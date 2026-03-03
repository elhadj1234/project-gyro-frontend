import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../AuthProvider";
import { supabase } from "../supabaseClient";
import api from "../api";
import JobLiveView from "../components/JobLiveView";
import { PageContainer } from "../components/layout";
import "./Dashboard.css";

function formatTimeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getFaviconUrl(urlStr) {
  try {
    const hostname = new URL(urlStr).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return null;
  }
}

function getHostname(urlStr) {
  try {
    return new URL(urlStr).hostname.replace("www.", "");
  } catch {
    return "link";
  }
}

export default function Dashboard() {
  const { user, session } = useAuth();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedLinks, setSavedLinks] = useState([]);
  const [applying, setApplying] = useState({});
  const [runningJobs, setRunningJobs] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState(null);

  const [showLiveView, setShowLiveView] = useState(false);
  const [liveViewMinimized, setLiveViewMinimized] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [liveSessionData, setLiveSessionData] = useState(null);

  const toastTimeoutRef = useRef(null);

  const showToast = (text, type = "success") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setMessage({ text, type });
    toastTimeoutRef.current = setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const isAuthenticated = useCallback(() => {
    return session && session.user && user;
  }, [session, user]);

  useEffect(() => {
    if (user) {
      loadUserLinks();
    }
  }, [user?.id]);

  const getProfileData = async () => {
    try {
      if (!isAuthenticated()) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") return null;
      return data;
    } catch {
      return null;
    }
  };

  const handleViewJob = async (link) => {
    const sessionInfo = liveSessionData?.[link.id];

    if (sessionInfo) {
      setActiveJob({ ...link, ...sessionInfo });
      setShowLiveView(true);
      setLiveViewMinimized(false);
    } else {
      showToast("Initializing live session...", "info");
      try {
        const response = await api.post("/init-job", { url: link.url });
        const { session_id, live_url } = response.data;
        const newSessionInfo = { sessionId: session_id, liveUrl: live_url };
        setLiveSessionData((prev) => ({ ...prev, [link.id]: newSessionInfo }));
        setActiveJob({ ...link, ...newSessionInfo });
        setShowLiveView(true);
        setLiveViewMinimized(false);
        setMessage({ text: "", type: "" });
      } catch (err) {
        console.error("Failed to init job:", err);
        showToast("Failed to start live session: " + (err.response?.data?.detail || err.message), "error");
      }
    }
  };

  const handleApplyToJob = async (link) => {
    setApplying((prev) => ({ ...prev, [link.id]: true }));
    setRunningJobs((prev) => ({ ...prev, [link.id]: true }));

    try {
      const profileData = await getProfileData();
      if (link.application_status === "applied") {
        showToast("You have already applied to this job.", "info");
        return;
      }
      if (!isAuthenticated()) {
        showToast("Authentication error: Please sign in again.", "error");
        return;
      }

      const { error } = await supabase
        .from("user_links")
        .update({
          application_status: "applied",
          applied_at: new Date().toISOString(),
          profile_data: profileData,
          application_notes: `Applied via Tempra to ${link.title || link.url}`,
        })
        .eq("id", link.id)
        .eq("user_id", session.user.id)
        .select();

      if (error) {
        showToast("Error applying to job: " + error.message, "error");
      } else {
        showToast("Successfully applied to job!", "success");
        await loadUserLinks();
      }
    } catch (error) {
      console.error("Error applying to job:", error);
      showToast("Error applying to job. Please try again.", "error");
    } finally {
      setApplying((prev) => ({ ...prev, [link.id]: false }));
      setTimeout(() => {
        setRunningJobs((prev) => ({ ...prev, [link.id]: false }));
      }, 2000);
    }
  };

  const loadUserLinks = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      if (!isAuthenticated()) {
        showToast("Authentication error: Please sign in again.", "error");
        return;
      }

      const { data, error } = await supabase
        .from("user_links")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        showToast("Error loading your job applications: " + error.message, "error");
      } else {
        setSavedLinks(data || []);
        const sessions = {};
        (data || []).forEach((link) => {
          if (link.application_notes) {
            try {
              const notes = JSON.parse(link.application_notes);
              if (notes.session_id && notes.initial_live_url) {
                sessions[link.id] = {
                  sessionId: notes.session_id,
                  liveUrl: notes.initial_live_url,
                };
              }
            } catch {
              // ignore
            }
          }
        });
        if (Object.keys(sessions).length > 0) {
          setLiveSessionData((prev) => ({ ...prev, ...sessions }));
        }
      }
    } catch {
      showToast("Error loading your job applications. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setSubmitting(true);
    try {
      if (!isAuthenticated()) {
        showToast("Authentication error: Please sign in again.", "error");
        setSubmitting(false);
        return;
      }

      showToast("Initializing job session...", "info");
      let sessionData = null;
      try {
        const response = await api.post("/init-job", { url: url.trim() });
        sessionData = response.data;
      } catch (apiError) {
        console.error("Backend init-job failed:", apiError);
        showToast("Failed to initialize: " + (apiError.response?.data?.detail || apiError.message), "error");
        setSubmitting(false);
        return;
      }

      const clip = (s, n) => (typeof s === "string" ? s.slice(0, n) : s);
      const safeTitle = clip(title.trim() || getHostname(url.trim()), 255);
      const safeDescription = description.trim() ? clip(description.trim(), 255) : null;
      const notesStr = JSON.stringify({ session_id: sessionData.session_id });

      const { data, error } = await supabase.from("user_links").insert({
        user_id: user.id,
        url: url.trim(),
        title: safeTitle,
        description: safeDescription,
        category: "job_application",
        tags: ["job_application"],
        application_notes: notesStr,
      }).select();

      if (error) {
        showToast("Error saving job application: " + error.message, "error");
      } else {
        setRecentlyAdded(data?.[0]?.id);
        setTimeout(() => setRecentlyAdded(null), 3000);

        if (data && data[0]) {
          setLiveSessionData((prev) => ({
            ...prev,
            [data[0].id]: {
              sessionId: sessionData.session_id,
              liveUrl: sessionData.live_url,
            },
          }));
        }

        setUrl("");
        setTitle("");
        setDescription("");
        setShowAddModal(false);
        showToast("Job added successfully!", "success");
        await loadUserLinks();
      }
    } catch {
      showToast("Error saving job application. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (linkId) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      if (!isAuthenticated()) {
        showToast("Authentication error: Please sign in again.", "error");
        return;
      }

      try {
        const link = savedLinks.find((l) => l.id === linkId);
        let sessionId = liveSessionData?.[linkId]?.sessionId;
        if (!sessionId && link?.application_notes) {
          try {
            const notes = JSON.parse(link.application_notes);
            sessionId = notes?.session_id || null;
          } catch {
            // ignore
          }
        }
        if (sessionId) {
          await api.post("/stop-job", { session_id: sessionId });
        }
      } catch (stopErr) {
        console.warn("Stop job failed:", stopErr?.message || stopErr);
      }

      setSavedLinks((prev) => prev.filter((l) => l.id !== linkId));

      const { error } = await supabase
        .from("user_links")
        .delete()
        .eq("id", linkId)
        .eq("user_id", user.id);

      if (error) {
        showToast("Error deleting job: " + error.message, "error");
        await loadUserLinks();
      } else {
        showToast("Job deleted successfully!", "success");
      }
    } catch {
      showToast("Error deleting job. Please try again.", "error");
    }
  };

  const getJobStatus = (link) => {
    if (runningJobs[link.id]) return "running";
    if (link.application_status === "applied") return "applied";
    return "ready";
  };

  const filteredLinks = savedLinks.filter((link) => {
    const matchesSearch =
      !searchQuery ||
      link.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.url?.toLowerCase().includes(searchQuery.toLowerCase());

    const status = getJobStatus(link);
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "ready" && status === "ready") ||
      (filterStatus === "applied" && status === "applied") ||
      (filterStatus === "running" && status === "running");

    return matchesSearch && matchesFilter;
  });

  const readyJobs = filteredLinks.filter((l) => getJobStatus(l) === "ready");
  const runningJobsList = filteredLinks.filter((l) => getJobStatus(l) === "running");
  const appliedJobs = filteredLinks.filter((l) => getJobStatus(l) === "applied");

  const appliedCount = savedLinks.filter((l) => l.application_status === "applied").length;
  const readyCount = savedLinks.length - appliedCount;

  if (loading) {
    return (
      <PageContainer>
        <div className="dash-skeleton">
          <div className="dash-skeleton-header">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-subtitle" />
          </div>
          <div className="dash-skeleton-stats">
            <div className="skeleton skeleton-stat" />
            <div className="skeleton skeleton-stat" />
            <div className="skeleton skeleton-stat" />
          </div>
          <div className="dash-skeleton-cards">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="dashboard-page">
      {/* Toast Notification */}
      {message.text && (
        <div className={`toast toast-${message.type}`}>
          <span className="toast-icon">
            {message.type === "success" && "✓"}
            {message.type === "error" && "✕"}
            {message.type === "info" && "ℹ"}
          </span>
          <span className="toast-text">{message.text}</span>
          <button className="toast-close" onClick={() => setMessage({ text: "", type: "" })}>×</button>
        </div>
      )}

      {/* Header */}
      <div className="dash-header">
        <div className="dash-header-left">
          <h1 className="dash-title">Job Applications</h1>
          <p className="dash-subtitle">Track and automate your job search</p>
        </div>
        <button className="btn btn-primary dash-add-btn" onClick={() => setShowAddModal(true)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
          </svg>
          Add Job
        </button>
      </div>

      {/* Stats */}
      <div className="dash-stats">
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-total">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4h12v12H4V4zm1 1v10h10V5H5z"/>
              <path d="M7 7h6v2H7V7zm0 4h4v2H7v-2z"/>
            </svg>
          </div>
          <div className="dash-stat-content">
            <span className="dash-stat-value">{savedLinks.length}</span>
            <span className="dash-stat-label">Total Jobs</span>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-ready">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 14.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13z"/>
              <path d="M10 5v5l3 3"/>
            </svg>
          </div>
          <div className="dash-stat-content">
            <span className="dash-stat-value">{readyCount}</span>
            <span className="dash-stat-label">Ready to Apply</span>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-applied">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 14.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13z"/>
              <path d="M7 10l2 2 4-4"/>
            </svg>
          </div>
          <div className="dash-stat-content">
            <span className="dash-stat-value dash-stat-success">{appliedCount}</span>
            <span className="dash-stat-label">Applied</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      {savedLinks.length > 0 && (
        <div className="dash-toolbar">
          <div className="dash-search">
            <svg className="dash-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
            <input
              type="text"
              className="dash-search-input"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="dash-filters">
            {["all", "ready", "applied"].map((status) => (
              <button
                key={status}
                className={`dash-filter-btn ${filterStatus === status ? "active" : ""}`}
                onClick={() => setFilterStatus(status)}
              >
                {status === "all" ? "All" : status === "ready" ? "Ready" : "Applied"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Job Sections */}
      {savedLinks.length > 0 ? (
        <div className="dash-sections">
          {/* Running Jobs */}
          {runningJobsList.length > 0 && (
            <section className="dash-section">
              <h2 className="dash-section-title">
                <span className="dash-section-indicator dash-indicator-running" />
                In Progress
                <span className="dash-section-count">{runningJobsList.length}</span>
              </h2>
              <div className="dash-jobs-grid">
                {runningJobsList.map((link) => (
                  <JobCard
                    key={link.id}
                    link={link}
                    status="running"
                    isNew={recentlyAdded === link.id}
                    onView={() => handleViewJob(link)}
                    onDelete={() => handleDelete(link.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Ready to Apply */}
          {readyJobs.length > 0 && (
            <section className="dash-section">
              <h2 className="dash-section-title">
                <span className="dash-section-indicator dash-indicator-ready" />
                Ready to Apply
                <span className="dash-section-count">{readyJobs.length}</span>
              </h2>
              <div className="dash-jobs-grid">
                {readyJobs.map((link) => (
                  <JobCard
                    key={link.id}
                    link={link}
                    status="ready"
                    isNew={recentlyAdded === link.id}
                    onView={() => handleViewJob(link)}
                    onDelete={() => handleDelete(link.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Applied */}
          {appliedJobs.length > 0 && (
            <section className="dash-section">
              <h2 className="dash-section-title">
                <span className="dash-section-indicator dash-indicator-applied" />
                Applied
                <span className="dash-section-count">{appliedJobs.length}</span>
              </h2>
              <div className="dash-jobs-grid">
                {appliedJobs.map((link) => (
                  <JobCard
                    key={link.id}
                    link={link}
                    status="applied"
                    isNew={recentlyAdded === link.id}
                    onView={() => handleViewJob(link)}
                    onDelete={() => handleDelete(link.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* No results from filter */}
          {filteredLinks.length === 0 && (
            <div className="dash-no-results">
              <p>No jobs match your search or filter.</p>
              <button className="btn btn-secondary" onClick={() => { setSearchQuery(""); setFilterStatus("all"); }}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="dash-empty">
          <div className="dash-empty-illustration">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <rect x="20" y="30" width="80" height="60" rx="8" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
              <rect x="30" y="45" width="40" height="6" rx="3" fill="currentColor" opacity="0.2"/>
              <rect x="30" y="55" width="60" height="4" rx="2" fill="currentColor" opacity="0.15"/>
              <rect x="30" y="63" width="50" height="4" rx="2" fill="currentColor" opacity="0.15"/>
              <circle cx="85" cy="75" r="20" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
              <path d="M85 65v20M75 75h20" stroke="currentColor" strokeWidth="2" opacity="0.4"/>
            </svg>
          </div>
          <h2 className="dash-empty-title">No jobs yet</h2>
          <p className="dash-empty-description">
            Add your first job link to start tracking and automating your applications.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => setShowAddModal(true)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
            </svg>
            Add Your First Job
          </button>
          <div className="dash-empty-hint">
            <p>Tip: Paste any job URL from LinkedIn, Indeed, Greenhouse, Lever, and more!</p>
          </div>
        </div>
      )}

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal dash-add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Job</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">Job URL *</label>
                  <input
                    type="url"
                    className="input"
                    placeholder="https://linkedin.com/jobs/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    autoFocus
                  />
                  <span className="input-helper">Paste the full URL of the job posting</span>
                </div>
                <div className="input-group">
                  <label className="input-label">Job Title (optional)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Software Engineer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Notes (optional)</label>
                  <textarea
                    className="input textarea"
                    placeholder="Any notes about this application..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner spinner-sm" />
                      Initializing...
                    </>
                  ) : (
                    "Add Job"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Add Button (Mobile) */}
      <button className="dash-fab" onClick={() => setShowAddModal(true)} aria-label="Add new job">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5a1 1 0 0 1 1-1z"/>
        </svg>
      </button>

      {/* Minimized LiveView Indicator */}
      {showLiveView && liveViewMinimized && (
        <button
          className="dash-liveview-minimized"
          onClick={() => setLiveViewMinimized(false)}
        >
          <span className="dash-liveview-pulse" />
          <span>Live View Running</span>
          <span className="dash-liveview-expand">↗</span>
        </button>
      )}

      {/* Live View Modal */}
      {showLiveView && activeJob && !liveViewMinimized && (
        <JobLiveView
          liveUrl={activeJob.liveUrl}
          sessionId={activeJob.sessionId}
          jobTitle={activeJob.title}
          onClose={() => {
            setShowLiveView(false);
            setActiveJob(null);
          }}
          onMinimize={() => setLiveViewMinimized(true)}
          onApply={() => {
            showToast("Automation started for " + (activeJob.title || "job"), "success");
            handleApplyToJob(activeJob);
          }}
        />
      )}
    </PageContainer>
  );
}

function JobCard({ link, status, isNew, onView, onDelete }) {
  const faviconUrl = getFaviconUrl(link.url);
  const hostname = getHostname(link.url);
  const timeAgo = formatTimeAgo(link.created_at);

  return (
    <article className={`job-card card job-card-${status} ${isNew ? "job-card-new" : ""}`}>
      <div className="job-card-status-bar" />
      <div className="job-card-content">
        <div className="job-card-header">
          <div className="job-card-favicon">
            {faviconUrl ? (
              <img src={faviconUrl} alt="" onError={(e) => { e.target.style.display = "none"; }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" opacity="0.5">
                <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16z"/>
              </svg>
            )}
          </div>
          <div className="job-card-meta">
            <span className="job-card-hostname">{hostname}</span>
            <span className="job-card-time">{timeAgo}</span>
          </div>
          <span className={`job-card-badge badge badge-${status === "applied" ? "success" : status === "running" ? "info" : "default"}`}>
            {status === "applied" && "Applied"}
            {status === "running" && (
              <>
                <span className="job-card-badge-pulse" />
                Running
              </>
            )}
            {status === "ready" && "Ready"}
          </span>
        </div>

        <h3 className="job-card-title">
          {link.title && link.title !== link.url ? link.title : hostname}
        </h3>

        <a href={link.url} target="_blank" rel="noopener noreferrer" className="job-card-url">
          {link.url.length > 60 ? link.url.slice(0, 60) + "..." : link.url}
        </a>

        {link.description && (
          <p className="job-card-desc">{link.description}</p>
        )}

        <div className="job-card-actions">
          <button onClick={onView} className="btn btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
              <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
            </svg>
            {status === "ready" ? "Apply" : "View"}
          </button>
          <button onClick={onDelete} className="btn btn-ghost btn-sm job-card-delete" title="Delete job">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
              <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
            <span className="job-card-delete-text">Delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}
