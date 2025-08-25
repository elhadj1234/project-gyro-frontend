import { useState, useEffect } from "react";
import { useAuth } from "../AuthProvider";
import { supabase } from "../supabaseClient";

const initialProfileData = {
  my_information: {
    how_did_you_hear_about_us: "Social Media",
    country: "United States",
    first_name: "",
    last_name: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    email_address: "",
    phone_device_type: "",
    country_phone_code: "",
    phone_number: "",
    phone_extension: ""
  },
  my_experience: {
    work_experience: [{
      job_title: "",
      company_name: "Company Name",
      location: "City, State",
      start_date: "MM/DD/YYYY",
      end_date: "MM/DD/YYYY",
      description: "- Description of responsibilities and accomplishments here."
    }],
    education: [{
      school_name: "University Name",
      degree: "Degree Type",
      field_of_study: "Field of Study",
      overall_result: "",
      from: "YYYY",
      to: "YYYY"
    }],
    skills: [
      { skill_name: "Skill 1" },
      { skill_name: "Skill 2" }
    ],
    resume: {
      path: "",
      filename: "",
      file_url: ""
    },
    social_network_urls: [
      { platform: "LinkedIn", url: "" },
      { platform: "GitHub", url: "" }
    ]
  },
  application_questions: {
    "Are you able to perform the essential functions of the job for which you are applying with or without reasonable accomodation": "Yes",
    "Are you legally authorized to work in the country for which you are applying": "Yes",
    "Will you now, or in the future, require sponsorship for an employment visa": "No",
    "Are you currently or previously employed at this company": "No",
    "Do you have any criminal convictions": "No",
    "Have you been employed at any company before": "Yes"
  },
  personal_information: {
    gender: "",
    date_of_birth: "",
    race: "",
    religion: "",
    marital_status: "",
    invitation_to_self_identify_as_a_protected_veteran: ""
  },
  self_identity: {
    language: "",
    name: "",
    date: "",
    disability: ""
  }
};

