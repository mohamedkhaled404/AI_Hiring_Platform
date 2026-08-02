import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../context/useAuth";
import * as authService from "../../services/authService";
import { deleteUser } from "../../services/userService";
import BackButton from "../../components/common/BackButton";
import toast from "react-hot-toast";
import styles from "./SettingsPage.module.css";

const passwordSchema = yup.object({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .notOneOf([yup.ref("currentPassword")], "New password must be different")
    .required("New password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords do not match")
    .required("Please confirm your new password"),
});

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isRecruiter = user?.role === "recruiter";
  const isAdmin = user?.role === "admin";
  const dashboardPath = isAdmin
    ? "/admin/dashboard"
    : isRecruiter
      ? "/recruiter/dashboard"
      : "/candidate/dashboard";
  const profilePath = isRecruiter ? "/recruiter/profile/edit" : "/candidate/profile/edit";

  const { mutate, isPending, isError, error, reset } = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: (result) => {
      setSuccessMessage(result.message || "Password updated successfully.");
      reset();
    },
  });

  const {
    mutate: mutateDelete,
    isPending: isDeleting,
    isError: isDeleteError,
    error: deleteError,
  } = useMutation({
    mutationFn: () => deleteUser(user.id),
    onSuccess: async () => {
      toast.success("Your account has been deleted.");
      await logout();
      navigate("/login", { replace: true });
    },
  });

  const handleDeleteAccount = () => {
    if (!user?.id) {
      toast.error("Unable to delete account. Please sign in again.");
      return;
    }
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    mutateDelete();
  };

  return (
    <>
     <BackButton forceTo={dashboardPath} label="Back to Dashboard" />
      <div className="page-header-row">
        <div>
          <h1>Settings</h1>
          <p className={styles.subtitle}>
            Manage your account and security preferences.
          </p>
        </div>
      </div>

      <div className={styles.stack}>
        <div className={styles.topGrid}>
          {/* Account */}
          <div className={`hcard ${styles.card}`}>
            <h2 className={styles.cardTitle}>Account</h2>
            <div className={styles.infoGrid}>
              <div>
                <div className={styles.infoLabel}>Name</div>
                <div className={styles.infoValue}>{user?.name || "—"}</div>
              </div>
              <div>
                <div className={styles.infoLabel}>Email</div>
                <div className={styles.infoValue}>{user?.email || "—"}</div>
              </div>
              <div>
                <div className={styles.infoLabel}>Role</div>
                <div className={styles["infoValue--capitalize"]}>{user?.role || "—"}</div>
              </div>
            </div>
            <Link
              to={profilePath}
              className={`btn-primary-custom ${styles.editProfileBtn}`}
            >
              <i className="bi bi-pencil me-2" />
              Edit Profile
            </Link>
          </div>

          {/* Security */}
          <div className={`hcard ${styles.card}`}>
            <h2 className={styles.cardTitleSm}>Change Password</h2>
            <p className={styles.cardText}>
              Update your password. You will stay signed in on this device.
            </p>

            {successMessage && (
              <div className={`${styles.banner} ${styles["banner--success"]}`}>
                {successMessage}
              </div>
            )}

            {isError && (
              <div className={`${styles.banner} ${styles["banner--error"]}`}>
                {error?.message || "Failed to update password."}
              </div>
            )}

            <Formik
              initialValues={{ currentPassword: "", newPassword: "", confirmPassword: "" }}
              validationSchema={passwordSchema}
              onSubmit={(values, { resetForm }) => {
                setSuccessMessage("");
                mutate(
                  { currentPassword: values.currentPassword, newPassword: values.newPassword },
                  { onSuccess: () => resetForm() }
                );
              }}
            >
              {() => (
                <Form className={styles.form}>
                  {[
                    { name: "currentPassword", label: "Current password", show: showCurrent, toggle: () => setShowCurrent((v) => !v) },
                    { name: "newPassword", label: "New password", show: showNew, toggle: () => setShowNew((v) => !v) },
                    { name: "confirmPassword", label: "Confirm new password", show: showConfirm, toggle: () => setShowConfirm((v) => !v) },
                  ].map(({ name, label, show, toggle }) => (
                    <div key={name}>
                      <label htmlFor={name} className={styles.fieldLabel}>
                        {label}
                      </label>
                      <div className={styles.fieldWrap}>
                        <Field
                          id={name}
                          name={name}
                          type={show ? "text" : "password"}
                          className="form-control"
                          autoComplete={name === "currentPassword" ? "current-password" : "new-password"}
                        />
                        <button
                          type="button"
                          onClick={toggle}
                          className={`border-0 bg-transparent ${styles.toggleBtn}`}
                          aria-label={show ? "Hide password" : "Show password"}
                        >
                          <i className={`bi ${show ? "bi-eye-slash" : "bi-eye"}`} />
                        </button>
                      </div>
                      <ErrorMessage name={name} component="div" className={styles.fieldError} />
                    </div>
                  ))}

                  <button type="submit" className={`btn-primary-custom ${styles.submitBtn}`} disabled={isPending}>
                    {isPending ? "Updating..." : "Update Password"}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>

        {/* Danger zone — not available for admin accounts */}
        {!isAdmin && (
          <div className={`hcard ${styles.dangerCard}`}>
            <h2 className={styles.dangerTitle}>Delete Account</h2>
            <p className={styles.cardText}>
              Permanently delete your account and associated data. This action cannot be undone.
            </p>

            {isDeleteError && (
              <div className={`${styles.banner} ${styles["banner--error"]}`}>
                {deleteError?.message || "Failed to delete account."}
              </div>
            )}

            {confirmDelete && (
              <div className={styles["banner--confirm"]}>
                Click <strong>Confirm Delete</strong> to permanently remove your account.
              </div>
            )}

            <div className={styles.dangerActions}>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting
                  ? "Deleting..."
                  : confirmDelete
                    ? "Confirm Delete"
                    : "Delete Account"}
              </button>
              {confirmDelete && !isDeleting && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}