import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as yup from "yup";
import * as authService from "../../services/authService";
import AuthHeroPanel from "../../components/auth/AuthHeroPanel";
import BrandLogo from "../../components/common/BrandLogo";
import BackButton from "../../components/common/BackButton";
import styles from "./VerifyEmailPage.module.css";

const emailSchema = yup.object({
  email: yup.string().email("Enter a valid email").required("Email is required"),
});

const COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const registeredEmail = location.state?.email || "";
  const [email, setEmail] = useState(registeredEmail);
  const [showEmailInput, setShowEmailInput] = useState(!registeredEmail);
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);

  const startCooldown = useCallback(() => {
    setCooldown(COOLDOWN_SECONDS);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleResend = async (resendEmail) => {
    if (!resendEmail) return;
    setSending(true);
    try {
      const result = await authService.resendVerification({ email: resendEmail });
      toast.success(result.message || "Verification email sent. Please check your inbox.", { duration: 5000 });
      startCooldown();
    } catch (error) {
      toast.error(error.message || "Failed to resend verification email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <AuthHeroPanel />
      <div className="auth-right">
        <div className="auth-form">
          <BackButton forceTo="/" label="Back to Home" className="mb-4" />
          <div className="mb-3">
            <BrandLogo size="sm" linkTo="/" />
          </div>

          <div className={styles.heroSection}>
            <div className={styles.iconCircle}>
              <i className="bi bi-envelope-check" />
            </div>
            <h1 className={styles.title}>Verify your email</h1>
            <p className={styles.sentToLabel}>
              We sent a verification email to:
            </p>
            {email && (
              <p className={styles.sentToEmail}>{email}</p>
            )}
          </div>

          {showEmailInput && (
            <div className={styles.resendSection}>
              <p className={styles.resendHint}>
                Enter your email address to receive a new verification link.
              </p>
              <Formik
                initialValues={{ email: "" }}
                validationSchema={emailSchema}
                onSubmit={(values) => {
                  setEmail(values.email);
                  setShowEmailInput(false);
                  handleResend(values.email);
                }}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className={styles.emailFieldWrap}>
                      <Field
                        id="verify-email-input"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        className="form-control"
                        autoComplete="email"
                      />
                      <ErrorMessage name="email">
                        {(msg) => (
                          <p className={styles.fieldError}>{msg}</p>
                        )}
                      </ErrorMessage>
                    </div>
                    <button type="submit" className="btn-primary-custom w-100" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : "Send Verification Email"}
                    </button>
                  </Form>
                )}
              </Formik>
            </div>
          )}

          {!showEmailInput && (
            <div className={styles.resendActions}>
              <p className={styles.resendActionsHint}>
                Didn&apos;t receive the email? Check your spam folder or resend below.
              </p>
              <button
                type="button"
                className="btn-primary-custom w-100 mb-3"
                disabled={cooldown > 0 || sending}
                onClick={() => handleResend(email)}
              >
                {sending
                  ? "Sending..."
                  : cooldown > 0
                    ? `Resend available in ${cooldown}s`
                    : "Resend Verification Email"}
              </button>
            </div>
          )}

          <div className={styles.footerNote}>
            Already verified?{" "}
            <Link
              to="/login"
              className={styles.footerLink}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}