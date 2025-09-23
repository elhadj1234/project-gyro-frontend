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
          application_notes: `Applied via Link Saver to ${link.title || link.url}`
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
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          fontSize: '18px',
          fontWeight: '600',
          color: '#374151'
        }}>
          💼 Loading your job applications...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        transform: 'translateY(0)',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            margin: '0 0 10px 0',
            fontSize: '32px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>💼 Job Application Tracker</h1>
          
          <p style={{
            margin: '0',
            color: '#6b7280',
            fontSize: '16px',
            fontWeight: '500'
          }}>Welcome back, {user?.email}</p>
        </div>

        {message && (
          <div style={{
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '24px',
            backgroundColor: message.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            color: message.includes('Error') ? '#dc2626' : '#16a34a',
            border: `2px solid ${message.includes('Error') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
            fontWeight: '500',
            textAlign: 'center',
            backdropFilter: 'blur(10px)'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{marginBottom: '32px'}}>
          <div style={{marginBottom: '24px'}}>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              textAlign: 'center'
            }}>💼 Save Job Application Link</label>
            
            {/* URL Input */}
            <div style={{position: 'relative', marginBottom: '16px'}}>
              <input
                type="url"
                placeholder="Enter job posting URL here... (required)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  color: '#1f2937'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
            </div>
            
            {/* Title Input */}
            <div style={{position: 'relative', marginBottom: '16px'}}>
              <input
                type="text"
                placeholder="Job title or company name (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  color: '#1f2937'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            
            {/* Description Input */}
            <div style={{position: 'relative', marginBottom: '16px'}}>
              <textarea
                placeholder="Job description or notes (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  color: '#1f2937',
                  resize: 'vertical',
                  minHeight: '80px'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button 
              type="submit" 
              disabled={submitting}
              style={{
                background: submitting ? '#9ca3af' : 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: submitting ? 'none' : '0 8px 20px rgba(102, 126, 234, 0.3)',
                transform: 'translateY(0)',
                minWidth: '140px'
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
                }
              }}
            >
              {submitting ? '💼 Saving...' : '💼 Save Job Link'}
            </button>
            
            <button 
              type="button"
              onClick={handleLogout}
              style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)',
                transform: 'translateY(0)',
                minWidth: '140px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 24px rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.3)';
              }}
            >
              🚪 Sign Out
            </button>
          </div>
        </form>

        {/* Saved Links Section */}
        {savedLinks.length > 0 && (
          <div style={{
            marginTop: '32px',
            padding: '24px',
            background: 'rgba(255, 255, 255, 0.6)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#374151',
              textAlign: 'center'
            }}>💼 Your Job Applications</h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {savedLinks.map((link) => (
                <div key={link.id} style={{
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '16px',
                  border: '1px solid rgba(102, 126, 234, 0.1)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}>
                  {/* Title */}
                  {link.title && link.title !== link.url && (
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#1f2937',
                      marginBottom: '8px',
                      lineHeight: '1.4'
                    }}>
                      {link.title}
                    </div>
                  )}
                  
                  {/* URL */}
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      color: '#667eea',
                      textDecoration: 'none',
                      fontWeight: '500',
                      fontSize: '14px',
                      wordBreak: 'break-all',
                      display: 'block',
                      marginBottom: '12px',
                      padding: '8px 12px',
                      background: 'rgba(102, 126, 234, 0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(102, 126, 234, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.textDecoration = 'underline';
                      e.target.style.background = 'rgba(102, 126, 234, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.textDecoration = 'none';
                      e.target.style.background = 'rgba(102, 126, 234, 0.05)';
                    }}
                  >
                    🔗 {link.url}
                  </a>
                  
                  {/* Description */}
                  {link.description && (
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '12px',
                      lineHeight: '1.5',
                      fontStyle: 'italic'
                    }}>
                      {link.description}
                    </div>
                  )}
                  
                  {/* Footer with date, category, and actions */}
                   <div style={{
                     fontSize: '12px',
                     color: '#9ca3af',
                     display: 'flex',
                     justifyContent: 'space-between',
                     alignItems: 'center',
                     flexWrap: 'wrap',
                     gap: '8px'
                   }}>
                     <div style={{
                       display: 'flex',
                       alignItems: 'center',
                       gap: '12px',
                       flexWrap: 'wrap'
                     }}>
                       <span style={{
                         display: 'flex',
                         alignItems: 'center',
                         gap: '4px'
                       }}>
                         📅 {new Date(link.created_at).toLocaleDateString('en-US', {
                           year: 'numeric',
                           month: 'short',
                           day: 'numeric'
                         })}
                       </span>
                       {link.category && (
                         <span style={{
                           background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                           color: '#667eea',
                           padding: '4px 12px',
                           borderRadius: '16px',
                           fontSize: '11px',
                           fontWeight: '600',
                           border: '1px solid rgba(102, 126, 234, 0.2)'
                         }}>
                           🏷️ {link.category}
                         </span>
                       )}
                     </div>
                     
                     {/* Action Buttons */}
                     <div style={{
                       display: 'flex',
                       alignItems: 'center',
                       gap: '8px',
                       flexWrap: 'wrap'
                     }}>
                       {/* Application Status */}
                        {getApplicationStatus(link) && (
                          <span style={{
                            background: getApplicationStatus(link) === 'applied' 
                              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1))'
                              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))',
                            color: getApplicationStatus(link) === 'applied' ? '#16a34a' : '#2563eb',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            fontSize: '11px',
                            fontWeight: '600',
                            border: getApplicationStatus(link) === 'applied'
                              ? '1px solid rgba(34, 197, 94, 0.2)'
                              : '1px solid rgba(59, 130, 246, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {getApplicationStatus(link) === 'applied' ? '✅ Applied' : '📋 ' + getApplicationStatus(link)}
                          </span>
                        )}
                        
                        {/* Apply Button */}
                        {!getApplicationStatus(link) && (
                         <button
                           onClick={() => handleApplyToJob(link)}
                           disabled={applying[link.id]}
                           style={{
                             background: applying[link.id] 
                               ? 'linear-gradient(135deg, rgba(156, 163, 175, 0.1), rgba(107, 114, 128, 0.1))'
                               : 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1))',
                             color: applying[link.id] ? '#6b7280' : '#16a34a',
                             border: applying[link.id] 
                               ? '1px solid rgba(156, 163, 175, 0.2)'
                               : '1px solid rgba(34, 197, 94, 0.2)',
                             padding: '6px 12px',
                             borderRadius: '8px',
                             fontSize: '11px',
                             fontWeight: '600',
                             cursor: applying[link.id] ? 'not-allowed' : 'pointer',
                             transition: 'all 0.2s ease',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '4px'
                           }}
                           onMouseEnter={(e) => {
                             if (!applying[link.id]) {
                               e.target.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))';
                               e.target.style.transform = 'translateY(-1px)';
                             }
                           }}
                           onMouseLeave={(e) => {
                             if (!applying[link.id]) {
                               e.target.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1))';
                               e.target.style.transform = 'translateY(0)';
                             }
                           }}
                         >
                           {applying[link.id] ? '⏳ Applying...' : '🚀 Apply'}
                         </button>
                       )}
                       
                       {/* Delete Button */}
                       <button
                         onClick={() => handleDelete(link.id)}
                         style={{
                           background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))',
                           color: '#dc2626',
                           border: '1px solid rgba(239, 68, 68, 0.2)',
                           padding: '6px 12px',
                           borderRadius: '8px',
                           fontSize: '11px',
                           fontWeight: '600',
                           cursor: 'pointer',
                           transition: 'all 0.2s ease',
                           display: 'flex',
                           alignItems: 'center',
                           gap: '4px'
                         }}
                         onMouseEnter={(e) => {
                           e.target.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))';
                           e.target.style.transform = 'translateY(-1px)';
                         }}
                         onMouseLeave={(e) => {
                           e.target.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))';
                           e.target.style.transform = 'translateY(0)';
                         }}
                       >
                         🗑️ Delete
                       </button>
                     </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
