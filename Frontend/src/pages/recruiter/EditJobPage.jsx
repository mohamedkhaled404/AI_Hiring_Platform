import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getJobById, updateJob, openJob } from "../../services/jobService";
import { getCategories } from "../../services/categoryService";
import { queryKeys } from "../../constants/queryKeys";
import { WORKPLACES, JOB_TYPES } from "../../constants/jobEnums";
import { postJobSchema } from "../../schemas/postJobSchema";
import LoadingState from "../../components/common/LoadingState";
import BackButton from "../../components/common/BackButton";
import toast from "react-hot-toast";
import styles from "./EditJobPage.module.css";

function todayMinDate() {
  return new Date().toISOString().slice(0, 10);
}

function FieldError({ name }) {
  return (
    <ErrorMessage name={name}>
      {(msg) => <p className={styles.fieldError}>{msg}</p>}
    </ErrorMessage>
  );
}

// Same 5-minute editing window shown on the Assessment page - a Drafted job can only
// be edited within 5 minutes of creation, so we surface the same countdown here.
function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function EditWindowBanner({ timeLeftMs, isLocked }) {
  if (isLocked) {
    return (
      <div className={`${styles.banner} ${styles["banner--locked"]}`}>
        <i className="bi bi-lock-fill" aria-hidden="true" />
        The editing window has expired - this job can no longer be modified.
      </div>
    );
  }

  if (timeLeftMs === null) return null;

  return (
    <div className={`${styles.banner} ${styles["banner--warning"]}`}>
      <i className="bi bi-clock-history" aria-hidden="true" />
      {formatCountdown(timeLeftMs)} left to edit this job before it locks automatically.
    </div>
  );
}

