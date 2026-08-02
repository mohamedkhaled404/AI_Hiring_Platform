import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getJobById } from "../../services/jobService";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import BackButton from "../../components/common/BackButton";
import styles from "./JobDetailsPage.module.css";

/** Normalize raw backend job into a flat UI shape */
function normalizeJob(raw) {
  if (!raw) return null;
  return {
    id: raw._id,
    title: raw.title || "Untitled",
    company: raw.recruiter?.company_name || raw.recruiter?.name || "Joblio Recruiter",
    logo: raw.recruiter?.profile_image || raw.recruiter?.company_logo || "",
    location: raw.location || "Remote",
    type: raw.jobType || "",
    workplace: raw.workplace || "",
    experience: raw.requirements || "Experience details not specified",
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    description: raw.description || "",
    categoryName: raw.category?.name || "",
    applicationEnd: raw.applicationEnd || null,
    status: raw.status || "",
    posted: raw.createdAt ? new Date(raw.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
  };
}

/** Collapse extra blank lines / trailing whitespace so pre-wrap text doesn't leave big gaps */
function cleanMultilineText(text) {
  if (!text) return "";
  return text
    .replace(/[ \t]+$/gm, "")   // trailing spaces per line
    .replace(/\n{3,}/g, "\n\n") // collapse 3+ newlines into 2
    .trim();
}

export default function JobDetailsPage() {
  const { id, jobId } = useParams();
  const effectiveId = id || jobId;
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const raw = await getJobById(effectiveId);
        if (!cancelled) setJob(normalizeJob(raw));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [effectiveId]);

  if (loading) return <LoadingState message="Loading job details..." />;

  if (!job) {
    return (
      <EmptyState
        icon="bi-briefcase"
        title="Job not found"
        description="This job listing may have been removed or is no longer available."
        action={
          <button className="btn-primary-custom" onClick={() => navigate("/recruiter/jobs")}>
            Back to Jobs
          </button>
        }
      />
    );
  }

  const isDeadlinePast = job.applicationEnd && new Date(job.applicationEnd) < new Date();

  return (
    <>
      <BackButton fallbackTo="/recruiter/jobs" label="Back to Jobs" />
      <div className={styles.breadcrumb}>
        <span className={styles.breadcrumbLink} onClick={() => navigate("/recruiter/jobs")}>Jobs</span>
        <i className="bi bi-chevron-right"></i>
        <span>{job.title}</span>
      </div>

      <div className="grid-aside-main">
        <div className={styles.col}>
          <div className={`hcard ${styles.mainCard}`}>
            <div className={styles.headerRow}>
              <img
                src={job.logo}
                alt={job.company}
                className={styles.logo}
                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=F3F5FB&color=1D2445`; }}
              />
              <div className={styles.titleCol}>
                <h1 className={styles.title}>{job.title}</h1>
                <div className={styles.company}>{job.company}</div>
              </div>
              {job.status === "Open" && !isDeadlinePast ? (
                <span className={`${styles.statusBadge} ${styles["statusBadge--open"]}`}>Open</span>
              ) : isDeadlinePast ? (
                <span className={`${styles.statusBadge} ${styles["statusBadge--expired"]}`}>Expired</span>
              ) : job.status === "Closed" ? (
                <span className={`${styles.statusBadge} ${styles["statusBadge--closed"]}`}>Closed</span>
              ) : null}
            </div>
            <div className={styles.tagsRow}>
              {job.location && (
                <span className={styles.pill}>
                  <i className="bi bi-geo-alt"></i> {job.location}
                </span>
              )}
              {job.type && (
                <span className={styles.pill}>
                  <i className="bi bi-briefcase"></i> {job.type}
                </span>
              )}
              {job.workplace && (
                <span className={styles.pill}>
                  <i className="bi bi-building"></i> {job.workplace}
                </span>
              )}
              {job.categoryName && (
                <span className={`${styles.pill} ${styles["pill--accent"]}`}>
                  <i className="bi bi-tag"></i> {job.categoryName}
                </span>
              )}
              {job.applicationEnd && (
                <span className={`${styles.pill} ${isDeadlinePast ? styles["pill--danger"] : ""}`}>
                  <i className={`bi ${isDeadlinePast ? "bi-calendar-x" : "bi-calendar-event"}`}></i>
                  {isDeadlinePast ? "Applications closed" : `Apply by ${new Date(job.applicationEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
                </span>
              )}
            </div>
            {job.skills.length > 0 && (
              <div className={styles.skillsSection}>
                <div className={styles.skillsTitle}>Required Skills</div>
                <div className={styles.skillsList}>
                  {job.skills.map((s) => <span key={s} className="skill-tag">{s}</span>)}
                </div>
              </div>
            )}

            <div className={styles.descSection}>
              <div className={styles.descTitle}>About this role</div>
              {job.description ? (
                <p className={styles.descText}>
                  {cleanMultilineText(job.description)}
                </p>
              ) : (
                <p className={styles.descText}>
                  No description provided for this role yet.
                </p>
              )}
              {job.experience && job.experience !== "Experience details not specified" && (
                <>
                  <div className={styles.reqTitle}>Requirements</div>
                  <p className={styles.descText}>
                    {cleanMultilineText(job.experience)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={styles.sideCol}>
          <div className={`hcard ${styles.actionsCard}`}>
            <button
              type="button"
              className={`btn-primary-custom ${styles.applyBtn}`}
              onClick={() => navigate("/recruiter/applications", { state: { jobId: job.id } })}
            >
              View Applications
            </button>
          </div>
          <div className={`hcard ${styles.overviewCard}`}>
            <div className={styles.overviewTitle}>Job Overview</div>
            {[
              ["Posted", job.posted],
              ["Location", job.location],
              ["Job Type", job.type],
              ["Workplace", job.workplace],
              ["Category", job.categoryName],
              ["Deadline", job.applicationEnd ? new Date(job.applicationEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null],
            ]
              .filter(([, v]) => !!v)
              .map(([k, v]) => (
                <div key={k} className={styles.overviewRow}>
                  <span className={styles.overviewKey}>{k}</span>
                  <span className={styles.overviewValue}>{v}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}