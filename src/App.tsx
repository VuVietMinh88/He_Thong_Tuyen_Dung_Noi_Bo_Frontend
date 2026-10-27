import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import ToastProvider from "./components/notifications/ToastProvider";
import LoginPage from "./pages/Login/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPassword/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPassword/ResetPasswordPage";
import AccountActivationPage from "./pages/AccountActivation/AccountActivationPage";
import ChangePasswordPage from "./pages/ChangePassword/ChangePasswordPage";
import AccountListPage from "./pages/AccountList/AccountListPage";
import EditAccountPage from "./pages/AccountList/EditAccountPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import RecruitmentPage from "./pages/Recruitment/RecruitmentPage";
import RecruitmentAdminPage from "./pages/Recruitment/RecruitmentAdminPage";
import ImportExcelUI from "./components/Recruitment/ImportExcelUI";
import UnauthorizedPage from "./pages/error/UnauthorizedPage";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import PermissionProvider from "./components/routes/PermissionProvider";
import SessionDraftRestorer from "./components/routes/SessionDraftRestorer";
import MainLayout from "./components/layout/MainLayout";
import { getHealth, type HealthResponse } from "./services/healthService";
import { ROLES, type Role } from "./constants/roles";
import JobTitlesPage from "./pages/JobTitle/JobTitlesPage";
import DepartmentPage from "./pages/Department/DepartmentPage";
import DepartmentPositionProgress from "./pages/Department/DepartmentPositionProgress";
import MasterDataManagement from "./pages/MasterData/MasterDataManagement";
import HeadcountBudgetManagement from "./pages/Headcount/HeadcountBudgetManagement";
import JobPostingForm from "./components/JobPosting/JobPostingForm";
import JobPostingPreviewApproval from "./components/JobPosting/JobPostingPreviewApproval";
import PublicJobListPage from "./pages/CareerPage/PublicJobListPage";
import PublicJobDetailPage from "./pages/CareerPage/PublicJobDetailPage";
import PublicJobApplyPage from "./pages/CareerPage/PublicJobApplyPage";
import ApplicationLookupPage from "./pages/CareerPage/ApplicationLookupPage";
import CompanyLandingPage from "./pages/Company/CompanyLandingPage";
import InternalReferralPage from "./pages/Referral/InternalReferralPage";
import JobPostingManagementPage from "./pages/Recruitment/JobPostingManagementPage";
import CandidateManagementPage from "./pages/Candidate/CandidateManagementPage";
import UnifiedCandidateProfilePage from "./pages/Candidate/UnifiedCandidateProfilePage";
import CandidateEvaluationSummaryPage from "./pages/Candidate/CandidateEvaluationSummaryPage";
import SlaSettingsPage from "./pages/SLA/SlaSettingsPage";
import PersonalInterviewSchedulePage from "./pages/Interview/PersonalInterviewSchedulePage";
import InterviewerCalendarPage from "./pages/Interview/InterviewerCalendarPage";
import OnboardingChecklistPage from "./pages/Onboarding/OnboardingChecklistPage";
import OnboardingTrackingPage from "./pages/Onboarding/OnboardingTrackingPage";
import RecruitmentFunnelPage from "./pages/RecruitmentFunnel/RecruitmentFunnelPage";
import CandidateSourceReportPage from "./pages/CandidateSourceReport/CandidateSourceReportPage";
import OfferApprovalPage from "./pages/Offer/OfferApprovalPage";
import NotificationSettingsPage from "./pages/Settings/NotificationSettingsPage";
import EmailTemplateManagementPage from "./pages/Settings/EmailTemplateManagementPage";
import EmailAuditLogPage from "./pages/Candidate/EmailAuditLogPage";
import DashboardOverview from "./pages/Dashboard/DashboardOverview";
import AdminDashboardPage from "./pages/Dashboard/AdminDashboardPage";
import RecruitmentTimeCostReportPage from "./pages/Reports/RecruitmentTimeCostReportPage";
import NotFoundPage from "./pages/error/NotFoundPage";

const ALL_ROLES = Object.values(ROLES) as Role[];


