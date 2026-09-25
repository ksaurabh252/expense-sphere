import type { GroupExpense } from "../services/groupApi";
import { formatCurrency } from "../lib/format";

interface ExpenseCardProps {
  expense: GroupExpense;
}

/** One expense: what it was, who paid, and how it was split. */
const ExpenseCard = ({ expense }: ExpenseCardProps) => (
  <div className="px-5 py-4">
    <div className="flex items-start justify-between gap-3">
      <h3 className="min-w-0 truncate text-[14px] font-semibold text-foreground">
        {expense.description}
      </h3>
      <p className="shrink-0 text-[14px] font-semibold tabular-nums text-foreground">
        {formatCurrency(expense.amount)}
      </p>
    </div>

    <p className="mt-1 text-[13px] text-muted-foreground">
      {expense.paidByName} paid
    </p>

    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>
        {expense.participantCount}{" "}
        {expense.participantCount === 1 ? "participant" : "participants"}
      </span>
      <span className="size-1 shrink-0 rounded-full bg-border" />
      <span className="capitalize">{expense.splitType} split</span>
    </p>
  </div>
);

export default ExpenseCard;
