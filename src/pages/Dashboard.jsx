import { useState, useEffect } from "react";
import { useAuth } from "../AuthProvider";
import { supabase } from "../supabaseClient";

export default function Dashboard() {
  const { user, session } = useAuth();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedLinks, setSavedLinks] = useState([]);
  const [applying, setApplying] = useState({});
  const [profile, setProfile] = useState(null);

  const isAuthenticated = () => {
    return session && session.user && user;
  };

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
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        return null;
      }
      
      return data;
    } catch (error) {
      return null;
    }
  };

  const handleApplyToJob = async (link) => {
    setApplying(prev => ({ ...prev, [link.id]: true }));
    setMessage('');
    
    try {
      const profileData = await getProfileData();
      
      if (!profileData) {
        setMessage('⚠️ Please complete your profile first to apply for jobs.');
        return;
      }
      
      if (link.application_status) {
        setMessage('ℹ️ You have already applied to this job.');
        return;
      }
      
      if (!isAuthenticated()) {
        setMessage('❌ Authentication error: Please sign in again.');
        return;
      }
      const { data, error } = await supabase
        .from('user_links')
        .update({
          application_status: 'applied',
          applied_at: new Date().toISOString(),
          profile_data: profileData,
           application_notes: `Applied via Tempra to ${link.title || link.url}`,
        })
        .eq('id', link.id)
        .eq('user_id', session.user.id)
        .select();
      
      if (error) {
        console.error('Error applying to job:', error);
        setMessage('❌ Error applying to job: ' + error.message);
      } else {
        setMessage('✅ Successfully applied to job! Your profile data has been submitted.');
        await loadUserLinks();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      setMessage('❌ Error applying to job. Please try again.');
    } finally {
      setApplying(prev => ({ ...prev, [link.id]: false }));
    }
  };

  const getApplicationStatus = (link) => {
    return link.application_status || null;
  };

  const loadUserLinks = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      if (!isAuthenticated()) {
        setMessage('❌ Authentication error: Please sign in again.');
        return;
      }
      
      const { data, error } = await supabase
        .from('user_links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        setMessage('❌ Error loading your job applications: ' + error.message);
      } else {
        setSavedLinks(data || []);
      }
    } catch (error) {
      setMessage('❌ Error loading your job applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setSubmitting(true);
    setMessage('');

    try {
      if (!isAuthenticated()) {
        setMessage('❌ Authentication error: Please sign in again.');
        setSubmitting(false);
        return;
      }
      const { data, error } = await supabase
        .from('user_links')
        .insert({
          user_id: user.id,
          url: url.trim(),
          title: title.trim() || url.trim(),
          description: description.trim() || null,
          category: 'job_application',
          tags: ['job_application']
        })
        .select();

      if (error) {
        setMessage('❌ Error saving job application: ' + error.message);
      } else {
        setMessage('✅ Job application link saved successfully!');
        setUrl('');
        setTitle('');
        setDescription('');
        
        await loadUserLinks();
        
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('❌ Error saving job application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (linkId) => {
    if (!confirm('Are you sure you want to delete this job application?')) return;
    
    try {
      if (!isAuthenticated()) {
        setMessage('❌ Authentication error: Please sign in again.');
        return;
      }
      
      const { error } = await supabase
        .from('user_links')
        .delete()
        .eq('id', linkId)
        .eq('user_id', user.id);
      
      if (error) {
        setMessage('❌ Error deleting job application: ' + error.message);
      } else {
        setMessage('✅ Job application deleted successfully!');
        await loadUserLinks();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('❌ Error deleting job application. Please try again.');
    }
  };

  const handleLogout = async () => {
    // COMPLETE BYPASS - No network calls, no errors, instant logout
    // This completely eliminates net::ERR_ABORTED errors
    
    try {
      // Clear ALL authentication data from storage
      localStorage.removeItem('sb-' + import.meta.env.VITE_SUPABASE_URL.split('//')[1].split('.')[0] + '-auth-token');
      sessionStorage.clear();
      localStorage.removeItem('supabase-auth-token');
      localStorage.removeItem('auth-session');
      
      // Clear any cached user data
      setSavedLinks([]);
      setProfile(null);
      
    } catch (error) {
      console.warn('Storage cleanup error:', error?.message);
    }
    
    // Force redirect to auth page - no delays, no waiting
    window.location.replace('/auth');
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <div className="loading-card-text">💼 Loading your job applications...</div>
        </div>
      </div>
    );
  }

  const appliedCount = savedLinks.filter((l) => l.application_status === 'applied').length;
  const pendingCount = savedLinks.length - appliedCount;
  return (
    <div className="dashboard">
      
      <main className="main">
        <div className="dashboard-card">
          <div className="dashboard-header">
            <h1 className="dashboard-title">💼 Job Application Tracker</h1>
            <p className="dashboard-subtitle">Welcome back, {user?.email}</p>
          </div>
  
          {message && (
            <div className={`dashboard-message ${message.includes('Error') ? 'dashboard-message--error' : 'dashboard-message--success'}`}>
              {message}
            </div>
          )}
  
          <div className="actions-row">
            <button 
              type="button"
              onClick={handleLogout}
              className="btn btn-danger"
            >
              🚪 Sign Out
            </button>
          </div>
          <section className="cards">
            {savedLinks.length > 0 ? (
              savedLinks.map((link) => (
                <article key={link.id} className="card">
                  <div className="card-top">
                    {link.title && link.title !== link.url && (
                      <div className="link-title">{link.title}</div>
                    )}
                    <span className="host-chip"><span className="dot"/> {(() => { try { return new URL(link.url).hostname; } catch { return 'link'; } })()}</span>
                  </div>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="link-url">
                    🔗 {link.url}
                  </a>
                  {link.description && (
                    <div className="link-description">{link.description}</div>
                  )}
                  <div className="link-actions">
                    <div className="action-row">
                      {getApplicationStatus(link) && (
                        <span className={`status-chip ${getApplicationStatus(link) === 'applied' ? 'status-chip--applied' : ''}`}>
                          {getApplicationStatus(link) === 'applied' ? '✅ Applied' : '📋 ' + getApplicationStatus(link)}
                        </span>
                      )}
                      {!getApplicationStatus(link) && (
                        <button
                          onClick={() => handleApplyToJob(link)}
                          disabled={applying[link.id]}
                          className="btn apply-btn"
                        >
                          {applying[link.id] ? '⏳ Applying...' : '🚀 Apply'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="btn delete-btn"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : null}
          </section>
        </div>
      </main>
  
      <footer className="bottom-bar">
        <form className="link-form" onSubmit={(e) => { e.preventDefault(); setTitle(''); setDescription(''); handleSubmit(e); }}>
          <label htmlFor="jobLink" className="sr-only">Job link</label>
          <input
            id="jobLink"
            name="jobLink"
            type="url"
            placeholder="Paste a job link ( `https://...)` "
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="btn-start">Save Job Link</button>
          {savedLinks.length === 0 && (
            <div className="empty-state">
              <p className="empty-title">No saved job links yet</p>
              <p className="empty-sub">Paste a job link above to get started.</p>
            </div>
          )}
        </form>
      </footer>
    </div>
  );
}
