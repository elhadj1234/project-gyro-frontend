import os
import asyncio
from typing import Dict, Optional, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks, Response, Request, Depends, Cookie
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import uuid
import json
import shutil
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from workday_pager import WorkdayPager

load_dotenv()

app = FastAPI()

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Warning: SUPABASE_URL or SUPABASE_KEY not set. Authentication will fail.")
    supabase: Optional[Client] = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session storage
class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, WorkdayPager] = {}
        self.temp_files: Dict[str, str] = {} # Track temp files for cleanup

    def create_session(self, pager: WorkdayPager, temp_resume_path: Optional[str] = None) -> str:
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = pager
        if temp_resume_path:
            self.temp_files[session_id] = temp_resume_path
        return session_id

    def get_session(self, session_id: str) -> Optional[WorkdayPager]:
        return self.sessions.get(session_id)

    def remove_session(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]
        
        # Clean up temp file
        if session_id in self.temp_files:
            temp_path = self.temp_files[session_id]
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                    print(f"Cleaned up temp resume: {temp_path}")
                except Exception as e:
                    print(f"Error cleaning up temp resume {temp_path}: {e}")
            del self.temp_files[session_id]

session_manager = SessionManager()

# Models
class LoginRequest(BaseModel):
    email: str
    password: str

class InitJobRequest(BaseModel):
    url: str

class StartJobRequest(BaseModel):
    session_id: str

# Dependency to get current user from Supabase
async def get_current_user(access_token: Optional[str] = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    try:
        user_response = supabase.auth.get_user(access_token)
        if not user_response.user:
             raise HTTPException(status_code=401, detail="Invalid token")
        return user_response.user
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# Endpoints

@app.post("/login")
async def login(request: LoginRequest, response: Response):
    """
    Login with Supabase and return access token in cookie.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        access_token = auth_response.session.access_token
        
        # Set secure, HttpOnly cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,  # Set to True in production (requires HTTPS)
            samesite="lax",
            max_age=auth_response.session.expires_in
        )
        
        return {"message": "Login successful", "user_id": auth_response.user.id}
        
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/init-job")
async def init_job(
    request: InitJobRequest, 
    user=Depends(get_current_user),
    access_token: Optional[str] = Cookie(None) # Explicitly get token for storage access if needed
):
    """
    Initialize a WorkdayPager session.
    Fetches user info and resume from Supabase based on authenticated user.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    try:
        user_id = user.id
        print(f"Initializing job for user: {user_id}")
        
        # 1. Fetch user profile
        profile_response = (
            supabase.table("user_profiles")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="User profile not found")
            
        user_profile = profile_response.data[0]
        
        # 2. Extract user info and resume details
        # Assuming user_info structure matches what WorkdayPager expects (flat or nested)
        # Based on test_supabase_client.py, resume is in my_experience.resume
        
        # Construct user_info dictionary for the agents
        # We might need to map database fields to the structure expected by agents
        # For now, pass the whole profile as user_info
        user_info = user_profile
        
        # 3. Handle Resume
        resume_path = None
        temp_resume_path = None
        
        my_experience = user_profile.get('my_experience', {})
        resume_info = my_experience.get('resume', {})
        storage_path = resume_info.get('path')
        filename = resume_info.get('filename')
        
        if storage_path:
            print(f"Downloading resume from: {storage_path}")
            try:
                # Download to a temporary file
                temp_dir = Path("temp_resumes")
                temp_dir.mkdir(exist_ok=True)
                
                # Use a unique filename to avoid collisions
                safe_filename = f"{user_id}_{uuid.uuid4()}_{filename or 'resume.pdf'}"
                temp_resume_path = temp_dir / safe_filename
                
                # Download from Supabase Storage
                file_data = supabase.storage.from_("resumes").download(storage_path)
                
                with open(temp_resume_path, 'wb') as f:
                    f.write(file_data)
                
                resume_path = str(temp_resume_path.absolute())
                print(f"Resume downloaded to: {resume_path}")
                
            except Exception as e:
                print(f"Error downloading resume: {e}")
                # Continue without resume if download fails? Or fail?
                # Let's log warning but proceed if user wants to try without
                pass
        
        # 4. Initialize WorkdayPager
        pager = WorkdayPager(
            url=request.url,
            headless=False, 
            production=True, # Use Anchor/Browserbase for live URL
            user_info=user_info,
            resume_path=resume_path
        )
        
        # Initialize session
        print(f"Initializing session for {request.url}")
        session_details = await pager.init_session()
        
        # Navigate to job
        print("Navigating to job...")
        await pager.navigate_to_job()
        
        # Store in session manager with temp file tracking
        session_id = session_manager.create_session(pager, resume_path)
        
        return {
            "session_id": session_id,
            "live_url": session_details.get("live_view_url"),
            "cdp_url": session_details.get("cdp_url")
        }
        
    except Exception as e:
        print(f"Error in init-job: {e}")
        # Clean up temp file if created and error occurred
        if 'temp_resume_path' in locals() and temp_resume_path and os.path.exists(temp_resume_path):
            try:
                os.remove(temp_resume_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/start-job")
async def start_job(request: StartJobRequest, background_tasks: BackgroundTasks):
    """
    Start the automation for a given session.
    Runs in the background.
    """
    pager = session_manager.get_session(request.session_id)
    if not pager:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Run automation in background
    background_tasks.add_task(run_automation_task, request.session_id, pager)
    
    return {"message": "Job started", "session_id": request.session_id}

async def run_automation_task(session_id: str, pager: WorkdayPager):
    try:
        print(f"Starting automation for session {session_id}")
        await pager.run_automation()
        print(f"Automation finished for session {session_id}")
    except Exception as e:
        print(f"Error in session {session_id}: {e}")
        # Only cleanup on error
        try:
            await pager.cleanup()
        except Exception as e_cleanup:
            print(f"Error cleaning up session {session_id}: {e_cleanup}")
    finally:
        # We DO NOT want to cleanup automatically in finally block
        # because if we hit "Review" stage, we want to keep the session alive.
        # The run_automation method itself handles cleanup on success/error internally
        # except for the "Review" case where it returns without cleanup.
        
        # We should only remove from session manager if it's truly done or errored out?
        # If we remove it from manager, subsequent requests (if any) might fail.
        # But if we keep it, we need a way to clean it up later.
        # For now, let's keep it in manager so user can still access it if needed?
        # Or maybe we just remove it because the automation part is done.
        
        # If we returned early due to "Review", the session is still active in the browser.
        # We might want to keep tracking it.
        pass
        # session_manager.remove_session(session_id)

if __name__ == "__main__":
    # Ensure server mode is set for WorkdayPager to behave correctly if it checks env
    os.environ["SERVER_MODE"] = "true"
    uvicorn.run(app, host="0.0.0.0", port=8000)
