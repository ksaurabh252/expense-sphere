import type { ReactNode } from "react";
import {
  AlertCircle,
  ChevronRight,
  Plus,
  RefreshCw,
  SearchX,
  Users,
} from "lucide-react";
import { Button } from "../ui/button";
import type { Group } from "../../services/api";
import {
  formatCurrency,
  formatRelativeTime,
  getAvatarTintClass,
  getInitials,
} from "../../lib/format";

export type LoadStatus = "loading" | "ready" | "error";

interface YourGroupsProps {
  groups: Group[];
  status: LoadStatus;
  error: string;
  /** True when a search term is active but nothing matched. */
  filtered: boolean;
  onRetry: () => void;
  onCreateGroup: () => void;
}

/* ------------------------------------------------------------------------- */

interface BalancePresentation {
  label: string;
  valueClass: string;
}

const getBalancePresentation = (balance: number): BalancePresentation => {
  if (Math.abs(balance) < 0.01) {
    return { label: "Settled up", valueClass: "text-muted-foreground" };
  }
  if (balance > 0) {
    return { label: "You are owed", valueClass: "text-emerald-600 dark:text-emerald-400" };
  }
  return { label: "You owe", valueClass: "text-rose-600 dark:text-rose-400" };
};

const GroupCard = ({ group }: { group: Group }) => {
  const balance = getBalancePresentation(group.balance);

  return (
    <article className="group flex flex-col rounded-xl border border-border/70 bg-card p-5 transition-[border-color,box-shadow] duration-200 hover:border-border hover:shadow-[0_4px_16px_-8px_rgba(24,25,28,0.16)]">
      <div className="flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold ${getAvatarTintClass(
            group.id,
          )}`}
        >
          {getInitials(group.name)}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-foreground">
            {group.name}
          </h3>
          <p className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {group.memberCount}{" "}
              {group.memberCount === 1 ? "member" : "members"}
            </span>
            <span className="size-1 shrink-0 rounded-full bg-border" />
            <span className="truncate">
              {formatRelativeTime(group.lastActivityAt)}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between border-t border-border/60 pt-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {balance.label}
          </p>
          <p
            className={`mt-1 text-lg font-semibold tabular-nums ${balance.valueClass}`}
          >
            {formatCurrency(group.balance)}
          </p>
        </div>
        <ChevronRight className="mb-1 size-4 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </article>
  );
};

/* ------------------------------------------------------------------------- */

const GroupCardSkeleton = () => (
  <div className="animate-pulse rounded-xl border border-border/70 bg-card p-5">
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
);

const StatePanel = ({
  icon: Icon,
  tone,
  title,
  description,
  action,
}: {
  icon: typeof Users;
  tone: "neutral" | "danger";
  title: string;
  description: string;
  action?: ReactNode;
}) => (
  <div
    className={`flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-14 text-center ${
      tone === "danger"
        ? "border-rose-200 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/[0.04]"
        : "border-border/70 bg-card"
    }`}
  >
    <span
      className={`flex size-11 items-center justify-center rounded-xl ${
        tone === "danger"
          ? "bg-rose-100 text-rose-600 dark:bg-rose-500/12 dark:text-rose-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <Icon className="size-5" />
    </span>
    <h3 className="mt-4 text-base font-semibold tracking-[-0.01em] text-foreground">
      {title}
    </h3>
    <p className="mt-2 max-w-sm text-[13px] leading-6 text-muted-foreground">
      {description}
    </p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);

/* ------------------------------------------------------------------------- */

const YourGroups = ({
  groups,
  status,
  error,
  filtered,
  onRetry,
  onCreateGroup,
}: YourGroupsProps) => {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">
            Your groups
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {status === "ready"
              ? `${groups.length} ${groups.length === 1 ? "group" : "groups"} with shared activity`
              : "Loading your shared expense groups"}
          </p>
        </div>

        <Button
          type="button"
          onClick={onCreateGroup}
          className="h-9 shrink-0 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium"
        >
          <Plus className="size-4" />
          New group
        </Button>
      </div>

      {status === "loading" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <GroupCardSkeleton key={key} />
          ))}
        </div>
      )}

      {status === "error" && (
        <StatePanel
          icon={AlertCircle}
          tone="danger"
          title="Couldn't load your groups"
          description={error}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={onRetry}
              className="h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium"
            >
              <RefreshCw className="size-4" />
              Try again
            </Button>
          }
        />
      )}

      {status === "ready" && groups.length === 0 && filtered && (
        <StatePanel
          icon={SearchX}
          tone="neutral"
          title="No matching groups"
          description="No group matches your search. Try a different name, or clear the search field."
        />
      )}

      {status === "ready" && groups.length === 0 && !filtered && (
        <StatePanel
          icon={Users}
          tone="neutral"
          title="No groups yet"
          description="Create your first group to start splitting rent, trips, and everyday expenses with the people you share them with."
          action={
            <Button
              type="button"
              onClick={onCreateGroup}
              className="h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium"
            >
              <Plus className="size-4" />
              New group
            </Button>
          }
        />
      )}

      {status === "ready" && groups.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </section>
  );
};

export default YourGroups;
