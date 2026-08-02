import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getApplicantsList, updateJobApplicationStatus } from "../../services/recruiterService";
import { getAssessment } from "../../services/assessmentService";
import { getJobViolations } from "../../services/assessmentViolation.service";
import toast from "react-hot-toast";
import CircleProgress from "../../components/common/CircleProgress";
import LoadingState from "../../components/common/LoadingState";
import BackButton from "../../components/common/BackButton";
import styles from "./ApplicantsListPage.module.css";

function normalizeApplicantsData(data, jobId) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.jobs)) return data.jobs;
  if (Array.isArray(data?.applicants)) {
    return [{ _id: jobId ?? "all", title: data.jobTitle ?? "All Jobs", applications: data.applicants }];
  }
  return [];
}

export default function ApplicantsListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const jobId = location.state?.jobId;
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [violationsMap, setViolationsMap] = useState({});

  const handleStatusUpdate = async (jobId, applicationId, newStatus) => {
    if (!jobId || !applicationId) return;
    setUpdatingStatus((prev) => ({ ...prev, [applicationId]: newStatus }));
    try {
      await updateJobApplicationStatus(jobId, applicationId, newStatus);
      setJobs((prevJobs) =>
        prevJobs.map((job) => {
          if (job._id === jobId || job._id === "all") {
            return {
              ...job,
              applications: job.applications.map((app) =>
                app._id === applicationId || app.id === applicationId
                  ? { ...app, status: newStatus }
                  : app
              ),
            };
          }
          return job;
        })
      );
      toast.success(`Candidate application ${newStatus.toLowerCase()} successfully!`);
    } catch (err) {
      toast.error(err.message || "Failed to update candidate application status.");
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [applicationId]: null }));
    }
  };

  const loadApplicants = useCallback(
    async () => {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      try {
        const data = await getApplicantsList(jobId);
        setJobs(normalizeApplicantsData(data, jobId));
      } catch (err) {
        setIsError(true);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [jobId]
  );

  useEffect(() => {
    loadApplicants();
  }, [loadApplicants]);

  const currentJobTitle = useMemo(() => {
    if (!jobId || !jobs.length) return "";
    const job = jobs.find((j) => j._id === jobId);
    return job ? job.title : "";
  }, [jobs, jobId]);

  const displayedApplications = useMemo(() => {
    if (!jobs.length) return [];
    if (jobId) {
      const job = jobs.find((j) => j._id === jobId);
      return job ? job.applications.map((app) => ({ ...app, jobTitle: job.title, jobId: job._id })) : [];
    }
    return jobs.flatMap((job) => job.applications.map((app) => ({ ...app, jobTitle: job.title, jobId: app.jobId || job._id })));
  }, [jobs, jobId]);

  // Which jobs actually require an assessment (type AI/MANUAL, not the default "NONE").
  // Only relevant for jobs that require one do we hold candidates back until they've
  // taken it — jobs with no assessment show every applicant as before.
  const [jobsWithAssessment, setJobsWithAssessment] = useState({});

  useEffect(() => {
    const jobIds = [...new Set(displayedApplications.map((app) => app.jobId).filter(Boolean))]
      .filter((id) => jobsWithAssessment[id] === undefined);
    if (jobIds.length === 0) return;

    let cancelled = false;
    jobIds.forEach((id) => {
      getAssessment(id)
        .then(({ data: res }) => {
          if (cancelled) return;
          const requiresAssessment = Boolean(res?.assessment?.type && res.assessment.type !== "NONE");
          setJobsWithAssessment((prev) => ({ ...prev, [id]: requiresAssessment }));
        })
        .catch(() => {
          if (!cancelled) setJobsWithAssessment((prev) => ({ ...prev, [id]: false }));
        });
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedApplications]);

  // Fetch violations for the applicant jobs that have assessments
  useEffect(() => {
    const jobIds = [...new Set(displayedApplications.map((app) => app.jobId).filter(Boolean))]
      .filter((id) => jobsWithAssessment[id]);
    if (jobIds.length === 0) return;

    let cancelled = false;
    jobIds.forEach((id) => {
      getJobViolations(id)
        .then(({ data }) => {
          if (cancelled) return;
          const map = {};
          for (const entry of data) {
            const candidateId = entry.candidate?._id;
            if (candidateId) {
              map[candidateId] = entry;
            }
          }
          setViolationsMap((prev) => ({ ...prev, ...map }));
        })
        .catch(() => {});
    });

    return () => { cancelled = true; };
  }, [displayedApplications, jobsWithAssessment]);

  // When viewing a single job's applicants, hide the whole Assessment Score column
  // if that job has no assessment attached. When viewing all jobs mixed together,
  // keep the column (different jobs may have different assessment setups).
  const showAssessmentColumn = jobId ? jobsWithAssessment[jobId] !== false : true;

  // Only show candidates who uploaded a CV, and — for jobs that actually require an
  // assessment — who have completed it. Everyone else stays hidden from the HR view
  // until they've done what's needed.
  const eligibleApplications = useMemo(() => {
    return displayedApplications.filter((app) => {
      if (!app.CV) return false;
      if (jobsWithAssessment[app.jobId] && !app.assessmentCompleted) return false;
      return true;
    });
  }, [displayedApplications, jobsWithAssessment]);

  const sortedApplications = useMemo(() => {
    return [...eligibleApplications]
      .filter((app) => (app.status || "Pending").toLowerCase() !== "rejected")
      .sort((a, b) => {
        const scoreA = ((a.cvScore ?? 0) + (a.skillMatch ?? 0) + (a.assessmentScore ?? 0)) / 3;
        const scoreB = ((b.cvScore ?? 0) + (b.skillMatch ?? 0) + (b.assessmentScore ?? 0)) / 3;
        return scoreB - scoreA;
      });
  }, [eligibleApplications]);

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sortedApplications.filter((app) => {
      if (term) {
        const name = (app.candidate?.name || "").toLowerCase();
        const email = (app.candidate?.email || "").toLowerCase();
        if (!name.includes(term) && !email.includes(term)) return false;
      }
      if (statusFilter !== "all" && (app.status || "Pending").toLowerCase() !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [sortedApplications, search, statusFilter]);

  if (isLoading) return <LoadingState message="Loading applicants..." />;

  return (
    <>
      <BackButton fallbackTo="/recruiter/applications" label="Back to Applications" />
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>
            {jobId && currentJobTitle ? `${currentJobTitle} - Applicants List` : "Applicants List"}
          </h1>
          <p className={styles.subtitle}>Review and filter candidates applying for this position.</p>
        </div>
        <div className={styles.headerActions}>
          {jobId && (
            <button className="btn-primary-custom" onClick={() => navigate(`/recruiter/jobs/${jobId}/assessment`)}>
              <i className="bi bi-clipboard-check me-2" />
              Manage Assessment
            </button>
          )}

        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div className={`input-group search-filter-box ${styles.searchBox}`}>
          <span className="input-group-text border-0"><i className="bi bi-search text-muted"></i></span>
          <input
            type="text"
            className="form-control border-0"
            placeholder="Search by name or email"
            name="applicant-search"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={`input-group search-filter-box ${styles.filterBox}`}>
          <span className="input-group-text border-0"><i className="bi bi-sliders text-muted"></i></span>
          <select className="form-select border-0" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
          </select>
        </div>
      </div>

      {isError && (
        <div className={styles.errorText}>Failed to load applicants: {error?.message || "Unknown error"}</div>
      )}

      {!isError && !filteredApplications.length && (
        <div className={styles.emptyText}>No applicants found.</div>
      )}

      {!isError && filteredApplications.length > 0 && (
        <div className={`hcard p-0 ${styles.tableCard}`}>
          <table className={`table align-middle mb-0 ${styles.table}`}>
            <thead className="table-light">
              <tr className={styles.headRow}>
                <th>Applicant</th>
                <th>Status</th>
                <th className="text-center">CV Score</th>
                {showAssessmentColumn && <th className="text-center">Assessment Score</th>}
                {showAssessmentColumn && <th className="text-center">Cheating Flags</th>}
                <th>AI Report</th>
                <th className={styles.actionsHead}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app, idx) => {
                const cvRelevanceScore = Math.round(app.cvScore ?? app.matchScore ?? 0);
                const assessmentScore = Math.round(app.assessmentScore ?? 0);
                const candidateId = app._id || app.id;
                const effectiveJobId = app.jobId || jobId;

                return (
                  <tr key={candidateId || idx}>
                    <td>
                      <div className={styles.candidateCell}>
                        <img
                          src={app.candidate?.profile_image || `https://ui-avatars.com/api/?name=${app.candidate?.name?.[0] || "U"}`}
                          alt=""
                          className={styles.candidateAvatar}
                        />
                        <div>
                          <div className={styles.candidateName}>{app.candidate?.name || "Unknown"}</div>
                          <div className={styles.candidateEmail}>{app.candidate?.email || ""}</div>
                          {!jobId && (
                            <span className={`badge rounded-pill mt-1 ${styles.jobBadge}`}>
                              Applied for: {app.jobTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge rounded-pill text-bg-${(app.status || "Pending").toLowerCase() === "accepted" ? "success" : (app.status || "Pending").toLowerCase() === "rejected" ? "danger" : "warning"}`}>
                        {app.status || "Pending"}
                      </span>
                    </td>
                    <td className={styles.centerCell}>
                      <CircleProgress value={cvRelevanceScore} size={60} stroke={5} />
                    </td>
                    {showAssessmentColumn && (
                      <td className={styles.centerCell}>
                        {jobsWithAssessment[app.jobId] ? (
                          <CircleProgress value={assessmentScore} size={60} stroke={5} />
                        ) : (
                          <span className={styles.mutedSmall}>—</span>
                        )}
                      </td>
                    )}
                    {showAssessmentColumn && (
                      <td className={styles.violationsCell}>
                        {(() => {
                          const candidateId = app.candidate?._id;
                          const violationEntry = candidateId ? violationsMap[candidateId] : null;
                          if (!violationEntry || violationEntry.totalCount === 0) {
                            return <span className={styles.mutedSmall}>No cheating detected</span>;
                          }
                          const grouped = {};
                          for (const v of violationEntry.violations) {
                            grouped[v.type] = (grouped[v.type] || 0) + 1;
                          }
                          const lastTimestamp = violationEntry.violations[0]?.timestamp;
                          const formattedDate = lastTimestamp
                            ? new Date(lastTimestamp).toLocaleString("en-GB", {
                                day: "numeric", month: "long", year: "numeric",
                                hour: "2-digit", minute: "2-digit", second: "2-digit",
                              })
                            : "";
                          const tooltipLines = Object.entries(grouped).map(
                            ([type, count]) => `${type}: ${count} occurrence${count > 1 ? "s" : ""}`
                          );
                          if (formattedDate) tooltipLines.push(`Last: ${formattedDate}`);
                          return (
                            <span title={tooltipLines.join("\n")} className={styles.violationsWrap}>
                              {Object.entries(grouped).map(([type, count]) => (
                                <span key={type} className={styles.violationChip}>
                                  🚩 {type} x{count}
                                </span>
                              ))}
                            </span>
                          );
                        })()}
                      </td>
                    )}
                    <td className={styles.reportCell}>
                      <button
                        type="button"
                        className={`btn btn-link btn-sm p-0 fw-bold ${styles.reportLink}`}
                        onClick={() => navigate(`/recruiter/feedback/${effectiveJobId}/${candidateId}`)}
                      >
                        View Report <i className="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                      </button>
                    </td>
                    <td>
                      <div className={`d-flex flex-column gap-1 ${styles.actionsCol}`}>
                        <button
                          type="button"
                          className={`w-100 ${styles.viewCandidateBtn}`}
                          onClick={() => navigate(`/recruiter/candidates/${app.candidate?._id || candidateId}`, {
                            state: {
                              jobId: effectiveJobId,
                              applicationId: candidateId,
                              cvScore: cvRelevanceScore,
                              assessmentScore,
                              matchScore: app.matchScore ?? app.skillMatch,
                            },
                          })}
                        >
                          View Candidate <i className="bi bi-arrow-right ms-1" />
                        </button>
                        {(app.status || "Pending").toLowerCase() === "pending" && (
                          <div className="d-flex gap-1">
                            <button
                              type="button"
                              className={`flex-fill ${styles.decisionBtn} ${styles["decisionBtn--accept"]}`}
                              onClick={() => handleStatusUpdate(effectiveJobId, candidateId, "Accepted")}
                              disabled={!!updatingStatus[candidateId]}
                            >
                              {updatingStatus[candidateId] === "Accepted" ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : "Accept"}
                            </button>
                            <button
                              type="button"
                              className={`flex-fill ${styles.decisionBtn} ${styles["decisionBtn--reject"]}`}
                              onClick={() => handleStatusUpdate(effectiveJobId, candidateId, "Rejected")}
                              disabled={!!updatingStatus[candidateId]}
                            >
                              {updatingStatus[candidateId] === "Rejected" ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : "Reject"}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isError && filteredApplications.length > 0 && (
        <div className={styles.footerText}>
          Showing {filteredApplications.length} {filteredApplications.length === 1 ? "applicant" : "applicants"}
        </div>
      )}
    </>
  );
}