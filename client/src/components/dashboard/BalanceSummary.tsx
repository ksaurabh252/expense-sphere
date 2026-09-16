import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatRelativeTime } from "../../lib/format";

interface BalanceSummaryProps {
  youOwe: number;
  youAreOwed: number;
  total: number;
  groupCount: number;
  /** Timestamp of the last successful `GET /groups`. */
  updatedAt: number | null;
  loading: boolean;
}

interface MetricProps {
  label: string;
  amount: number;
  icon: typeof ArrowUpRight;
  iconClass: string;
  valueClass: string;
}

const Metric = ({
  label,
  amount,
  icon: Icon,
  iconClass,
  valueClass,
}: MetricProps) => (
  <div>
    <div className="flex items-center gap-2">
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-md ${iconClass}`}
      >
        <Icon className="size-3.5" />
      </span>
      <span className="text-[13px] font-medium text-muted-foreground">
        {label}
      </span>
    </div>
    <p
      className={`mt-3 text-2xl font-semibold tabular-nums tracking-[-0.02em] ${valueClass}`}
    >
      {formatCurrency(amount)}
    </p>
  </div>
);

const BalanceSummary = ({
  youOwe,
  youAreOwed,
  total,
  groupCount,
  updatedAt,
  loading,
}: BalanceSummaryProps) => {
  if (loading) {
    return (
      <section className="animate-pulse rounded-2xl border border-border/70 bg-card p-6 sm:p-7">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-10">
          <div className="lg:w-[38%]">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="mt-4 h-9 w-40 rounded bg-muted" />
            <div className="mt-4 h-3 w-52 rounded bg-muted" />
          </div>
          <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
            {[0, 1].map((key) => (
              <div key={key}>
                <div className="h-7 w-32 rounded bg-muted" />
                <div className="mt-4 h-6 w-24 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const settled = Math.abs(total) < 0.01;

  const status = settled
    ? {
        label: "All settled up",
        className:
          "bg-muted text-muted-foreground",
      }
    : total > 0
      ? {
          label: "You are owed",
          className:
            "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-400",
        }
      : {
          label: "You owe",
          className:
            "bg-rose-50 text-rose-700 dark:bg-rose-500/12 dark:text-rose-400",
        };

  return (
    <section className="rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(24,25,28,0.04)]">
      <div className="flex flex-col gap-8 p-6 sm:p-7 lg:flex-row lg:items-center lg:gap-10">
        {/* Dominant region — the one number that matters most */}
        <div className="lg:w-[38%] lg:shrink-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-muted-foreground">
            Total balance
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-[38px] font-semibold leading-none tabular-nums tracking-[-0.035em] text-foreground">
              {formatCurrency(total)}
            </p>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${status.className}`}
            >
              {status.label}
            </span>
          </div>
          <p className="mt-4 text-[13px] leading-6 text-muted-foreground">
            Across {groupCount} {groupCount === 1 ? "group" : "groups"}
            {updatedAt ? ` · Updated ${formatRelativeTime(updatedAt)}` : ""}
          </p>
        </div>

        <div className="hidden h-20 w-px shrink-0 bg-border/70 lg:block" />
        <div className="h-px w-full bg-border/70 lg:hidden" />

        <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
          <Metric
            label="You owe"
            amount={youOwe}
            icon={ArrowUpRight}
            iconClass="bg-rose-50 text-rose-600 dark:bg-rose-500/12 dark:text-rose-400"
            valueClass="text-foreground"
          />
          <Metric
            label="You are owed"
            amount={youAreOwed}
            icon={ArrowDownLeft}
            iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/12 dark:text-emerald-400"
            valueClass="text-foreground"
          />
        </div>
      </div>
    </section>
  );
};

export default BalanceSummary;
