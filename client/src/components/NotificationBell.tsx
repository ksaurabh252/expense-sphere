import { useState } from "react";
import { useNavigate } from "react-router";
import { Bell, CheckCheck } from "lucide-react";
import type { AppNotification } from "../services/notificationApi";
import { formatRelativeTime } from "../lib/format";

interface NotificationBellProps {
  notifications: AppNotification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

/**
 * Bell with an unread badge. Clicking opens a small dropdown; picking a
 * notification marks it read and opens its group.
 */
const NotificationBell = ({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
}: NotificationBellProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const openNotification = (item: AppNotification) => {
    if (!item.isRead) onMarkRead(item._id);
    setOpen(false);
    navigate(`/groups/${item.groupId}`);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
        className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-4.5 " />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-(--auth-accent) px-1 text-[10px] font-semibold leading-4 text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-border/70 bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
              <p className="text-[13px] font-semibold text-foreground">
                Notifications
              </p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              <ul className="max-h-80 divide-y divide-border/60 overflow-y-auto">
                {notifications.slice(0, 8).map((item) => (
                  <li key={item._id}>
                    <button
                      type="button"
                      onClick={() => openNotification(item)}
                      className={`flex w-full cursor-pointer items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted ${item.isRead ? "" : "notif-unread"
                        }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-1.75 size-2 shrink-0 rounded-full ${item.isRead
                          ? "bg-transparent"
                          : "bg-(--auth-accent)"
                          }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-[13px] leading-5 ${item.isRead
                            ? "text-muted-foreground"
                            : "text-foreground"
                            }`}
                        >
                          {item.message}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
              className="w-full cursor-pointer border-t border-border/60 px-4 py-2.5 text-center text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              See all
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
