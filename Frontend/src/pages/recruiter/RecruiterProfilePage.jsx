import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecruiterProfile } from "../../services/profileService";
import { formatSocialLink } from "../../utils/profileFormat";
import LoadingState from "../../components/common/LoadingState";
import BackButton from "../../components/common/BackButton";
import styles from "./RecruiterProfilePage.module.css";

export default function RecruiterProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getRecruiterProfile()
      .then(setProfile)
      .catch((err) => setError(err.message || "Unable to load profile."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading profile..." />;

  if (error) {
    return (
      <>
        <BackButton fallbackTo="/recruiter/dashboard" label="Back to Dashboard" />
        <div className={`hcard ${styles.errorCard}`}>{error}</div>
      </>
    );
  }

  if (!profile) return null;

  const logo = profile.companyLogo || profile.avatar;
  const socialLinks = profile.socialLinks.map(formatSocialLink).filter(Boolean);

  const companyRows = [
    ["bi-briefcase", profile.industry],
    ["bi-geo-alt", profile.companyLocation || profile.location],
    ["bi-people", profile.companySize && `${profile.companySize} employees`],
    ["bi-calendar-event", profile.foundedYear && `Founded ${profile.foundedYear}`],
  ].filter(([, text]) => Boolean(text));

  return (
    <>
      <BackButton forceTo="/recruiter/dashboard" label="Back to Dashboard" />
      <div className="page-header-row">
        <div>
          <h1>Company Profile</h1>
          <p className={styles.subtitle}>Manage how your company appears to candidates.</p>
        </div>

        <Link to="/recruiter/profile/edit" className={`btn-primary-custom ${styles.editBtn}`}>
          <i className="bi bi-pencil me-2" />
          Edit Profile
        </Link>
      </div>

      <div className="grid-profile">
        <div className={styles.col}>
          <div className={`hcard ${styles.logoCard}`}>
            <div className={styles.logoWrap}>
              <img src={logo} alt="" className={styles.logoImg} />
              {profile.isVerified && (
                <span className={styles.verifiedBadge}>
                  <i className={`bi bi-check text-white ${styles.verifiedIcon}`} aria-hidden="true" />
                </span>
              )}
            </div>
            <h2 className={styles.companyName}>{profile.companyName || "Your Company"}</h2>
            {profile.industry && <div className={styles.industry}>{profile.industry}</div>}

            {companyRows.map(([icon, text]) => (
              <div key={text} className={styles.companyRow}>
                <i className={`bi ${icon} ${styles.companyRowIcon}`} aria-hidden="true" />
                {text}
              </div>
            ))}

            {profile.companyWebsite && (
              <div className={styles.websiteWrap}>
                <a
                  href={/^https?:\/\//i.test(profile.companyWebsite) ? profile.companyWebsite : `https://${profile.companyWebsite}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn btn-outline-primary w-100 ${styles.websiteBtn}`}
                >
                  <i className="bi bi-globe" />
                  Visit Website
                </a>
              </div>
            )}
          </div>

          {socialLinks.length > 0 && (
            <div className={`hcard ${styles.card}`}>
              <div className={styles.cardTitle}>Social Links</div>
              <div className={styles.socialList}>
                {socialLinks.map((link) => (
                  <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                    <i className={`bi ${link.icon}`} aria-hidden="true" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.col}>
          <div className={`hcard ${styles.card}`}>
            <div className={styles.cardTitleSm}>About the Company</div>
            <p className={styles.aboutText}>
              {profile.companyDescription || "No company description yet. Click \u201cEdit Profile\u201d to introduce your company to candidates."}
            </p>
          </div>

        </div>
      </div>
    </>
  );
}