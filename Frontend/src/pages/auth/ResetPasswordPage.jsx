import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Formik, Form, ErrorMessage } from "formik";
import * as yup from "yup";
import toast from "react-hot-toast";
import AuthHeroPanel from "../../components/auth/AuthHeroPanel";
import AuthPasswordField from "../../components/auth/AuthPasswordField";
import BrandLogo from "../../components/common/BrandLogo";
import BackButton from "../../components/common/BackButton";
import * as authService from "../../services/authService";
import styles from "./ResetPasswordPage.module.css";

const schema = yup.object({
  newPassword: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("New password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords do not match")
    .required("Please confirm your password"),
});

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const userId = searchParams.get("userId");

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isLinkValid = Boolean(token && userId);

  const handleSubmit = async (values, { setSubmitting }) => {
    const toastId = toast.loading("Resetting password...");

    try {
      const result = await authService.confirmForgotPassword({
        token,
        newPassword: values.newPassword,
      });
      toast.success(result.message || "Password reset successfully.", { id: toastId });
      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: { message: "Password reset successfully. Please log in with your new password." },
        });
      }, 1500);
    } catch (error) {
      toast.error(error.message || "Failed to reset password. Please try again.", { id: toastId });
      setSubmitting(false);
    }
  };

  return (
    <>
      <AuthHeroPanel />

      <div className="auth-right">
        <div className="auth-form">
          <BackButton fallbackTo="/login" label="Back to Login" className="mb-4" />
          <div className="mb-3">
            <BrandLogo size="sm" linkTo="/" />
          </div>
          <h1 className={styles.title}>Reset password</h1>
          <p className={styles.subtitle}>
            Choose a new password for your account.
          </p>

          {!isLinkValid ? (
            <div>
              <div className={styles.invalidLinkBanner}>
                This reset link is invalid or incomplete. Please request a new one.
              </div>
              <Link to="/login" className={`btn-primary-custom ${styles.invalidLinkAction}`}>
                Back to Login
              </Link>
            </div>
          ) : (
            <Formik
              initialValues={{ newPassword: "", confirmPassword: "" }}
              validationSchema={schema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form>
                  <AuthPasswordField
                    id="reset-new-password"
                    name="newPassword"
                    label="New Password"
                    show={showNew}
                    onToggle={() => setShowNew((value) => !value)}
                  />
                  <ErrorMessage name="newPassword">
                    {(msg) => (
                      <p className={styles.fieldError}>{msg}</p>
                    )}
                  </ErrorMessage>

                  <AuthPasswordField
                    id="reset-confirm-password"
                    name="confirmPassword"
                    label="Confirm Password"
                    show={showConfirm}
                    onToggle={() => setShowConfirm((value) => !value)}
                  />
                  <ErrorMessage name="confirmPassword">
                    {(msg) => (
                      <p className={styles.fieldError}>{msg}</p>
                    )}
                  </ErrorMessage>

                  <button
                    type="submit"
                    className={`btn-primary-custom w-100 mb-3 ${styles.submitBtn}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Resetting..." : "Reset Password"}
                  </button>
                </Form>
              )}
            </Formik>
          )}

          <div className={styles.footerNote}>
            Remember your password?{" "}
            <Link to="/login" className={styles.footerLink}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}