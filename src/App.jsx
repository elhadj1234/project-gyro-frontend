import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "./AuthProvider";
// import { supabase } from "./supabaseClient";

function Home() { 
  return (
    <div className="home">
      {/* Hero */}
      <section className="home-hero">
        <div className="container hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Auto‑apply to jobs with <span className="brand">Tempra</span></h1>
            <p className="hero-subtitle">
              Automatically submit applications on supported job sites, track status, and stay organized.
            </p>
            <div className="cta-buttons">
              <Link to="/auth" className="btn btn-primary">Get Started</Link>
              <Link to="/dashboard" className="btn btn-secondary">Go to Dashboard</Link>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <svg viewBox="0 0 240 160" className="hero-illustration" role="img" aria-label="Abstract dashboard illustration">
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6a11cb"/>
                  <stop offset="100%" stopColor="#2575fc"/>
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="240" height="160" rx="12" fill="url(#grad)" opacity="0.15"/>
              <rect x="16" y="20" width="208" height="28" rx="6" fill="#ffffff" opacity="0.9"/>
              <rect x="16" y="56" width="96" height="22" rx="6" fill="#ffffff" opacity="0.9"/>
              <rect x="128" y="56" width="96" height="22" rx="6" fill="#ffffff" opacity="0.75"/>
              <rect x="16" y="86" width="208" height="50" rx="8" fill="#ffffff" opacity="0.8"/>
              <circle cx="40" cy="36" r="6" fill="#6a11cb"/>
              <circle cx="58" cy="36" r="6" fill="#2575fc"/>
              <circle cx="76" cy="36" r="6" fill="#00c6ff"/>
            </svg>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Everything you need to stay organized</h2>
          <div className="features-grid">
            <article className="feature-card">
              <div className="feature-icon" aria-hidden="true">🔗</div>
              <h3 className="feature-title">Save roles fast</h3>
              <p className="feature-text">Bookmark job postings across the web with one click.</p>
            </article>
            <article className="feature-card">
              <div className="feature-icon" aria-hidden="true">⚙️</div>
              <h3 className="feature-title">Auto‑apply on job sites</h3>
              <p className="feature-text">Automatically submit applications on supported job websites.</p>
            </article>
            <article className="feature-card">
              <div className="feature-icon" aria-hidden="true">🧑‍💼</div>
              <h3 className="feature-title">Track and stay ready</h3>
              <p className="feature-text">Monitor statuses and keep your resume/profile ready to go.</p>
            </article>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="steps">
        <div className="container">
          <h2 className="section-title">How Tempra works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Sign in</h3>
              <p className="step-text">Create an account or sign in to sync your data securely.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Auto‑apply</h3>
              <p className="step-text">Choose jobs and let Tempra submit on supported job sites.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Track status</h3>
              <p className="step-text">Monitor progress and keep materials updated for next steps.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="cta">
        <div className="container cta-inner">
          <h2 className="cta-title">Ready to get organized?</h2>
          <p className="cta-text">Join Tempra and streamline your job search today.</p>
          <div className="cta-buttons">
            <Link to="/auth" className="btn btn-primary">Create your account</Link>
            <Link to="/dashboard" className="btn btn-secondary">See the dashboard</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user } = useAuth();
  const dropdownRef = useRef(null);
  const location = useLocation();

  // Update document title and canonical per route
  useEffect(() => {
    const { pathname } = location;
    const baseTitle = 'Tempra';
    const titles = {
      '/': `${baseTitle} — Auto‑apply to jobs and stay organized`,
      '/auth': `${baseTitle} — Sign In`,
      '/dashboard': `${baseTitle} — Dashboard`,
      '/profile': `${baseTitle} — Profile`,
    };
    document.title = titles[pathname] || baseTitle;

    const canonicalHref = `${window.location.origin}${pathname}`;
    let link = document.querySelector('#canonical-link');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('id', 'canonical-link');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalHref);
  }, [location]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [profileDropdownOpen]);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    
    // COMPLETE BYPASS - No network calls, no errors, instant logout
    // This completely eliminates net::ERR_ABORTED errors
    
    try {
      // Clear ALL authentication data from storage
      localStorage.removeItem('sb-' + import.meta.env.VITE_SUPABASE_URL.split('//')[1].split('.')[0] + '-auth-token');
      sessionStorage.clear();
      localStorage.removeItem('supabase-auth-token');
      localStorage.removeItem('auth-session');
    } catch (error) {
      console.warn('Storage cleanup error:', error?.message);
    }
    
    // Force redirect to auth page - no delays, no waiting
    window.location.replace('/auth');
  };

  // Render app shell for all routes

  return (
    <div className="app">
      {/* Skip to main content for keyboard users */}
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {/* Header Navigation */}
      <header className="site-header" role="banner">
        <div className="container header-inner">
          <div className="logo-wrap">
            <Link to="/" className="logo-home" aria-label="Home">
              <img src="/Tempra.png" alt="Tempra logo" className="header-logo-img" />
              <span className="header-logo">Tempra</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="header-nav" role="navigation" aria-label="Primary">
            <Link to="/" className="nav-link">Home</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                {/* Profile Dropdown */}
                <div className="profile-dropdown">
                  <button 
                    id="profile-menu-button"
                    className="profile-btn"
                    onClick={toggleProfileDropdown}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleProfileDropdown(); }
                      if (e.key === 'Escape') { setProfileDropdownOpen(false); }
                    }}
                    aria-label="Profile menu"
                    aria-haspopup="menu"
                    aria-expanded={profileDropdownOpen}
                    aria-controls="profile-menu"
                  >
                    <div className="profile-avatar">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <span className="profile-email">{user.email}</span>
                    <svg 
                      className={`dropdown-arrow ${profileDropdownOpen ? 'open' : ''}`}
                      width="12" 
                      height="12" 
                      viewBox="0 0 12 12"
                    >
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  </button>
                  
                  {profileDropdownOpen && (
                    <div 
                      id="profile-menu" 
                      className="dropdown-menu" 
                      role="menu" 
                      aria-labelledby="profile-menu-button"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') { 
                          setProfileDropdownOpen(false);
                          document.getElementById('profile-menu-button')?.focus();
                        }
                      }}
                    >
                      <Link 
                        to="/profile" 
                        className="dropdown-item"
                        role="menuitem"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                        </svg>
                        Profile
                      </Link>
                      <Link 
                        to="/dashboard" 
                        className="dropdown-item"
                        role="menuitem"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1zm3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4h-3.5z"/>
                        </svg>
                        Dashboard
                      </Link>
                      <button 
                        className="dropdown-item logout-btn"
                        role="menuitem"
                        onClick={handleLogout}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
                          <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/auth" className="nav-link">Sign In</Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={toggleMobileMenu}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMobileMenu(); }
            }}
            aria-label="Toggle menu"
            aria-controls="mobile-nav"
            aria-expanded={mobileMenuOpen}
            id="mobile-menu-button"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="nav-mobile" role="navigation" aria-label="Mobile" id="mobile-nav">
            <Link to="/" className="nav-link" onClick={toggleMobileMenu}>Home</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="nav-link" onClick={toggleMobileMenu}>Dashboard</Link>
                <Link to="/profile" className="nav-link" onClick={toggleMobileMenu}>Profile</Link>
                <div className="mobile-profile">
                  <div className="mobile-profile-info">
                    <div className="profile-avatar">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <span>{user.email}</span>
                  </div>
                  <button 
                    className="mobile-logout-btn"
                    onClick={() => {
                      handleLogout();
                      toggleMobileMenu();
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <Link to="/auth" className="nav-link" onClick={toggleMobileMenu}>Sign In</Link>
            )}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="main" id="main-content" role="main">
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            {/* Fallback: redirect any unknown path to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 MyApp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
