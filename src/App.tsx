import { useEffect, useState, type ReactNode } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ToastProvider from "./components/notifications/ToastProvider";
import LoginPage from "./pages/Login/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPassword/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPassword/ResetPasswordPage";
import AccountActivationPage from "./pages/AccountActivation/AccountActivationPage";
import ChangePasswordPage from "./pages/ChangePassword/ChangePasswordPage";
import AccountListPage from "./pages/AccountList/AccountListPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import RecruitmentPage from "./pages/Recruitment/RecruitmentPage";
import RecruitmentAdminPage from "./pages/Recruitment/RecruitmentAdminPage";
import ImportExcelUI from "./components/Recruitment/ImportExcelUI";
import UnauthorizedPage from "./pages/error/UnauthorizedPage";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import PermissionProvider from "./components/routes/PermissionProvider";
import SessionDraftRestorer from "./components/routes/SessionDraftRestorer";
import Sidebar from "./components/layout/Sidebar";
import { getHealth, type HealthResponse } from "./services/healthService";
import { ROLES, type Role } from "./constants/roles";
import JobTitlesPage from "./pages/JobTitle/JobTitlesPage";
import DepartmentPage from "./pages/Department/DepartmentPage";
import MasterDataManagement from "./pages/MasterData/MasterDataManagement";
import HeadcountBudgetManagement from "./pages/Headcount/HeadcountBudgetManagement";
import JobPostingForm from "./components/JobPosting/JobPostingForm";
import JobPostingPreviewApproval from "./components/JobPosting/JobPostingPreviewApproval";

const ALL_ROLES = Object.values(ROLES) as Role[];

const MainLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex h-screen bg-gray-100">
    <Sidebar />
    <div className="flex flex-1 flex-col overflow-hidden">
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
        {children}
      </main>
    </div>
  </div>
);

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

const PlaceholderPage = ({ title }: { title: string }) => (
  <section className="rounded-lg bg-white p-8">
    <h1 className="text-2xl font-bold">{title}</h1>
    <p className="mt-3 text-sm text-slate-600">
      Giao diện chức năng này chưa được tích hợp với API Backend.
    </p>
  </section>
);

function App() {
  return (
    <ToastProvider>
      <Router>
        <PermissionProvider>
          <SessionDraftRestorer />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
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
                    <PlaceholderPage title="Bảng điều khiển chung" />
                  </MainLayout>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <MainLayout>
                    <PlaceholderPage title="Bảng điều khiển quản trị" />
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
              <Route path="/users" element={<AccountListPage />} />
              <Route path="/admin/users" element={<AccountListPage />} />
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
                    <PlaceholderPage title="Quản lý CV / Ứng viên" />
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
                    <PlaceholderPage title="Lịch phỏng vấn" />
                  </MainLayout>
                }
              />
            </Route>

            <Route
              path="*"
              element={
                <div className="flex h-screen items-center justify-center text-2xl">
                  404 - Không tìm thấy trang
                </div>
              }
            />
          </Routes>
        </PermissionProvider>
      </Router>
    </ToastProvider>
  );
}

export default App;
