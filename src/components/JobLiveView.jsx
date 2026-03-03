import { useState, useEffect } from "react";
import api from "../api";
import "./JobLiveView.css";

export default function JobLiveView({
  liveUrl,
  sessionId,
  jobTitle,
  onClose,
  onMinimize,
  onApply,
}) {
  const [starting, setStarting] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("Ready to start automation");

  useEffect(() => {
    if (started) {
      const steps = [
        { progress: 10, text: "Connecting to job site..." },
        { progress: 25, text: "Loading application form..." },
        { progress: 40, text: "Filling in your details..." },
        { progress: 60, text: "Uploading resume..." },
        { progress: 80, text: "Reviewing application..." },
        { progress: 95, text: "Submitting application..." },
        { progress: 100, text: "Application submitted!" },
      ];

      let stepIndex = 0;
      const interval = setInterval(() => {
        if (stepIndex < steps.length) {
          setProgress(steps[stepIndex].progress);
          setProgressText(steps[stepIndex].text);
          stepIndex++;
        } else {
          clearInterval(interval);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [started]);

  const handleApply = async () => {
    setStarting(true);
    setError("");
    setProgress(5);
    setProgressText("Initiating automation...");

    try {
      await api.post("/start-job", { session_id: sessionId });
      setStarted(true);
      onApply();
    } catch (err) {
      console.error("Failed to start job:", err);
      setError("Failed to start automation. Please try again.");
      setStarting(false);
      setProgress(0);
      setProgressText("Ready to start automation");
    }
  };

  return (
    <div className="liveview-backdrop">
      <div className="liveview-modal liveview-modal-large">
        {/* Header */}
        <div className="liveview-header">
          <div className="liveview-header-left">
            <h2 className="liveview-title">
              {started ? "Automation Running" : "Live Application View"}
            </h2>
            {jobTitle && <p className="liveview-job-title">{jobTitle}</p>}
          </div>
          <div className="liveview-header-actions">
            {onMinimize && (
              <button
                onClick={onMinimize}
                className="liveview-minimize"
                aria-label="Minimize"
                title="Minimize to continue browsing"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M14 8a1 1 0 0 1-1 1H3a1 1 0 0 1 0-2h10a1 1 0 0 1 1 1z"/>
                </svg>
              </button>
            )}
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
        </div>

        {/* Progress Bar */}
        {(starting || started) && (
          <div className="liveview-progress-container">
            <div className="liveview-progress-bar">
              <div
                className="liveview-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="liveview-progress-info">
              <span className="liveview-progress-text">{progressText}</span>
              <span className="liveview-progress-percent">{progress}%</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!started && !starting && (
          <div className="liveview-instructions">
            <div className="liveview-instruction-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
            </div>
            <div className="liveview-instruction-text">
              <strong>Sign in to the job site below</strong>
              <p>
                Once you're logged in and on the application page, click "Apply
                for me" to start the automation.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error liveview-error">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
            </svg>
            {error}
          </div>
        )}

        {/* Iframe Container */}
        <div className="liveview-body">
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
                <p>Connecting to job site...</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="liveview-footer">
          <div className="liveview-footer-left">
            {started && (
              <div className="liveview-status">
                <span className="liveview-status-dot" />
                <span>Automation active</span>
              </div>
            )}
          </div>
          <div className="liveview-footer-actions">
            <button onClick={onClose} className="btn btn-secondary">
              {started ? "Close" : "Cancel"}
            </button>
            {!started && (
              <button
                onClick={handleApply}
                className="btn btn-primary liveview-apply-btn"
                disabled={starting}
              >
                {starting ? (
                  <>
                    <span className="spinner spinner-sm" />
                    Starting...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z"/>
                    </svg>
                    Apply for me
                  </>
                )}
              </button>
            )}
            {started && (
              <div className="liveview-running-indicator">
                <span className="liveview-running-pulse" />
                Running...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
