import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getApplicationSubmitted } from "../../services/applicationService";
import LoadingState from "../../components/common/LoadingState";
import BackButton from "../../components/common/BackButton";
import EmptyState from "../../components/common/EmptyState";
import styles from "./ApplicationSubmittedPage.module.css";

export default function ApplicationSubmittedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Confirmation modal shown when the candidate tries to leave without doing a required assessment
  const [pendingNav, setPendingNav] = useState(null); // holds a () => void to run if they confirm

  useEffect(() => {
    if (!applicationId) {
      setError("Missing application reference.");
      setLoading(false);
      return;
    }

    getApplicationSubmitted(applicationId)
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load application details."))
      .finally(() => setLoading(false));
  }, [applicationId]);

  // Whether this job actually has an assessment attached — comes straight from the
  // backend now (no separate /assessment lookup needed).
  const hasAssessment = Boolean(data?.hasAssessment);

  // Any navigation away from this page goes through here while the assessment is still pending
  const guardedNavigate = (navFn) => {
    if (hasAssessment) {
      setPendingNav(() => navFn);
    } else {
      navFn();
    }
  };

  if (loading) return <LoadingState message="Loading..." />;

  if (error || !data) {
    return (
      <EmptyState
        icon="bi-exclamation-circle"
        title="Unable to load confirmation"
        description={error || "Application details could not be loaded."}
        action={
          <button type="button" className="btn-primary-custom" onClick={() => navigate("/candidate/applications")}>
            Go to My Applications
          </button>
        }
      />
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.backWrap}>
          <button
            type="button"
            className="back-button rounded-pill px-3 py-2 shadow-sm"
            onClick={() => guardedNavigate(() => navigate("/candidate/jobs"))}
          >
            <i className="bi bi-arrow-left back-button__icon" aria-hidden="true" />
            <span>Back to Jobs</span>
          </button>
        </div>
        <div className={styles.iconWrap}>
          <div className={styles.iconCircle}>
            <i className={`bi bi-person-workspace ${styles.iconInner}`} aria-hidden="true" />
          </div>
          <span className={styles.checkBadge}>
            <i className="bi bi-check-lg" aria-hidden="true" />
          </span>
        </div>

        <h1 className={styles.title}>Application Submitted Successfully!</h1>
        <p className={styles.message}>{data.message}</p>

        <span className={styles.statusBadge}>
          • {data.statusLabel}
        </span>

        {data.jobId && hasAssessment && (
          <button
            type="button"
            className={`btn-primary-custom ${styles.startAssessmentBtn}`}
            onClick={() => navigate(`/candidate/jobs/${data.jobId}/assessment`)}
          >
            <i className="bi bi-clipboard-check me-2" aria-hidden="true" />
            Start Assessment
          </button>
        )}

        {hasAssessment && (
          <p className={styles.assessmentNotice}>
            <i className="bi bi-info-circle-fill" aria-hidden="true" />
            This job requires an assessment — the company won't see your application until it's completed. You can complete it within 3 days.
          </p>
        )}

        <div className={styles.actionsRow}>
          <button
            type="button"
            className={`btn-outline-custom ${styles.actionBtn}`}
            onClick={() => guardedNavigate(() => navigate(`/candidate/applications/${applicationId}`))}
          >
            Track Application
          </button>
          <button
            type="button"
            className={`btn-outline-custom ${styles.actionBtn}`}
            onClick={() => guardedNavigate(() => navigate("/candidate/jobs"))}
          >
            Back to Jobs
          </button>
        </div>

        <div className={styles.etaRow}>
          <i className="bi bi-info-circle" aria-hidden="true" />
          {data.eta}
        </div>
      </div>

      {/* ===== Leave-without-assessment confirmation modal ===== */}
      {pendingNav && (
        <div className={`modal show d-block ${styles.modalBackdrop}`} tabIndex="-1">
          <div className={`modal-dialog modal-dialog-centered ${styles.modalDialog}`}>
            <div className={`modal-content ${styles.modalContent}`}>
              <div className={`modal-body ${styles.modalBody}`}>
                <div className={styles.modalIconWrap}>
                  <i className={`bi bi-exclamation-triangle ${styles.modalIcon}`} />
                </div>
                <div className={styles.modalTitle}>Leave without completing the assessment?</div>
                <p className={styles.modalText}>
                  This job requires an assessment. You can complete it within 3 days, otherwise the company won't be able to see your application.
                </p>
              </div>
              <div className={`modal-footer ${styles.modalFooter}`}>
                <button type="button" className="btn btn-light" onClick={() => setPendingNav(null)}>
                  Stay &amp; Take Assessment
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() => {
                    const fn = pendingNav;
                    setPendingNav(null);
                    fn();
                  }}
                >
                  Leave Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}