import React, { useState } from 'react';
import api from '../api';

export default function JobLiveView({ liveUrl, sessionId, onClose, onApply }) {
  const [starting, setStarting] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async () => {
    setStarting(true);
    setError('');
    try {
      await api.post('/start-job', { session_id: sessionId });
      setStarted(true);
      onApply();
    } catch (err) {
      console.error("Failed to start job:", err);
      setError("Failed to start automation. Please try again.");
      setStarting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content live-view-modal">
        <div className="modal-header">
          <h2>Live Application View</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="modal-body">
          <p className="instruction-text">
            {started 
              ? "Automation is running! You can watch the progress below." 
              : "Please sign in to the job site below. Once you are logged in and on the application page, click \"Apply for me\"."}
          </p>
          
          <div className="iframe-container">
            {liveUrl ? (
              <iframe 
                src={liveUrl} 
                title="Job Application Live View" 
                className="live-iframe"
                allow="clipboard-read; clipboard-write"
              />
            ) : (
              <div className="loading-placeholder">Loading live view...</div>
            )}
          </div>
          
          {error && <div className="error-message">{error}</div>}
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">{started ? 'Close' : 'Cancel'}</button>
          {!started && (
            <button 
              onClick={handleApply} 
              className="btn btn-primary"
              disabled={starting}
            >
              {starting ? 'Starting...' : 'Apply for me'}
            </button>
          )}
          {started && (
            <button className="btn btn-success" disabled>
              Running...
            </button>
          )}
        </div>
      </div>
      
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 1000px;
          height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        .modal-header {
          padding: 16px 24px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-body {
          flex: 1;
          padding: 24px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .iframe-container {
          flex: 1;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
          background: #f9f9f9;
        }
        .live-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        .instruction-text {
          margin-bottom: 16px;
          color: #555;
          font-weight: 500;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }
        .error-message {
          color: red;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}
