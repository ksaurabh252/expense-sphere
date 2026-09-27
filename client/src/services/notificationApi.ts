import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "./api";

export type { AppNotification };

export interface NotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
}

/** GET /user/notifications */
export const fetchNotifications = (): Promise<NotificationsResult> =>
  getNotifications();

/** PUT /user/notifications/:id/read → the fresh unread count */
export const markRead = (id: string): Promise<number> =>
  markNotificationRead(id);

/** PUT /user/notifications/read-all → 0 */
export const markAllRead = (): Promise<number> => markAllNotificationsRead();
