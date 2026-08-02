import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  useAssessment,
  useGenerateAssessment,
  useUpdateAssessmentSettings,
  useRegenerateAssessment,
  useAddManualQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useRegenerateQuestion,
} from "../../hooks/useAssessment";
import { getJobById, openJob } from "../../services/jobService";
import LoadingState from "../../components/common/LoadingState";
import BackButton from "../../components/common/BackButton";
import toast from "react-hot-toast";
import styles from "./AssessmentGeneratorPage.module.css";

// Candidates need a realistic minimum to actually read and answer questions —
// the backend rejects anything shorter, so we catch it here first with a clear message
// instead of letting the raw API error surface to the recruiter.
const MIN_ASSESSMENT_DURATION_MINUTES = 5;

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Turns a 403 "no longer editable" response into a clear message; otherwise falls back.
function getEditWindowMessage(err, fallback) {
  if (err?.response?.status === 403) {
    return "The 5-minute editing window has expired — this assessment is now locked and can no longer be modified.";
  }
  return fallback;
}

function EditWindowBanner({ job, timeLeftMs, isLocked }) {
  if (!job) return null;

  if (isLocked) {
    return (
      <div className={`${styles.editWindowBanner} ${styles.locked}`}>
        <i className="bi bi-lock-fill" />
        The editing window has expired — this assessment is now locked and can no longer be modified.
      </div>
    );
  }

  if (timeLeftMs === null) return null;

  return (
    <div className={`${styles.editWindowBanner} ${styles.warning}`}>
      <i className="bi bi-clock-history" />
      {formatCountdown(timeLeftMs)} left to edit or add questions before this assessment locks automatically.
    </div>
  );
}

function DurationBadge({ assessment, isLocked, editing, draft, setDraft, onEditStart, onSave, onCancel, saving, error }) {
  if (editing) {
    return (
      <div className={styles.durationEditForm}>
        <form onSubmit={onSave} className={styles.durationEditRow}>
          <input
            type="number" min={MIN_ASSESSMENT_DURATION_MINUTES} max="240" required autoFocus
            value={draft} onChange={(e) => setDraft(e.target.value)}
            className={`form-control form-control-sm ${styles.durationInput}`}
          />
          <span className={styles.durationUnit}>minutes</span>
          <button type="submit" className={`btn btn-sm btn-primary ${styles.durationSaveBtn}`} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button type="button" className={`btn btn-sm btn-light ${styles.durationCancelBtn}`} onClick={onCancel}>Cancel</button>
        </form>
        <FieldError message={error} />
      </div>
    );
  }

  return (
    <div
      className={`${styles.durationView} ${isLocked ? styles.locked : ""}`}
      onClick={() => !isLocked && onEditStart()}
      title={isLocked ? undefined : "Click to change the duration"}
    >
      <i className="bi bi-stopwatch" />
      {assessment?.durationMinutes ? `${assessment.durationMinutes} minute time limit` : "No time limit set"}
      {!isLocked && <i className={`bi bi-pencil ${styles.durationEditIcon}`} />}
    </div>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <div className={styles.fieldError}>
      <i className="bi bi-exclamation-circle-fill" />
      {message}
    </div>
  );
}

const tagColors = {
  Easy: { bg: "#D1FAE5", color: "#065F46" },
  Medium: { bg: "#FEF3C7", color: "#92400E" },
  Hard: { bg: "#FEE2E2", color: "#991B1B" },
  default: { bg: "#f3f5fb", color: "#1d2445" },
};

function ChangeTypeButton({ onClick, style, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={styles.changeTypeBtn}
      style={style}
    >
      <i className={`bi bi-arrow-left-right ${styles.changeTypeIcon}`} />
      Change Assessment Type
    </button>
  );
}

