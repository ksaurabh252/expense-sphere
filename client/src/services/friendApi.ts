import { getGroups } from "./api";
import { addMember, fetchGroup, searchUsers } from "./groupApi";

export interface Friend {
  id: string;
  name: string;
  email: string;
}

/**
 * There is no separate Friend model — a "friend" is simply someone you
 * already share a group with, so they are collected from your groups.
 */
export async function fetchFriends(userId: string): Promise<Friend[]> {
  const groups = await getGroups();

  const details = await Promise.all(
    groups.map((group) => fetchGroup(group.id).catch(() => null)),
  );

  const friends = new Map<string, Friend>();

  for (const detail of details) {
    if (!detail) continue;

    for (const member of detail.members) {
      if (member.id === userId || friends.has(member.id)) continue;
      friends.set(member.id, {
        id: member.id,
        name: member.name,
        email: member.email,
      });
    }
  }

  return [...friends.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** GET /user/search?q= — people to add to a group. */
export const searchFriends = (query: string): Promise<Friend[]> =>
  searchUsers(query);

/** POST /user/:groupId/members */
export const addFriendToGroup = (
  groupId: string,
  userId: string,
): Promise<void> => addMember(groupId, userId);