export default function Profile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(initialProfileData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState("my_information");

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfileData({
          my_information: data.my_information || initialProfileData.my_information,
          my_experience: data.my_experience || initialProfileData.my_experience,
          application_questions: data.application_questions || initialProfileData.application_questions,
          personal_information: data.personal_information || initialProfileData.personal_information,
          self_identity: data.self_identity || initialProfileData.self_identity
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage('Error loading profile data');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage("");

    try {
      // Use upsert with proper conflict resolution
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          my_information: profileData.my_information,
          my_experience: profileData.my_experience,
          application_questions: profileData.application_questions,
          personal_information: profileData.personal_information,
          self_identity: profileData.self_identity,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setMessage('Profile saved successfully!');
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Error saving profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateNestedField = (section, field, value, index = null, subField = null) => {
    setProfileData(prev => {
      const newData = { ...prev };
      
      if (index !== null) {
        // Handle array updates
        if (subField) {
          newData[section][field][index][subField] = value;
        } else {
          newData[section][field][index] = value;
        }
      } else {
        // Handle direct field updates
        if (typeof value === 'object' && value !== null) {
          newData[section][field] = { ...newData[section][field], ...value };
        } else {
          newData[section][field] = value;
        }
      }
      
      return newData;
    });
  };

  const addArrayItem = (section, field, newItem) => {
    setProfileData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...prev[section][field], newItem]
      }
    }));
  };

  const removeArrayItem = (section, field, index) => {
    setProfileData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].filter((_, i) => i !== index)
      }
    }));
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_resume_${Date.now()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      // Note: You'll need to create a 'user-files' bucket in Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-files')
        .getPublicUrl(filePath);

      // Update resume data
      updateNestedField('my_experience', 'resume', {
        path: filePath,
        filename: file.name,
        file_url: publicUrl
      });

      setMessage('Resume uploaded successfully!');
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage('Error uploading resume: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <button 
          onClick={saveProfile} 
          disabled={saving}
          className="save-btn"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="profile-content">
        <nav className="profile-nav">
          {Object.keys(initialProfileData).map(section => (
            <button
              key={section}
              className={`nav-btn ${activeSection === section ? 'active' : ''}`}
              onClick={() => setActiveSection(section)}
            >
              {section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </nav>

        <div className="profile-form">
          {activeSection === 'my_information' && (
            <MyInformationSection 
              data={profileData.my_information}
              updateField={(field, value) => updateNestedField('my_information', field, value)}
            />
          )}
          
          {activeSection === 'my_experience' && (
            <MyExperienceSection 
              data={profileData.my_experience}
              updateField={updateNestedField}
              addArrayItem={addArrayItem}
              removeArrayItem={removeArrayItem}
              onFileUpload={handleFileUpload}
              uploading={uploading}
            />
          )}
          
          {activeSection === 'application_questions' && (
            <ApplicationQuestionsSection 
              data={profileData.application_questions}
              updateField={(field, value) => updateNestedField('application_questions', field, value)}
            />
          )}
          
          {activeSection === 'personal_information' && (
            <PersonalInformationSection 
              data={profileData.personal_information}
              updateField={(field, value) => updateNestedField('personal_information', field, value)}
            />
          )}
          
          {activeSection === 'self_identity' && (
            <SelfIdentitySection 
              data={profileData.self_identity}
              updateField={(field, value) => updateNestedField('self_identity', field, value)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// My Information Section Component
function MyInformationSection({ data, updateField }) {
  return (
    <div className="form-section">
      <h2>My Information</h2>
      
      <div className="form-group">
        <label>How did you hear about us?</label>
        <select 
          value={data.how_did_you_hear_about_us} 
          onChange={(e) => updateField('how_did_you_hear_about_us', e.target.value)}
        >
          <option value="Social Media">Social Media</option>
          <option value="Search Engine">Search Engine</option>
          <option value="Friend/Referral">Friend/Referral</option>
          <option value="Advertisement">Advertisement</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>First Name</label>
          <input 
            type="text" 
            value={data.first_name} 
            onChange={(e) => updateField('first_name', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Last Name</label>
          <input 
            type="text" 
            value={data.last_name} 
            onChange={(e) => updateField('last_name', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Email Address</label>
        <input 
          type="email" 
          value={data.email_address} 
          onChange={(e) => updateField('email_address', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Country</label>
        <input 
          type="text" 
          value={data.country} 
          onChange={(e) => updateField('country', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Address Line 1</label>
        <input 
          type="text" 
          value={data.address_line_1} 
          onChange={(e) => updateField('address_line_1', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Address Line 2</label>
        <input 
          type="text" 
          value={data.address_line_2} 
          onChange={(e) => updateField('address_line_2', e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>City</label>
          <input 
            type="text" 
            value={data.city} 
            onChange={(e) => updateField('city', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>State</label>
          <input 
            type="text" 
            value={data.state} 
            onChange={(e) => updateField('state', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Postal Code</label>
          <input 
            type="text" 
            value={data.postal_code} 
            onChange={(e) => updateField('postal_code', e.target.value)}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Country Phone Code</label>
          <input 
            type="text" 
            value={data.country_phone_code} 
            onChange={(e) => updateField('country_phone_code', e.target.value)}
            placeholder="+1"
          />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input 
            type="tel" 
            value={data.phone_number} 
            onChange={(e) => updateField('phone_number', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Extension</label>
          <input 
            type="text" 
            value={data.phone_extension} 
            onChange={(e) => updateField('phone_extension', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Phone Device Type</label>
        <select 
          value={data.phone_device_type} 
          onChange={(e) => updateField('phone_device_type', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="Mobile">Mobile</option>
          <option value="Home">Home</option>
          <option value="Work">Work</option>
        </select>
      </div>
    </div>
  );
}

// My Experience Section Component
function MyExperienceSection({ data, updateField, addArrayItem, removeArrayItem, onFileUpload, uploading }) {
  return (
    <div className="form-section">
      <h2>My Experience</h2>
      
      {/* Work Experience */}
      <div className="subsection">
        <div className="subsection-header">
          <h3>Work Experience</h3>
          <button 
            type="button"
            onClick={() => addArrayItem('my_experience', 'work_experience', {
              job_title: "",
              company_name: "",
              location: "",
              start_date: "",
              end_date: "",
              description: ""
            })}
            className="add-btn"
          >
            Add Experience
          </button>
        </div>
        
        {data.work_experience.map((exp, index) => (
          <div key={index} className="array-item">
            <div className="array-item-header">
              <h4>Experience {index + 1}</h4>
              <button 
                type="button"
                onClick={() => removeArrayItem('my_experience', 'work_experience', index)}
                className="remove-btn"
              >
                Remove
              </button>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Job Title</label>
                <input 
                  type="text" 
                  value={exp.job_title} 
                  onChange={(e) => updateField('my_experience', 'work_experience', e.target.value, index, 'job_title')}
                />
              </div>
              <div className="form-group">
                <label>Company Name</label>
                <input 
                  type="text" 
                  value={exp.company_name} 
                  onChange={(e) => updateField('my_experience', 'work_experience', e.target.value, index, 'company_name')}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Location</label>
              <input 
                type="text" 
                value={exp.location} 
                onChange={(e) => updateField('my_experience', 'work_experience', e.target.value, index, 'location')}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input 
                  type="date" 
                  value={exp.start_date} 
                  onChange={(e) => updateField('my_experience', 'work_experience', e.target.value, index, 'start_date')}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input 
                  type="date" 
                  value={exp.end_date} 
                  onChange={(e) => updateField('my_experience', 'work_experience', e.target.value, index, 'end_date')}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea 
                value={exp.description} 
                onChange={(e) => updateField('my_experience', 'work_experience', e.target.value, index, 'description')}
                rows="4"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Education */}
      <div className="subsection">
        <div className="subsection-header">
          <h3>Education</h3>
          <button 
            type="button"
            onClick={() => addArrayItem('my_experience', 'education', {
              school_name: "",
              degree: "",
              field_of_study: "",
              overall_result: "",
              from: "",
              to: ""
            })}
            className="add-btn"
          >
            Add Education
          </button>
        </div>
        
        {data.education.map((edu, index) => (
          <div key={index} className="array-item">
            <div className="array-item-header">
              <h4>Education {index + 1}</h4>
              <button 
                type="button"
                onClick={() => removeArrayItem('my_experience', 'education', index)}
                className="remove-btn"
              >
                Remove
              </button>
            </div>
            
            <div className="form-group">
              <label>School Name</label>
              <input 
                type="text" 
                value={edu.school_name} 
                onChange={(e) => updateField('my_experience', 'education', e.target.value, index, 'school_name')}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Degree</label>
                <input 
                  type="text" 
                  value={edu.degree} 
                  onChange={(e) => updateField('my_experience', 'education', e.target.value, index, 'degree')}
                />
              </div>
              <div className="form-group">
                <label>Field of Study</label>
                <input 
                  type="text" 
                  value={edu.field_of_study} 
                  onChange={(e) => updateField('my_experience', 'education', e.target.value, index, 'field_of_study')}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>From Year</label>
                <input 
                  type="number" 
                  value={edu.from} 
                  onChange={(e) => updateField('my_experience', 'education', e.target.value, index, 'from')}
                />
              </div>
              <div className="form-group">
                <label>To Year</label>
                <input 
                  type="number" 
                  value={edu.to} 
                  onChange={(e) => updateField('my_experience', 'education', e.target.value, index, 'to')}
                />
              </div>
              <div className="form-group">
                <label>Overall Result</label>
                <input 
                  type="text" 
                  value={edu.overall_result} 
                  onChange={(e) => updateField('my_experience', 'education', e.target.value, index, 'overall_result')}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="subsection">
        <div className="subsection-header">
          <h3>Skills</h3>
          <button 
            type="button"
            onClick={() => addArrayItem('my_experience', 'skills', { skill_name: "" })}
            className="add-btn"
          >
            Add Skill
          </button>
        </div>
        
        {data.skills.map((skill, index) => (
          <div key={index} className="skill-item">
            <input 
              type="text" 
              value={skill.skill_name} 
              onChange={(e) => updateField('my_experience', 'skills', e.target.value, index, 'skill_name')}
              placeholder="Skill name"
            />
            <button 
              type="button"
              onClick={() => removeArrayItem('my_experience', 'skills', index)}
              className="remove-btn small"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Social Networks */}
      <div className="subsection">
        <div className="subsection-header">
          <h3>Social Network URLs</h3>
          <button 
            type="button"
            onClick={() => addArrayItem('my_experience', 'social_network_urls', { platform: "", url: "" })}
            className="add-btn"
          >
            Add Social Network
          </button>
        </div>
        
        {data.social_network_urls.map((social, index) => (
          <div key={index} className="array-item">
            <div className="array-item-header">
              <h4>Social Network {index + 1}</h4>
              <button 
                type="button"
                onClick={() => removeArrayItem('my_experience', 'social_network_urls', index)}
                className="remove-btn"
              >
                Remove
              </button>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Platform</label>
                <select 
                  value={social.platform} 
                  onChange={(e) => updateField('my_experience', 'social_network_urls', e.target.value, index, 'platform')}
                >
                  <option value="">Select Platform</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="GitHub">GitHub</option>
                  <option value="Twitter">Twitter</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>URL</label>
                <input 
                  type="url" 
                  value={social.url} 
                  onChange={(e) => updateField('my_experience', 'social_network_urls', e.target.value, index, 'url')}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resume */}
      <div className="subsection">
        <h3>Resume</h3>
        <div className="form-group">
          <label>Resume Path/URL</label>
          <input 
            type="text" 
            value={data.resume.path} 
            onChange={(e) => updateField('my_experience', 'resume', { path: e.target.value })}
            placeholder="Upload resume or provide URL"
          />
        </div>
      </div>
    </div>
  );
}

// Application Questions Section Component
function ApplicationQuestionsSection({ data, updateField }) {
  const questions = Object.keys(data);
  
  return (
    <div className="form-section">
      <h2>Application Questions</h2>
      
      {questions.map((question, index) => (
        <div key={index} className="form-group">
          <label>{question}</label>
          <select 
            value={data[question]} 
            onChange={(e) => updateField(question, e.target.value)}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
      ))}
    </div>
  );
}

// Personal Information Section Component
function PersonalInformationSection({ data, updateField }) {
  return (
    <div className="form-section">
      <h2>Personal Information</h2>
      <p className="disclaimer">This information is optional and used for diversity and inclusion purposes only.</p>
      
      <div className="form-group">
        <label>Gender</label>
        <select 
          value={data.gender} 
          onChange={(e) => updateField('gender', e.target.value)}
        >
          <option value="">Prefer not to say</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Non-binary">Non-binary</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label>Date of Birth</label>
        <input 
          type="date" 
          value={data.date_of_birth} 
          onChange={(e) => updateField('date_of_birth', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Race/Ethnicity</label>
        <input 
          type="text" 
          value={data.race} 
          onChange={(e) => updateField('race', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Religion</label>
        <input 
          type="text" 
          value={data.religion} 
          onChange={(e) => updateField('religion', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Marital Status</label>
        <select 
          value={data.marital_status} 
          onChange={(e) => updateField('marital_status', e.target.value)}
        >
          <option value="">Prefer not to say</option>
          <option value="Single">Single</option>
          <option value="Married">Married</option>
          <option value="Divorced">Divorced</option>
          <option value="Widowed">Widowed</option>
        </select>
      </div>

      <div className="form-group">
        <label>Protected Veteran Status</label>
        <select 
          value={data.invitation_to_self_identify_as_a_protected_veteran} 
          onChange={(e) => updateField('invitation_to_self_identify_as_a_protected_veteran', e.target.value)}
        >
          <option value="">Prefer not to say</option>
          <option value="Yes">Yes, I am a protected veteran</option>
          <option value="No">No, I am not a protected veteran</option>
        </select>
      </div>
    </div>
  );
}

// Self Identity Section Component
function SelfIdentitySection({ data, updateField }) {
  return (
    <div className="form-section">
      <h2>Self Identity</h2>
      
      <div className="form-group">
        <label>Preferred Language</label>
        <input 
          type="text" 
          value={data.language} 
          onChange={(e) => updateField('language', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Preferred Name</label>
        <input 
          type="text" 
          value={data.name} 
          onChange={(e) => updateField('name', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Date</label>
        <input 
          type="date" 
          value={data.date} 
          onChange={(e) => updateField('date', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Disability Status</label>
        <select 
          value={data.disability} 
          onChange={(e) => updateField('disability', e.target.value)}
        >
          <option value="">Prefer not to say</option>
          <option value="Yes">Yes, I have a disability</option>
          <option value="No">No, I do not have a disability</option>
        </select>
      </div>
    </div>
  );
}