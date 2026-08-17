import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import TopNav from "../components/layout/TopNav";
import { ROLE_HOME_PATH } from "../data/navigation";
import { useAuth } from "../context/AuthContext";
import SessionTimeoutWatcher from "../components/layout/SessionTimeoutWatcher";
import { notificationService } from "../services/notificationService";

const REQUESTS_PATH_BY_ROLE = {
  applicant: "/applicant/requests",
  approver: "/approver/pending",
  department_head: "/department-head",
  hr_coordinator: "/hr/matrix",
  auditor: "/auditor/logs",
  super_admin: "/super-admin",
  system_admin: "/system-admin",
};

/**
 * Shared shell for every authenticated dashboard: sidebar + sticky top nav +
 * <Outlet /> for the active page. Role is read from AuthContext so the same
 * layout renders correctly for all 7 roles without duplication.
 */
export default function DashboardLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    notificationService
      .list()
      .then(({ notifications }) => setUnreadCount(notifications.filter((n) => !n.read_at).length))
      .catch(() => {});
  }, [user]);

  if (!user) return null;

  const homePath = ROLE_HOME_PATH[user.role];

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar role={user.role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav
          onMenuClick={() => setSidebarOpen(true)}
          notificationsPath={`${homePath}/notifications`}
          profilePath={`${homePath}/profile`}
          requestsPath={REQUESTS_PATH_BY_ROLE[user.role] || homePath}
          notificationCount={unreadCount}
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <SessionTimeoutWatcher />
    </div>
  );
}
