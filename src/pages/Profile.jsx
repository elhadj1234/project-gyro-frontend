import { useState, useEffect, useRef } from "react";
import { useAuth } from "../AuthProvider";
import { supabase } from "../supabaseClient";
import { PageContainer, PageHeader } from "../components/layout";
import "./Profile.css";

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
    phone_extension: "",
  },
  my_experience: {
    work_experience: [
      {
        job_title: "",
        company_name: "Company Name",
        location: "City, State",
        start_date: "MM/DD/YYYY",
        end_date: "MM/DD/YYYY",
        description:
          "- Description of responsibilities and accomplishments here.",
      },
    ],
    education: [
      {
        school_name: "University Name",
        degree: "Degree Type",
        field_of_study: "Field of Study",
        overall_result: "",
        from: "YYYY",
        to: "YYYY",
      },
    ],
    skills: [{ skill_name: "Skill 1" }, { skill_name: "Skill 2" }],
    resume: {
      path: "",
      filename: "",
      file_url: "",
    },
    social_network_urls: [
      { platform: "LinkedIn", url: "" },
      { platform: "GitHub", url: "" },
    ],
  },
  application_questions: {
    "Are you able to perform the essential functions of the job for which you are applying with or without reasonable accomodation":
      "Yes",
    "Are you legally authorized to work in the country for which you are applying":
      "Yes",
    "Will you now, or in the future, require sponsorship for an employment visa":
      "No",
    "Are you currently or previously employed at this company": "No",
    "Do you have any criminal convictions": "No",
    "Have you been employed at any company before": "Yes",
  },
  personal_information: {
    gender: "",
    date_of_birth: "",
    race: "",
    religion: "",
    marital_status: "",
    invitation_to_self_identify_as_a_protected_veteran: "",
  },
  self_identity: {
    language: "",
    name: "",
    date: "",
    disability: "",
  },
};

const sectionLabels = {
  my_information: "Personal Info",
  my_experience: "Experience",
  application_questions: "Questions",
  personal_information: "Demographics",
  self_identity: "Self Identity",
};

