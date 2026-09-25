import { ChevronRight, Users } from "lucide-react";
import type { Group } from "../services/groupApi";
import {
  formatCurrency,
  formatRelativeTime,
  getAvatarTintClass,
  getInitials,
} from "../lib/format";

interface GroupCardProps {
  group: Group;
  onOpen: (groupId: string) => void;
}

/**
 * One group in the grid: name, member count, balance, and last activity.
 * The whole card is the click target for opening the group.
 */
const GroupCard = ({ group, onOpen }: GroupCardProps) => {
  const settled = Math.abs(group.balance) < 0.01;
  const owed = group.balance > 0;

  const valueClass = settled
    ? "text-muted-foreground"
    : owed
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-rose-600 dark:text-rose-400";

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open ${group.name}`}
      onClick={() => onOpen(group.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(group.id);
        }
      }}
      className="group flex cursor-pointer flex-col rounded-xl border border-border/70 bg-card p-5 transition-[border-color,box-shadow] duration-200 hover:border-border hover:shadow-[0_4px_16px_-8px_rgba(24,25,28,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
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
            Your balance
          </p>
          <p className={`mt-1 text-lg font-semibold tabular-nums ${valueClass}`}>
            {settled
              ? "Settled up"
              : `${owed ? "+" : "-"} ${formatCurrency(group.balance)}`}
          </p>
        </div>
        <ChevronRight className="mb-1 size-4 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </article>
  );
};

export default GroupCard;
