import { useState } from "react";
import api from "../api";
import "./JobLiveView.css";

export default function JobLiveView({ liveUrl, sessionId, onClose, onApply }) {
  const [starting, setStarting] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");

  const handleApply = async () => {
    setStarting(true);
    setError("");
    try {
      await api.post("/start-job", { session_id: sessionId });
      setStarted(true);
      onApply();
    } catch (err) {
      console.error("Failed to start job:", err);
      setError("Failed to start automation. Please try again.");
      setStarting(false);
    }
  };

  return (
    <div className="liveview-backdrop">
      <div className="liveview-modal">
        <div className="liveview-header">
          <div className="liveview-header-text">
            <h2 className="liveview-title">Live Application View</h2>
            <p className="liveview-subtitle">
              {started
                ? "Automation is running. Watch the progress below."
                : "Sign in to the job site below, then click \"Apply for me\"."}
            </p>
          </div>
          <button onClick={onClose} className="liveview-close" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="liveview-body">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="liveview-iframe-container">
            {liveUrl ? (
              <iframe
                src={liveUrl}
                title="Job Application Live View"
                className="liveview-iframe"
                allow="clipboard-read; clipboard-write"
              />
            ) : (
              <div className="liveview-loading">
                <div className="spinner spinner-lg" />
                <p>Loading live view...</p>
              </div>
            )}
          </div>
        </div>

        <div className="liveview-footer">
          <button onClick={onClose} className="btn btn-secondary">
            {started ? "Close" : "Cancel"}
          </button>
          {!started && (
            <button
              onClick={handleApply}
              className="btn btn-primary"
              disabled={starting}
            >
              {starting ? (
                <>
                  <span className="spinner spinner-sm" />
                  Starting...
                </>
              ) : (
                "Apply for me"
              )}
            </button>
          )}
          {started && (
            <button className="btn liveview-running-btn" disabled>
              <span className="liveview-pulse" />
              Running...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
