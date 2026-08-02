import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/useAuth";
import { getMyApplications, getCandidateDashboardStats } from "../../services/applicationService";
import { queryKeys } from "../../constants/queryKeys";
import StatusBadge from "../../components/common/StatusBadge";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import styles from "./CandidateDashboard.module.css";

export default function CandidateDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    data: stats = [],
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ["candidate", "dashboard-stats"],
    queryFn: getCandidateDashboardStats,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: applications = [],
    isLoading: appsLoading,
    isError: appsError,
  } = useQuery({
    queryKey: queryKeys.applications.mine,
    queryFn: getMyApplications,
    staleTime: 60 * 1000,
  });

  // Real pending-assessments count: only applications whose job is still Open, still
  // has an assessment attached (hasAssessment, from the backend), and hasn't been
  // completed yet. A deleted job (no jobId) or a closed job (status !== "Open") is
  // automatically excluded, so the count drops on its own once a job is removed or closed.
  // Applications that already got a final decision (Rejected/Accepted) are excluded too —
  // once the recruiter has decided, there's no point asking the candidate to still take it.
  const pendingCount = applications.filter(
    (app) =>
      app.jobId &&
      app.jobStatus === "Open" &&
      app.hasAssessment &&
      !app.assessmentCompleted &&
      app.status !== "rejected" &&
      app.status !== "accepted"
  ).length;

  // Real feedback-reports count: an AI feedback report only exists once an application
  // has been rejected (that's when "View AI Feedback" becomes available to the candidate),
  // so this counts rejected applications instead of using the old static mock number.
  const feedbackCount = applications.filter((app) => app.status === "rejected").length;

  const loading = statsLoading || appsLoading;
  const recentApps = applications.slice(0, 4);
  const activeApplications = applications.filter((app) => app.status !== "rejected").length;

  if (loading) return <LoadingState message="Loading dashboard..." />;

  return (
    <>
      <div className="page-header-row">
        <div>
          <h1>Welcome, {user?.name?.split(" ")[0]} 👋</h1>
          <p className={styles.subtitle}>
            Here&apos;s an overview of your recruitment journey today.
          </p>
        </div>
      </div>

      <div className="grid-stats-3 mb-4">
        <div className="hcard stat-card">
          <div className={styles.statRow}>
            <div>
              <div className="stat-label">Active Applications</div>
              <div className="stat-value">{activeApplications}</div>
              <div className={`stat-change ${styles.statChangeSuccess}`}>
                <i className="bi bi-arrow-up me-1" aria-hidden="true" />
                From your submitted applications
              </div>
            </div>
            <div className={`stat-icon ${styles.statIcon}`}>
              <i className={`bi bi-file-earmark-text ${styles.statIconInner}`} aria-hidden="true" />
            </div>
          </div>
        </div>
        {stats.filter((s) => s.label !== "Active Applications").map((s, i) => (
          <div key={i} className="hcard stat-card">
            <div className={styles.statRow}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">
                  {s.label === "Pending Assessments"
                    ? String(pendingCount).padStart(2, "0")
                    : s.label === "Feedback Reports"
                    ? String(feedbackCount).padStart(2, "0")
                    : s.value}
                </div>
                <div className={`stat-change ${styles.statChangeDynamic}`} style={{ "--status-color": s.warning ? "var(--danger)" : "var(--success)" }}>
                  <i className={`bi ${s.warning ? "bi-clock" : "bi-arrow-up"} me-1`} aria-hidden="true" />
                  {s.label === "Feedback Reports" ? "From rejected applications" : s.change}
                </div>
              </div>
              <div className={`stat-icon ${styles.statIcon}`} style={{ "--icon-bg": s.iconBg }}>
                <i className={`bi ${s.icon} ${styles.statIconInner}`} style={{ "--icon-color": s.iconColor }} aria-hidden="true" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-aside-main">
        <div className={`hcard ${styles.card}`}>
          <div className={styles.cardHeaderRow}>
            <div className={`section-title ${styles.cardTitleFlush}`}>Recent Applications</div>
            <button
              type="button"
              onClick={() => navigate("/candidate/applications")}
              className={styles.viewAllBtn}
            >
              View All
            </button>
          </div>

          {appsError ? (
            <EmptyState
              icon="bi-exclamation-circle"
              title="Could not load applications"
              description="Your recent applications could not be fetched right now."
              action={
                <button type="button" className="btn-outline-custom" onClick={() => navigate("/candidate/applications")}>
                  Open My Applications
                </button>
              }
            />
          ) : recentApps.length === 0 ? (
            <EmptyState
              icon="bi-file-earmark-text"
              title="No applications yet"
              description="Browse open roles and submit your first application."
              action={
                <button type="button" className="btn-primary-custom" onClick={() => navigate("/candidate/jobs")}>
                  Browse Jobs
                </button>
              }
            />
          ) : (
            <div className={styles.appList}>
              {recentApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => navigate(`/candidate/applications/${app.id}`)}
                  className={styles.appRow}
                >
                  <img
                    src={app.logo}
                    alt={app.company}
                    className={styles.appLogo}
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.company)}&background=F3F5FB&color=1D2445&size=40`; }}
                  />
                  <div className={styles.appInfo}>
                    <div className={styles.appTitle}>{app.jobTitle}</div>
                    <div className={styles.appMeta}>
                      {app.company} · Applied {app.appliedAt}
                    </div>
                    {app.jobWorkplace && (
                      <div className={styles.appWorkplace}>
                        {app.jobWorkplace}{app.jobLocation ? ` · ${app.jobLocation}` : ""}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={app.status} />
                  <i className="bi bi-chevron-right text-muted" aria-hidden="true" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`hcard ${styles.card}`}>
          <div className="section-title">Assessments</div>
          <div className={styles.todoHeader}>
            <div className={styles.todoHeaderRow}>
              <span className={styles.todoLabel}>To-Do List</span>
              <span className={styles.todoCount}>
                {pendingCount}
              </span>
            </div>
          </div>

          {pendingCount === 0 ? (
            <div className={styles.assessmentPanel}>
              <div className={styles.assessmentIconWrap} style={{ "--icon-wrap-bg": "#D1FAE5" }}>
                <i className={`bi bi-check-circle-fill ${styles.assessmentIcon}`} style={{ "--icon-wrap-color": "#059669" }} aria-hidden="true" />
              </div>
              <div className={styles.assessmentTitle}>You&apos;re all caught up!</div>
              <p className={styles.assessmentText}>
                No pending skill tests or technical assessments require your attention right now.
              </p>
              <button
                type="button"
                className={`btn-outline-custom ${styles.assessmentBtn}`}
                onClick={() => navigate("/candidate/applications")}
              >
                View Assessments
              </button>
            </div>
          ) : (
            <div className={styles.assessmentPanel}>
              <div className={styles.assessmentIconWrap}>
                <i className={`bi bi-clipboard-check ${styles.assessmentIcon}`} aria-hidden="true" />
              </div>
              <div className={styles.assessmentTitle}>
                {pendingCount} assessment{pendingCount !== 1 ? "s" : ""} pending
              </div>
              <p className={styles.assessmentText}>
                Complete your pending assessments to stay on track.
              </p>
              <button
                type="button"
                className={`btn-primary-custom ${styles.assessmentBtn}`}
                onClick={() => navigate("/candidate/applications")}
              >
                View Assessments
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}