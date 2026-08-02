import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { resolveAvatar } from "../../services/authService";
import { saveRecruiterProfile, COMPANY_SIZES } from "../../services/profileService";
import LoadingState from "../../components/common/LoadingState";
import BackButton from "../../components/common/BackButton";
import toast from "react-hot-toast";
import styles from "./RecruiterEditProfilePage.module.css";

const emptyForm = {
  name: "",
  bio: "",
  company_name: "",
  company_website: "",
  company_size: "",
  industry: "",
  company_location: "",
  company_description: "",
  founded_year: "",
};

export default function RecruiterEditProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const logoInputRef = useRef(null);

  const [form, setForm] = useState(emptyForm);
  const [socialLinks, setSocialLinks] = useState([""]);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name || "",
      bio: user.bio || "",
      company_name: user.company_name || "",
      company_website: user.company_website || "",
      company_size: user.company_size || "",
      industry: user.industry || "",
      company_location: user.company_location || "",
      company_description: user.company_description || "",
      founded_year: user.founded_year || "",
    });

    const links = Array.isArray(user.social_links) ? user.social_links.filter(Boolean) : [];
    setSocialLinks(links.length ? links : [""]);
    setLogoPreview(user.company_logo || resolveAvatar(user));
    setLoading(false);
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      toast.error("Please upload a PNG or JPG company logo.");
      return;
    }
    setLogoFile(selected);
    setLogoPreview(URL.createObjectURL(selected));
  };

  const updateSocialLink = (index, value) => {
    setSocialLinks((prev) => prev.map((link, i) => (i === index ? value : link)));
  };

  const addSocialLink = () => setSocialLinks((prev) => [...prev, ""]);

  const removeSocialLink = (index) => {
    setSocialLinks((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [""];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await saveRecruiterProfile(user.id, {
        ...form,
        social_links: socialLinks,
        logoFile,
      });
      await refreshUser();
      toast.success("Profile updated successfully.");
      navigate("/recruiter/profile");
    } catch (error) {
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading profile..." />;

  return (
    <>
      <BackButton forceTo="/recruiter/profile" label="Back to Profile" />
      <div className="page-header-row">
        <div>
          <h1>Edit Company Profile</h1>
          <p className={styles.subtitle}>Update the details candidates see about your company.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formStack}>
          {/* Logo */}
          <div className={`hcard ${styles.card}`}>
            <div className={styles.cardTitle}>Company Logo</div>
            <div className={styles.logoRow}>
              <img
                src={logoPreview}
                alt="Company logo"
                className={styles.logoImg}
              />
              <div>
                <button type="button" className="btn btn-outline-primary" onClick={() => logoInputRef.current?.click()}>
                  <i className="bi bi-upload me-2" />
                  Upload Logo
                </button>
                <div className={styles.uploadHint}>PNG or JPG.</div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="d-none"
                onChange={handleLogoChange}
              />
            </div>
          </div>

          {/* Company details */}
          <div className={`hcard ${styles.card}`}>
            <div className={styles.cardTitle}>Company Details</div>
            <div className={styles.detailsGrid}>

              <Field label="Company Name">
                <input className="form-control" name="company_name" value={form.company_name} onChange={handleChange} placeholder="e.g. Assiut Team" />
              </Field>

              <div className={styles.twoCol}>
                <Field label="Industry">
                  <input className="form-control" name="industry" value={form.industry} onChange={handleChange} placeholder="e.g. Technology" />
                </Field>
                <Field label="Company Size">
                  <select className="form-select" name="company_size" value={form.company_size} onChange={handleChange}>
                    <option value="">Select size</option>
                    {COMPANY_SIZES.map((size) => (
                      <option key={size} value={size}>{size} employees</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className={styles.twoCol}>
                <Field label="Location">
                  <input className="form-control" name="company_location" value={form.company_location} onChange={handleChange} placeholder="e.g. Cairo, Egypt" />
                </Field>
                <Field label="Founded Year">
                  <input
                    type="number"
                    className="form-control"
                    name="founded_year"
                    value={form.founded_year}
                    onChange={handleChange}
                    min={1800}
                    max={new Date().getFullYear()}
                    placeholder="e.g. 2015"
                  />
                </Field>
              </div>

              <Field label="Website">
                <input className="form-control" name="company_website" value={form.company_website} onChange={handleChange} placeholder="https://your-company.com" />
              </Field>

              <Field label="Bio">
                <textarea className="form-control" name="bio" value={form.bio} onChange={handleChange} rows={2} maxLength={300} placeholder="A short tagline (max 300 characters)" />
              </Field>

              <Field label="Company Description">
                <textarea className="form-control" name="company_description" value={form.company_description} onChange={handleChange} rows={4} maxLength={1000} placeholder="Tell candidates about your company (max 1000 characters)" />
              </Field>
            </div>
          </div>

          {/* Social links */}
          <div className={`hcard ${styles.card}`}>
            <div className={styles.cardHeaderRow}>
              <div className={styles.cardTitleFlush}>Social Links</div>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={addSocialLink}>
                <i className="bi bi-plus-lg me-1" />
                Add Link
              </button>
            </div>
            <div className={styles.linksList}>
              {socialLinks.map((link, index) => (
                <div key={index} className={styles.linkRow}>
                  <input
                    className="form-control"
                    value={link}
                    onChange={(e) => updateSocialLink(index, e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                  />
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => removeSocialLink(index)}
                    aria-label="Remove link"
                  >
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
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/recruiter/profile")} disabled={submitting}>
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