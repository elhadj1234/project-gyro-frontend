import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Auto-apply to jobs with <span className="hero-brand">Tempra</span>
          </h1>
          <p className="hero-description">
            Automatically submit applications on supported job sites, track
            status, and stay organized. Save hours on your job search.
          </p>
          <div className="hero-actions">
            <Link to="/auth" className="btn btn-primary btn-lg">
              Get Started
            </Link>
            <Link to="/dashboard" className="btn btn-secondary btn-lg">
              Go to Dashboard
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-card">
            <div className="hero-card-header">
              <div className="hero-card-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="hero-card-body">
              <div className="hero-card-line hero-card-line-long" />
              <div className="hero-card-line hero-card-line-medium" />
              <div className="hero-card-row">
                <div className="hero-card-box" />
                <div className="hero-card-box" />
              </div>
              <div className="hero-card-line hero-card-line-short" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="section-title">Everything you need to stay organized</h2>
        <div className="features-grid">
          <article className="feature-card card">
            <div className="feature-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <h3 className="feature-title">Save roles fast</h3>
            <p className="feature-description">
              Bookmark job postings across the web with one click. Keep all your
              opportunities in one place.
            </p>
          </article>

          <article className="feature-card card">
            <div className="feature-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              </svg>
            </div>
            <h3 className="feature-title">Auto-apply on job sites</h3>
            <p className="feature-description">
              Automatically submit applications on supported job websites. Let
              Tempra do the repetitive work.
            </p>
          </article>

          <article className="feature-card card">
            <div className="feature-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="feature-title">Track and stay ready</h3>
            <p className="feature-description">
              Monitor application statuses and keep your resume and profile
              ready to go at all times.
            </p>
          </article>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="steps">
        <h2 className="section-title">How Tempra works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3 className="step-title">Sign in</h3>
            <p className="step-description">
              Create an account or sign in to sync your data securely across
              devices.
            </p>
          </div>

          <div className="step-connector" />

          <div className="step-card">
            <div className="step-number">2</div>
            <h3 className="step-title">Auto-apply</h3>
            <p className="step-description">
              Choose jobs and let Tempra submit applications on supported job
              sites.
            </p>
          </div>

          <div className="step-connector" />

          <div className="step-card">
            <div className="step-number">3</div>
            <h3 className="step-title">Track status</h3>
            <p className="step-description">
              Monitor progress and keep your materials updated for next steps.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-content">
          <h2 className="cta-title">Ready to streamline your job search?</h2>
          <p className="cta-description">
            Join Tempra today and spend less time on applications, more time
            preparing for interviews.
          </p>
          <div className="cta-actions">
            <Link to="/auth" className="btn btn-primary btn-lg">
              Create your account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
