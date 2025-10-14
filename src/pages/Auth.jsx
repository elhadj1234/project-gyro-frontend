import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if this is a password update from email link
    const modeParam = searchParams.get('mode');
    if (modeParam === 'update-password') {
      setMode('update-password');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);
    
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage("Welcome back! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1000);
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("🎉 Account created! Check your email to confirm sign up!");
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=update-password`,
        });
        if (error) throw error;
        setMessage("📧 Password reset email sent! Check your inbox.");
      } else if (mode === "update-password") {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage("✅ Password updated successfully! You can now sign in.");
        setTimeout(() => {
          setMode("signin");
          setPassword("");
          setConfirmPassword("");
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle = {};
  const cardStyle = {};
  const titleStyle = {};
  const messageStyle = {};
  const errorStyle = {};
  const successStyle = {};

  return (
    <div className="auth-page">
      <div className="dashboard-card">
        <h1 className="dashboard-title">
          {mode === "signin" ? "Welcome Back" : 
           mode === "signup" ? "Create Account" : 
           mode === "reset" ? "Reset Password" : "Update Password"}
        </h1>
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="✉️ Enter your email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="input-control"
          />
          
          {mode !== "reset" && (
            <>
              <input
                type="password"
                placeholder={mode === "update-password" ? "🔒 Enter new password" : "🔒 Enter your password"}
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="input-control"
              />
              
              {mode === "update-password" && (
                <input
                  type="password"
                  placeholder="🔒 Confirm new password"
                  value={confirmPassword}
                  required
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-control"
                />
              )}
            </>
          )}
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? (
              <span>⏳ Processing...</span>
            ) : (
              <span>
                {mode === "signin" ? "🚀 Sign In" : 
                 mode === "signup" ? "✨ Create Account" : 
                 mode === "reset" ? "📧 Send Reset Email" : "🔄 Update Password"}
              </span>
            )}
          </button>
        </form>
        
        {error && <div className="dashboard-message dashboard-message--error">❌ {error}</div>}
        {message && <div className="dashboard-message dashboard-message--success">{message}</div>}
        
          <div className="auth-helper">
            {mode === "signin" && (
              <>
                <p className="helper-text">
                  Don't have an account?{" "}
                  <button 
                    type="button" 
                    onClick={() => setMode("signup")}
                    className="link-btn"
                  >
                    Create one here ✨
                  </button>
                </p>
                <p className="helper-text">
                  Forgot your password?{" "}
                  <button 
                    type="button" 
                    onClick={() => setMode("reset")}
                    className="link-btn"
                  >
                    Reset it here 🔑
                  </button>
                </p>
              </>
            )}
            
            {mode === "signup" && (
              <p className="helper-text">
                Already have an account?{" "}
                <button 
                  type="button" 
                  onClick={() => setMode("signin")}
                  className="link-btn"
                >
                  Sign in here 🚀
                </button>
              </p>
            )}
            
            {mode === "reset" && (
              <p className="helper-text">
                Remember your password?{" "}
                <button 
                  type="button" 
                  onClick={() => setMode("signin")}
                  className="link-btn"
                >
                  Sign in here 🚀
                </button>
              </p>
            )}
            
            {mode === "update-password" && (
              <p className="helper-text">
                <button 
                  type="button" 
                  onClick={() => setMode("signin")}
                  className="link-btn"
                >
                  ← Back to Sign In
                </button>
              </p>
            )}
          </div>
         </div>
       </div>
     );
   }
