import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { AlertCircle, Plus, RefreshCw, SearchX, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import GroupCard from "../components/GroupCard";
import CreateGroupModal from "../components/CreateGroupModal";
import type { ShellContext } from "../components/dashboard/AppLayout";
import {
  ApiError,
  clearSession,
  getUser,
  getToken,
} from "../services/api";
import { createGroup, fetchGroups, type Group } from "../services/groupApi";

type LoadStatus = "loading" | "ready" | "error";

/**
 * Groups page. Renders inside `AppLayout`; the shell's search field drives
 * the filter, so there is only one search input on screen.
 */
const Groups = () => {
  const navigate = useNavigate();
  const { query } = useOutletContext<ShellContext>();

  const [groups, setGroups] = useState<Group[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const loadGroups = useCallback(async () => {
    setStatus("loading");
    setError("");

    try {
      const user = getUser();
      if (!user?._id) {
        clearSession();
        navigate("/auth", { replace: true });
        return;
      }

      setGroups(await fetchGroups(user._id));
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
          : "Something went wrong while loading your groups.",
      );
      setStatus("error");
    }
  }, [navigate]);

  useEffect(() => {
    if (!getToken()) {
      navigate("/auth", { replace: true });
      return;
    }
    void loadGroups();
  }, [loadGroups, navigate]);

  // A new group starts with no expenses, so its balance is 0 — it can go
  // straight into the list without re-requesting everything.
  const handleCreate = async (name: string) => {
    const created = await createGroup(name);
    setGroups((prev) => [...prev, created]);
  };

  const visibleGroups = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter((group) => group.name.toLowerCase().includes(term));
  }, [groups, query]);

  const filtered = query.trim().length > 0;

  const subtitle =
    status === "ready"
      ? `${groups.length} ${groups.length === 1 ? "group" : "groups"} you are part of`
      : "Loading your groups";

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground">
            Groups
          </h1>
          <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setModalOpen(true)}
          className="h-9 shrink-0 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium"
        >
          <Plus className="size-4" />
          Create Group
        </Button>
      </header>

      {status === "loading" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <div
              key={key}
              className="animate-pulse rounded-xl border border-border/70 bg-card p-5"
            >
              <div className="flex items-start gap-3">
                <div className="size-10 shrink-0 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="h-3.5 w-2/3 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
              <div className="mt-5 border-t border-border/60 pt-4">
                <div className="h-2.5 w-20 rounded bg-muted" />
                <div className="mt-2.5 h-4 w-24 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-rose-200 bg-rose-50/50 px-6 py-14 text-center dark:border-rose-500/20 dark:bg-rose-500/[0.04]">
          <span className="flex size-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/12 dark:text-rose-400">
            <AlertCircle className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold tracking-[-0.01em] text-foreground">
            Couldn't load your groups
          </h2>
          <p className="mt-2 max-w-sm text-[13px] leading-6 text-muted-foreground">
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadGroups()}
            className="mt-6 h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium"
          >
            <RefreshCw className="size-4" />
            Try again
          </Button>
        </div>
      )}

      {status === "ready" && groups.length === 0 && !filtered && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-card px-6 py-16 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Users className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold tracking-[-0.01em] text-foreground">
            No groups yet
          </h2>
          <p className="mt-2 max-w-sm text-[13px] leading-6 text-muted-foreground">
            Create your first group to start splitting rent, trips, and everyday
            expenses.
          </p>
          <Button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-6 h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium"
          >
            <Plus className="size-4" />
            Create Group
          </Button>
        </div>
      )}

      {status === "ready" && visibleGroups.length === 0 && filtered && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-card px-6 py-16 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <SearchX className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold tracking-[-0.01em] text-foreground">
            No matching groups
          </h2>
          <p className="mt-2 max-w-sm text-[13px] leading-6 text-muted-foreground">
            No group matches “{query.trim()}”. Try a different name, or clear the
            search field.
          </p>
        </div>
      )}

      {status === "ready" && visibleGroups.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onOpen={(groupId) => navigate(`/groups/${groupId}`)}
            />
          ))}
        </div>
      )}

      {/* Mounted only while open, so every visit starts with an empty field. */}
      {modalOpen && (
        <CreateGroupModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
};

export default Groups;
