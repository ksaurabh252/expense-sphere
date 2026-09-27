import { request, toNumber, toText } from "./api";

export interface Settlement {
  fromId: string;
  from: string;
  toId: string;
  to: string;
  amount: number;
}

/** GET /user/:groupId/settlements — the payments that would clear the group. */
export async function fetchSettlements(groupId: string): Promise<Settlement[]> {
  const data = await request<{ settlements?: any[] }>(
    `/user/${groupId}/settlements`,
  );
  const raw = Array.isArray(data.settlements) ? data.settlements : [];

  return raw.map((settlement) => ({
    fromId: toText(settlement?.fromId),
    from: toText(settlement?.from, "Someone"),
    toId: toText(settlement?.toId),
    to: toText(settlement?.to, "Someone"),
    amount: toNumber(settlement?.amount),
  }));
}

/** POST /user/settlements — records that the logged-in user paid `to`. */
export async function settleUp(
  groupId: string,
  to: string,
  amount: number,
): Promise<void> {
  await request<unknown>("/user/settlements", {
    method: "POST",
    body: JSON.stringify({ groupId, to, amount }),
  });
}
