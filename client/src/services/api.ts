const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const TOKEN_KEY = "token";
const USER_KEY = "user";

/* ------------------------------------------------------------------------- */
/* Errors                                                                     */
/* ------------------------------------------------------------------------- */

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/* ------------------------------------------------------------------------- */
/* Session                                                                    */
/* ------------------------------------------------------------------------- */

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const setUser = (user: AuthUser | null) => {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/* ------------------------------------------------------------------------- */
/* Core request                                                               */
/* ------------------------------------------------------------------------- */

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  } catch {
    throw new ApiError(
      `Can't reach the server. Make sure the backend is running on ${API_URL}.`,
      0,
    );
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearSession();
    throw new ApiError(
      data.message || "Your session has expired. Please sign in again.",
      401,
    );
  }

  if (!response.ok) {
    throw new ApiError(data.message || "Something went wrong", response.status);
  }

  return data as T;
}

/* ------------------------------------------------------------------------- */
/* Auth — mounted at /user                                                    */
/* ------------------------------------------------------------------------- */

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResponse {
  message?: string;
  token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message?: string;
  newUser: AuthUser;
}

export const loginUser = (payload: LoginPayload) =>
  request<LoginResponse>("/user/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const registerUser = (payload: RegisterPayload) =>
  request<RegisterResponse>("/user/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });

/* ------------------------------------------------------------------------- */
/* Groups — mounted at /user                                                  */
/* ------------------------------------------------------------------------- */

export interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  lastActivityAt: string | null;
  /** Positive → you are owed. Negative → you owe. Filled in from the balances endpoint. */
  balance: number;
}

const toText = (value: unknown, fallback = ""): string =>
  typeof value === "string" && value.trim() ? value : fallback;

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed)
    ? parsed
    : fallback;
};

/**
 * Unread counts drive a badge, so they must be whole and non-negative.
 * A missing, negative, fractional, or non-numeric value (undefined, -1, 3.7,
 * NaN) is coerced here — the badge can never render junk or a phantom value.
 */
const toUnreadCount = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
};

/** Normalises a raw mongoose group document into the shape the UI expects. */
const normalizeGroup = (raw: any, index: number): Group => {
  const members = Array.isArray(raw?.members) ? raw.members : [];

  return {
    id: toText(raw?._id ?? raw?.id, `group-${index}`),
    name: toText(raw?.name, "Untitled group"),
    description: toText(raw?.description),
    memberCount: members.length,
    lastActivityAt: raw?.updatedAt ?? raw?.createdAt ?? null,
    balance: 0,
  };
};

/** GET /user/groups → { success, source, groups: [...] } */
export async function getGroups(): Promise<Group[]> {
  const data = await request<{ groups?: any[] }>("/user/groups");
  const raw = Array.isArray(data?.groups) ? data.groups : [];
  return raw.map(normalizeGroup);
}

export interface MemberBalance {
  userId: string;
  balance: number;
}

/** GET /user/:groupId/balances → { success, balances: [{ userId, balance }] } */
export async function getGroupBalances(
  groupId: string,
): Promise<MemberBalance[]> {
  const data = await request<{ balances?: MemberBalance[] }>(
    `/user/${groupId}/balances`,
  );
  const raw = Array.isArray(data?.balances) ? data.balances : [];

  return raw.map((entry) => ({
    userId: toText(entry?.userId),
    balance: toNumber(entry?.balance),
  }));
}

/**
 * Loads every group plus the signed-in user's balance in each one.
 * The balance is not part of the group document, so it comes from the
 * per-group balances endpoint. Requests run in parallel.
 */
export async function getGroupsWithBalances(userId: string): Promise<Group[]> {
  const groups = await getGroups();
  if (groups.length === 0) return groups;

  const balancesPerGroup = await Promise.all(
    groups.map((group) =>
      getGroupBalances(group.id).catch(() => [] as MemberBalance[]),
    ),
  );

  return groups.map((group, index) => {
    const mine = balancesPerGroup[index].find(
      (entry) => entry.userId === userId,
    );
    return { ...group, balance: mine ? mine.balance : 0 };
  });
}

/* ------------------------------------------------------------------------- */
/* Notifications — mounted at /user                                           */
/* ------------------------------------------------------------------------- */

export interface AppNotification {
  _id: string;
  groupId: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
}

/** GET /user/notifications → { success, unreadCount, notifications } */
export async function getNotifications(): Promise<NotificationsResult> {
  const data = await request<{
    unreadCount?: number;
    notifications?: AppNotification[];
  }>("/user/notifications");

  const notifications = Array.isArray(data?.notifications)
    ? data.notifications
    : [];

  // Count the list as well, so an empty inbox always yields 0 even if the
  // server sends a stale or missing count.
  const unreadInList = notifications.filter((item) => !item.isRead).length;

  return {
    notifications,
    // No notifications at all ⇒ no badge, unconditionally.
    unreadCount:
      notifications.length === 0
        ? 0
        : toUnreadCount(data?.unreadCount, unreadInList),
  };
}

/** PUT /user/notifications/:id/read → the fresh unread count */
export async function markNotificationRead(id: string): Promise<number> {
  const data = await request<{ unreadCount?: number }>(
    `/user/notifications/${id}/read`,
    { method: "PUT" },
  );
  return toUnreadCount(data?.unreadCount, 0);
}

/** PUT /user/notifications/read-all → 0 */
export async function markAllNotificationsRead(): Promise<number> {
  const data = await request<{ unreadCount?: number }>(
    "/user/notifications/read-all",
    { method: "PUT" },
  );
  return toUnreadCount(data?.unreadCount, 0);
}
