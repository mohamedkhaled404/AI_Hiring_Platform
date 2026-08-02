import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import AuthLayout from "../layouts/AuthLayout";
import CandidateLayout from "../layouts/CandidateLayout";
import RecruiterLayout from "../layouts/RecruiterLayout";
import AdminLayout from "../layouts/AdminLayout";
import StandaloneLayout from "../layouts/StandaloneLayout";
import ProtectedRoute from "./ProtectedRoute";
import GuestRoute from "./GuestRoute";
import LoadingState from "../components/common/LoadingState";

const LandingPage = lazy(() => import("../pages/public/LandingPage"));
const AboutPage = lazy(() => import("../pages/public/AboutPage"));
const PrivacyPolicyPage = lazy(() => import("../pages/public/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("../pages/public/TermsOfServicePage"));
const NotFoundPage = lazy(() => import("../pages/public/NotFoundPage"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("../pages/auth/VerifyEmailPage"));

const CandidateDashboard = lazy(() => import("../pages/candidate/CandidateDashboard"));
const BrowseJobsPage = lazy(() => import("../pages/candidate/BrowseJobsPage"));
const SavedJobsPage = lazy(() => import("../pages/candidate/SavedJobsPage"));
const JobDetailsPage = lazy(() => import("../pages/recruiter/JobDetailsPage"));
const JobDetailPage = lazy(() => import("../pages/candidate/JobDetailPage"));
const ApplyJobPage = lazy(() => import("../pages/candidate/ApplyJobPage"));
const MyApplicationsPage = lazy(() => import("../pages/candidate/MyApplicationsPage"));
const ApplicationDetailPage = lazy(() => import("../pages/candidate/ApplicationDetailPage"));
const AssessmentPage = lazy(() => import("../pages/candidate/AssessmentPage"));
const ChatPage = lazy(() => import("../pages/candidate/ChatPage"));
const AIFeedbackPage = lazy(() => import("../pages/candidate/AIFeedbackPage"));
const CandidateProfilePage = lazy(() => import("../pages/candidate/CandidateProfilePage"));
const CandidateEditProfilePage = lazy(() => import("../pages/candidate/CandidateEditProfilePage"));
const CompleteProfilePage = lazy(() => import("../pages/candidate/CompleteProfilePage"));
const ApplicationSubmittedPage = lazy(() => import("../pages/candidate/ApplicationSubmittedPage"));

const RecruiterDashboard = lazy(() => import("../pages/recruiter/RecruiterDashboard"));
const MyJobsPage = lazy(() => import("../pages/recruiter/MyJobsPage"));
const PostJobPage = lazy(() => import("../pages/recruiter/PostJobPage"));
const EditJobPage = lazy(() => import("../pages/recruiter/EditJobPage"));
const ApplicantsListPage = lazy(() => import("../pages/recruiter/ApplicantsListPage"));
const CandidateReviewPage = lazy(() => import("../pages/recruiter/CandidateReviewPage"));
// const TopCandidatesPage = lazy(() => import("../pages/recruiter/TopCandidatesPage"));
const RecruiterFeedbackPage = lazy(() => import("../pages/recruiter/RecruiterFeedbackPage"));
const AssessmentGeneratorPage = lazy(() => import("../pages/recruiter/AssessmentGeneratorPage"));
const AIRecommendationPage = lazy(() => import("../pages/recruiter/AIRecommendationPage"));
// const EmailInvitationsPage = lazy(() => import("../pages/recruiter/EmailInvitationsPage"));
const RecruiterProfilePage = lazy(() => import("../pages/recruiter/RecruiterProfilePage"));
const RecruiterEditProfilePage = lazy(() => import("../pages/recruiter/RecruiterEditProfilePage"));
const SettingsPage = lazy(() => import("../pages/settings/SettingsPage"));

const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const CategoryManagementPage = lazy(() => import("../pages/admin/CategoryManagementPage"));
const JobManagementPage = lazy(() => import("../pages/admin/JobManagementPage"));
const UserManagementPage = lazy(() => import("../pages/admin/UserManagementPage"));

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="privacy" element={<PrivacyPolicyPage />} />
        <Route path="terms" element={<TermsOfServicePage />} />
      </Route>

      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["candidate", "recruiter"]} />}>
        <Route element={<StandaloneLayout />}>
          <Route path="candidate/profile/complete" element={<CompleteProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["candidate"]} />}>
        <Route element={<StandaloneLayout />}>
          <Route path="candidate/application-submitted" element={<ApplicationSubmittedPage />} />
        </Route>

        <Route
          path="candidate/jobs/:jobId/assessment"
          element={
            <Suspense fallback={<LoadingState message="Loading page..." />}>
              <AssessmentPage />
            </Suspense>
          }
        />
        <Route
          path="candidate/chat"
          element={
            <Suspense fallback={<LoadingState message="Loading page..." />}>
              <ChatPage />
            </Suspense>
          }
        />

        <Route path="candidate" element={<CandidateLayout />}>
          <Route path="dashboard" element={<CandidateDashboard />} />
          <Route path="jobs" element={<BrowseJobsPage />} />
          <Route path="jobs/saved" element={<SavedJobsPage />} />
          <Route path="job/:jobId" element={<JobDetailsPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="jobs/:id/apply" element={<ApplyJobPage />} />
          <Route path="applications" element={<MyApplicationsPage />} />
          <Route path="applications/:id" element={<ApplicationDetailPage />} />
          <Route path="profile" element={<CandidateProfilePage />} />
          <Route path="profile/edit" element={<CandidateEditProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="feedback" element={<AIFeedbackPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["recruiter"]} />}>
        <Route path="recruiter" element={<RecruiterLayout />}>
          <Route path="dashboard" element={<RecruiterDashboard />} />
          <Route path="jobs/new" element={<PostJobPage />} />
          <Route path="jobs/edit/:id" element={<EditJobPage />} />
          <Route path="jobs" element={<MyJobsPage />} />
          <Route path="jobs/:id/view" element={<JobDetailsPage />} />
          <Route path="job/:jobId" element={<JobDetailsPage />} />
          <Route path="applications" element={<ApplicantsListPage />} />
          <Route path="candidates/:id" element={<CandidateReviewPage />} />
          {/* <Route path="top-candidates" element={<TopCandidatesPage />} /> */}
          <Route path="feedback/:jobId/:applicationId" element={<RecruiterFeedbackPage />} />
          <Route path="feedback" element={<RecruiterFeedbackPage />} />
          <Route path="jobs/:jobId/assessment" element={<AssessmentGeneratorPage />} />
          <Route path="assessment-generator" element={<AssessmentGeneratorPage />} />
          <Route path="ai-recommendation" element={<AIRecommendationPage />} />
          <Route path="profile" element={<RecruiterProfilePage />} />
          <Route path="profile/edit" element={<RecruiterEditProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* <Route path="email-invitations" element={<EmailInvitationsPage />} /> */}
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="categories" element={<CategoryManagementPage />} />
          <Route path="jobs" element={<JobManagementPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Suspense fallback={<LoadingState message="Loading page..." />}>
            <NotFoundPage />
          </Suspense>
        }
      />
    </Routes>
  );
}