import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../AuthProvider";
import "./AppShell.css";

export default function AppShell({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user } = useAuth();
  const dropdownRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const { pathname } = location;
    const baseTitle = "Tempra";
    const titles = {
      "/": `${baseTitle} — Auto‑apply to jobs and stay organized`,
      "/auth": `${baseTitle} — Sign In`,
      "/dashboard": `${baseTitle} — Dashboard`,
      "/profile": `${baseTitle} — Profile`,
    };
    document.title = titles[pathname] || baseTitle;

    const canonicalHref = `${window.location.origin}${pathname}`;
    let link = document.querySelector("#canonical-link");
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("id", "canonical-link");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalHref);
  }, [location]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        profileDropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [profileDropdownOpen]);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    try {
      localStorage.removeItem(
        "sb-" +
          import.meta.env.VITE_SUPABASE_URL.split("//")[1].split(".")[0] +
          "-auth-token"
      );
      sessionStorage.clear();
      localStorage.removeItem("supabase-auth-token");
      localStorage.removeItem("auth-session");
    } catch (error) {
      console.warn("Storage cleanup error:", error?.message);
    }
    window.location.replace("/auth");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="shell-header">
        <div className="shell-header-inner">
          <Link to="/" className="shell-logo" aria-label="Home">
            <img
              src="/Tempra.png"
              alt=""
              className="shell-logo-img"
              aria-hidden="true"
            />
            <span className="shell-logo-text">Tempra</span>
          </Link>

          <nav className="shell-nav" aria-label="Primary">
            <Link
              to="/"
              className={`shell-nav-link ${isActive("/") ? "active" : ""}`}
            >
              Home
            </Link>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`shell-nav-link ${isActive("/dashboard") ? "active" : ""}`}
                >
                  Dashboard
                </Link>

                <div className="shell-profile-dropdown" ref={dropdownRef}>
                  <button
                    className="shell-profile-btn"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    aria-label="Profile menu"
                    aria-haspopup="menu"
                    aria-expanded={profileDropdownOpen}
                  >
                    <span className="shell-avatar">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                    <span className="shell-profile-email">{user.email}</span>
                    <svg
                      className={`shell-chevron ${profileDropdownOpen ? "open" : ""}`}
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2 4l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {profileDropdownOpen && (
                    <div className="shell-dropdown-menu" role="menu">
                      <Link
                        to="/profile"
                        className="shell-dropdown-item"
                        role="menuitem"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
                        </svg>
                        Profile
                      </Link>
                      <Link
                        to="/dashboard"
                        className="shell-dropdown-item"
                        role="menuitem"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M4 4h8v8H4V4zm1 1v6h6V5H5z" />
                          <path d="M1 1h14v14H1V1zm1 1v12h12V2H2z" />
                        </svg>
                        Dashboard
                      </Link>
                      <div className="shell-dropdown-divider" />
                      <button
                        className="shell-dropdown-item shell-dropdown-logout"
                        role="menuitem"
                        onClick={handleLogout}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"
                          />
                          <path
                            fillRule="evenodd"
                            d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"
                          />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/auth"
                className={`shell-nav-link ${isActive("/auth") ? "active" : ""}`}
              >
                Sign In
              </Link>
            )}
          </nav>

          <button
            className={`shell-mobile-btn ${mobileMenuOpen ? "open" : ""}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="shell-mobile-nav" aria-label="Mobile">
            <Link
              to="/"
              className={`shell-mobile-link ${isActive("/") ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`shell-mobile-link ${isActive("/dashboard") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className={`shell-mobile-link ${isActive("/profile") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <div className="shell-mobile-divider" />
                <div className="shell-mobile-profile">
                  <span className="shell-avatar">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                  <span className="shell-mobile-email">{user.email}</span>
                </div>
                <button
                  className="shell-mobile-logout"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className={`shell-mobile-link ${isActive("/auth") ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </nav>
        )}
      </header>

      <main className="shell-main" id="main-content">
        {children}
      </main>

      <footer className="shell-footer">
        <div className="shell-footer-inner">
          <p className="shell-footer-text">
            &copy; {new Date().getFullYear()} Tempra. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
