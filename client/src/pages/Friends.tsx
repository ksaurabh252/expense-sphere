import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Dialog } from "@base-ui/react/dialog";
import { AlertCircle, Plus, RefreshCw, Search, SearchX, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import FriendCard from "../components/FriendCard";
import { ApiError, clearSession, getGroups, getUser, getToken, type Group } from "../services/api";
import {
  addFriendToGroup,
  fetchFriends,
  searchFriends,
  type Friend,
} from "../services/friendApi";

type LoadStatus = "loading" | "ready" | "error";

/**
 * Friends page. There is no friend model, so this lists the people you
 * already share a group with, plus a search to find someone new.
 */
const Friends = () => {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Friend[]>([]);

  const [selected, setSelected] = useState<Friend | null>(null);
  const [targetGroupId, setTargetGroupId] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const currentUserId = useMemo(() => getUser()?._id ?? "", []);

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");

    try {
      if (!currentUserId) {
        clearSession();
        navigate("/auth", { replace: true });
        return;
      }

      const [friendList, groupList] = await Promise.all([
        fetchFriends(currentUserId),
        getGroups(),
      ]);

      setFriends(friendList);
      setGroups(groupList);
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
          : "Something went wrong while loading your friends.",
      );
      setStatus("error");
    }
  }, [currentUserId, navigate]);

  useEffect(() => {
    if (!getToken()) {
      navigate("/auth", { replace: true });
      return;
    }
    void load();
  }, [load, navigate]);

  // Search only once there is something to search for.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;

    const timer = setTimeout(() => {
      searchFriends(term)
        .then(setResults)
        .catch(() => setResults([]));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searching = query.trim().length >= 2;
  const visible = searching ? results : friends;

  const openAddToGroup = (friend: Friend) => {
    setSelected(friend);
    setTargetGroupId(groups[0]?.id ?? "");
    setAddError("");
  };

  const handleAddToGroup = async () => {
    if (!selected || !targetGroupId) return;

    setAdding(true);
    setAddError("");

    try {
      await addFriendToGroup(targetGroupId, selected.id);
      setSelected(null);
      await load();
    } catch (caught) {
      setAddError(
        caught instanceof Error ? caught.message : "Could not add to the group.",
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground">
            Friends
          </h1>
          <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
            {status === "ready"
              ? `${friends.length} ${friends.length === 1 ? "person" : "people"} in your groups`
              : "Loading your friends"}
          </p>
        </div>

        <Button
          type="button"
          onClick={() => searchRef.current?.focus()}
          className="h-9 shrink-0 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium"
        >
          <Plus className="size-4" />
          Add
        </Button>
      </header>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (event.target.value.trim().length < 2) setResults([]);
          }}
          placeholder="Search friends..."
          aria-label="Search friends"
          className="h-10 pl-9 pr-3 text-sm"
        />
      </div>

      {status === "loading" && (
        <div className="animate-pulse divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card">
          {[0, 1, 2].map((key) => (
            <div key={key} className="flex items-center gap-3 px-5 py-4">
              <div className="size-10 shrink-0 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/3 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
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
            Couldn't load your friends
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

      {status === "ready" && visible.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-card px-6 py-16 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            {searching ? <SearchX className="size-5" /> : <Users className="size-5" />}
          </span>
          <h2 className="mt-4 text-base font-semibold tracking-[-0.01em] text-foreground">
            {searching ? "No matching people" : "No friends yet"}
          </h2>
          <p className="mt-2 max-w-sm text-[13px] leading-6 text-muted-foreground">
            {searching
              ? `No user matches “${query.trim()}”. Try a different name or email.`
              : "Search for someone by name or email, then add them to one of your groups."}
          </p>
        </div>
      )}

      {status === "ready" && visible.length > 0 && (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card">
          {visible.map((friend) => (
            <li key={friend.id}>
              <FriendCard friend={friend} onAddToGroup={openAddToGroup} />
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <Dialog.Root open onOpenChange={(next) => !next && setSelected(null)}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[2px]" />

            <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border/70 bg-card p-5 shadow-xl">
              <Dialog.Title className="text-base font-semibold tracking-[-0.01em] text-foreground">
                Add to Group
              </Dialog.Title>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                Put {selected.name} into one of your groups.
              </p>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleAddToGroup();
                }}
                className="mt-4 space-y-4"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="target-group"
                    className="text-[13px] text-foreground"
                  >
                    Group
                  </Label>
                  {groups.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground">
                      You have no groups yet. Create one first.
                    </p>
                  ) : (
                    <select
                      id="target-group"
                      value={targetGroupId}
                      onChange={(event) => setTargetGroupId(event.target.value)}
                      className="h-10 w-full rounded-lg border border-border/70 bg-card px-3 text-sm text-foreground outline-none focus:border-ring/60 focus:ring-2 focus:ring-ring/20"
                    >
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {addError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {addError}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelected(null)}
                    disabled={adding}
                    className="h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium disabled:cursor-not-allowed"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={adding || !targetGroupId}
                    className="h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium disabled:cursor-not-allowed"
                  >
                    {adding ? "Adding..." : "Add to Group"}
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

export default Friends;
