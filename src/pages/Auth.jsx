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

  const containerStyle = {
    height: '100vh',
    width: '100vw',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    overflow: 'hidden',
    position: 'fixed',
    top: 0,
    left: 0
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '30px',
    width: '100%',
    maxWidth: '400px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    transform: isLoading ? 'scale(0.98)' : 'scale(1)'
  };

  const titleStyle = {
    fontSize: '28px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textAlign: 'center',
    marginBottom: '20px',
    letterSpacing: '-0.5px'
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 18px',
    marginBottom: '15px',
    border: '2px solid #e1e5e9',
    borderRadius: '12px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    backgroundColor: '#fafbfc',
    color: '#2d3748',
    outline: 'none',
    fontFamily: 'inherit'
  };

  const inputFocusStyle = {
    ...inputStyle,
    borderColor: '#667eea',
    backgroundColor: '#fff',
    color: '#1a202c',
    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
  };

  const buttonStyle = {
    width: '100%',
    padding: '16px',
    background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    transform: isLoading ? 'scale(0.98)' : 'scale(1)',
    boxShadow: isLoading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
    fontFamily: 'inherit'
  };

  const linkButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#667eea',
    textDecoration: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'color 0.3s ease',
    fontFamily: 'inherit'
  };

  const messageStyle = {
    padding: '12px 16px',
    borderRadius: '8px',
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '500'
  };

  const errorStyle = {
    ...messageStyle,
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fecaca'
  };

  const successStyle = {
    ...messageStyle,
    backgroundColor: '#d1fae5',
    color: '#059669',
    border: '1px solid #a7f3d0'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>
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
            style={inputStyle}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, inputStyle)}
          />
          
          {mode !== "reset" && (
            <>
              <input
                type="password"
                placeholder={mode === "update-password" ? "🔒 Enter new password" : "🔒 Enter your password"}
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              />
              
              {mode === "update-password" && (
                <input
                  type="password"
                  placeholder="🔒 Confirm new password"
                  value={confirmPassword}
                  required
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                />
              )}
            </>
          )}
          
          <button 
            type="submit" 
            style={buttonStyle}
            disabled={isLoading}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }
            }}
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
        
        {error && <div style={errorStyle}>❌ {error}</div>}
        {message && <div style={successStyle}>{message}</div>}
        
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            {mode === "signin" && (
              <>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '15px' }}>
                  Don't have an account?{" "}
                  <button 
                    type="button" 
                    onClick={() => setMode("signup")}
                    style={linkButtonStyle}
                    onMouseEnter={(e) => e.target.style.color = '#4f46e5'}
                    onMouseLeave={(e) => e.target.style.color = '#667eea'}
                  >
                    Create one here ✨
                  </button>
                </p>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  Forgot your password?{" "}
                  <button 
                    type="button" 
                    onClick={() => setMode("reset")}
                    style={linkButtonStyle}
                    onMouseEnter={(e) => e.target.style.color = '#4f46e5'}
                    onMouseLeave={(e) => e.target.style.color = '#667eea'}
                  >
                    Reset it here 🔑
                  </button>
                </p>
              </>
            )}
            
            {mode === "signup" && (
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Already have an account?{" "}
                <button 
                  type="button" 
                  onClick={() => setMode("signin")}
                  style={linkButtonStyle}
                  onMouseEnter={(e) => e.target.style.color = '#4f46e5'}
                  onMouseLeave={(e) => e.target.style.color = '#667eea'}
                >
                  Sign in here 🚀
                </button>
              </p>
            )}
            
            {mode === "reset" && (
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Remember your password?{" "}
                <button 
                  type="button" 
                  onClick={() => setMode("signin")}
                  style={linkButtonStyle}
                  onMouseEnter={(e) => e.target.style.color = '#4f46e5'}
                  onMouseLeave={(e) => e.target.style.color = '#667eea'}
                >
                  Sign in here 🚀
                </button>
              </p>
            )}
            
            {mode === "update-password" && (
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                <button 
                  type="button" 
                  onClick={() => setMode("signin")}
                  style={linkButtonStyle}
                  onMouseEnter={(e) => e.target.style.color = '#4f46e5'}
                  onMouseLeave={(e) => e.target.style.color = '#667eea'}
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