function PublishConfirmModal({ show, onCancel, onConfirm, pending }) {
  if (!show) return null;

  return (
    <div className={`modal show d-block ${styles.modalBackdrop}`} tabIndex="-1">
      <div className={`modal-dialog modal-dialog-centered ${styles.modalDialog}`}>
        <div className={`modal-content ${styles.modalContent}`}>
          <div className={`modal-body ${styles.modalBody}`}>
            <div className={styles.modalIconWrap}>
              <i className={`bi bi-upload ${styles.modalIcon}`} />
            </div>
            <div className={styles.modalTitle}>Publish Job</div>
            <p className={styles.modalText}>
              Are you sure you want to publish this job now?
            </p>
            <div className={styles.modalListLabel}>Once published:</div>
            <ul className={styles.modalList}>
              <li>The job will become visible to candidates immediately.</li>
              <li>You will no longer be able to edit this job.</li>
              <li>The assessment linked to this job will be locked.</li>
              <li>This action cannot be undone.</li>
            </ul>
          </div>
          <div className={`modal-footer ${styles.modalFooter}`}>
            <button type="button" className="btn-outline-custom" onClick={onCancel} disabled={pending}>Cancel</button>
            <button type="button" className="btn-primary-custom" onClick={onConfirm} disabled={pending}>
              {pending ? "Publishing..." : "Publish Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditJobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [skillInput, setSkillInput] = useState("");
  const [showPublishModal, setShowPublishModal] = useState(false);

  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: job,
    isLoading: jobLoading,
    isError: jobError,
    error: jobFetchError,
  } = useQuery({
    queryKey: ["job", id],
    queryFn: () => getJobById(id),
    enabled: !!id,
  });

  const updateJobMutation = useMutation({
    mutationFn: (payload) => updateJob(id, payload),
    onSuccess: () => {
      toast.success("Job updated successfully!");
      navigate("/recruiter/jobs");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update job. Please try again.");
    },
  });

  const publishJobMutation = useMutation({
    mutationFn: () => openJob(id),
    onSuccess: () => {
      setShowPublishModal(false);
      toast.success("Job published successfully.");
      navigate("/recruiter/jobs");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to publish job. Please try again.");
    },
  });

  // Countdown timer - job is only editable within 5 minutes of creation (same rule as
  // the Assessment page).
  const [timeLeftMs, setTimeLeftMs] = useState(null);

  useEffect(() => {
    if (!job?.editableUntil) {
      setTimeLeftMs(null);
      return undefined;
    }
    const deadline = new Date(job.editableUntil).getTime();
    const tick = () => setTimeLeftMs(Math.max(0, deadline - Date.now()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [job?.editableUntil]);

  // Only Drafted jobs are subject to the 5-minute window; already-published jobs stay
  // editable as before (no timer, no lock).
  const isLocked = job?.status === "Drafted" && timeLeftMs !== null && timeLeftMs <= 0;

  if (categoriesLoading || jobLoading) return <LoadingState message="Loading job details..." />;

  if (jobError) {
    return (
      <>
        <BackButton fallbackTo="/recruiter/jobs" label="Back to Jobs" />
        <div className={styles.notFoundBanner}>
          {jobFetchError?.message || "Failed to load job details."}
        </div>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <BackButton fallbackTo="/recruiter/jobs" label="Back to Jobs" />
        <div className={styles.notFoundBanner}>
          Job not found.
        </div>
      </>
    );
  }

  if (updateJobMutation.isPending) return <LoadingState message="Saving changes..." />;
  if (publishJobMutation.isPending) return <LoadingState message="Publishing job..." />;

  const editInitialValues = {
    category: job.category?._id || job.category || "",
    title: job.title || "",
    description: job.description || "",
    workplace: job.workplace || "Remote",
    jobType: job.jobType || "Full Time",
    location: job.location || "",
    skills: job.skills || [],
    requirements: job.requirements || "",
    applicationEnd: job.applicationEnd ? job.applicationEnd.slice(0, 10) : "",
  };

  return (
    <>
      <BackButton fallbackTo="/recruiter/jobs" label="Back to Jobs" />
      <div className="page-header-row">
        <div>
          <h1 className={styles.pageTitle}>Edit Job</h1>
          <p className={styles.pageSubtitle}>Update the details of your job posting.</p>
        </div>
      </div>

      <EditWindowBanner timeLeftMs={timeLeftMs} isLocked={isLocked} />

      <Formik
        initialValues={editInitialValues}
        validationSchema={postJobSchema}
        enableReinitialize
        onSubmit={(values) => {
          const payload = {
            category: values.category,
            title: values.title.trim(),
            description: values.description.trim(),
            workplace: values.workplace,
            jobType: values.jobType,
            skills: values.skills,
            requirements: values.requirements?.trim() ?? "",
            location: values.location?.trim() ?? "",
          };
          if (values.applicationEnd) {
            payload.applicationEnd = values.applicationEnd;
          }
          updateJobMutation.mutate(payload);
        }}
      >
        {({ values, setFieldValue }) => {
          const addSkill = (value) => {
            const trimmed = (value || skillInput).trim().replace(/,$/, "");
            if (trimmed && !values.skills.includes(trimmed)) {
              setFieldValue("skills", [...values.skills, trimmed]);
              setSkillInput("");
            }
          };

          const handleSkillKey = (e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addSkill();
            }
          };

          const removeSkill = (skill) => {
            setFieldValue("skills", values.skills.filter((s) => s !== skill));
          };

          return (
            <Form>
              {updateJobMutation.isError && (
                <div className={styles.errorBanner}>
                  {updateJobMutation.error?.message || "Failed to update job. Please try again."}
                </div>
              )}

              <div className={`hcard ${styles.formCard}`}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="category">Category</label>
                  <Field as="select" id="category" name="category" className={styles.input}>
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </Field>
                  <FieldError name="category" />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="title">Job Title</label>
                  <Field id="title" name="title" placeholder="e.g. Frontend Developer" className={styles.input} />
                  <FieldError name="title" />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="description">Description</label>
                  <Field
                    as="textarea"
                    id="description"
                    name="description"
                    rows={5}
                    placeholder="Describe the role and responsibilities..."
                    className={`${styles.input} ${styles.textarea}`}
                  />
                  <FieldError name="description" />
                </div>

                <div className={`grid-stats-3 ${styles.threeCol}`}>
                  <div>
                    <label className={styles.label} htmlFor="workplace">Workplace</label>
                    <Field as="select" id="workplace" name="workplace" className={styles.input}>
                      {WORKPLACES.map((o) => <option key={o} value={o}>{o}</option>)}
                    </Field>
                    <FieldError name="workplace" />
                  </div>
                  <div>
                    <label className={styles.label} htmlFor="jobType">Job Type</label>
                    <Field as="select" id="jobType" name="jobType" className={styles.input}>
                      {JOB_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
                    </Field>
                    <FieldError name="jobType" />
                  </div>
                  <div>
                    <label className={styles.label} htmlFor="location">Location</label>
                    <Field id="location" name="location" placeholder="e.g. Cairo, Egypt" className={styles.input} />
                    <FieldError name="location" />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Skills</label>
                  <div className={styles.skillsBox}>
                    {values.skills.map((s) => (
                      <span key={s} className={styles.skillChip}>
                        {s}
                        <i className={`bi bi-x ${styles.skillChipRemove}`} onClick={() => removeSkill(s)} aria-hidden="true" />
                      </span>
                    ))}
                    <input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleSkillKey}
                      onBlur={() => addSkill()}
                      placeholder="Add skill..."
                      className={styles.skillInput}
                    />
                  </div>
                  <FieldError name="skills" />
                  <div className={styles.skillsHint}>Press Enter or use commas to separate tags.</div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="requirements">Requirements</label>
                  <Field
                    as="textarea"
                    id="requirements"
                    name="requirements"
                    rows={3}
                    placeholder="e.g. 2+ years of frontend experience."
                    className={`${styles.input} ${styles.textarea}`}
                  />
                  <FieldError name="requirements" />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="application-end">Application End</label>
                  <Field id="application-end" name="applicationEnd" type="date" min={todayMinDate()} className={`${styles.input} ${styles.dateInput}`} />
                  <FieldError name="applicationEnd" />
                </div>

                <div className={styles.actionsRow}>
                  {job.status === "Drafted" && (
                    <button
                      type="button"
                      className="btn-outline-custom"
                      disabled={isLocked}
                      onClick={() => {
                        const deadline = values.applicationEnd ? new Date(`${values.applicationEnd}T23:59:59`) : null;
                        if (deadline && deadline < new Date()) {
                          toast.error("Can't publish this job — its application deadline has already passed. Please update the deadline first.");
                          return;
                        }
                        setShowPublishModal(true);
                      }}
                    >
                      <i className="bi bi-send me-2" aria-hidden="true" />Publish Now
                    </button>
                  )}
                  <button type="submit" className="btn-primary-custom" disabled={isLocked}>
                    <i className="bi bi-check-lg me-2" aria-hidden="true" />Save Changes
                  </button>
                </div>
              </div>
            </Form>
          );
        }}
      </Formik>
      <PublishConfirmModal
        show={showPublishModal}
        onCancel={() => setShowPublishModal(false)}
        onConfirm={() => publishJobMutation.mutate()}
        pending={publishJobMutation.isPending}
      />
    </>
  );
}