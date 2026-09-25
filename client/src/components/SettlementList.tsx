import type { Settlement } from "../services/settlementApi";
import { formatCurrency } from "../lib/format";

interface SettlementListProps {
  settlements: Settlement[];
}

/** The payments that would clear every balance in the group. */
const SettlementList = ({ settlements }: SettlementListProps) => {
  if (settlements.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-[13px] text-muted-foreground">
        Everyone is settled up. No payments needed.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {settlements.map((settlement, index) => (
        <li
          key={`${settlement.fromId}-${settlement.toId}-${index}`}
          className="flex items-center justify-between gap-3 px-5 py-3.5"
        >
          <p className="min-w-0 truncate text-[13px] text-foreground">
            <span className="font-medium">{settlement.from}</span>
            <span className="text-muted-foreground"> pays </span>
            <span className="font-medium">{settlement.to}</span>
          </p>
          <p className="shrink-0 text-[13px] font-semibold tabular-nums text-foreground">
            {formatCurrency(settlement.amount)}
          </p>
        </li>
      ))}
    </ul>
  );
};

export default SettlementList;
