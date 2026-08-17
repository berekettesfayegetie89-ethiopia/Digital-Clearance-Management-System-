import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { BrandingProvider } from "./context/BrandingContext";
import { ROLES } from "./data/users";

import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

// Auth
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import ForceChangePassword from "./pages/auth/ForceChangePassword";

// Applicant
import ApplicantHome from "./pages/applicant/Home";
import ApplyClearance from "./pages/applicant/ApplyClearance";
import MyRequests from "./pages/applicant/MyRequests";
import UploadDocuments from "./pages/applicant/UploadDocuments";
import DownloadCertificate from "./pages/applicant/DownloadCertificate";
import ApplicantNotifications from "./pages/applicant/Notifications";
import ApplicantProfile from "./pages/applicant/Profile";

// Approver
import ApproverHome from "./pages/approver/Home";
import PendingRequests from "./pages/approver/PendingRequests";
import ApprovalHistory from "./pages/approver/ApprovalHistory";
import DelegationSettings from "./pages/approver/DelegationSettings";
import DepartmentDocuments from "./pages/approver/DepartmentDocuments";
import ApproverCalendar from "./pages/approver/Calendar";
import ApproverNotifications from "./pages/approver/Notifications";
import ApproverProfile from "./pages/approver/Profile";

// Department Head
import DepartmentHeadHome from "./pages/departmentHead/Home";
import EscalatedRequests from "./pages/departmentHead/EscalatedRequests";
import Substitutes from "./pages/departmentHead/Substitutes";
import TeamPerformance from "./pages/departmentHead/TeamPerformance";
import SendReminder from "./pages/departmentHead/SendReminder";
import DeptHeadNotifications from "./pages/departmentHead/Notifications";
import DeptHeadProfile from "./pages/departmentHead/Profile";

// HR
import HRHome from "./pages/hr/Home";
import ClearanceMatrix from "./pages/hr/ClearanceMatrix";
import InitiateOnBehalf from "./pages/hr/InitiateOnBehalf";
import DelayedEscalated from "./pages/hr/DelayedEscalated";
import CertificateManagement from "./pages/hr/CertificateManagement";
import HRReports from "./pages/hr/Reports";
import HRNotifications from "./pages/hr/Notifications";
import HRProfile from "./pages/hr/Profile";

// Auditor
import AuditorHome from "./pages/auditor/Home";
import AuditLogs from "./pages/auditor/AuditLogs";
import TimelineViewer from "./pages/auditor/TimelineViewer";
import SessionActivity from "./pages/auditor/SessionActivity";
import ExportReports from "./pages/auditor/ExportReports";
import AuditorProfile from "./pages/auditor/Profile";

// Super Admin
import SuperAdminHome from "./pages/superAdmin/Home";
import UserManagement from "./pages/superAdmin/UserManagement";
import DepartmentManagement from "./pages/superAdmin/DepartmentManagement";
import WorkflowBuilder from "./pages/superAdmin/WorkflowBuilder";
import CertificateAdministration from "./pages/superAdmin/CertificateAdministration";
import EscalationOverrides from "./pages/superAdmin/EscalationOverrides";
import SuperAdminReports from "./pages/superAdmin/Reports";
import NotificationTemplates from "./pages/superAdmin/NotificationTemplates";
import SuperAdminAuditLogs from "./pages/superAdmin/AuditLogs";
import Settings from "./pages/superAdmin/Settings";
import SuperAdminProfile from "./pages/superAdmin/Profile";

// System Admin
import SystemAdminHome from "./pages/systemAdmin/Home";
import Monitoring from "./pages/systemAdmin/Monitoring";
import Security from "./pages/systemAdmin/Security";
import Backup from "./pages/systemAdmin/Backup";
import CronJobs from "./pages/systemAdmin/CronJobs";
import EmailLogs from "./pages/systemAdmin/EmailLogs";
import NotificationSettings from "./pages/systemAdmin/NotificationSettings";
import SystemAdminProfile from "./pages/systemAdmin/Profile";

