import { useEffect, useState } from "react";

import { getJobs, deleteJob, adminCloseJob } from "../../services/jobService";
import { getErrorMessage } from "../../utils/errorMessages";

import LoadingState from "../../components/common/LoadingState";
import toast from "react-hot-toast";
import styles from "./JobManagementPage.module.css";

export default function JobManagementPage() {

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null); // job pending deletion, or null
  const [deleting, setDeleting] = useState(false);
  const [closeTarget, setCloseTarget] = useState(null); // job pending closing, or null
  const [closing, setClosing] = useState(false);

  const loadJobs = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const data = await getJobs({ page: pageNumber, limit: 10 });
      setJobs(data.jobs || []);
      setPage(data.page || 1);
      setTotalPages(data.pages || 1);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load jobs"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleDelete = (job) => setDeleteTarget(job);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteJob(deleteTarget._id);
      toast.success("Job deleted");
      setDeleteTarget(null);
      loadJobs(page);
    } catch (err) {
      toast.error(getErrorMessage(err, "Delete failed"));
    } finally {
      setDeleting(false);
    }
  };

  // الأدمن يقدر يقفل جوب مفتوح بس (مينفعش يفتحه تاني ولا يرجعه درافت)
  const handleCloseClick = (job) => setCloseTarget(job);

  const handleConfirmClose = async () => {
    if (!closeTarget) return;
    setClosing(true);
    try {
      await adminCloseJob(closeTarget._id);
      toast.success("Job closed");
      setCloseTarget(null);
      loadJobs(page);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to close job"));
    } finally {
      setClosing(false);
    }
  };

  if (loading && jobs.length === 0) return <LoadingState message="Loading jobs..." />;

  return (
    <div className="container-fluid py-4">
      <div className="page-header-row">
        <h1 className={styles.title}>Manage Jobs</h1>
        <p className={styles.subtitle}>
          Review and delete job postings.
        </p>
        <div className={`hcard w-100 ${styles.tableCard}`}>
          <table className="table table-hover align-middle w-100">
            <thead>
              <tr>
                <th>Title</th>
                <th>Company</th>
                <th>Category</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job._id}>
                  <td>{job.title}</td>
                  <td>{job.recruiter?.company_logo ? (<img src={job.recruiter.company_logo} alt="Company logo" className={`rounded shadow-sm ${styles.companyLogo}`} />) : null}</td>
                  <td>{job.category?.name || "Uncategorized"}</td>
                  <td>
                    <span
                      className={`badge ${job.status === "Open"
                          ? "text-bg-success"
                          : job.status === "Closed"
                            ? "text-bg-secondary"
                            : "text-bg-warning"
                        }`}
                    >
                      {job.status || "Open"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      <div className={styles.closeBtnWrap}>
                        {job.status === "Open" && (
                          <button
                            className="btn btn-sm btn-outline-secondary w-100"
                            onClick={() => handleCloseClick(job)}
                          >
                            Close
                          </button>
                        )}
                      </div>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(job)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    No jobs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className={styles.paginationFooter}>
              <span className={styles.pageInfo}>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </span>
              <div className={styles.paginationBtns}>
                <button
                  type="button"
                  className={`btn-outline-custom ${styles.pageBtn}`}
                  disabled={page <= 1 || loading}
                  onClick={() => loadJobs(page - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className={`btn-outline-custom ${styles.pageBtn}`}
                  disabled={page >= totalPages || loading}
                  onClick={() => loadJobs(page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Delete confirmation modal ===== */}
      {deleteTarget && (
        <div className={`modal show d-block ${styles.modalBackdrop}`} tabIndex="-1">
          <div className={`modal-dialog modal-dialog-centered ${styles.modalDialog}`}>
            <div className={`modal-content ${styles.modalContentBox}`}>
              <div className={`modal-body ${styles.modalBody}`}>
                <div className={`${styles.modalIconCircle} ${styles["modalIconCircle--danger"]}`}>
                  <i className={`bi bi-trash ${styles.modalIcon} ${styles["modalIcon--danger"]}`} />
                </div>
                <div className={styles.modalTitle}>Delete this job?</div>
                <p className={styles.modalText}>
                  Are you sure you want to delete "{deleteTarget.title}"? This action cannot be undone.
                </p>
              </div>
              <div className={`modal-footer ${styles.modalFooter}`}>
                <button type="button" className="btn btn-light" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleConfirmDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Close job confirmation modal ===== */}
      {closeTarget && (
        <div className={`modal show d-block ${styles.modalBackdrop}`} tabIndex="-1">
          <div className={`modal-dialog modal-dialog-centered ${styles.modalDialog}`}>
            <div className={`modal-content ${styles.modalContentBox}`}>
              <div className={`modal-body ${styles.modalBody}`}>
                <div className={`${styles.modalIconCircle} ${styles["modalIconCircle--warning"]}`}>
                  <i className={`bi bi-lock ${styles.modalIcon} ${styles["modalIcon--warning"]}`} />
                </div>
                <div className={styles.modalTitle}>Close this job?</div>
                <p className={styles.modalText}>
                  Are you sure you want to close "{closeTarget.title}"? Candidates won't be able to apply anymore.
                </p>
              </div>
              <div className={`modal-footer ${styles.modalFooter}`}>
                <button type="button" className="btn btn-light" onClick={() => setCloseTarget(null)} disabled={closing}>Cancel</button>
                <button type="button" className="btn btn-warning" onClick={handleConfirmClose} disabled={closing}>
                  {closing ? "Closing..." : "Close Job"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}