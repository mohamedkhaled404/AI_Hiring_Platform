import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { getJobById, isJobAvailableForCandidate } from "../../services/jobService";
import { applyToJob, validateCvFile } from "../../services/applicationService";
import { getCandidateProfile } from "../../services/profileService";
import { useAuth } from "../../context/useAuth";
import { queryKeys } from "../../constants/queryKeys";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import BackButton from "../../components/common/BackButton";
import toast from "react-hot-toast";
import styles from "./ApplyJobPage.module.css";

function normalizeJob(raw) {
  if (!raw) return null;
  return {
    id: raw._id,
    title: raw.title || "Untitled",
    company: raw.recruiter?.company_name || raw.recruiter?.name || "Joblio Recruiter",
    location: raw.location || "Remote",
    status: raw.status,
    applicationEnd: raw.applicationEnd,
    isAvailable: isJobAvailableForCandidate(raw),
  };
}

export default function ApplyJobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [savedCvUrl, setSavedCvUrl] = useState(user?.cv || null);
  const [useSavedCV, setUseSavedCV] = useState(Boolean(user?.cv));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [rawJob, profile] = await Promise.all([
          getJobById(id),
          getCandidateProfile().catch(() => null),
        ]);

        if (cancelled) return;

        const normalizedJob = normalizeJob(rawJob);
        setJob(normalizedJob);

        const profileCv = profile?.cv || user?.cv || null;
        setSavedCvUrl(profileCv);
        if (profileCv) setUseSavedCV(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, user?.cv]);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    const validationError = validateCvFile(selectedFile);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setFile(selectedFile);
    setUseSavedCV(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const canSubmit = useSavedCV ? Boolean(savedCvUrl) : Boolean(file);

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error(
        savedCvUrl
          ? "Upload a CV or choose your saved profile CV to proceed."
          : "Upload a CV or add one to your profile before applying."
      );
      return;
    }

    if (!job?.isAvailable) {
      toast.error("This job is no longer accepting applications.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await applyToJob(job.id, useSavedCV ? {} : { cvFile: file });
      await queryClient.invalidateQueries({ queryKey: queryKeys.applications.mine });
      const applicationId = result?.application?._id;

      if (!applicationId) {
        toast.success(result?.message || "Application submitted successfully!");
        navigate("/candidate/applications");
        return;
      }

      navigate(`/candidate/application-submitted?applicationId=${applicationId}`);
    } catch (error) {
      toast.error(error.message || "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading application form..." />;

  if (!job) {
    return (
      <EmptyState
        icon="bi-briefcase"
        title="Job not found"
        description="This job listing may have been removed or is no longer available."
        action={
          <button type="button" className="btn-primary-custom" onClick={() => navigate("/candidate/jobs")}>
            Back to Jobs
          </button>
        }
      />
    );
  }

  if (!job.isAvailable) {
    return (
      <EmptyState
        icon="bi-calendar-x"
        title="Applications closed"
        description="This job is no longer open for applications."
        action={
          <button type="button" className="btn-primary-custom" onClick={() => navigate(`/candidate/jobs/${id}`)}>
            Back to Job
          </button>
        }
      />
    );
  }

  return (
    <div className={styles.wrap}>
      <BackButton fallbackTo={`/candidate/jobs/${id}`} label="Back to Job" />
      <div className={styles.breadcrumb}>
        <span className={styles.breadcrumbLink} onClick={() => navigate("/candidate/jobs")}>Jobs</span>
        <i className="bi bi-chevron-right" aria-hidden="true" />
        <span className={styles.breadcrumbLink} onClick={() => navigate(`/candidate/jobs/${id}`)}>{job.title}</span>
        <i className="bi bi-chevron-right" aria-hidden="true" />
        <span>Apply</span>
      </div>

      <h1 className={styles.title}>Apply to {job.title}</h1>
      <div className={styles.subtitle}>{job.company} · {job.location}</div>

      <div className={`hcard ${styles.cvCard}`}>
        <div className={styles.cvHeaderRow}>
          <div className={styles.cvHeaderTitle}>Your CV</div>
          <label className={`${styles.savedCvLabel} ${savedCvUrl ? styles["savedCvLabel--enabled"] : styles["savedCvLabel--disabled"]}`}>
            <input
              type="checkbox"
              checked={useSavedCV}
              disabled={!savedCvUrl}
              onChange={(e) => {
                setUseSavedCV(e.target.checked);
                if (e.target.checked) setFile(null);
              }}
              className={`${styles.savedCvCheckbox} ${savedCvUrl ? styles["savedCvCheckbox--enabled"] : styles["savedCvCheckbox--disabled"]}`}
            />
            Use my saved profile CV
          </label>
        </div>

        {savedCvUrl ? (
          <p className={styles.helperText}>
            A CV is saved on your profile. You can apply with it or upload a different PDF for this application.
          </p>
        ) : (
          <div className={styles.noCvBanner}>
            No CV found on your profile. Upload a PDF below or{" "}
            <button
              type="button"
              className={`btn btn-link p-0 align-baseline ${styles.noCvLink}`}
              onClick={() => navigate("/candidate/profile/complete")}
            >
              add one to your profile
            </button>
            .
          </div>
        )}

        {useSavedCV && savedCvUrl ? (
          <div className={styles.savedCvBox}>
            <div className={styles.savedCvRow}>
              <i className={`bi bi-file-earmark-pdf-fill ${styles.pdfIconLg}`} aria-hidden="true" />
              <div>
                <div className={styles.savedCvName}>Saved profile CV</div>
                <a href={savedCvUrl} target="_blank" rel="noreferrer" className={styles.previewLink}>
                  Preview CV
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("cv-input")?.click()}
            className={`${styles.dropzone} ${dragging ? styles["dropzone--active"] : ""}`}
          >
            {file ? (
              <>
                <i className={`bi bi-file-earmark-pdf-fill ${styles.pdfIconXl}`} aria-hidden="true" />
                <div className={styles.fileName}>{file.name}</div>
                <div className={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</div>
              </>
            ) : (
              <>
                <i className={`bi bi-cloud-arrow-up ${styles.uploadIcon}`} aria-hidden="true" />
                <div className={styles.dropTitle}>Drag & drop your CV here</div>
                <div className={styles.dropHint}>
                  or <span className={styles.browseText}>browse files</span> · PDF only · Max 5MB
                </div>
              </>
            )}
            <input
              id="cv-input"
              type="file"
              accept="application/pdf,.pdf"
              className={styles.hiddenInput}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
          </div>
        )}
      </div>

      <div className={styles.actionsRow}>
        <button type="button" className={`btn-outline-custom ${styles.cancelBtn}`} onClick={() => navigate(`/candidate/jobs/${id}`)}>
          Cancel
        </button>
        <button
          type="button"
          className={`btn-primary-custom ${styles.submitBtn} ${!canSubmit && !submitting ? styles["submitBtn--disabled"] : styles["submitBtn--enabled"]}`}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Submitting...
            </>
          ) : (
            <>
              <i className="bi bi-send me-2" aria-hidden="true" />
              Submit Application
            </>
          )}
        </button>
      </div>
    </div>
  );
}