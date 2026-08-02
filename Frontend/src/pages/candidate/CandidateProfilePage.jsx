import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCandidateProfile } from "../../services/profileService";
import { formatEducation, formatSkill, formatSocialLink } from "../../utils/profileFormat";
import LoadingState from "../../components/common/LoadingState";
import BackButton from "../../components/common/BackButton";
import styles from "./CandidateProfilePage.module.css";

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCandidateProfile()
      .then(setProfile)
      .catch((err) => setError(err.message || "Unable to load profile."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading profile..." />;

  if (error) {
    return (
      <>
        <BackButton fallbackTo="/candidate/applications" label="Back to My Applications" />
        <div className={`hcard ${styles.errorCard}`}>{error}</div>
      </>
    );
  }

  if (!profile) return null;

  const skills = profile.skills.map(formatSkill).filter(Boolean);
  const education = profile.education.map(formatEducation).filter((e) => e.degree || e.school);
  const socialLinks = [...(profile.socialLinks || []), ...(profile.attachments || [])].map(formatSocialLink).filter(Boolean);
  const aboutText = profile.about || profile.bio;

  const contactRows = [
    ["bi-envelope", profile.email],
    ["bi-telephone", profile.phone],
    ["bi-geo-alt", profile.location],
    ["bi-link-45deg", profile.portfolio],
  ].filter(([, text]) => Boolean(text));

  return (
    <>
      <BackButton forceTo="/candidate/applications" label="Back to my Applications" />
      <div className="page-header-row">
        <div>
          <h1>Candidate Profile</h1>
          <p className={styles.subtitle}>Manage your professional identity and resume details.</p>
        </div>

        <Link to="/candidate/profile/edit" className={`btn-primary-custom ${styles.editBtn}`}>
          <i className="bi bi-pencil me-2" />
          Edit Profile
        </Link>
      </div>

      <div className="grid-profile">
        <div className={styles.col}>
          <div className={`hcard ${styles.avatarCard}`}>
            <div className={styles.avatarWrap}>
              <img src={profile.avatar} alt="" className={styles.avatarImg} />
              {profile.isVerified && (
                <span className={styles.verifiedBadge}>
                  <i className={`bi bi-check text-white ${styles.verifiedIcon}`} aria-hidden="true" />
                </span>
              )}
            </div>
            <h2 className={styles.name}>{profile.name || "Unnamed Candidate"}</h2>
            {profile.title && <div className={styles.title}>{profile.title}</div>}

            {contactRows.map(([icon, text]) => (
              <div key={text} className={styles.contactRow}>
                <i className={`bi ${icon} ${styles.contactIcon}`} aria-hidden="true" />
                {text}
              </div>
            ))}

            {profile.cv && (
              <div className={styles.cvWrap}>
                <a
                  href={profile.cv}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn btn-outline-primary w-100 ${styles.cvBtn}`}
                >
                  <i className="bi bi-file-earmark-pdf" />
                  View Attached CV
                </a>
              </div>
            )}
          </div>

          {socialLinks.length > 0 && (
            <div className={`hcard ${styles.socialCard}`}>
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
            <div className={styles.cardTitleSm}>About</div>
            <p className={styles.aboutText}>
              {aboutText || "No bio added yet. Click \u201cEdit Profile\u201d to tell recruiters about yourself."}
            </p>
          </div>

          <div className={`hcard ${styles.card}`}>
            <div className={styles.cardHeaderRow}>
              <div className={styles.cardHeaderTitle}>Skills</div>
            </div>
            {skills.length > 0 ? (
              <div className={styles.skillsList}>
                {skills.map((s) => (
                  <span key={s} className="skill-tag">{s}</span>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>No skills added yet.</p>
            )}
          </div>

          <div className={`hcard ${styles.card}`}>
            <div className={styles.cardTitle}>Education</div>
            {education.length > 0 ? (
              <div className={styles.eduList}>
                {education.map((edu, i) => (
                  <div key={`${edu.degree}-${i}`} className={styles.eduRow}>
                    <div className={styles.eduIcon}>
                      <i className={`bi bi-mortarboard ${styles.contactIcon}`} aria-hidden="true" />
                    </div>
                    <div>
                      {edu.degree && <div className={styles.eduDegree}>{edu.degree}</div>}
                      {edu.school && <div className={styles.eduSchool}>{edu.school}</div>}
                      {edu.period && <div className={styles.eduPeriod}>{edu.period}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>No education details added yet.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}