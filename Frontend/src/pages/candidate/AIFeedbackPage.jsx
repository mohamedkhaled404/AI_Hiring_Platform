import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCandidateFeedbackReport } from "../../services/feedbackService";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import BackButton from "../../components/common/BackButton";
import styles from "./AIFeedbackPage.module.css";

export default function AIFeedbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get("applicationId");

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!applicationId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getCandidateFeedbackReport(applicationId);
        if (!cancelled) setReport(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [applicationId]);

  if (loading) return <LoadingState message="Loading feedback report..." />;

  if (!report) {
    return (
      <EmptyState
        icon="bi-chat-square-text"
        title="Feedback not available"
        description="No AI feedback report is available for this application yet."
        action={
          <button className="btn-primary-custom" onClick={() => navigate("/candidate/applications")}>
            Back to Applications
          </button>
        }
      />
    );
  }

  const { strengths, weaknesses, summary, howToImprove, basedOnAssessment, generatedAt } = report;

  const generatedAtLabel = generatedAt
    ? new Date(generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <>
      <BackButton forceTo="/candidate/applications" label="Back to Applications" />
      <div className={styles.breadcrumb}>
        <span className={styles.breadcrumbLink} onClick={() => navigate("/candidate/applications")}>
          Applications
        </span>
        <i className="bi bi-chevron-right text-muted"></i>
        <span className="ai-badge"><i className="bi bi-stars"></i>AI Report</span>
      </div>

      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Your AI Feedback Report</h1>
          <p className={styles.subtitle}>
            Personalized analysis of your application.
          </p>
        </div>
        <div className={styles.metaRow}>
          <span
            className={`${styles.basisBadge} ${basedOnAssessment ? styles["basisBadge--assessment"] : styles["basisBadge--cvOnly"]}`}
          >
            <i className={`bi ${basedOnAssessment ? "bi-clipboard-check" : "bi-file-earmark-person"}`}></i>
            {basedOnAssessment ? "Based on CV & Assessment" : "Based on CV only"}
          </span>
          {generatedAtLabel && (
            <span className={styles.generatedText}>Generated {generatedAtLabel}</span>
          )}
        </div>
      </div>

      {summary && (
        <div className={`hcard ${styles.summaryCard}`}>
          <div className={styles.badgeRow}>
            <span className="ai-badge"><i className="bi bi-stars"></i>Summary</span>
          </div>
          <p className={styles.summaryText}>{summary}</p>
        </div>
      )}

      <div className={styles.swotGrid}>
        <div className={`hcard ${styles.swotCard}`}>
          <div className={styles.swotHeaderRow}>
            <i className={`bi bi-check-circle-fill ${styles.swotIcon} ${styles["swotIcon--success"]}`}></i>
            <span className={styles.swotLabel}>Strengths</span>
          </div>
          {strengths?.length ? (
            <div className={styles.itemList}>
              {strengths.map((s, i) => (
                <div key={i} className={`${styles.itemBlock} ${styles["itemBlock--success"]}`}>
                  <div className={styles.itemText}>{s}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No strengths listed.</p>
          )}
        </div>

        <div className={`hcard ${styles.swotCard}`}>
          <div className={styles.swotHeaderRow}>
            <i className={`bi bi-exclamation-triangle-fill ${styles.swotIcon} ${styles["swotIcon--warning"]}`}></i>
            <span className={styles.swotLabel}>Weaknesses</span>
          </div>
          {weaknesses?.length ? (
            <div className={styles.itemList}>
              {weaknesses.map((w, i) => (
                <div key={i} className={`${styles.itemBlock} ${styles["itemBlock--warning"]}`}>
                  <div className={styles.itemText}>{w}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No weaknesses listed.</p>
          )}
        </div>
      </div>

      {howToImprove && (
        <div className={`hcard ${styles.improveCard}`}>
          <div className={styles.badgeRow}>
            <span className="ai-badge"><i className="bi bi-lightbulb"></i>How to Improve</span>
          </div>
          <p className={styles.improveText}>{howToImprove}</p>
        </div>
      )}

      <div className={styles.ctaWrap}>
        <button className={`btn-primary-custom ${styles.ctaBtn}`} onClick={() => navigate("/candidate/jobs")}>
          <i className="bi bi-rocket me-2"></i>Browse More Jobs
        </button>
      </div>
    </>
  );
}