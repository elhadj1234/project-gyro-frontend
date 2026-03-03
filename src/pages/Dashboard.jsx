import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../AuthProvider";
import { supabase } from "../supabaseClient";
import api from "../api";
import JobLiveView from "../components/JobLiveView";
import { PageContainer, PageHeader } from "../components/layout";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, session } = useAuth();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedLinks, setSavedLinks] = useState([]);
  const [applying, setApplying] = useState({});

  const [showLiveView, setShowLiveView] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [liveSessionData, setLiveSessionData] = useState(null);

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
      if (!isAuthenticated()) {
        return null;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        return null;
      }

      const _unused = data;
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
    } else {
      setMessage("Initializing live session...");
      try {
        const response = await api.post("/init-job", { url: link.url });
        const { session_id, live_url } = response.data;

        const newSessionInfo = { sessionId: session_id, liveUrl: live_url };
        setLiveSessionData((prev) => ({ ...prev, [link.id]: newSessionInfo }));

        setActiveJob({ ...link, ...newSessionInfo });
        setShowLiveView(true);
        setMessage("");
      } catch (err) {
        console.error("Failed to init job:", err);
        setMessage(
          "Failed to start live session: " +
            (err.response?.data?.detail || err.message)
        );
      }
    }
  };

  const handleApplyToJob = async (link) => {
    setApplying((prev) => ({ ...prev, [link.id]: true }));
    setMessage("");

    try {
      const profileData = await getProfileData();

      if (link.application_status) {
        setMessage("You have already applied to this job.");
        return;
      }

      if (!isAuthenticated()) {
        setMessage("Authentication error: Please sign in again.");
        return;
      }
      const { data, error } = await supabase
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

      const _unused = data;

      if (error) {
        console.error("Error applying to job:", error);
        setMessage("Error applying to job: " + error.message);
      } else {
        setMessage("Successfully applied to job!");
        await loadUserLinks();
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error applying to job:", error);
      setMessage("Error applying to job. Please try again.");
    } finally {
      setApplying((prev) => ({ ...prev, [link.id]: false }));
    }
  };

  const _unused = applying;

  const getApplicationStatus = (link) => {
    return link.application_status || null;
  };

  const loadUserLinks = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      if (!isAuthenticated()) {
        setMessage("Authentication error: Please sign in again.");
        return;
      }

      const { data, error } = await supabase
        .from("user_links")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage("Error loading your job applications: " + error.message);
      } else {
        setSavedLinks(data || []);
        const _unused = data;

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
              // ignore parsing error
            }
          }
        });

        if (Object.keys(sessions).length > 0) {
          setLiveSessionData((prev) => ({ ...prev, ...sessions }));
        }
      }
    } catch {
      setMessage("Error loading your job applications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setSubmitting(true);
    setMessage("");

    try {
      if (!isAuthenticated()) {
        setMessage("Authentication error: Please sign in again.");
        setSubmitting(false);
        return;
      }

      setMessage("Initializing job session...");
      let sessionData = null;
      try {
        const response = await api.post("/init-job", { url: url.trim() });
        sessionData = response.data;
      } catch (apiError) {
        console.error("Backend init-job failed:", apiError);
        setMessage(
          "Failed to initialize job automation: " +
            (apiError.response?.data?.detail || apiError.message)
        );
        setSubmitting(false);
        return;
      }

      const clip = (s, n) => (typeof s === "string" ? s.slice(0, n) : s);
      const safeTitle = clip(title.trim() || url.trim(), 255);
      const safeDescription = description.trim()
        ? clip(description.trim(), 255)
        : null;
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
        setMessage("Error saving job application: " + error.message);
      } else {
        setMessage("Job application link saved & initialized!");
        setUrl("");
        setTitle("");
        setDescription("");

        if (data && data[0]) {
          setLiveSessionData((prev) => ({
            ...prev,
            [data[0].id]: {
              sessionId: sessionData.session_id,
              liveUrl: sessionData.live_url,
            },
          }));
        }

        await loadUserLinks();
        setTimeout(() => setMessage(""), 3000);
      }
    } catch {
      setMessage("Error saving job application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (linkId) => {
    if (!confirm("Are you sure you want to delete this job application?"))
      return;

    try {
      if (!isAuthenticated()) {
        setMessage("Authentication error: Please sign in again.");
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
            // ignore parse error
          }
        }
        if (sessionId) {
          await api.post("/stop-job", { session_id: sessionId });
        }
      } catch (stopErr) {
        console.warn(
          "Stop job failed (continuing with delete):",
          stopErr?.message || stopErr
        );
      }

      const { error } = await supabase
        .from("user_links")
        .delete()
        .eq("id", linkId)
        .eq("user_id", user.id);

      if (error) {
        setMessage("Error deleting job application: " + error.message);
      } else {
        setMessage("Job application deleted successfully!");
        await loadUserLinks();
        setTimeout(() => setMessage(""), 3000);
      }
    } catch {
      setMessage("Error deleting job application. Please try again.");
    }
  };

  const getHostname = (urlStr) => {
    try {
      return new URL(urlStr).hostname;
    } catch {
      return "link";
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="dash-loading">
          <div className="spinner spinner-lg" />
          <p>Loading your job applications...</p>
        </div>
      </PageContainer>
    );
  }

  const appliedCount = savedLinks.filter(
    (l) => l.application_status === "applied"
  ).length;
  const pendingCount = savedLinks.length - appliedCount;

  return (
    <PageContainer className="dashboard-page">
      <PageHeader
        title="Job Applications"
        description={`Welcome back, ${user?.email}`}
      />

      {/* Stats Row */}
      <div className="dash-stats">
        <div className="dash-stat-card">
          <span className="dash-stat-value">{savedLinks.length}</span>
          <span className="dash-stat-label">Total Jobs</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-value dash-stat-success">{appliedCount}</span>
          <span className="dash-stat-label">Applied</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-value">{pendingCount}</span>
          <span className="dash-stat-label">Pending</span>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`alert ${message.toLowerCase().includes("error") || message.toLowerCase().includes("failed") ? "alert-error" : "alert-success"}`}
        >
          {message}
        </div>
      )}

      {/* Add Job Form */}
      <div className="dash-add-section">
        <form className="dash-add-form" onSubmit={handleSubmit}>
          <div className="dash-form-row">
            <input
              type="url"
              className="input dash-url-input"
              placeholder="Paste a job link (https://...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner spinner-sm" />
                  Initializing...
                </>
              ) : (
                "Save & Init Job"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Job Cards */}
      {savedLinks.length > 0 ? (
        <div className="dash-jobs-grid">
          {savedLinks.map((link) => (
            <article key={link.id} className="dash-job-card card">
              <div className="dash-job-header">
                <div className="dash-job-info">
                  {link.title && link.title !== link.url && (
                    <h3 className="dash-job-title">{link.title}</h3>
                  )}
                  <span className="badge badge-default">{getHostname(link.url)}</span>
                </div>
                {getApplicationStatus(link) && (
                  <span
                    className={`badge ${getApplicationStatus(link) === "applied" ? "badge-success" : "badge-default"}`}
                  >
                    {getApplicationStatus(link) === "applied"
                      ? "Applied"
                      : getApplicationStatus(link)}
                  </span>
                )}
              </div>

              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="dash-job-url"
              >
                {link.url}
              </a>

              {link.description && (
                <p className="dash-job-desc">{link.description}</p>
              )}

              <div className="dash-job-actions">
                <button
                  onClick={() => handleViewJob(link)}
                  className="btn btn-secondary"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                  </svg>
                  View
                </button>
                <button
                  onClick={() => handleDelete(link.id)}
                  className="btn btn-ghost dash-delete-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                  </svg>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <svg
            className="empty-state-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="empty-state-title">No saved job links yet</h3>
          <p className="empty-state-description">
            Paste a job link above to get started tracking your applications.
          </p>
        </div>
      )}

      {/* Live View Modal */}
      {showLiveView && activeJob && (
        <JobLiveView
          liveUrl={activeJob.liveUrl}
          sessionId={activeJob.sessionId}
          onClose={() => {
            setShowLiveView(false);
            setActiveJob(null);
          }}
          onApply={() => {
            setMessage("Automation started for " + activeJob.title);
            handleApplyToJob(activeJob);
          }}
        />
      )}
    </PageContainer>
  );
}
