import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useSocket } from "../../context/SocketContext";
import {
  fetchNotifications,
  markAllRead,
  markRead,
  type AppNotification,
} from "../../services/notificationApi";
import { clearSession, getUser } from "../../services/api";

/**
 * Shared data available to pages rendered inside the app shell.
 */
export interface ShellContext {
  query: string;
  setQuery: (value: string) => void;
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

/**
 * Main authenticated layout containing the sidebar, navbar, and page content.
 */
const AppLayout = () => {
  const navigate = useNavigate();
  const socket = useSocket();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  // Keep the badge hidden until the initial notification count is loaded.
  const [unreadCount, setUnreadCount] = useState(0);

  const user = useMemo(() => getUser(), []);
  const currentUserId = user?._id ?? "";
  const userName = user?.name ?? "Your account";
  const userEmail = user?.email ?? "";

  // Load notifications and update the unread badge.
  const loadNotifications = useCallback(async () => {
    try {
      const result = await fetchNotifications();

      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  // Listen for new notifications from the socket.
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const onNotificationNew = (notification: AppNotification) => {
      // Only add notifications that belong to the current user.
      if (!notification?.userId || notification.userId !== currentUserId) {
        return;
      }

      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification-new", onNotificationNew);

    return () => {
      socket.off("notification-new", onNotificationNew);
    };
  }, [socket, currentUserId]);

  // Refresh the notification list and unread count.
  const refreshUnreadCount = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  // Mark one notification as read.
  const handleMarkRead = useCallback((id: string) => {
    void markRead(id).then((count) => {
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, isRead: true } : item,
        ),
      );

      setUnreadCount(count);
    });
  }, []);

  // Mark all notifications as read.
  const handleMarkAllRead = useCallback(() => {
    void markAllRead().then(() => {
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true })),
      );

      setUnreadCount(0);
    });
  }, []);

  // Clear the session and return to the authentication page.
  const handleLogout = useCallback(() => {
    clearSession();
    navigate("/auth", { replace: true });
  }, [navigate]);

  // Context shared with pages rendered through <Outlet />.
  const shell = useMemo<ShellContext>(
    () => ({
      query,
      setQuery,
      unreadCount,
      refreshUnreadCount,
    }),
    [query, unreadCount, refreshUnreadCount],
  );

  return (
    <div className="flex min-h-screen bg-[#fafaf9] dark:bg-background">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={userName}
        userEmail={userEmail}
        unreadCount={unreadCount}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          userName={userName}
          userEmail={userEmail}
          unreadCount={unreadCount}
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          searchValue={query}
          onSearchChange={setQuery}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="mx-auto w-full max-w-295 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
          <Outlet context={shell} />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
