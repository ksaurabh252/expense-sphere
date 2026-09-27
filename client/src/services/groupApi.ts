import {
  getGroupBalances,
  getGroupsWithBalances,
  normalizeGroup,
  request,
  toNumber,
  toText,
  type Group,
  type MemberBalance,
} from "./api";

export type { Group, MemberBalance };

export interface GroupMember {
  id: string;
  name: string;
  email: string;
}

export interface GroupInfo {
  id: string;
  name: string;
  members: GroupMember[];
}

export interface GroupExpense {
  id: string;
  description: string;
  amount: number;
  paidByName: string;
  participantCount: number;
  splitType: string;
}

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
}

/* ------------------------------------------------------------------------- */
/* Groups                                                                     */
/* ------------------------------------------------------------------------- */

/**
 * GET /user/groups (plus the balances lookup) — every group the signed-in
 * user belongs to, with their balance in each one.
 */
export const fetchGroups = (userId: string): Promise<Group[]> =>
  getGroupsWithBalances(userId);

/** POST /user/groups — creates a group with the caller as its first member. */
export async function createGroup(name: string): Promise<Group> {
  const data = await request<{ group?: unknown }>("/user/groups", {
    method: "POST",
    body: JSON.stringify({ name: name.trim() }),
  });

  return normalizeGroup(data.group, 0);
}

/* ------------------------------------------------------------------------- */
/* Group details                                                              */
/* ------------------------------------------------------------------------- */

/** GET /user/:groupId — the group with its members' names. */
export async function fetchGroup(groupId: string): Promise<GroupInfo> {
  const data = await request<{ group?: any }>(`/user/${groupId}`);
  const raw = data.group ?? {};
  const members: any[] = Array.isArray(raw.members) ? raw.members : [];

  return {
    id: toText(raw._id, groupId),
    name: toText(raw.name, "Untitled group"),
    members: members.map((member) => ({
      id: toText(member?._id),
      name: toText(member?.name, "Unknown member"),
      email: toText(member?.email),
    })),
  };
}

/** GET /user/:groupId/balances — each member's net position in the group. */
export const fetchBalances = (groupId: string): Promise<MemberBalance[]> =>
  getGroupBalances(groupId);

/** GET /user/:groupId/expenses — every expense recorded in the group. */
export async function fetchGroupExpenses(
  groupId: string,
): Promise<GroupExpense[]> {
  const data = await request<{ expenses?: any[] }>(
    `/user/${groupId}/expenses`,
  );
  const raw = Array.isArray(data.expenses) ? data.expenses : [];

  return raw.map((expense, index) => ({
    id: toText(expense?._id, `expense-${index}`),
    description: toText(expense?.description, "Expense"),
    amount: toNumber(expense?.amount),
    paidByName: toText(expense?.paidBy?.name, "Someone"),
    participantCount: Array.isArray(expense?.participants)
      ? expense.participants.length
      : 0,
    splitType: toText(expense?.splitType, "equal"),
  }));
}

export interface ExpenseSplit {
  userId: string;
  amount?: number;
  percent?: number;
}

export interface ExpensePayload {
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  splitType: "equal" | "unequal" | "percentage";
  participants: string[];
  /** Only sent for unequal (amount) and percentage (percent) splits. */
  splits?: ExpenseSplit[];
}

/** POST /user/expenses — records an equally split expense in the group. */
export async function createExpense(payload: ExpensePayload): Promise<void> {
  await request<unknown>("/user/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** POST /user/:groupId/members — adds an existing user to the group. */
export async function addMember(groupId: string, userId: string): Promise<void> {
  await request<unknown>(`/user/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

/** GET /user/search?q= — users to pick from when adding a member. */
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const data = await request<{ users?: any[] }>(
    `/user/search?q=${encodeURIComponent(query.trim())}`,
  );
  const raw = Array.isArray(data.users) ? data.users : [];

  return raw
    .map((user) => ({
      id: toText(user?._id),
      name: toText(user?.name, "Unknown user"),
      email: toText(user?.email),
    }))
    .filter((user) => user.id.length > 0);
}