// Public / Errors
import VerifyCertificate from "./pages/public/VerifyCertificate";
import AccessDenied from "./pages/errors/AccessDenied";
import NotFound from "./pages/errors/NotFound";
import HelpSupport from "./pages/common/HelpSupport";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <BrandingProvider>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/verify" element={<VerifyCertificate />} />
            <Route path="/403" element={<AccessDenied />} />
            <Route path="/force-password-change" element={<ForceChangePassword />} />

            {/* Auth */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* Applicant */}
            <Route element={<ProtectedRoute allowedRoles={[ROLES.APPLICANT]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/applicant" element={<ApplicantHome />} />
                <Route path="/applicant/apply" element={<ApplyClearance />} />
                <Route path="/applicant/requests" element={<MyRequests />} />
                <Route path="/applicant/documents" element={<UploadDocuments />} />
                <Route path="/applicant/certificate" element={<DownloadCertificate />} />
                <Route path="/applicant/notifications" element={<ApplicantNotifications />} />
                <Route path="/applicant/profile" element={<ApplicantProfile />} />
              </Route>
            </Route>

            {/* Approver */}
            <Route element={<ProtectedRoute allowedRoles={[ROLES.APPROVER]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/approver" element={<ApproverHome />} />
                <Route path="/approver/pending" element={<PendingRequests />} />
                <Route path="/approver/history" element={<ApprovalHistory />} />
                <Route path="/approver/delegation" element={<DelegationSettings />} />
                <Route path="/approver/documents" element={<DepartmentDocuments />} />
                <Route path="/approver/calendar" element={<ApproverCalendar />} />
                <Route path="/approver/notifications" element={<ApproverNotifications />} />
                <Route path="/approver/profile" element={<ApproverProfile />} />
              </Route>
            </Route>

            {/* Department Head */}
            <Route element={<ProtectedRoute allowedRoles={[ROLES.DEPARTMENT_HEAD]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/department-head" element={<DepartmentHeadHome />} />
                <Route path="/department-head/escalations" element={<EscalatedRequests />} />
                <Route path="/department-head/substitutes" element={<Substitutes />} />
                <Route path="/department-head/performance" element={<TeamPerformance />} />
                <Route path="/department-head/reminders" element={<SendReminder />} />
                <Route path="/department-head/notifications" element={<DeptHeadNotifications />} />
                <Route path="/department-head/profile" element={<DeptHeadProfile />} />
              </Route>
            </Route>

            {/* HR Coordinator */}
            <Route element={<ProtectedRoute allowedRoles={[ROLES.HR_COORDINATOR]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/hr" element={<HRHome />} />
                <Route path="/hr/matrix" element={<ClearanceMatrix />} />
                <Route path="/hr/initiate" element={<InitiateOnBehalf />} />
                <Route path="/hr/delayed" element={<DelayedEscalated />} />
                <Route path="/hr/certificates" element={<CertificateManagement />} />
                <Route path="/hr/reports" element={<HRReports />} />
                <Route path="/hr/notifications" element={<HRNotifications />} />
                <Route path="/hr/profile" element={<HRProfile />} />
              </Route>
            </Route>

            {/* Auditor */}
            <Route element={<ProtectedRoute allowedRoles={[ROLES.AUDITOR]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/auditor" element={<AuditorHome />} />
                <Route path="/auditor/logs" element={<AuditLogs />} />
                <Route path="/auditor/timeline" element={<TimelineViewer />} />
                <Route path="/auditor/sessions" element={<SessionActivity />} />
                <Route path="/auditor/export" element={<ExportReports />} />
                <Route path="/auditor/profile" element={<AuditorProfile />} />
              </Route>
            </Route>

            {/* Super Admin */}
            <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/super-admin" element={<SuperAdminHome />} />
                <Route path="/super-admin/users" element={<UserManagement />} />
                <Route path="/super-admin/departments" element={<DepartmentManagement />} />
                <Route path="/super-admin/workflow" element={<WorkflowBuilder />} />
                <Route path="/super-admin/certificates" element={<CertificateAdministration />} />
                <Route path="/super-admin/escalations" element={<EscalationOverrides />} />
                <Route path="/super-admin/reports" element={<SuperAdminReports />} />
                <Route path="/super-admin/templates" element={<NotificationTemplates />} />
                <Route path="/super-admin/audit-logs" element={<SuperAdminAuditLogs />} />
                <Route path="/super-admin/settings" element={<Settings />} />
                <Route path="/super-admin/profile" element={<SuperAdminProfile />} />
              </Route>
            </Route>

            {/* System Admin */}
            <Route element={<ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/system-admin" element={<SystemAdminHome />} />
                <Route path="/system-admin/monitoring" element={<Monitoring />} />
                <Route path="/system-admin/security" element={<Security />} />
                <Route path="/system-admin/backup" element={<Backup />} />
                <Route path="/system-admin/cron" element={<CronJobs />} />
                <Route path="/system-admin/email-logs" element={<EmailLogs />} />
                <Route path="/system-admin/notification-settings" element={<NotificationSettings />} />
                <Route path="/system-admin/profile" element={<SystemAdminProfile />} />
              </Route>
            </Route>

            {/* Help & Support — shared across every authenticated role */}
            <Route element={<ProtectedRoute allowedRoles={Object.values(ROLES)} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/help-support" element={<HelpSupport />} />
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
      </BrandingProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