function PublishConfirmModal({ show, onCancel, onConfirm, pending }) {
  if (!show) return null;

  return (
    <div className={`modal show d-block ${styles.modalOverlay}`} tabIndex="-1">
      <div className={`modal-dialog modal-dialog-centered ${styles.modalDialogSm}`}>
        <div className={`modal-content ${styles.modalContent}`}>
          <div className={`modal-body ${styles.confirmModalBody}`}>
            <div className={`${styles.confirmIconWrap} ${styles.publishIconWrap}`}>
              <i className={`bi bi-upload ${styles.publishIcon}`} />
            </div>
            <div className={styles.confirmTitle}>Publish Job</div>
            <p className={styles.confirmDesc}>
              Are you sure you want to publish this job now?
            </p>
            <div className={styles.confirmListTitle}>Once published:</div>
            <ul className={styles.confirmList}>
              <li>The job will become visible to candidates immediately.</li>
              <li>The job will no longer be editable.</li>
              <li>The assessment will be locked.</li>
              <li>This action cannot be undone.</li>
            </ul>
          </div>
          <div className={`modal-footer ${styles.confirmModalFooter}`}>
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

export default function AssessmentGeneratorPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useAssessment(jobId);
  const { data: job } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJobById(jobId),
    enabled: !!jobId,
  });

  const generateMut = useGenerateAssessment();
  const updateSettingsMut = useUpdateAssessmentSettings();
  const regenerateAssMut = useRegenerateAssessment();
  const addQuestionMut = useAddManualQuestion();
  const updateQuestionMut = useUpdateQuestion();
  const deleteQuestionMut = useDeleteQuestion();
  const regenerateQuestionMut = useRegenerateQuestion();

  const publishJobMutation = useMutation({
    mutationFn: () => openJob(jobId),
    onSuccess: () => {
      setShowPublishModal(false);
      toast.success("Job published successfully.");
      navigate("/recruiter/jobs");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to publish job. Please try again.");
    },
  });

  const [pendingChoice, setPendingChoice] = useState(null); // 'AI' | 'MANUAL_SETUP' | 'MANUAL' | null
  const [overridingType, setOverridingType] = useState(false);

  const [generateConfig, setGenerateConfig] = useState({
    questionCount: 10,
    difficulty: "Medium",
    topics: "",
    durationMinutes: 30,
  });

  const [manualDuration, setManualDuration] = useState(30);

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingQuestion, setDeletingQuestion] = useState(false);

  const [showPublishModal, setShowPublishModal] = useState(false);

  const [editingDuration, setEditingDuration] = useState(false);
  const [durationDraft, setDurationDraft] = useState(30);

  const [generateError, setGenerateError] = useState(null);
  const [manualSetupError, setManualSetupError] = useState(null);
  const [durationEditError, setDurationEditError] = useState(null);

  const [chooseError, setChooseError] = useState(null);
  const [listActionError, setListActionError] = useState(null); // regenerate-all / regenerate-one / delete
  const [questionModalError, setQuestionModalError] = useState(null);

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

  const isLocked = job ? job.status !== "Drafted" || (timeLeftMs !== null && timeLeftMs <= 0) : false;

  const notFound = error?.response?.status === 404;
  const assessment = data?.assessment;
  const questions = data?.questions || [];

  const inSetupFlow = notFound || overridingType;
  let mode;
  if (inSetupFlow) {
    mode = pendingChoice === "AI" ? "ai-config" : pendingChoice === "MANUAL_SETUP" ? "manual-setup" : pendingChoice === "MANUAL" ? "manual" : "choose";
  } else if (assessment?.type === "NONE") {
    mode = "disabled";
  } else if (assessment?.type === "AI") {
    mode = questions.length > 0 ? "ai" : "ai-config";
  } else if (assessment?.type === "MANUAL") {
    mode = "manual";
  } else {
    mode = "choose";
  }

  const handleChooseType = async (type) => {
    if (type === "AI") {
      setGenerateError(null);
      setPendingChoice("AI");
      return;
    }
    if (type === "MANUAL") {
      setManualSetupError(null);
      setPendingChoice("MANUAL_SETUP");
      return;
    }
    if (type === "NONE") {
      setChooseError(null);
      try {
        await updateSettingsMut.mutateAsync({
          jobId,
          payload: {
            type: "NONE",
            questionCount: 1,
            difficulty: "Medium",
            topics: "",
            durationMinutes: assessment?.durationMinutes || MIN_ASSESSMENT_DURATION_MINUTES,
          },
        });
        setOverridingType(false);
        setPendingChoice(null);
      } catch (err) {
        setChooseError(getEditWindowMessage(err, err.response?.data?.message || "Failed to disable the assessment. Please try again."));
      }
      return;
    }
  };

  const handleChangeType = () => {
    setGenerateError(null);
    setManualSetupError(null);
    setChooseError(null);
    setOverridingType(true);
    setPendingChoice(null);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    const duration = Number(generateConfig.durationMinutes);
    if (!duration || duration < MIN_ASSESSMENT_DURATION_MINUTES) {
      setGenerateError(`Assessment duration can't be less than ${MIN_ASSESSMENT_DURATION_MINUTES} minutes.`);
      return;
    }
    setGenerateError(null);
    try {
      const payload = {
        questionCount: Number(generateConfig.questionCount),
        difficulty: generateConfig.difficulty,
        topics: generateConfig.topics,
        durationMinutes: duration,
      };
      await generateMut.mutateAsync({ jobId, payload });
      setPendingChoice(null);
      setOverridingType(false);
    } catch (err) {
      setGenerateError(getEditWindowMessage(err, err.response?.data?.message || "Failed to generate the assessment. Please try again."));
    }
  };

  const handleConfirmManualSetup = async (e) => {
    e.preventDefault();
    const duration = Number(manualDuration);
    if (!duration || duration < MIN_ASSESSMENT_DURATION_MINUTES) {
      setManualSetupError(`Assessment duration can't be less than ${MIN_ASSESSMENT_DURATION_MINUTES} minutes.`);
      return;
    }
    setManualSetupError(null);
    try {
      await updateSettingsMut.mutateAsync({
        jobId,
        payload: {
          type: "MANUAL",
          questionCount: 1,
          difficulty: "Medium",
          topics: "",
          durationMinutes: duration,
        },
      });
      setPendingChoice("MANUAL");
      setOverridingType(false);
    } catch (err) {
      setManualSetupError(getEditWindowMessage(err, err.response?.data?.message || "Failed to start a manual assessment. Please try again."));
    }
  };

  const handleSaveDuration = async (e) => {
    e.preventDefault();
    const duration = Number(durationDraft);
    if (!duration || duration < MIN_ASSESSMENT_DURATION_MINUTES) {
      setDurationEditError(`Assessment duration can't be less than ${MIN_ASSESSMENT_DURATION_MINUTES} minutes.`);
      return;
    }
    setDurationEditError(null);
    try {
      await updateSettingsMut.mutateAsync({
        jobId,
        payload: { durationMinutes: duration },
      });
      setEditingDuration(false);
    } catch (err) {
      setDurationEditError(getEditWindowMessage(err, err.response?.data?.message || "Failed to update duration. Please try again."));
    }
  };

  const handleRegenerateAssessment = async () => {
    setListActionError(null);
    try {
      await regenerateAssMut.mutateAsync({ jobId });
    } catch (err) {
      setListActionError(getEditWindowMessage(err, err.response?.data?.message || "Failed to regenerate the assessment. Please try again."));
    }
  };

  const handleRegenerateQuestion = async (questionId) => {
    setListActionError(null);
    try {
      await regenerateQuestionMut.mutateAsync({ questionId, jobId });
    } catch (err) {
      setListActionError(getEditWindowMessage(err, err.response?.data?.message || "Failed to regenerate this question. Please try again."));
    }
  };

  const openAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionModalError(null);
    setQuestionModalOpen(true);
  };

  const openEditQuestion = (q) => {
    setEditingQuestion(q);
    setQuestionModalError(null);
    setQuestionModalOpen(true);
  };

  const handleDeleteQuestion = (qId) => {
    setListActionError(null);
    setDeleteConfirmId(qId);
  };

  const handleConfirmDelete = async () => {
    setDeletingQuestion(true);
    try {
      await deleteQuestionMut.mutateAsync({ questionId: deleteConfirmId, jobId });
      setDeleteConfirmId(null);
    } catch (err) {
      setListActionError(getEditWindowMessage(err, err.response?.data?.message || "Failed to delete this question. Please try again."));
      setDeleteConfirmId(null);
    } finally {
      setDeletingQuestion(false);
    }
  };

  const handleQuestionSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const options = [
      formData.get("option1"),
      formData.get("option2"),
      formData.get("option3"),
      formData.get("option4"),
    ].map((opt) => (opt || "").trim());
    const correctAnswer = (formData.get("correctAnswer") || "").trim();
    const question = (formData.get("question") || "").trim();

    if (!question || options.some((opt) => !opt)) {
      setQuestionModalError("Please fill in the question and all four options before saving.");
      return;
    }
    if (!correctAnswer || !options.includes(correctAnswer)) {
      setQuestionModalError("The correct answer must exactly match one of the four options above.");
      return;
    }

    const qData = {
      question,
      options,
      correctAnswer,
      explanation: formData.get("explanation"),
      topic: formData.get("topic"),
      difficulty: formData.get("difficulty"),
    };

    setQuestionModalError(null);
    try {
      if (editingQuestion) {
        await updateQuestionMut.mutateAsync({ questionId: editingQuestion._id, question: qData, jobId });
      } else {
        await addQuestionMut.mutateAsync({ jobId, question: qData });
      }
      setQuestionModalOpen(false);
    } catch (err) {
      setQuestionModalError(getEditWindowMessage(err, err.response?.data?.message || "Please make sure every field is filled in correctly, then try again."));
    }
  };

  if (isLoading) return <LoadingState message="Loading assessment..." />;

  return (
    <>
      <BackButton fallbackTo={`/recruiter/job/${jobId}`} label="Back to Job" />
      <EditWindowBanner job={job} timeLeftMs={timeLeftMs} isLocked={isLocked} />

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Assessment</h1>
        <p className={styles.pageSubtitle}>Configure how candidates for this job will be assessed.</p>
      </div>

      {mode === "choose" && (
        <div>
          <FieldError message={chooseError} />
          <div className={`row g-4 ${chooseError ? styles.typeGridWithError : styles.typeGrid}`}>
            {[
              { type: "NONE", icon: "bi-slash-circle", title: "No Assessment", desc: "Don't require candidates to take any assessment for this job." },
              { type: "AI", icon: "bi-stars", title: "AI Assessment", desc: "Let AI generate multiple-choice questions based on your topics and difficulty." },
              { type: "MANUAL", icon: "bi-pencil-square", title: "Manual Assessment", desc: "Write your own questions from scratch, one at a time." },
            ].map((opt) => (
              <div className="col-md-4" key={opt.type}>
                <button
                  type="button"
                  className={`hcard w-100 text-start ${styles.typeCard}`}
                  onClick={() => handleChooseType(opt.type)}
                  disabled={updateSettingsMut.isPending || isLocked}
                >
                  <i className={`bi ${opt.icon} ${styles.typeCardIcon}`} />
                  <div className={styles.typeCardTitle}>{opt.title}</div>
                  <div className={styles.typeCardDesc}>{opt.desc}</div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "disabled" && (
        <div className={`hcard ${styles.disabledCard}`}>
          <i className={`bi bi-slash-circle ${styles.disabledIcon}`} />
          <div className={styles.disabledTitle}>Assessment disabled</div>
          <p className={styles.disabledDesc}>Candidates applying to this job won't be asked to take an assessment.</p>
          <div className={styles.disabledActions}>
            <button type="button" className="btn-outline-custom" onClick={handleChangeType} disabled={isLocked}>
              Change Assessment Type
            </button>
            {job?.status === "Drafted" && !isLocked && (
              <button type="button" className="btn-primary-custom" onClick={() => setShowPublishModal(true)} disabled={publishJobMutation.isPending}>
                <i className="bi bi-send me-2" />Publish Now
              </button>
            )}
          </div>
        </div>
      )}

      {mode === "ai-config" && (
        <div className={`hcard ${styles.aiConfigCard}`}>
          <div className={styles.aiConfigHeader}>
            <ChangeTypeButton onClick={handleChangeType} style={{ marginBottom: 20 }} />
            <div className={styles.aiConfigTitleRow}>
              <div className={styles.aiConfigIconWrap}>
                <i className={`bi bi-stars ${styles.aiConfigIcon}`} />
              </div>
              <div>
                <div className={styles.aiConfigTitle}>Configure Assessment</div>
                <div className={styles.aiConfigSubtitle}>Tell the AI what to test candidates on — it'll generate the questions for you.</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleGenerate} className={styles.aiConfigForm}>
            <div className="row g-4">
              <div className="col-md-6">
                <label className={`form-label fw-bold ${styles.fieldLabel}`}>
                  <i className={`bi bi-list-ol ${styles.fieldLabelIcon}`} />Question Count
                </label>
                <input type="number" min="1" max="100" className={`form-control ${styles.fieldInput}`}
                  value={generateConfig.questionCount}
                  onChange={(e) => setGenerateConfig({ ...generateConfig, questionCount: e.target.value })} />
                <div className={styles.fieldHint}>Between 1 and 100 questions.</div>
              </div>
              <div className="col-md-6">
                <label className={`form-label fw-bold ${styles.fieldLabel}`}>
                  <i className={`bi bi-bar-chart-steps ${styles.fieldLabelIcon}`} />Difficulty
                </label>
                <div className={styles.difficultyRow}>
                  {["Easy", "Medium", "Hard"].map((level) => {
                    const active = generateConfig.difficulty === level;
                    const colors = tagColors[level];
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setGenerateConfig({ ...generateConfig, difficulty: level })}
                        className={styles.difficultyBtn}
                        style={{
                          border: active ? `1.5px solid ${colors.color}` : "1.5px solid var(--border)",
                          background: active ? colors.bg : "#fff",
                          color: active ? colors.color : "var(--text-muted)",
                        }}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="col-md-6">
                <label className={`form-label fw-bold ${styles.fieldLabel}`}>
                  <i className={`bi bi-clock ${styles.fieldLabelIcon}`} />Duration (minutes) <span className={styles.requiredStar}>*</span>
                </label>
                <input type="number" min={MIN_ASSESSMENT_DURATION_MINUTES} max="240" required className={`form-control ${styles.fieldInput}`}
                  value={generateConfig.durationMinutes}
                  onChange={(e) => setGenerateConfig({ ...generateConfig, durationMinutes: e.target.value })} />
                <div className={styles.fieldHint}>How long candidates get once they start.</div>
              </div>
              <div className="col-md-6">
                <label className={`form-label fw-bold ${styles.fieldLabel}`}>
                  <i className={`bi bi-tags ${styles.fieldLabelIcon}`} />Topics
                </label>
                <input type="text" className={`form-control ${styles.fieldInput}`}
                  value={generateConfig.topics}
                  onChange={(e) => setGenerateConfig({ ...generateConfig, topics: e.target.value })} placeholder="React, JavaScript" />
                <div className={styles.fieldHint}>Comma separated. Leave blank to let AI choose based on the job.</div>
              </div>
            </div>

            <FieldError message={generateError} />

            <div className={styles.formFooterDivider}>
              <button type="submit" className={`btn-primary-custom ${styles.wideSubmitBtn}`} disabled={generateMut.isPending || isLocked}>
                {generateMut.isPending ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Generating...</> : <><i className="bi bi-magic me-2"></i>Generate Questions</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {mode === "manual-setup" && (
        <div className={`hcard ${styles.manualSetupCard}`}>
          <ChangeTypeButton onClick={handleChangeType} style={{ marginBottom: 20 }} />
          <div className={styles.manualSetupHeader}>
            <div className={styles.manualSetupIconWrap}>
              <i className={`bi bi-pencil-square ${styles.manualSetupIcon}`} />
            </div>
            <div>
              <div className={styles.manualSetupTitle}>Set Up Manual Assessment</div>
              <div className={styles.manualSetupSubtitle}>Before you start adding questions, set the time candidates will have to complete it.</div>
            </div>
          </div>

          <form onSubmit={handleConfirmManualSetup}>
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label fw-bold" style={{ fontSize: 13 }}>Duration (minutes) <span className={styles.requiredStar}>*</span></label>
                <input type="number" min={MIN_ASSESSMENT_DURATION_MINUTES} max="240" required className={`form-control ${styles.fieldInput}`}
                  value={manualDuration}
                  onChange={(e) => setManualDuration(e.target.value)} />
                <div className={styles.fieldHint} style={{ marginTop: 4 }}>How long candidates get to complete the assessment once they start it.</div>
              </div>
            </div>

            <FieldError message={manualSetupError} />

            <div className={styles.manualFormFooter}>
              <button type="submit" className={`btn-primary-custom ${styles.wideSubmitBtn}`} disabled={updateSettingsMut.isPending}>
                {updateSettingsMut.isPending ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Creating...</> : <><i className="bi bi-arrow-right me-2"></i>Continue</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {mode === "ai" && (
        <>
          <div className={styles.sectionHeaderRow}>
            <div>
              <span className="ai-badge mb-2 d-inline-flex"><i className="bi bi-stars" /> AI-Powered Assessment</span>
              <p className={styles.sectionSubtitle}>Review and refine the questions generated for this position.</p>
              <div className={styles.sectionMetaRow}>
                <ChangeTypeButton onClick={handleChangeType} disabled={isLocked} style={{ marginTop: 8 }} />
                <DurationBadge
                  assessment={assessment} isLocked={isLocked}
                  editing={editingDuration}
                  draft={durationDraft} setDraft={setDurationDraft}
                  onEditStart={() => { setDurationDraft(assessment?.durationMinutes || 30); setDurationEditError(null); setEditingDuration(true); }}
                  onSave={handleSaveDuration}
                  onCancel={() => { setEditingDuration(false); setDurationEditError(null); }}
                  saving={updateSettingsMut.isPending}
                  error={durationEditError}
                />
              </div>
            </div>
            {!isLocked && (
              <button type="button" className={`btn-outline-custom ${styles.regenerateBtn}`} onClick={handleRegenerateAssessment} disabled={regenerateAssMut.isPending}>
                <i className="bi bi-arrow-clockwise me-2" />{regenerateAssMut.isPending ? "Regenerating..." : "Regenerate All Questions"}
              </button>
            )}
          </div>

          <FieldError message={listActionError} />

          <QuestionList
            questions={questions}
            allowRegenerate
            onEdit={openEditQuestion}
            onDelete={handleDeleteQuestion}
            onRegenerate={handleRegenerateQuestion}
            regeneratingId={regenerateQuestionMut.isPending ? regenerateQuestionMut.variables?.questionId : null}
            isLocked={isLocked}
          />

          <div className={styles.publishRow}>
            {job?.status === "Drafted" && !isLocked && (
              <button type="button" className="btn-outline-custom" onClick={() => setShowPublishModal(true)} disabled={publishJobMutation.isPending}>
                <i className="bi bi-send me-2" />Publish Now
              </button>
            )}
          </div>
        </>
      )}

      {mode === "manual" && (
        <>
          <div className={styles.manualSectionWrap}>
            <span className={`ai-badge mb-2 d-inline-flex ${styles.manualBadge}`}>
              <i className="bi bi-pencil-square" /> Manual Assessment
            </span>
            <p className={styles.sectionSubtitle}>Write and manage your own questions for this position.</p>
            <div className={styles.sectionMetaRow}>
              <ChangeTypeButton onClick={handleChangeType} disabled={isLocked} style={{ marginTop: 8 }} />
              <DurationBadge
                assessment={assessment} isLocked={isLocked}
                editing={editingDuration}
                draft={durationDraft} setDraft={setDurationDraft}
                onEditStart={() => { setDurationDraft(assessment?.durationMinutes || 30); setDurationEditError(null); setEditingDuration(true); }}
                onSave={handleSaveDuration}
                onCancel={() => { setEditingDuration(false); setDurationEditError(null); }}
                saving={updateSettingsMut.isPending}
                  error={durationEditError}
              />
            </div>
          </div>

          <FieldError message={listActionError} />

          <QuestionList
            questions={questions}
            allowRegenerate={false}
            onEdit={openEditQuestion}
            onDelete={handleDeleteQuestion}
            isLocked={isLocked}
          />

          <button type="button" className={`btn-outline-custom w-100 mt-3 ${styles.addQuestionBtn}`} onClick={openAddQuestion} disabled={isLocked}>
            <i className="bi bi-plus me-2" />Add Question
          </button>

          <div className={styles.publishRow}>
            {job?.status === "Drafted" && !isLocked && (
              <button
                type="button"
                className="btn-outline-custom"
                onClick={() => {
                  if (questions.length === 0) {
                    toast.error("You must add at least one question before publishing.");
                    return;
                  }
                  setShowPublishModal(true);
                }}
                disabled={publishJobMutation.isPending || questions.length === 0}
              >
                <i className="bi bi-send me-2" />Publish Now
              </button>
            )}
          </div>
        </>
      )}

      {questionModalOpen && (
        <div className={`modal show d-block ${styles.modalOverlay}`} tabIndex="-1">
          <div className={`modal-dialog modal-dialog-centered ${styles.modalDialogMd}`}>
            <div className={`modal-content ${styles.modalContent}`}>
              <div className={`modal-header ${styles.questionModalHeader}`}>
                <h5 className={styles.questionModalTitle}>{editingQuestion ? "Edit Question" : "Add Question"}</h5>
                <button type="button" className="btn-close" onClick={() => setQuestionModalOpen(false)}></button>
              </div>
              <div className={`modal-body ${styles.questionModalBody}`}>
                <form id="questionForm" onSubmit={handleQuestionSave}>
                  <div className="mb-3">
                    <label className={`form-label fw-bold ${styles.smallFieldLabel}`}>Question</label>
                    <textarea name="question" className={`form-control ${styles.smallFormField}`} rows="2" required defaultValue={editingQuestion?.question || ""}></textarea>
                  </div>
                  {[1, 2, 3, 4].map((n) => (
                    <div className="mb-2" key={n}>
                      <label className={`form-label fw-bold ${styles.smallFieldLabel}`}>Option {n}</label>
                      <input name={`option${n}`} type="text" className={`form-control ${styles.smallFormField}`} required defaultValue={editingQuestion?.options?.[n - 1] || ""} />
                    </div>
                  ))}
                  <div className="mb-3">
                    <label className={`form-label fw-bold ${styles.smallFieldLabel}`}>Correct Answer (must match one option exactly)</label>
                    <input name="correctAnswer" type="text" className={`form-control ${styles.smallFormField}`} required defaultValue={editingQuestion?.correctAnswer || ""} />
                  </div>
                  <div className="mb-3">
                    <label className={`form-label fw-bold ${styles.smallFieldLabel}`}>Explanation</label>
                    <textarea name="explanation" className={`form-control ${styles.smallFormField}`} rows="2" defaultValue={editingQuestion?.explanation || ""}></textarea>
                  </div>
                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className={`form-label fw-bold ${styles.smallFieldLabel}`}>Topic</label>
                      <input name="topic" type="text" className={`form-control ${styles.smallFormField}`} defaultValue={editingQuestion?.topic || ""} />
                    </div>
                    <div className="col-6 mb-3">
                      <label className={`form-label fw-bold ${styles.smallFieldLabel}`}>Difficulty</label>
                      <select name="difficulty" className={`form-select ${styles.smallFormField}`} defaultValue={editingQuestion?.difficulty || "Medium"}>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>
                </form>
                <FieldError message={questionModalError} />
              </div>
              <div className={`modal-footer ${styles.questionModalFooter}`}>
                <button type="button" className="btn-outline-custom" onClick={() => setQuestionModalOpen(false)}>Cancel</button>
                <button type="submit" form="questionForm" className="btn-primary-custom" disabled={addQuestionMut.isPending || updateQuestionMut.isPending}>
                  {(addQuestionMut.isPending || updateQuestionMut.isPending) ? "Saving..." : "Save Question"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className={`modal show d-block ${styles.modalOverlay}`} tabIndex="-1">
          <div className={`modal-dialog modal-dialog-centered ${styles.modalDialogSm}`}>
            <div className={`modal-content ${styles.modalContent}`}>
              <div className={`modal-body ${styles.confirmModalBody}`}>
                <div className={`${styles.confirmIconWrap} ${styles.deleteIconWrap}`}>
                  <i className={`bi bi-trash ${styles.deleteIcon}`} />
                </div>
                <div className={styles.confirmTitle}>Delete this question?</div>
                <p className={styles.confirmDesc} style={{ marginBottom: 0 }}>This can't be undone.</p>
              </div>
              <div className={`modal-footer ${styles.confirmModalFooter}`}>
                <button type="button" className="btn-outline-custom" onClick={() => setDeleteConfirmId(null)} disabled={deletingQuestion}>
                  Cancel
                </button>
                <button type="button" className={`btn-primary-custom ${styles.deleteConfirmBtn}`} onClick={handleConfirmDelete} disabled={deletingQuestion}>
                  {deletingQuestion ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PublishConfirmModal
        show={showPublishModal}
        onCancel={() => setShowPublishModal(false)}
        onConfirm={() => publishJobMutation.mutate()}
        pending={publishJobMutation.isPending}
      />
    </>
  );
}

function QuestionList({ questions, allowRegenerate, onEdit, onDelete, onRegenerate, regeneratingId, isLocked }) {
  if (questions.length === 0) {
    return (
      <div className={`hcard ${styles.questionListEmpty}`}>
        No questions yet.
      </div>
    );
  }

  const questionTextClass = isLocked
    ? styles.questionTextLocked
    : (allowRegenerate ? styles.questionTextWithRegenerate : styles.questionTextDefault);

  const difficultyClass = {
    Easy: styles.difficultyEasy,
    Medium: styles.difficultyMedium,
    Hard: styles.difficultyHard,
  };

  return (
    <div className={styles.questionListWrap}>
      {questions.map((q, i) => (
        <div key={q._id} className={`hcard ${styles.questionCard}`}>
          {!isLocked && (
            <div className={styles.questionCardActions}>
              {allowRegenerate && (
                <button onClick={() => onRegenerate(q._id)} className="btn btn-sm btn-light" title="Regenerate via AI" disabled={regeneratingId === q._id}>
                  <i className={`bi ${regeneratingId === q._id ? "bi-hourglass-split" : "bi-arrow-clockwise"}`}></i>
                </button>
              )}
              <button onClick={() => onEdit(q)} className="btn btn-sm btn-light" title="Edit"><i className="bi bi-pencil"></i></button>
              <button onClick={() => onDelete(q._id)} className="btn btn-sm btn-light" title="Delete"><i className="bi bi-trash text-danger"></i></button>
            </div>
          )}
          <div className={styles.questionNumber}>Question {String(i + 1).padStart(2, "0")}</div>
          <p className={`${styles.questionText} ${questionTextClass}`}>{q.question}</p>
          {q.options?.length > 0 && (
            <ul className={styles.optionsList}>
              {q.options.map((opt) => (
                <li key={opt} className={opt === q.correctAnswer ? styles.optionCorrect : styles.optionDefault}>
                  {opt}{opt === q.correctAnswer && " ✓"}
                </li>
              ))}
            </ul>
          )}
          <div className={styles.tagsRow}>
            {q.topic && (
              <span className={`${styles.tag} ${styles.topicTag}`}>{q.topic}</span>
            )}
            <span className={`${styles.tag} ${difficultyClass[q.difficulty] || styles.difficultyDefault}`}>
              {q.difficulty}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}