export default function Profile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(initialProfileData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState("my_information");
  const [uploading, setUploading] = useState(false);
  const resumeInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setProfileData({
          my_information:
            data.my_information || initialProfileData.my_information,
          my_experience:
            data.my_experience || initialProfileData.my_experience,
          application_questions:
            data.application_questions ||
            initialProfileData.application_questions,
          personal_information:
            data.personal_information ||
            initialProfileData.personal_information,
          self_identity: data.self_identity || initialProfileData.self_identity,
        });
      }
    } catch (error) {
      setMessage("Error loading profile data");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase.from("user_profiles").upsert(
        {
          user_id: user.id,
          my_information: profileData.my_information,
          my_experience: profileData.my_experience,
          application_questions: profileData.application_questions,
          personal_information: profileData.personal_information,
          self_identity: profileData.self_identity,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

      if (error) throw error;

      setMessage("Profile saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Error saving profile: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateNestedField = (
    section,
    field,
    value,
    index = null,
    subField = null
  ) => {
    setProfileData((prev) => {
      const newData = { ...prev };

      if (index !== null) {
        if (subField) {
          newData[section][field][index][subField] = value;
        } else {
          newData[section][field][index] = value;
        }
      } else {
        if (typeof value === "object" && value !== null) {
          newData[section][field] = { ...newData[section][field], ...value };
        } else {
          newData[section][field] = value;
        }
      }

      return newData;
    });
  };

  const addArrayItem = (section, field, newItem) => {
    setProfileData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...prev[section][field], newItem],
      },
    }));
  };

  const removeArrayItem = (section, field, index) => {
    setProfileData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].filter((_, i) => i !== index),
      },
    }));
  };

  const email = user?.email || "";
  const initials = (email?.[0] || "U").toUpperCase();
  const skillsCount = profileData?.my_experience?.skills?.length || 0;
  const jobsCount = profileData?.my_experience?.work_experience?.length || 0;
  const eduCount = profileData?.my_experience?.education?.length || 0;

  const handleFileUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) {
        setUploading(false);
        return;
      }

      const ext = file.name.includes(".") ? file.name.split(".").pop() : "pdf";
      const randomKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? `${crypto.randomUUID()}.${ext}`
          : `${Math.random().toString(36).slice(2)}-${Date.now()}.${ext}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from("resumes")
        .upload(randomKey, file, {
          upsert: false,
          contentType: file.type || "application/octet-stream",
        });

      if (storageError) throw storageError;

      updateNestedField("my_experience", "resume", {
        filename: file.name,
        path: storageData?.path || randomKey,
      });

      setMessage("Resume uploaded successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Resume upload error:", err);
      setMessage(
        "Error uploading resume: " + (err?.message || "Please try again")
      );
    } finally {
      setUploading(false);
      if (resumeInputRef.current) {
        resumeInputRef.current.value = "";
      }
    }
  };

  const triggerResumeUpload = () => {
    resumeInputRef.current?.click();
  };

  const viewResume = async () => {
    try {
      const path = profileData?.my_experience?.resume?.path;
      if (!path) {
        setMessage("No resume uploaded yet.");
        setTimeout(() => setMessage(""), 2500);
        return;
      }
      const { data, error } = await supabase.storage
        .from("resumes")
        .createSignedUrl(path, 120);
      if (error) throw error;
      const url = data?.signedUrl;
      if (!url) throw new Error("Failed to generate signed URL");
      window.open(url, "_blank", "noopener");
    } catch (err) {
      console.error("View resume error:", err);
      setMessage(
        "Error generating secure view link: " +
          (err?.message || "Please try again")
      );
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="profile-loading">
          <div className="spinner spinner-lg" />
          <p>Loading profile...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="profile-page">
      <div className="profile-header-card card">
        <div className="profile-header-content">
          <div className="profile-avatar-large">{initials}</div>
          <div className="profile-header-info">
            <h1 className="profile-name">
              {profileData.my_information.first_name ||
              profileData.my_information.last_name
                ? `${profileData.my_information.first_name} ${profileData.my_information.last_name}`
                : "Your Profile"}
            </h1>
            <p className="profile-email">{email}</p>
          </div>
          <div className="profile-header-actions">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? (
                <>
                  <span className="spinner spinner-sm" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </button>
            <button
              onClick={triggerResumeUpload}
              disabled={uploading}
              className="btn btn-secondary"
            >
              {uploading ? "Uploading..." : "Upload Resume"}
            </button>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              ref={resumeInputRef}
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </div>
        </div>

        <div className="profile-stats-row">
          <div className="profile-stat">
            <span className="profile-stat-value">{skillsCount}</span>
            <span className="profile-stat-label">Skills</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{jobsCount}</span>
            <span className="profile-stat-label">Jobs</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{eduCount}</span>
            <span className="profile-stat-label">Education</span>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`alert ${message.toLowerCase().includes("error") ? "alert-error" : "alert-success"}`}
        >
          {message}
        </div>
      )}

      <div className="profile-content">
        <nav className="profile-tabs">
          {Object.keys(initialProfileData).map((section) => (
            <button
              key={section}
              className={`profile-tab ${activeSection === section ? "active" : ""}`}
              onClick={() => setActiveSection(section)}
            >
              {sectionLabels[section] || section}
            </button>
          ))}
        </nav>

        <div className="profile-form-container card">
          {activeSection === "my_information" && (
            <MyInformationSection
              data={profileData.my_information}
              updateField={(field, value) =>
                updateNestedField("my_information", field, value)
              }
            />
          )}

          {activeSection === "my_experience" && (
            <MyExperienceSection
              data={profileData.my_experience}
              updateField={updateNestedField}
              addArrayItem={addArrayItem}
              removeArrayItem={removeArrayItem}
              onFileUpload={handleFileUpload}
              uploading={uploading}
              onViewResume={viewResume}
            />
          )}

          {activeSection === "application_questions" && (
            <ApplicationQuestionsSection
              data={profileData.application_questions}
              updateField={(field, value) =>
                updateNestedField("application_questions", field, value)
              }
            />
          )}

          {activeSection === "personal_information" && (
            <PersonalInformationSection
              data={profileData.personal_information}
              updateField={(field, value) =>
                updateNestedField("personal_information", field, value)
              }
            />
          )}

          {activeSection === "self_identity" && (
            <SelfIdentitySection
              data={profileData.self_identity}
              updateField={(field, value) =>
                updateNestedField("self_identity", field, value)
              }
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
}

function MyInformationSection({ data, updateField }) {
  return (
    <div className="profile-section">
      <h2 className="profile-section-title">Personal Information</h2>

      <div className="profile-form-grid">
        <div className="input-group span-2">
          <label className="input-label">How did you hear about us?</label>
          <select
            className="input"
            value={data.how_did_you_hear_about_us}
            onChange={(e) =>
              updateField("how_did_you_hear_about_us", e.target.value)
            }
          >
            <option value="Social Media">Social Media</option>
            <option value="Search Engine">Search Engine</option>
            <option value="Friend/Referral">Friend/Referral</option>
            <option value="Advertisement">Advertisement</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">First Name</label>
          <input
            type="text"
            className="input"
            value={data.first_name}
            onChange={(e) => updateField("first_name", e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Last Name</label>
          <input
            type="text"
            className="input"
            value={data.last_name}
            onChange={(e) => updateField("last_name", e.target.value)}
          />
        </div>

        <div className="input-group span-2">
          <label className="input-label">Email Address</label>
          <input
            type="email"
            className="input"
            value={data.email_address}
            onChange={(e) => updateField("email_address", e.target.value)}
          />
        </div>

        <div className="input-group span-2">
          <label className="input-label">Country</label>
          <input
            type="text"
            className="input"
            value={data.country}
            onChange={(e) => updateField("country", e.target.value)}
          />
        </div>

        <div className="input-group span-2">
          <label className="input-label">Address Line 1</label>
          <input
            type="text"
            className="input"
            value={data.address_line_1}
            onChange={(e) => updateField("address_line_1", e.target.value)}
          />
        </div>

        <div className="input-group span-2">
          <label className="input-label">Address Line 2</label>
          <input
            type="text"
            className="input"
            value={data.address_line_2}
            onChange={(e) => updateField("address_line_2", e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">City</label>
          <input
            type="text"
            className="input"
            value={data.city}
            onChange={(e) => updateField("city", e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">State</label>
          <input
            type="text"
            className="input"
            value={data.state}
            onChange={(e) => updateField("state", e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Postal Code</label>
          <input
            type="text"
            className="input"
            value={data.postal_code}
            onChange={(e) => updateField("postal_code", e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Country Code</label>
          <input
            type="text"
            className="input"
            value={data.country_phone_code}
            onChange={(e) => updateField("country_phone_code", e.target.value)}
            placeholder="+1"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Phone Number</label>
          <input
            type="tel"
            className="input"
            value={data.phone_number}
            onChange={(e) => updateField("phone_number", e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Extension</label>
          <input
            type="text"
            className="input"
            value={data.phone_extension}
            onChange={(e) => updateField("phone_extension", e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Phone Device Type</label>
          <select
            className="input"
            value={data.phone_device_type}
            onChange={(e) => updateField("phone_device_type", e.target.value)}
          >
            <option value="">Select...</option>
            <option value="Mobile">Mobile</option>
            <option value="Home">Home</option>
            <option value="Work">Work</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function MyExperienceSection({
  data,
  updateField,
  addArrayItem,
  removeArrayItem,
  onFileUpload,
  uploading,
  onViewResume,
}) {
  return (
    <div className="profile-section">
      <h2 className="profile-section-title">Experience</h2>

      {/* Work Experience */}
      <div className="profile-subsection">
        <div className="profile-subsection-header">
          <h3 className="profile-subsection-title">Work Experience</h3>
          <button
            type="button"
            onClick={() =>
              addArrayItem("my_experience", "work_experience", {
                job_title: "",
                company_name: "",
                location: "",
                start_date: "",
                end_date: "",
                description: "",
              })
            }
            className="btn btn-secondary btn-sm"
          >
            Add Experience
          </button>
        </div>

        {data.work_experience.map((exp, index) => (
          <div key={index} className="profile-array-item card">
            <div className="profile-array-item-header">
              <h4>Experience {index + 1}</h4>
              <button
                type="button"
                onClick={() =>
                  removeArrayItem("my_experience", "work_experience", index)
                }
                className="btn btn-ghost btn-sm profile-remove-btn"
              >
                Remove
              </button>
            </div>

            <div className="profile-form-grid">
              <div className="input-group">
                <label className="input-label">Job Title</label>
                <input
                  type="text"
                  className="input"
                  value={exp.job_title}
                  onChange={(e) =>
                    updateField(
                      "my_experience",
                      "work_experience",
                      e.target.value,
                      index,
                      "job_title"
                    )
                  }
                />
              </div>

              <div className="input-group">
                <label className="input-label">Company Name</label>
                <input
                  type="text"
                  className="input"
                  value={exp.company_name}
                  onChange={(e) =>
                    updateField(
                      "my_experience",
                      "work_experience",
                      e.target.value,
                      index,
                      "company_name"
                    )
                  }
                />
              </div>

              <div className="input-group span-2">
                <label className="input-label">Location</label>
                <input
                  type="text"
                  className="input"
                  value={exp.location}
                  onChange={(e) =>
                    updateField(
                      "my_experience",
                      "work_experience",
                      e.target.value,
                      index,
                      "location"
                    )
                  }
                />
              </div>

              <div className="input-group">
                <label className="input-label">Start Date</label>
                <input
                  type="date"
                  className="input"
                  value={exp.start_date}
                  onChange={(e) =>
                    updateField(
                      "my_experience",
                      "work_experience",
                      e.target.value,
                      index,
                      "start_date"
                    )
                  }
                />
              </div>

              <div className="input-group">
                <label className="input-label">End Date</label>
                <input
                  type="date"
                  className="input"
                  value={exp.end_date}
                  onChange={(e) =>
                    updateField(
                      "my_experience",
                      "work_experience",
                      e.target.value,
                      index,
                      "end_date"
                    )
                  }
                />
              </div>

              <div className="input-group span-2">
                <label className="input-label">Description</label>
                <textarea
                  className="input textarea"
                  value={exp.description}
                  onChange={(e) =>
                    updateField(
                      "my_experience",
                      "work_experience",
                      e.target.value,
                      index,
                      "description"
                    )
                  }
                  rows="4"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Education */}
      <div className="profile-subsection">
        <div className="profile-subsection-header">
          <h3 className="profile-subsection-title">Education</h3>
          <button
            type="button"
            onClick={() =>
              addArrayItem("my_experience", "education", {
                school_name: "",
                degree: "",
                field_of_study: "",
                overall_result: "",
                from: "",
                to: "",
              })
            }
            className="btn btn-secondary btn-sm"
          >
            Add Education
          </button>
        </div>

        {data.education.map((edu, index) => (
          <div key={index} className="profile-array-item card">
            <div className="profile-array-item-header">
              <h4>Education {index + 1}</h4>
              <button
                type="button"
                onClick={() =>
                  removeArrayItem("my_experience", "education", index)
                }
                className="btn btn-ghost btn-sm profile-remove-btn"
              >
                Remove
              </button>
            </div>

            <div className="profile-form-grid">
              <div className="input-group span-2">
                <label className="input-label">School Name</label>
                <input
                  type="text"
                  className="input"
                  value={edu.school_name}
                  onChange={(e) =>
                    updateField(
                      "my_experience",
                      "education",
                      e.target.value,
                      index,
                      "school_name"
                    )
                  }
                />
              </div>

              <div className="input-group">
                <label className="input-label">Degree</label>
                <input
                  type="text"
                  className="input"
                  value={edu.degree}
                  onChange={(e) =>
                    updateField(
                      "my_experience",
                      "education",
                      e.target.value,
                      index,
                      "degree"
                    )
                  }
                />
              </div>

              <div className="input-group">
                <label className="input-label">Field of Study</label>
                <input
                  type="text"
                  className="input"
                  value={edu.field_of_study}
                  onChange={(e) =>
                    updateField(
                      "my_experience",
                      "education",
                      e.target.value,
                      index,
                      "field_of_study"
                    )
                  }
                />
              </div>

              <div className="input-group">
                <label className="input-label">From Year</label>
                <input
                  type="number"
                  className="input"
                  value={edu.from}
                  onChange={(e) =>
                    updateField(
                      "my_experience",
                      "education",
                      e.target.value,
                      index,
                      "from"
                    )
                  }
                />
              </div>

              <div className="input-group">
                <label className="input-label">To Year</label>
                <input
                  type="number"
                  className="input"
                  value={edu.to}
                  onChange={(e) =>
                    updateField(
                      "my_experience",
                      "education",
                      e.target.value,
                      index,
                      "to"
                    )
                  }
                />
              </div>

              <div className="input-group">
                <label className="input-label">Overall Result</label>
                <input
                  type="text"
                  className="input"
                  value={edu.overall_result}
                  onChange={(e) =>
                    updateField(
                      "my_experience",
                      "education",
                      e.target.value,
                      index,
                      "overall_result"
                    )
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="profile-subsection">
        <div className="profile-subsection-header">
          <h3 className="profile-subsection-title">Skills</h3>
          <button
            type="button"
            onClick={() =>
              addArrayItem("my_experience", "skills", { skill_name: "" })
            }
            className="btn btn-secondary btn-sm"
          >
            Add Skill
          </button>
        </div>

        <div className="profile-skills-grid">
          {data.skills.map((skill, index) => (
            <div key={index} className="profile-skill-item">
              <input
                type="text"
                className="input"
                value={skill.skill_name}
                onChange={(e) =>
                  updateField(
                    "my_experience",
                    "skills",
                    e.target.value,
                    index,
                    "skill_name"
                  )
                }
                placeholder="Skill name"
              />
              <button
                type="button"
                onClick={() =>
                  removeArrayItem("my_experience", "skills", index)
                }
                className="btn btn-ghost btn-icon profile-remove-btn"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Social Networks */}
      <div className="profile-subsection">
        <div className="profile-subsection-header">
          <h3 className="profile-subsection-title">Social Networks</h3>
          <button
            type="button"
            onClick={() =>
              addArrayItem("my_experience", "social_network_urls", {
                platform: "",
                url: "",
              })
            }
            className="btn btn-secondary btn-sm"
          >
            Add Network
          </button>
        </div>

        {data.social_network_urls.map((social, index) => (
          <div key={index} className="profile-social-item">
            <select
              className="input"
              value={social.platform}
              onChange={(e) =>
                updateField(
                  "my_experience",
                  "social_network_urls",
                  e.target.value,
                  index,
                  "platform"
                )
              }
            >
              <option value="">Select Platform</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="GitHub">GitHub</option>
              <option value="Twitter">Twitter</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="url"
              className="input"
              value={social.url}
              onChange={(e) =>
                updateField(
                  "my_experience",
                  "social_network_urls",
                  e.target.value,
                  index,
                  "url"
                )
              }
              placeholder="https://"
            />
            <button
              type="button"
              onClick={() =>
                removeArrayItem("my_experience", "social_network_urls", index)
              }
              className="btn btn-ghost btn-icon profile-remove-btn"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Resume */}
      <div className="profile-subsection">
        <div className="profile-subsection-header">
          <h3 className="profile-subsection-title">Resume</h3>
        </div>

        <div className="profile-resume-section">
          {data.resume.filename && (
            <div className="profile-resume-file">
              <span className="profile-resume-filename">
                {data.resume.filename}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onViewResume}
              >
                View Resume
              </button>
            </div>
          )}

          <div className="profile-form-grid">
            <div className="input-group span-2">
              <label className="input-label">Upload Resume</label>
              <input
                type="file"
                className="input"
                accept=".pdf,.doc,.docx"
                onChange={onFileUpload}
                disabled={uploading}
              />
              <span className="input-helper">Accepted: PDF, DOC, DOCX</span>
            </div>

            <div className="input-group span-2">
              <label className="input-label">
                Manual Resume URL (optional)
              </label>
              <input
                type="url"
                className="input"
                value={data.resume.file_url || ""}
                onChange={(e) =>
                  updateField("my_experience", "resume", {
                    file_url: e.target.value,
                  })
                }
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationQuestionsSection({ data, updateField }) {
  const questions = Object.keys(data);

  return (
    <div className="profile-section">
      <h2 className="profile-section-title">Application Questions</h2>
      <p className="profile-section-description">
        These are common questions asked on job applications. Fill them out once
        and they'll be used when auto-applying.
      </p>

      <div className="profile-questions-list">
        {questions.map((question, index) => (
          <div key={index} className="profile-question-item">
            <label className="profile-question-label">{question}</label>
            <select
              className="input"
              value={data[question]}
              onChange={(e) => updateField(question, e.target.value)}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonalInformationSection({ data, updateField }) {
  return (
    <div className="profile-section">
      <h2 className="profile-section-title">Demographics</h2>
      <p className="profile-section-description">
        This information is optional and used for diversity and inclusion
        purposes only.
      </p>

      <div className="profile-form-grid">
        <div className="input-group">
          <label className="input-label">Gender</label>
          <select
            className="input"
            value={data.gender}
            onChange={(e) => updateField("gender", e.target.value)}
          >
            <option value="">Prefer not to say</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Date of Birth</label>
          <input
            type="date"
            className="input"
            value={data.date_of_birth}
            onChange={(e) => updateField("date_of_birth", e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Race/Ethnicity</label>
          <input
            type="text"
            className="input"
            value={data.race}
            onChange={(e) => updateField("race", e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Religion</label>
          <input
            type="text"
            className="input"
            value={data.religion}
            onChange={(e) => updateField("religion", e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Marital Status</label>
          <select
            className="input"
            value={data.marital_status}
            onChange={(e) => updateField("marital_status", e.target.value)}
          >
            <option value="">Prefer not to say</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Protected Veteran Status</label>
          <select
            className="input"
            value={data.invitation_to_self_identify_as_a_protected_veteran}
            onChange={(e) =>
              updateField(
                "invitation_to_self_identify_as_a_protected_veteran",
                e.target.value
              )
            }
          >
            <option value="">Prefer not to say</option>
            <option value="Yes">Yes, I am a protected veteran</option>
            <option value="No">No, I am not a protected veteran</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function SelfIdentitySection({ data, updateField }) {
  return (
    <div className="profile-section">
      <h2 className="profile-section-title">Self Identity</h2>

      <div className="profile-form-grid">
        <div className="input-group">
          <label className="input-label">Preferred Language</label>
          <input
            type="text"
            className="input"
            value={data.language}
            onChange={(e) => updateField("language", e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Preferred Name</label>
          <input
            type="text"
            className="input"
            value={data.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Date</label>
          <input
            type="date"
            className="input"
            value={data.date}
            onChange={(e) => updateField("date", e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Disability Status</label>
          <select
            className="input"
            value={data.disability}
            onChange={(e) => updateField("disability", e.target.value)}
          >
            <option value="">Prefer not to say</option>
            <option value="Yes">Yes, I have a disability</option>
            <option value="No">No, I do not have a disability</option>
          </select>
        </div>
      </div>
    </div>
  );
}
