import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getApplicationById } from "../../services/applicationService";
import StatusBadge from "../../components/common/StatusBadge";
import CircleProgress from "../../components/common/CircleProgress";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import BackButton from "../../components/common/BackButton";
import styles from "./ApplicationDetailPage.module.css";

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await getApplicationById(id);
        if (!cancelled) setApp(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => (cancelled = true);
  }, [id]);

  if (loading) return <LoadingState message="Loading application..." />;

  if (!app) {
    return (
      <EmptyState
        icon="bi-file-earmark-text"
        title="Application not found"
        description="This application may have been removed or you don't have access to it."
        action={
          <button className="btn-primary-custom" onClick={() => navigate("/candidate/applications")}>Back to Applications</button>
        }
      />
    );
  }

  const isPending = app.status === "pending" || app.status === "reviewing";
  const isRejected = app.status === "rejected";
  const isAccepted = app.status === "interviewing" || app.status === "accepted";

  return (
    <>
      <BackButton fallbackTo="/candidate/applications" label="Back to Applications" />
      <div className={styles.breadcrumbContainer}>
        <span className={styles.breadcrumbLink} onClick={() => navigate("/candidate/applications")}>Applications</span>
        <i className="bi bi-chevron-right text-muted" />
        <span className={styles.breadcrumbText}>{app.jobTitle}</span>
      </div>

      <div className={styles.headerContainer}>
        <div>
          <h1 className={styles.appTitle}>{app.jobTitle}</h1>
          <p className={styles.appMeta}>Applied {app.appliedAt} at <strong>{app.company}</strong></p>
        </div>
        <div className={styles.statusWrapper}>
          <span className={styles.statusLabel}>Application Status</span>
          <StatusBadge status={app.status} />
        </div>
      </div>

      {isPending && (
        <div className={`hcard ${styles.padding60} ${styles.textCenter}`}>
          <div style={{ width: 72, height: 72, background: "var(--primary-bg)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <i className="bi bi-hourglass-split" style={{ fontSize: 32, color: "var(--primary)" }}></i>
          </div>
          <h2 className={styles.sectionHeader}>Application Under Review</h2>
          <p className={styles.sectionParagraph}>
            {app.hasAssessment
              ? app.assessmentCompleted
                ? "Your application and assessment have been submitted successfully. Our recruitment team is currently reviewing your profile. You will receive an update once a decision has been made."
                : "Your application has been submitted successfully. This job requires an assessment — please complete it so the recruitment team can review your profile."
              : "Your application has been submitted successfully. Our recruitment team is currently reviewing your profile. You will receive an update once a decision has been made."}
          </p>
          <div className={styles.pendingButtonsWrapper}>
            {app.hasAssessment && !app.assessmentCompleted && (
              <button className="btn-primary-custom" onClick={() => navigate(`/candidate/jobs/${app.jobId}/assessment`)}>
                Take Assessment
              </button>
            )}
            <button className="btn-outline-custom" onClick={() => navigate("/candidate/applications")}>View All Applications</button>
          </div>
        </div>
      )}

      {isRejected && app.matchScore == null && (
        <div className={`hcard ${styles.padding40} ${styles.textCenter}`}>
          <h2 className={styles.sectionHeader}>Application Status: Rejected</h2>
          <p className={styles.sectionParagraph}>Thank you for your interest. The recruiter has decided not to move forward with your application at this time.</p>
          <div className={styles.rejectedActionsWrapper}>
            <button type="button" className="btn-primary-custom" onClick={() => navigate(`/candidate/feedback?applicationId=${app.id}`)}>
              <i className="bi bi-stars me-2" />View AI Feedback
            </button>
            <button type="button" className="btn-outline-custom" onClick={() => navigate("/candidate/jobs")}>Browse More Jobs</button>
          </div>
        </div>
      )}

      {isRejected && app.matchScore != null && (
        <div className={styles.rejectedScoreSection}>
          <div className={styles.rejectedLeft}>
            <div className={`hcard ${styles.padding24}`}>
              <div className={styles.rejectedScoreHeader}>
                <CircleProgress value={app.matchScore} size={110} />
                <div>
                  <div className={styles.rejectedScoreTitle}>Application Status: Rejected</div>
                  <p className={styles.rejectedScoreParagraph}>Thank you for your interest in the position. After careful review, we will not be moving forward with your application at this time.</p>
                  <button className="btn-primary-custom" style={{ marginTop: 10 }} onClick={() => navigate(`/candidate/feedback?applicationId=${app.id}`)}>
                    <i className="bi bi-stars me-2" />View AI Feedback
                  </button>
                </div>
              </div>

              {app.skills && (
                <div className={styles.skillsContainer}>
                  {app.skills.map((s) => (
                    <span key={s} className="skill-tag">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.rejectedRight}>
            <div className={`hcard ${styles.padding20}`}>
              <div className={styles.insightsHeader}>
                <div className={styles.insightsTitle}>AI Skill Insights</div>
                <button className={styles.fullReportBtn} onClick={() => navigate(`/candidate/feedback?applicationId=${app.id}`)}>
                  View Full Report ↗
                </button>
              </div>

              <div className={styles.insightsGrid}>
                {app.skillInsights.map(([label, val]) => (
                  <div key={label}>
                    <div className={styles.insightsRow}>
                      <span className={styles.insightsLabel}>{label}</span>
                      <span className={styles.insightsValue}>{val}%</span>
                    </div>
                    <div className="match-bar">
                      <div className="match-bar-fill" style={{ width: `${val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.nextStepsContainer}>
              <div className={`hcard ${styles.padding20}`}>
                <div className={styles.nextStepsHeader}>Next Steps</div>
                {app.nextSteps.map((step, i) => (
                  <div key={i} className={styles.nextStepItem}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: step.done ? "var(--success)" : step.active ? "var(--primary)" : "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {step.done ? (
                        <i className="bi bi-check text-white" style={{ fontSize: 14 }} />
                      ) : (
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: step.active ? "#fff" : "var(--text-muted)" }} />
                      )}
                    </div>
                    <div>
                      <div className={styles.nextStepLabel} style={{ color: step.active ? "var(--primary)" : "var(--text-dark)" }}>{step.label}</div>
                      <div className={styles.nextStepSub}>{step.sub}</div>
                      {step.person && <div className={styles.nextStepPerson}>{step.person}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {app.sentiment && (
              <div className={`hcard ${styles.sentimentCard}`} style={{ background: "linear-gradient(135deg, #f3f5fb, #f3f5fb)" }}>
                <div className={styles.sentimentHeader}>
                  <i className="bi bi-stars" style={{ color: "var(--primary)" }} />
                  <span className={styles.sentimentTitle}>AI Sentiment Analysis</span>
                </div>
                <p className={styles.sentimentQuote}>“{app.sentiment.quote}”</p>
                <div className={styles.sentimentScore}>
                  <i className="bi bi-emoji-smile" style={{ color: "var(--success)" }} />
                  <span className={styles.sentimentScoreValue}>{app.sentiment.score}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isAccepted && (
        <div className={`hcard ${styles.padding40} ${styles.textCenter}`}>
          <div style={{ width: 72, height: 72, background: "#D1FAE5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <i className="bi bi-check-circle-fill" style={{ fontSize: 36, color: "var(--success)" }}></i>
          </div>
          <h2 className={styles.sectionHeader}>You’ve been shortlisted! 🎉</h2>
          <p className={styles.sectionParagraph}>Congratulations! The recruiter has reviewed your profile and selected you for the next stage. You will receive further instructions shortly.</p>
          {app.hasAssessment && (
            <button className="btn-primary-custom" onClick={() => navigate(`/candidate/jobs/${app.jobId}/assessment`)}>
              {app.assessmentCompleted ? "View Assessment" : "Take Assessment"}
            </button>
          )}
        </div>
      )}
    </>
  );
}