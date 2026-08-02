import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { resolveAvatar } from "../../services/authService";
import { saveCandidateProfile } from "../../services/profileService";
import LoadingState from "../../components/common/LoadingState";
import BackButton from "../../components/common/BackButton";
import toast from "react-hot-toast";
import styles from "./CandidateEditProfilePage.module.css";

const currentYear = new Date().getFullYear();

const emptyEducation = { degree: "", field: "", university: "", from: "", to: "", current: false };

export default function CandidateEditProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const avatarInputRef = useRef(null);
  const cvInputRef = useRef(null);

  const [form, setForm] = useState({ name: "", job_title: "", bio: "", about: "", cv_visibility: "public" });
  const [skills, setSkills] = useState([]);
  const [skillDraft, setSkillDraft] = useState("");
  const [education, setEducation] = useState([]);
  const [attachments, setAttachments] = useState([""]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name || "",
      job_title: user.job_title || "",
      bio: user.bio || "",
      about: user.about || "",
      cv_visibility: user.cv_visibility || "public",
    });
    setSkills(Array.isArray(user.skills) ? user.skills.filter(Boolean) : []);
    setEducation(
      Array.isArray(user.education) && user.education.length
        ? user.education.map((e) => ({
            degree: e.degree || "",
            field: e.field || "",
            university: e.university || e.school || "",
            from: e.from || "",
            to: e.to || "",
            current: Boolean(e.current),
          }))
        : []
    );
    const files = Array.isArray(user.attachments) ? user.attachments.filter(Boolean) : [];
    setAttachments(files.length ? files : [""]);
    setAvatarPreview(user.avatar || resolveAvatar(user));
    setLoading(false);
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      toast.error("Please upload a PNG or JPG image.");
      return;
    }
    setAvatarFile(selected);
    setAvatarPreview(URL.createObjectURL(selected));
  };

  const handleCvChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      toast.error("Please upload a PDF resume.");
      return;
    }
    setCvFile(selected);
  };

  const addSkill = () => {
    const value = skillDraft.trim();
    if (!value) return;
    if (!skills.includes(value)) setSkills((prev) => [...prev, value]);
    setSkillDraft("");
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }
  };

  const removeSkill = (skill) => setSkills((prev) => prev.filter((s) => s !== skill));

  const addEducation = () => setEducation((prev) => [...prev, { ...emptyEducation }]);
  const removeEducation = (index) => setEducation((prev) => prev.filter((_, i) => i !== index));
  const updateEducation = (index, key, value) =>
    setEducation((prev) => prev.map((edu, i) => (i === index ? { ...edu, [key]: value } : edu)));

  const updateAttachment = (index, value) =>
    setAttachments((prev) => prev.map((a, i) => (i === index ? value : a)));
  const addAttachment = () => setAttachments((prev) => [...prev, ""]);
  const removeAttachment = (index) =>
    setAttachments((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [""];
    });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const incomplete = education.some(
      (edu) => (edu.degree || edu.field || edu.university || edu.from) && !(edu.degree && edu.field && edu.university && edu.from)
    );
    if (incomplete) {
      toast.error("Each education entry needs a degree, field, university, and start year.");
      return;
    }

    setSubmitting(true);
    try {
      await saveCandidateProfile(user.id, {
        ...form,
        skills,
        education,
        attachments,
        avatarFile,
        cvFile,
      });
      await refreshUser();
      toast.success("Profile updated successfully.");
      navigate("/candidate/profile");
    } catch (error) {
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading profile..." />;

  return (
    <>
      <BackButton forceTo="/candidate/profile" label="Back to Profile" />
      <div className="page-header-row">
        <div>
          <h1>Edit Profile</h1>
          <p className={styles.subtitle}>Keep your professional details up to date.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formStack}>
          {/* Photo & CV */}
          <div className={`hcard ${styles.sectionCard}`}>
            <div className={styles.sectionTitle}>Photo & Resume</div>
            <div className={styles.avatarRow}>
              <img src={avatarPreview} alt="Avatar" className={styles.avatarImg} />
              <div>
                <button type="button" className="btn btn-outline-primary" onClick={() => avatarInputRef.current?.click()}>
                  <i className="bi bi-upload me-2" />
                  Upload Photo
                </button>
                <div className={styles.uploadHint}>PNG or JPG.</div>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/jpg" className="d-none" onChange={handleAvatarChange} />

              <div className={styles.cvWrap}>
                <button type="button" className="btn btn-outline-primary" onClick={() => cvInputRef.current?.click()}>
                  <i className="bi bi-file-earmark-pdf me-2" />
                  {cvFile ? "Change Resume" : "Upload Resume"}
                </button>
                <div className={styles.uploadHint}>
                  {cvFile ? cvFile.name : user.cv ? "A resume is on file." : "PDF only."}
                </div>
                <input ref={cvInputRef} type="file" accept="application/pdf" className="d-none" onChange={handleCvChange} />
              </div>
            </div>
          </div>

          {/* Basic info */}
          <div className={`hcard ${styles.sectionCard}`}>
            <div className={styles.sectionTitle}>Basic Information</div>
            <div className={styles.basicGrid}>
              <div className={styles.twoCol}>
                <Field label="Full Name">
                  <input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Your name" />
                </Field>
                <Field label="Job Title">
                  <input className="form-control" name="job_title" value={form.job_title} onChange={handleChange} placeholder="e.g. Full Stack Developer" />
                </Field>
              </div>

              <Field label="CV Visibility">
                <select className="form-select" name="cv_visibility" value={form.cv_visibility} onChange={handleChange}>
                  <option value="public">Public — recruiters can view my CV</option>
                  <option value="private">Private — only I can view my CV</option>
                </select>
              </Field>

              <Field label="Headline / Bio">
                <textarea className="form-control" name="bio" value={form.bio} onChange={handleChange} rows={2} maxLength={300} placeholder="A short headline (max 300 characters)" />
              </Field>

              <Field label="About">
                <textarea className="form-control" name="about" value={form.about} onChange={handleChange} rows={4} maxLength={1000} placeholder="Tell recruiters about yourself (max 1000 characters)" />
              </Field>
            </div>
          </div>

          {/* Skills */}
          <div className={`hcard ${styles.sectionCard}`}>
            <div className={styles.sectionTitle}>Skills</div>
            <div className={`${styles.skillsAddRow} ${skills.length ? styles.mb16 : ""}`}>
              <input
                className="form-control"
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder="Type a skill and press Enter"
              />
              <button type="button" className="btn btn-outline-primary" onClick={addSkill}>Add</button>
            </div>
            {skills.length > 0 && (
              <div className={styles.skillsList}>
                {skills.map((skill) => (
                  <span key={skill} className={`skill-tag ${styles.skillTag}`}>
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className={`border-0 bg-transparent p-0 ${styles.skillRemoveBtn}`} aria-label={`Remove ${skill}`}>
                      <i className="bi bi-x" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Education */}
          <div className={`hcard ${styles.sectionCard}`}>
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionTitleFlush}>Education</div>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={addEducation}>
                <i className="bi bi-plus-lg me-1" />
                Add Education
              </button>
            </div>

            {education.length === 0 ? (
              <p className={styles.emptyText}>No education added yet.</p>
            ) : (
              <div className={styles.eduList}>
                {education.map((edu, index) => (
                  <div key={index} className={styles.eduCard}>
                    <div className={styles.eduCardTop}>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeEducation(index)} aria-label="Remove education">
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                    <div className={styles.eduGrid}>
                      <div className={styles.twoColSm}>
                        <Field label="Degree">
                          <input className="form-control" value={edu.degree} onChange={(e) => updateEducation(index, "degree", e.target.value)} placeholder="e.g. Bachelor" />
                        </Field>
                        <Field label="Field of Study">
                          <input className="form-control" value={edu.field} onChange={(e) => updateEducation(index, "field", e.target.value)} placeholder="e.g. Computer Science" />
                        </Field>
                      </div>
                      <Field label="University">
                        <input className="form-control" value={edu.university} onChange={(e) => updateEducation(index, "university", e.target.value)} placeholder="e.g. Assiut University" />
                      </Field>
                      <div className={styles.twoColSm}>
                        <Field label="Start Year">
                          <input type="number" className="form-control" value={edu.from} onChange={(e) => updateEducation(index, "from", e.target.value)} min={1900} max={currentYear} placeholder="2018" />
                        </Field>
                        <Field label="End Year">
                          <input type="number" className="form-control" value={edu.to} onChange={(e) => updateEducation(index, "to", e.target.value)} min={1900} max={currentYear + 10} placeholder="2022" disabled={edu.current} />
                        </Field>
                      </div>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" checked={edu.current} onChange={(e) => updateEducation(index, "current", e.target.checked)} />
                        I currently study here
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className={`hcard ${styles.sectionCard}`}>
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionTitleFlush}>Links & Attachments</div>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={addAttachment}>
                <i className="bi bi-plus-lg me-1" />
                Add Link
              </button>
            </div>
            <div className={styles.attachList}>
              {attachments.map((link, index) => (
                <div key={index} className={styles.attachRow}>
                  <input className="form-control" value={link} onChange={(e) => updateAttachment(index, e.target.value)} placeholder="https://github.com/username" />
                  <button type="button" className="btn btn-outline-danger" onClick={() => removeAttachment(index)} aria-label="Remove link">
                    <i className="bi bi-trash" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.actionsRow}>
            <button type="submit" className="btn-primary-custom" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/candidate/profile")} disabled={submitting}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}