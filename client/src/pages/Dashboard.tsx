import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import BalanceSummary from "../components/dashboard/BalanceSummary";
import YourGroups, {
  type LoadStatus,
} from "../components/dashboard/YourGroups";
import type { ShellContext } from "../components/dashboard/AppLayout";
import {
  ApiError,
  clearSession,
  getGroupsWithBalances,
  getToken,
  getUser,
  type Group,
} from "../services/api";
import { getFirstName, getGreeting } from "../lib/format";

/**
 * Dashboard page. Renders inside `AppLayout`, which owns the sidebar,
 * navbar, and the search field's state.
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { query } = useOutletContext<ShellContext>();

  const [groups, setGroups] = useState<Group[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const user = useMemo(() => getUser(), []);

  /* ---------------------------------------------------------------- */
  /* Backend connection — GET /groups on dashboard load               */
  /* ---------------------------------------------------------------- */

  const loadGroups = useCallback(async () => {
    setStatus("loading");
    setError("");

    try {
      const currentUser = getUser();
      if (!currentUser?._id) {
        clearSession();
        navigate("/auth", { replace: true });
        return;
      }

      const data = await getGroupsWithBalances(currentUser._id);
      setGroups(data);
      setUpdatedAt(Date.now());
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

  /* ---------------------------------------------------------------- */
  /* Derived state                                                    */
  /* ---------------------------------------------------------------- */

  const summary = useMemo(() => {
    let youOwe = 0;
    let youAreOwed = 0;

    for (const group of groups) {
      if (group.balance < 0) youOwe += Math.abs(group.balance);
      else youAreOwed += group.balance;
    }

    return { youOwe, youAreOwed, total: youAreOwed - youOwe };
  }, [groups]);

  const visibleGroups = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter((group) => group.name.toLowerCase().includes(term));
  }, [groups, query]);

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground">
          {getGreeting()}, {getFirstName(user?.name)}
        </h1>
        <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
          Here is where your shared expenses stand right now.
        </p>
      </header>

      <BalanceSummary
        youOwe={summary.youOwe}
        youAreOwed={summary.youAreOwed}
        total={summary.total}
        groupCount={groups.length}
        updatedAt={updatedAt}
        loading={status === "loading"}
      />

      <YourGroups
        groups={visibleGroups}
        status={status}
        error={error}
        filtered={query.trim().length > 0}
        onRetry={() => void loadGroups()}
        onCreateGroup={() => navigate("/groups")}
      />
    </div>
  );
};

export default Dashboard;
