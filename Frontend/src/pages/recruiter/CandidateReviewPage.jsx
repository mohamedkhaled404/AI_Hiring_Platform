import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getUserProfileById } from "../../services/profileService";
import { formatEducation, formatSkill, formatSocialLink } from "../../utils/profileFormat";
import LoadingState from "../../components/common/LoadingState";
import BackButton from "../../components/common/BackButton";
import CircleProgress from "../../components/common/CircleProgress";
import styles from "./CandidateReviewPage.module.css";

export default function CandidateReviewPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { jobId, applicationId, matchScore = 0 } = location.state || {};

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getUserProfileById(id)
      .then(setProfile)
      .catch((err) => setError(err.message || "Unable to load candidate profile."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState message="Loading candidate profile..." />;

  if (error) {
    return (
      <>
        <BackButton fallbackTo="/recruiter/applications" label="Back to Applicants" />
        <div className={`hcard ${styles.errorBox}`}>{error}</div>
      </>
    );
  }

  if (!profile) return null;

  const skills = profile.skills.map(formatSkill).filter(Boolean);
  const education = profile.education.map(formatEducation).filter((e) => e.degree || e.school);
  const socialLinks = profile.socialLinks.map(formatSocialLink).filter(Boolean);
  const aboutText = profile.about || profile.bio;

  const contactRows = [
    ["bi-envelope", profile.email],
    ["bi-telephone", profile.phone],
    ["bi-geo-alt", profile.location],
    ["bi-link-45deg", profile.portfolio],
  ].filter(([, text]) => Boolean(text));

  const aiMatchScore = Math.round(matchScore || 0);
  const canViewAiReport = Boolean(jobId && applicationId);

  return (
    <>
      <BackButton fallbackTo="/recruiter/applications" label="Back to Applicants" />

      <div className={`grid-profile ${styles.profileGridSpacing}`}>
        <div className={styles.colStack}>
          <div className={`hcard ${styles.cardPad24Center}`}>
            <div className={styles.avatarWrap}>
              <img src={profile.avatar} alt="" className={styles.avatarImg} />
              {profile.isVerified && (
                <span className={styles.verifiedBadge}>
                  <i className={`bi bi-check text-white ${styles.verifiedIcon}`} aria-hidden="true" />
                </span>
              )}
            </div>
            <h2 className={styles.candidateName}>{profile.name || "Unnamed Candidate"}</h2>
            {profile.title && <div className={styles.candidateTitle}>{profile.title}</div>}

            {contactRows.map(([icon, text]) => (
              <div key={text} className={styles.contactRow}>
                <i className={`bi ${icon} ${styles.iconPrimary}`} aria-hidden="true" />
                {text}
              </div>
            ))}

            {profile.cv && (
              <div className={styles.cvWrapper}>
                <a
                  href={profile.cv}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn btn-outline-primary w-100 ${styles.cvLinkInner}`}
                >
                  <i className="bi bi-file-earmark-pdf" />
                  View Attached CV
                </a>
              </div>
            )}
          </div>

          {socialLinks.length > 0 && (
            <div className={`hcard ${styles.cardPad24}`}>
              <div className={styles.sectionLabelMb16}>Social Links</div>
              <div className={styles.colGap10}>
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

        <div className={styles.colStack}>
          <div className={`hcard ${styles.cardPad20}`}>
            <button
              type="button"
              disabled={!canViewAiReport}
              onClick={() => canViewAiReport && navigate(`/recruiter/feedback/${jobId}/${applicationId}`)}
              className={styles.aiReportBtn}
              style={{ cursor: canViewAiReport ? "pointer" : "not-allowed", opacity: canViewAiReport ? 1 : 0.6 }}
            >
              <i className="bi bi-stars"></i> View AI Report
            </button>
          </div>

          <div className={`hcard ${styles.cardPad24}`}>
            <div className={styles.sectionLabelMb12}>About</div>
            <p className={styles.aboutText}>
              {aboutText || "No bio added yet."}
            </p>
          </div>

          <div className={`hcard ${styles.cardPad24}`}>
            <div className={styles.skillsHeaderRow}>
              <div className={styles.fw700}>Skills</div>
            </div>
            {skills.length > 0 ? (
              <div className={styles.skillsWrap}>
                {skills.map((s) => (
                  <span key={s} className="skill-tag">{s}</span>
                ))}
              </div>
            ) : (
              <p className={styles.mutedNote}>No skills added yet.</p>
            )}
          </div>

          <div className={`hcard ${styles.cardPad24}`}>
            <div className={styles.sectionLabelMb16}>Education</div>
            {education.length > 0 ? (
              education.map((edu, i) => (
                <div
                  key={`${edu.degree}-${i}`}
                  className={styles.eduItem}
                  style={{ marginBottom: i < education.length - 1 ? 16 : 0 }}
                >
                  <div className={styles.eduIconWrap}>
                    <i className={`bi bi-mortarboard ${styles.iconPrimary}`} aria-hidden="true" />
                  </div>
                  <div>
                    {edu.degree && <div className={styles.eduDegree}>{edu.degree}</div>}
                    {edu.school && <div className={styles.eduSchool}>{edu.school}</div>}
                    {edu.period && <div className={styles.eduPeriod}>{edu.period}</div>}
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.mutedNote}>No education details added yet.</p>
            )}
          </div>

          <div className={`hcard ${styles.cardPad20Center}`}>
            <div className={styles.matchScoreLabel}>
              Match Score
            </div>
            <CircleProgress value={aiMatchScore} size={110} />
          </div>
        </div>
      </div>
    </>
  );
}