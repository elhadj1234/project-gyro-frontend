import { Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "./AuthProvider";
import { supabase } from "./supabaseClient";

function Home() { 
  return (
    <div className="home-content">
      <section className="hero">
        <h1>Welcome to Our Platform</h1>
        <p>Your secure authentication solution</p>
      </section>
    </div>
  );
}

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user } = useAuth();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfileDropdownOpen(false);
  };

  return (
    <div className="app">
      {/* Header Navigation */}
      <header className="header">
        <div className="container">
          <div className="nav-brand">
            <Link to="/" className="logo">MyApp</Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            <Link to="/" className="nav-link">Home</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                {/* Profile Dropdown */}
                <div className="profile-dropdown">
                  <button 
                    className="profile-btn"
                    onClick={toggleProfileDropdown}
                    aria-label="Profile menu"
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
                    <div className="dropdown-menu">
                      <Link 
                        to="/profile" 
                        className="dropdown-item"
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
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1zm3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4h-3.5z"/>
                        </svg>
                        Dashboard
                      </Link>
                      <button 
                        className="dropdown-item logout-btn"
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
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="nav-mobile">
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
      <main className="main">
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
