import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import "./Auth.css";

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
    const modeParam = searchParams.get("mode");
    if (modeParam === "update-password") {
      setMode("update-password");
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        try {
          await api.post("/login", { email, password });
          console.log("Backend login successful");
        } catch (backendError) {
          console.error("Backend login failed:", backendError);
        }

        setMessage("Welcome back! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1000);
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setMessage("Account created! Check your email to confirm sign up.");
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=update-password`,
        });
        if (error) throw error;
        setMessage("Password reset email sent! Check your inbox.");
      } else if (mode === "update-password") {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage("Password updated successfully! You can now sign in.");
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

  const getTitle = () => {
    switch (mode) {
      case "signin":
        return "Welcome back";
      case "signup":
        return "Create account";
      case "reset":
        return "Reset password";
      case "update-password":
        return "Update password";
      default:
        return "Sign in";
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "signin":
        return "Sign in to your account to continue";
      case "signup":
        return "Create an account to get started";
      case "reset":
        return "Enter your email to reset your password";
      case "update-password":
        return "Enter your new password";
      default:
        return "";
    }
  };

  const getButtonText = () => {
    if (isLoading) return "Processing...";
    switch (mode) {
      case "signin":
        return "Sign in";
      case "signup":
        return "Create account";
      case "reset":
        return "Send reset email";
      case "update-password":
        return "Update password";
      default:
        return "Submit";
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card card">
          <div className="auth-header">
            <h1 className="auth-title">{getTitle()}</h1>
            <p className="auth-subtitle">{getSubtitle()}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email" className="input-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {mode !== "reset" && (
              <div className="input-group">
                <label htmlFor="password" className="input-label">
                  {mode === "update-password" ? "New password" : "Password"}
                </label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            {mode === "update-password" && (
              <div className="input-group">
                <label htmlFor="confirmPassword" className="input-label">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="input"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  required
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-full"
            >
              {isLoading && <span className="spinner spinner-sm" />}
              {getButtonText()}
            </button>
          </form>

          <div className="auth-footer">
            {mode === "signin" && (
              <>
                <p className="auth-footer-text">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="auth-link"
                  >
                    Create one
                  </button>
                </p>
                <p className="auth-footer-text">
                  <button
                    type="button"
                    onClick={() => setMode("reset")}
                    className="auth-link"
                  >
                    Forgot your password?
                  </button>
                </p>
              </>
            )}

            {mode === "signup" && (
              <p className="auth-footer-text">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="auth-link"
                >
                  Sign in
                </button>
              </p>
            )}

            {mode === "reset" && (
              <p className="auth-footer-text">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="auth-link"
                >
                  Sign in
                </button>
              </p>
            )}

            {mode === "update-password" && (
              <p className="auth-footer-text">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="auth-link"
                >
                  Back to sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