function HealthCheck() {
  const [status, setStatus] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    getHealth()
      .then((response) => {
        if (isCurrent) setStatus(response);
      })
      .catch((requestError: unknown) => {
        if (isCurrent) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Lỗi kết nối tới server/database",
          );
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  if (error) {
    return (
      <div style={{ fontFamily: "monospace", padding: "20px", color: "red" }}>
        {JSON.stringify({ status: "error", message: error }, null, 2)}
      </div>
    );
  }

  if (!status) {
    return (
      <div style={{ fontFamily: "monospace", padding: "20px" }}>
        Checking connection...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "monospace", padding: "20px", color: "green" }}>
      {JSON.stringify({ status: "connected", backend_data: status }, null, 2)}
    </div>
  );
}



import { autoRefreshService } from "./services/autoRefresh.service";
import { authSyncService } from "./services/authSync.service";
import { tokenService } from "./services/token.service";
import { AUTH_ROUTES, AUTH_SYNC_EVENTS } from "./constants/auth.constants";

function AuthSessionManager() {
  const navigate = useNavigate();

  useEffect(() => {
    autoRefreshService.start();

    const unsubscribe = authSyncService.subscribe((message) => {
      if (message.type === AUTH_SYNC_EVENTS.LOGOUT) {
        tokenService.clearAll();
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new Event('auth:changed'));
        }
        navigate(AUTH_ROUTES.LOGIN, { replace: true });
      } else if (message.type === AUTH_SYNC_EVENTS.SESSION_EXPIRED) {
        const redirectParam = message.payload?.redirectUrl
          ? `&redirect_url=${encodeURIComponent(message.payload.redirectUrl)}`
          : '';
        navigate(`${AUTH_ROUTES.LOGIN}?sessionExpired=1${redirectParam}`, { replace: true });
      }
    });

    return () => {
      autoRefreshService.stop();
      unsubscribe();
    };
  }, [navigate]);

  return null;
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <PermissionProvider>
          <AuthSessionManager />
          <SessionDraftRestorer />
          <Routes>
            <Route path="/" element={<CompanyLandingPage />} />
            <Route path="/company" element={<CompanyLandingPage />} />
            <Route path="/about" element={<CompanyLandingPage />} />
            <Route path="/careers" element={<PublicJobListPage />} />
            <Route path="/careers/jobs" element={<PublicJobListPage />} />
            <Route path="/careers/jobs/:id" element={<PublicJobDetailPage />} />
            <Route path="/careers/jobs/:id/apply" element={<PublicJobApplyPage />} />
            <Route path="/careers/applications/lookup" element={<ApplicationLookupPage />} />
            <Route path="/jobs/:id" element={<PublicJobDetailPage />} />
            <Route path="/jobs/:id/apply" element={<PublicJobApplyPage />} />
            <Route path="/public-jobs" element={<PublicJobListPage />} />
            <Route path="/public-jobs/:id" element={<PublicJobDetailPage />} />
            <Route path="/public-jobs/:id/apply" element={<PublicJobApplyPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/health" element={<HealthCheck />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/activate-account" element={<AccountActivationPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
              <Route
                path="/dashboard"
                element={
                  <MainLayout>
                    <DashboardOverview />
                  </MainLayout>
                }
              />
              <Route
                path="/reports/funnel"
                element={
                  <MainLayout>
                    <RecruitmentFunnelPage />
                  </MainLayout>
                }
              />
              <Route
                path="/dashboard/funnel"
                element={
                  <MainLayout>
                    <RecruitmentFunnelPage />
                  </MainLayout>
                }
              />
              <Route
                path="/reports/sources"
                element={
                  <MainLayout>
                    <CandidateSourceReportPage />
                  </MainLayout>
                }
              />
              <Route
                path="/dashboard/sources"
                element={
                  <MainLayout>
                    <CandidateSourceReportPage />
                  </MainLayout>
                }
              />
              <Route
                path="/reports/time-cost"
                element={
                  <MainLayout>
                    <RecruitmentTimeCostReportPage />
                  </MainLayout>
                }
              />
              <Route
                path="/dashboard/time-cost"
                element={
                  <MainLayout>
                    <RecruitmentTimeCostReportPage />
                  </MainLayout>
                }
              />
              <Route
                path="/recruitment-time-cost-report"
                element={
                  <MainLayout>
                    <RecruitmentTimeCostReportPage />
                  </MainLayout>
                }
              />
              <Route
                path="/referrals"
                element={
                  <MainLayout>
                    <InternalReferralPage />
                  </MainLayout>
                }
              />
              <Route
                path="/settings/notifications"
                element={
                  <MainLayout>
                    <NotificationSettingsPage />
                  </MainLayout>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <MainLayout>
                    <AdminDashboardPage />
                  </MainLayout>
                }
              />

            </Route>

            <Route
              element={
                <ProtectedRoute requiredPermissions={["SELF_PROFILE_READ"]} />
              }
            >
              <Route
                path="/profile"
                element={
                  <MainLayout>
                    <ProfilePage />
                  </MainLayout>
                }
              />
            </Route>
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[ROLES.HIRING_MANAGER]}
                  requiredPermissions={["REQUISITIONS_READ_SCOPED"]}
                />
              }
            >
              <Route
                path="/department/positions/progress"
                element={
                  <MainLayout>
                    <DepartmentPositionProgress />
                  </MainLayout>
                }
              />
            </Route>
            <Route
              element={
                <ProtectedRoute requiredPermissions={["SELF_SECURITY_WRITE"]} />
              }
            >
              <Route
                path="/change-password"
                element={
                  <MainLayout>
                    <ChangePasswordPage />
                  </MainLayout>
                }
              />
            </Route>

            <Route
              element={
                <ProtectedRoute requiredPermissions={["USER_ADMIN_READ_ALL"]} />
              }
            >
              <Route
                path="/users"
                element={
                  <MainLayout>
                    <AccountListPage />
                  </MainLayout>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <MainLayout>
                    <AccountListPage />
                  </MainLayout>
                }
              />
              <Route
                path="/users/:id/edit"
                element={
                  <MainLayout>
                    <EditAccountPage />
                  </MainLayout>
                }
              />
              <Route
                path="/admin/users/:id/edit"
                element={
                  <MainLayout>
                    <EditAccountPage />
                  </MainLayout>
                }
              />
              <Route
                path="/users/import"
                element={
                  <MainLayout>
                    <ImportExcelUI />
                  </MainLayout>
                }
              />
              <Route
                path="/admin/users/import"
                element={
                  <MainLayout>
                    <ImportExcelUI />
                  </MainLayout>
                }
              />
            </Route>

            <Route element={<ProtectedRoute requiredPermissions={["JOB_POSTINGS_READ_ALL", "JOB_POSTINGS_READ_SCOPED"]} />}>
              <Route
                path="/job-postings"
                element={
                  <MainLayout>
                    <JobPostingManagementPage />
                  </MainLayout>
                }
              />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  requiredPermissions={[
                    "REQUISITIONS_READ_ALL",
                    "REQUISITIONS_READ_SCOPED",
                  ]}
                />
              }
            >
              <Route
                path="/jobs"
                element={
                  <MainLayout>
                    <RecruitmentPage />
                  </MainLayout>
                }
              />
              <Route
                path="/jobs/create"
                element={
                  <MainLayout>
                    <JobPostingForm />
                  </MainLayout>
                }
              />
              <Route
                path="/job-postings/create"
                element={
                  <MainLayout>
                    <JobPostingForm />
                  </MainLayout>
                }
              />
              <Route
                path="/job-postings/:id/review"
                element={
                  <MainLayout>
                    <JobPostingPreviewApproval />
                  </MainLayout>
                }
              />
              <Route
                path="/job-postings/review"
                element={
                  <MainLayout>
                    <JobPostingPreviewApproval />
                  </MainLayout>
                }
              />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  requiredPermissions={["ORGANIZATION_READ_ALL"]}
                />
              }
            >
              <Route
                path="/settings/departments"
                element={
                  <MainLayout>
                    <DepartmentPage />
                  </MainLayout>
                }
              />
              <Route
                path="/settings/positions"
                element={
                  <MainLayout>
                    <JobTitlesPage />
                  </MainLayout>
                }
              />
              <Route
                path="/settings/competency-frameworks"
                element={
                  <MainLayout>
                    <RecruitmentAdminPage mode="frameworks" />
                  </MainLayout>
                }
              />
              <Route
                path="/settings/interview-questions"
                element={
                  <MainLayout>
                    <RecruitmentAdminPage mode="questions" />
                  </MainLayout>
                }
              />
              <Route
                path="/settings/recruitment-catalogs"
                element={
                  <MainLayout>
                    <RecruitmentAdminPage mode="catalogs" />
                  </MainLayout>
                }
              />
              <Route
                path="/settings/master-data"
                element={
                  <MainLayout>
                    <MasterDataManagement />
                  </MainLayout>
                }
              />
              <Route
                path="/settings/sla"
                element={
                  <MainLayout>
                    <SlaSettingsPage />
                  </MainLayout>
                }
              />
              <Route
                path="/settings/email-templates"
                element={
                  <MainLayout>
                    <EmailTemplateManagementPage />
                  </MainLayout>
                }
              />
              <Route
                path="/onboarding/checklist-templates"
                element={
                  <MainLayout>
                    <OnboardingChecklistPage />
                  </MainLayout>
                }
              />
              <Route
                path="/onboarding/tracking"
                element={
                  <MainLayout>
                    <OnboardingTrackingPage />
                  </MainLayout>
                }
              />
              <Route
                path="/onboarding/tracking/:id"
                element={
                  <MainLayout>
                    <OnboardingTrackingPage />
                  </MainLayout>
                }
              />
              <Route
                path="/headcount-budget"
                element={
                  <MainLayout>
                    <HeadcountBudgetManagement />
                  </MainLayout>
                }
              />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  requiredPermissions={[
                    "CANDIDATES_READ_ALL",
                    "CANDIDATES_READ_SCOPED",
                  ]}
                />
              }
            >
              <Route
                path="/candidates"
                element={
                  <MainLayout>
                    <CandidateManagementPage />
                  </MainLayout>
                }
              />
              <Route
                path="/candidates/:id"
                element={
                  <MainLayout>
                    <UnifiedCandidateProfilePage />
                  </MainLayout>
                }
              />
              <Route
                path="/candidates/:id/evaluation-summary"
                element={
                  <MainLayout>
                    <CandidateEvaluationSummaryPage />
                  </MainLayout>
                }
              />
              <Route
                path="/candidates/email-audit-logs"
                element={
                  <MainLayout>
                    <EmailAuditLogPage />
                  </MainLayout>
                }
              />
              <Route
                path="/email-audit-logs"
                element={
                  <MainLayout>
                    <EmailAuditLogPage />
                  </MainLayout>
                }
              />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  requiredPermissions={[
                    "INTERVIEWS_READ_ALL",
                    "INTERVIEWS_READ_SCOPED",
                  ]}
                />
              }
            >
              <Route
                path="/interviews"
                element={
                  <MainLayout>
                    <PersonalInterviewSchedulePage />
                  </MainLayout>
                }
              />
              <Route
                path="/interviews/calendar"
                element={
                  <MainLayout>
                    <InterviewerCalendarPage />
                  </MainLayout>
                }
              />
              <Route
                path="/interviewer/calendar"
                element={
                  <MainLayout>
                    <InterviewerCalendarPage />
                  </MainLayout>
                }
              />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    ROLES.ADMIN,
                    ROLES.HR_MANAGER,
                    ROLES.HIRING_MANAGER,
                    ROLES.APPROVER,
                    ROLES.RECRUITER,
                  ]}
                />
              }
            >
              <Route
                path="/offers/:id/approval"
                element={
                  <MainLayout>
                    <OfferApprovalPage />
                  </MainLayout>
                }
              />
              <Route
                path="/offers/approval"
                element={
                  <MainLayout>
                    <OfferApprovalPage />
                  </MainLayout>
                }
              />
            </Route>

            <Route
              path="*"
              element={<NotFoundPage />}
            />
          </Routes>
        </PermissionProvider>
      </Router>
    </ToastProvider>
  );
}

export default App;
