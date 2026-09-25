import { formatCurrency, getAvatarTintClass, getInitials } from "../lib/format";

interface MemberCardProps {
  name: string;
  /** Positive → this member is owed. Negative → they owe. */
  balance: number;
  isYou?: boolean;
}

/** One member in the group's member list, with their net balance. */
const MemberCard = ({ name, balance, isYou = false }: MemberCardProps) => {
  const settled = Math.abs(balance) < 0.01;
  const owed = balance > 0;

  const valueClass = settled
    ? "text-muted-foreground"
    : owed
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-rose-600 dark:text-rose-400";

  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold ${getAvatarTintClass(
          name,
        )}`}
      >
        {getInitials(name)}
      </span>

      <p className="min-w-0 flex-1 truncate text-[14px] font-medium text-foreground">
        {name}
        {isYou && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            (you)
          </span>
        )}
      </p>

      <p className={`shrink-0 text-[14px] font-semibold tabular-nums ${valueClass}`}>
        {settled
          ? "Settled up"
          : `${owed ? "+" : "-"} ${formatCurrency(balance)}`}
      </p>
    </div>
  );
};

export default MemberCard;
