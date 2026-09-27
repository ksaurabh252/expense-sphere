import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Dialog } from "@base-ui/react/dialog";
import {
  AlertCircle,
  ArrowLeft,
  HandCoins,
  Plus,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import MemberCard from "../components/MemberCard";
import ExpenseCard from "../components/ExpenseCard";
import AddExpenseModal from "../components/AddExpenseModal";
import SettlementList from "../components/SettlementList";
import SettleUpModal from "../components/SettleUpModal";
import { useSocket } from "../context/SocketContext";
import { joinGroup } from "../services/socket";
import { ApiError, clearSession, getUser } from "../services/api";
import {
  addMember,
  createExpense,
  fetchBalances,
  fetchGroup,
  fetchGroupExpenses,
  searchUsers,
  type ExpensePayload,
  type GroupExpense,
  type GroupInfo,
  type MemberBalance,
  type UserSearchResult,
} from "../services/groupApi";
import {
  fetchSettlements,
  settleUp,
  type Settlement,
} from "../services/settlementApi";
import { getInitials } from "../lib/format";

type LoadStatus = "loading" | "ready" | "error";

/**
 * Group Details. Shows the group's members with their balances and the
 * expenses recorded in the group. Adding an expense is a later step.
 */
const GroupDetails = () => {
  const { groupId = "" } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const currentUserId = useMemo(() => getUser()?._id ?? "", []);
  const socket = useSocket();

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");

    try {
      // Settlement suggestions are a bonus — a failure there must not
      // stop the rest of the page from rendering.
      const [groupData, balanceData, expenseData, settlementData] =
        await Promise.all([
          fetchGroup(groupId),
          fetchBalances(groupId),
          fetchGroupExpenses(groupId),
          fetchSettlements(groupId).catch(() => [] as Settlement[]),
        ]);

      setGroup(groupData);
      setBalances(balanceData);
      setExpenses(expenseData);
      setSettlements(settlementData);
      setStatus("ready");
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        clearSession();
        navigate("/auth", { replace: true });
        return;
      }
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong while loading this group.",
      );
      setStatus("error");
    }
  }, [groupId, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  // Join the group's room so the server can push this page's updates.
  useEffect(() => {
    if (!socket || !groupId) return;

    joinGroup(groupId);

    const onExpenseAdded = () => {
      void load();
    };
    const onBalanceUpdated = (next: MemberBalance[]) => {
      setBalances(Array.isArray(next) ? next : []);
    };

    socket.on("expense-added", onExpenseAdded);
    socket.on("balance-updated", onBalanceUpdated);

    return () => {
      socket.off("expense-added", onExpenseAdded);
      socket.off("balance-updated", onBalanceUpdated);
    };
  }, [socket, groupId, load]);

  // Look users up as the name is typed, but wait for a pause between keys.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;

    const timer = setTimeout(() => {
      searchUsers(term)
        .then(setResults)
        .catch(() => setResults([]));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Balances arrive as a separate list keyed by user id.
  const members = useMemo(() => {
    if (!group) return [];
    return group.members.map((member) => ({
      ...member,
      balance:
        balances.find((entry) => entry.userId === member.id)?.balance ?? 0,
    }));
  }, [group, balances]);

  const openModal = () => {
    setQuery("");
    setResults([]);
    setSelectedId("");
    setAddError("");
    setModalOpen(true);
  };

  // Reloading refreshes the expense list and the balances in one go.
  const handleCreateExpense = async (payload: ExpensePayload) => {
    await createExpense(payload);
    await load();
  };

  const handleSettle = async (to: string, amount: number) => {
    await settleUp(groupId, to, amount);
    await load();
  };

  const handleAddMember = async () => {
    if (!selectedId) return;

    setAdding(true);
    setAddError("");

    try {
      await addMember(groupId, selectedId);
      setModalOpen(false);
      await load();
    } catch (caught) {
      setAddError(
        caught instanceof Error ? caught.message : "Could not add the member.",
      );
    } finally {
      setAdding(false);
    }
  };

  /* ---------------------------------------------------------------- */

  if (status === "loading") {
    return (
      <div className="space-y-7">
        <div className="animate-pulse space-y-2.5">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1].map((key) => (
            <div
              key={key}
              className="animate-pulse overflow-hidden rounded-xl border border-border/70 bg-card"
            >
              <div className="border-b border-border/60 px-5 py-4">
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-center gap-3 px-5 py-4">
                  <div className="size-9 shrink-0 rounded-lg bg-muted" />
                  <div className="h-3 flex-1 rounded bg-muted" />
                  <div className="h-3 w-16 rounded bg-muted" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (status === "error" || !group) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-rose-200 bg-rose-50/50 px-6 py-14 text-center dark:border-rose-500/20 dark:bg-rose-500/[0.04]">
        <span className="flex size-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/12 dark:text-rose-400">
          <AlertCircle className="size-5" />
        </span>
        <h1 className="mt-4 text-base font-semibold tracking-[-0.01em] text-foreground">
          Couldn't load this group
        </h1>
        <p className="mt-2 max-w-sm text-[13px] leading-6 text-muted-foreground">
          {error}
        </p>
        <div className="mt-6 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/groups")}
            className="h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium"
          >
            Back to groups
          </Button>
          <Button
            type="button"
            onClick={() => void load()}
            className="h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium"
          >
            <RefreshCw className="size-4" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate("/groups")}
            className="group inline-flex items-center gap-2 text-[22px] font-semibold tracking-[-0.025em] text-foreground"
          >
            <ArrowLeft className="size-5 text-muted-foreground transition-transform duration-200 group-hover:-translate-x-0.5" />
            {group.name}
          </button>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            {members.length} {members.length === 1 ? "member" : "members"}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setSettleModalOpen(true)}
            className="h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium"
          >
            <HandCoins className="size-4" />
            Settle Up
          </Button>
          <Button
            type="button"
            onClick={openModal}
            className="h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium"
          >
            <UserPlus className="size-4" />
            Add Member
          </Button>
          <Button
            type="button"
            onClick={() => setExpenseModalOpen(true)}
            className="h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium"
          >
            <Plus className="size-4" />
            Add Expense
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-border/70 bg-card">
          <h2 className="border-b border-border/60 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Members
          </h2>
          <ul className="divide-y divide-border/60">
            {members.map((member) => (
              <li key={member.id}>
                <MemberCard
                  name={member.name}
                  balance={member.balance}
                  isYou={member.id === currentUserId}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="overflow-hidden rounded-xl border border-border/70 bg-card">
          <h2 className="border-b border-border/60 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Expenses
          </h2>

          {expenses.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-muted-foreground">
              No expenses yet.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {expenses.map((expense) => (
                <li key={expense.id}>
                  <ExpenseCard expense={expense} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <h2 className="border-b border-border/60 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Settle up
        </h2>
        <SettlementList settlements={settlements} />
      </section>

      {settleModalOpen && (
        <SettleUpModal
          open={settleModalOpen}
          onOpenChange={setSettleModalOpen}
          members={members}
          currentUserId={currentUserId}
          onSettle={handleSettle}
        />
      )}

      {expenseModalOpen && (
        <AddExpenseModal
          open={expenseModalOpen}
          onOpenChange={setExpenseModalOpen}
          groupId={groupId}
          members={members}
          currentUserId={currentUserId}
          onCreate={handleCreateExpense}
        />
      )}

      {modalOpen && (
        <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[2px]" />

            <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border/70 bg-card p-5 shadow-xl">
              <Dialog.Title className="text-base font-semibold tracking-[-0.01em] text-foreground">
                Add Member
              </Dialog.Title>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleAddMember();
                }}
                className="mt-4 space-y-4"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="member-search"
                    className="text-[13px] text-foreground"
                  >
                    Search user
                  </Label>
                  <Input
                    id="member-search"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      if (event.target.value.trim().length < 2) setResults([]);
                    }}
                    placeholder="Name or email"
                    autoFocus
                    className="h-10 px-3 text-sm"
                  />
                </div>

                {query.trim().length >= 2 && results.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No users found.
                  </p>
                )}

                {results.length > 0 && (
                  <ul className="max-h-48 divide-y divide-border/60 overflow-y-auto rounded-lg border border-border/70">
                    {results.map((user) => (
                      <li key={user.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(user.id)}
                          className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                            selectedId === user.id
                              ? "bg-foreground/[0.06]"
                              : "hover:bg-muted"
                          }`}
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground">
                            {getInitials(user.name)}
                          </span>
                          <span className="min-w-0 flex-1 leading-tight">
                            <span className="block truncate text-[13px] font-medium text-foreground">
                              {user.name}
                            </span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {user.email}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {addError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {addError}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    disabled={adding}
                    className="h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium disabled:cursor-not-allowed"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedId || adding}
                    className="h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium disabled:cursor-not-allowed"
                  >
                    {adding ? "Adding..." : "Add Member"}
                  </Button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
};

export default GroupDetails;
