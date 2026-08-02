import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAIRecommendation } from "../../services/recruiterService";
import CircleProgress from "../../components/common/CircleProgress";
import LoadingState from "../../components/common/LoadingState";
import BackButton from "../../components/common/BackButton";
import styles from "./AIRecommendationPage.module.css";

export default function AIRecommendationPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAIRecommendation().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading AI recommendation..." />;
  if (!data) return null;

  return (
    <>
      <BackButton fallbackTo="/recruiter/applications" label="Back to Applicants" />
      <div className={styles.breadcrumb}>
        <span className={styles.breadcrumbLink} onClick={() => navigate("/recruiter/applications")}>Applications</span>
        <i className="bi bi-chevron-right text-muted" aria-hidden="true" />
        <span className={styles.breadcrumbMuted}>{data.jobTitle}</span>
        <i className="bi bi-chevron-right text-muted" aria-hidden="true" />
        <span className={styles.breadcrumbMuted}>Candidate ID: {data.candidateId}</span>
      </div>

      <div className={`hcard ${styles.mainCard}`}>
        <div className={`grid-aside-main ${styles.mainGrid}`}>
          <div className={styles.confidenceCol}>
            <CircleProgress value={data.confidence} size={140} stroke={10} />
            <div className={styles.confidenceLabel}>CONFIDENCE</div>
            <span className="ai-badge mt-2 d-inline-flex"><i className="bi bi-stars" /> AI RECOMMENDATION</span>
          </div>
          <div>
            <div className={styles.synthesisHeader}>
              <h1 className={styles.synthesisTitle}>Candidate Synthesis</h1>
              <button type="button" className={`btn-primary-custom ${styles.exportBtn}`}><i className="bi bi-download me-2" />Export Analysis</button>
            </div>
            <p className={styles.summaryText}>{data.summary}</p>
            <div className="grid-stats-4">
              {data.metrics.map((m) => (
                <div key={m.title} className={styles.metricCard} style={{ "--metric-color": m.color }}>
                  <i className={`bi ${m.icon} mb-2 d-block ${styles.metricIcon}`} aria-hidden="true" />
                  <div className={styles.metricTitle}>{m.title}</div>
                  <div className={styles.metricDesc}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-aside-main mb-4">
        <div className={styles.sideCol}>
          <div className={`hcard ${styles.panelCard}`}>
            <div className={styles.panelTitle}>Competency Heatmap</div>
            {data.competencies.map(([label, val]) => (
              <div key={label} className={styles.competencyRow}>
                <div className={styles.competencyHeader}>
                  <span>{label}</span>
                  <span className={styles.competencyValue}>{val}/100</span>
                </div>
                <div className="match-bar"><div className={`match-bar-fill ${styles.matchBarFill}`} style={{ "--bar-width": `${val}%` }} /></div>
              </div>
            ))}
          </div>

          <div className={`hcard ${styles.panelCard}`}>
            <div className={styles.insightHeader}>
              <i className={`bi bi-stars ${styles.insightIcon}`} aria-hidden="true" />
              <span className={styles.insightLabel}>AI Insight</span>
            </div>
            <p className={styles.insightQuote}>&ldquo;{data.aiInsight}&rdquo;</p>
            <div className={styles.insightActions}>
              <button type="button" className={`btn-outline-custom ${styles.insightActionBtn}`}>Compare with Average</button>
              <button type="button" className={`btn btn-link p-0 ${styles.insightLinkBtn}`}>See Data Sources</button>
            </div>
          </div>
        </div>

        <div className={styles.predictionCol}>
          <div className={`hcard ${styles.predictionCard}`}>
            <div className={styles.predictionTitle}>Hiring Success Prediction</div>
            {data.predictions.map((p) => (
              <div key={p.label} className={styles.predictionRow}>
                <span className={styles.predictionDot} style={{ "--dot-color": p.status === "high" ? "var(--success)" : "var(--warning)" }} />
                {p.label}
              </div>
            ))}
          </div>
          <div className={`hcard ${styles.verifiedCard}`}>
            <div className={styles.verifiedTitle}>Verified Profile</div>
            <p className={styles.verifiedText}>Identity and credentials verified via Blockchain Ledger on June 12, 2024.</p>
          </div>
          <button type="button" className={`btn-primary-custom w-100 ${styles.scheduleBtn}`}>
            <i className="bi bi-calendar-event me-2" />Schedule Interview
          </button>
        </div>
      </div>
    </>
  );
}