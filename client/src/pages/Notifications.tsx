import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import {
  AlertCircle,
  BellOff,
  Check,
  CheckCheck,
  RefreshCw,
} from "lucide-react";
import { Button } from "../components/ui/button";
import type { ShellContext } from "../components/dashboard/AppLayout";
import {
  ApiError,
  clearSession,
  getGroups,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "../services/api";
import { formatRelativeTime } from "../lib/format";

type LoadStatus = "loading" | "ready" | "error";

const Notifications = () => {
  // The header is driven by the list we are actually showing, so the numbers
  // on screen can never disagree with the rows below them.
  const { refreshUnreadCount } = useOutletContext<ShellContext>();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [groupNames, setGroupNames] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");

    try {
      // Group names are only used as a label, so a failure there must not
      // stop the notifications from rendering.
      const [result, groups] = await Promise.all([
        getNotifications(),
        getGroups().catch(() => []),
      ]);

      setNotifications(result.notifications);
      setGroupNames(
        Object.fromEntries(groups.map((group) => [group.id, group.name])),
      );
      setStatus("ready");
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        clearSession();
        return;
      }
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong while loading your notifications.",
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleMarkRead = useCallback(
    async (id: string) => {
      if (markingId) return;
      setMarkingId(id);

      try {
        await markNotificationRead(id);
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, isRead: true } : item,
          ),
        );
        // Keep the shell badge in step with what is on screen.
        await refreshUnreadCount();
      } catch {
        // Leave the row unread so the user can retry.
      } finally {
        setMarkingId(null);
      }
    },
    [markingId, refreshUnreadCount],
  );

  const handleMarkAll = useCallback(async () => {
    setMarkingAll(true);

    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      await refreshUnreadCount();
    } catch {
      // Nothing changed locally, so the UI stays truthful.
    } finally {
      setMarkingAll(false);
    }
  }, [refreshUnreadCount]);

  const unreadInList = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const subtitle =
    status === "ready"
      ? unreadInList > 0
        ? `${unreadInList} unread of ${notifications.length}`
        : `All ${notifications.length} caught up`
      : "Loading your notifications";

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground">
            Notifications
          </h1>
          <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void handleMarkAll()}
          disabled={unreadInList === 0 || markingAll || status !== "ready"}
          className="h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium disabled:cursor-not-allowed"
        >
          <CheckCheck className="size-4" />
          {markingAll ? "Marking..." : "Mark all as read"}
        </Button>
      </header>

      {status === "loading" && (
        <ul className="animate-pulse divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card">
          {[0, 1, 2, 3].map((key) => (
            <li key={key} className="flex items-start gap-3 px-5 py-4">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-3/4 rounded bg-muted" />
                <div className="h-3 w-32 rounded bg-muted" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-rose-200 bg-rose-50/50 px-6 py-14 text-center dark:border-rose-500/20 dark:bg-rose-500/[0.04]">
          <span className="flex size-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/12 dark:text-rose-400">
            <AlertCircle className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold tracking-[-0.01em] text-foreground">
            Couldn't load your notifications
          </h2>
          <p className="mt-2 max-w-sm text-[13px] leading-6 text-muted-foreground">
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void load()}
            className="mt-6 h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium"
          >
            <RefreshCw className="size-4" />
            Try again
          </Button>
        </div>
      )}

      {status === "ready" && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-card px-6 py-16 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <BellOff className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold tracking-[-0.01em] text-foreground">
            No notifications
          </h2>
          <p className="mt-2 max-w-sm text-[13px] leading-6 text-muted-foreground">
            You're all caught up. Activity from your groups will show up here.
          </p>
        </div>
      )}

      {status === "ready" && notifications.length > 0 && (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card">
          {notifications.map((item) => {
            const groupName = groupNames[item.groupId];
            const isBusy = markingId === item._id;

            return (
              <li
                key={item._id}
                className={`flex items-start gap-3 px-5 py-4 ${
                  item.isRead ? "" : "notif-unread"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-[7px] size-2 shrink-0 rounded-full ${
                    item.isRead ? "bg-transparent" : "bg-[var(--auth-accent)]"
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[13px] leading-6 ${
                      item.isRead ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {item.message}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {groupName && (
                      <>
                        <span className="truncate">{groupName}</span>
                        <span className="size-1 shrink-0 rounded-full bg-border" />
                      </>
                    )}
                    <span>{formatRelativeTime(item.createdAt)}</span>
                  </p>
                </div>

                {!item.isRead && (
                  <button
                    type="button"
                    onClick={() => void handleMarkRead(item._id)}
                    disabled={isBusy}
                    className="mt-0.5 inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check className="size-3.5" />
                    {isBusy ? "Saving" : "Mark read"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
