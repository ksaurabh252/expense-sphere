import { useState, type FormEvent } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import type { ExpensePayload, GroupMember } from "../services/groupApi";
import { formatCurrency } from "../lib/format";

type SplitType = "equal" | "unequal" | "percentage";

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  members: GroupMember[];
  currentUserId: string;
  /** Resolves once the expense exists. Rejects with the reason to show inline. */
  onCreate: (payload: ExpensePayload) => Promise<void>;
}

/**
 * "Add Expense" dialog. Equal, unequal and percentage splits all live here.
 * Mounted only while open, so every visit starts from a clean form.
 */
const AddExpenseModal = ({
  open,
  onOpenChange,
  groupId,
  members,
  currentUserId,
  onCreate,
}: AddExpenseModalProps) => {
  // Form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(currentUserId || members[0]?.id || "");

  // By default, all group members are selected.
  const [participants, setParticipants] = useState<string[]>(
    members.map((member) => member.id),
  );

  const [splitType, setSplitType] = useState<SplitType>("equal");

  // Store custom amounts/percentages using userId as the key.
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [percents, setPercents] = useState<Record<string, string>>({});

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Get only the members selected for this expense.
  const selectedMembers = members.filter((member) =>
    participants.includes(member.id),
  );

  const total = Number(amount);

  // Calculate the entered amount total for unequal split.
  const amountSum = selectedMembers.reduce(
    (sum, member) => sum + (Number(amounts[member.id]) || 0),
    0,
  );

  // Calculate the entered percentage total.
  const percentSum = selectedMembers.reduce(
    (sum, member) => sum + (Number(percents[member.id]) || 0),
    0,
  );

  // Add/remove a member from the expense participants.
  const toggleParticipant = (memberId: string) => {
    setParticipants((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  const changeSplitType = (next: SplitType) => {
    setSplitType(next);

    // Reset custom values when switching split type.
    setAmounts({});
    setPercents({});
    setError("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmed = description.trim();

    // Basic form validation.
    if (!trimmed) {
      setError("Description is required.");
      return;
    }

    if (!Number.isFinite(total) || total <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    if (!paidBy) {
      setError("Select who paid.");
      return;
    }

    if (selectedMembers.length === 0) {
      setError("Pick at least one participant.");
      return;
    }

    // For unequal split, individual amounts must equal the total expense.
    if (
      splitType === "unequal" &&
      Math.round(amountSum) !== Math.round(total)
    ) {
      setError(
        `Total must equal ${formatCurrency(total)} — currently ${formatCurrency(amountSum)}.`,
      );
      return;
    }

    // For percentage split, percentages must add up to 100%.
    if (splitType === "percentage" && percentSum !== 100) {
      setError(`Total percentage must be 100% — currently ${percentSum}%.`);
      return;
    }

    // Equal split does not need individual split values.
    // Unequal and percentage splits send their respective values.
    const splits =
      splitType === "equal"
        ? undefined
        : selectedMembers.map((member) =>
          splitType === "unequal"
            ? {
              userId: member.id,
              amount: Number(amounts[member.id]) || 0,
            }
            : {
              userId: member.id,
              percent: Number(percents[member.id]) || 0,
            },
        );

    setSubmitting(true);
    setError("");

    try {
      // Send the validated expense data to the parent/API handler.
      await onCreate({
        groupId,
        description: trimmed,
        amount: total,
        paidBy,
        splitType,
        participants,
        ...(splits ? { splits } : {}),
      });

      // Close the modal after successful creation.
      onOpenChange(false);
    } catch (caught) {
      // Show API/server error inside the modal.
      setError(
        caught instanceof Error ? caught.message : "Could not add the expense.",
      );
    } finally {
      // Re-enable the submit button whether the request succeeds or fails.
      setSubmitting(false);
    }
  };

  const shareInputClass =
    "h-9 w-24 rounded-lg border border-border/70 bg-card px-2.5 text-right text-sm text-foreground outline-none focus:border-ring/60 focus:ring-2 focus:ring-ring/20";

  // Used to show whether custom split values are currently balanced.
  const unequalBalanced =
    total > 0 && Math.round(amountSum) === Math.round(total);

  const percentageBalanced = percentSum === 100;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[2px]" />

        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border/70 bg-card p-5 shadow-xl">
          <Dialog.Title className="text-base font-semibold tracking-[-0.01em] text-foreground">
            Add Expense
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="expense-description"
                className="text-[13px] text-foreground"
              >
                Description
              </Label>

              <Input
                id="expense-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Dinner"
                autoFocus
                className="h-10 px-3 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="expense-amount"
                className="text-[13px] text-foreground"
              >
                Amount
              </Label>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ₹
                </span>

                <Input
                  id="expense-amount"
                  type="number"
                  min="0"
                  step="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="1200"
                  className="h-10 pl-7 pr-3 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="expense-paid-by"
                className="text-[13px] text-foreground"
              >
                Paid by
              </Label>

              <select
                id="expense-paid-by"
                value={paidBy}
                onChange={(event) => setPaidBy(event.target.value)}
                className="h-10 w-full rounded-lg border border-border/70 bg-card px-3 text-sm text-foreground outline-none focus:border-ring/60 focus:ring-2 focus:ring-ring/20"
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] text-foreground">
                Split between
              </Label>

              <div className="rounded-lg border border-border/70 py-1">
                {members.map((member) => (
                  <label
                    key={member.id}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={participants.includes(member.id)}
                      onChange={() => toggleParticipant(member.id)}
                      className="size-4 cursor-pointer accent-(--auth-accent)"
                    />

                    <span className="text-[13px] text-foreground">
                      {member.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="expense-split-type"
                className="text-[13px] text-foreground"
              >
                Split Type
              </Label>

              <select
                id="expense-split-type"
                value={splitType}
                onChange={(event) =>
                  changeSplitType(event.target.value as SplitType)
                }
                className="h-10 w-full rounded-lg border border-border/70 bg-card px-3 text-sm text-foreground outline-none focus:border-ring/60 focus:ring-2 focus:ring-ring/20"
              >
                <option value="equal">Equal</option>
                <option value="unequal">Unequal</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>

            {selectedMembers.length > 0 && (
              <div className="space-y-2">
                <Label className="text-[13px] text-foreground">
                  {splitType === "percentage"
                    ? "Share (%)"
                    : splitType === "unequal"
                      ? "Share (₹)"
                      : "Each person pays"}
                </Label>

                <div className="divide-y divide-border/60 rounded-lg border border-border/70">
                  {selectedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <span className="min-w-0 truncate text-[13px] text-foreground">
                        {member.name}
                      </span>

                      {splitType === "equal" && (
                        <span className="shrink-0 text-[13px] font-medium tabular-nums text-muted-foreground">
                          {total > 0
                            ? formatCurrency(total / selectedMembers.length)
                            : "—"}
                        </span>
                      )}

                      {splitType === "unequal" && (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={amounts[member.id] ?? ""}
                          onChange={(event) =>
                            setAmounts((prev) => ({
                              ...prev,
                              [member.id]: event.target.value,
                            }))
                          }
                          placeholder="0"
                          aria-label={`Amount for ${member.name}`}
                          className={shareInputClass}
                        />
                      )}

                      {splitType === "percentage" && (
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-[13px] tabular-nums text-muted-foreground">
                            {total > 0
                              ? formatCurrency(
                                (total * (Number(percents[member.id]) || 0)) /
                                100,
                              )
                              : "—"}
                          </span>

                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={percents[member.id] ?? ""}
                            onChange={(event) =>
                              setPercents((prev) => ({
                                ...prev,
                                [member.id]: event.target.value,
                              }))
                            }
                            placeholder="0"
                            aria-label={`Percentage for ${member.name}`}
                            className={shareInputClass}
                          />

                          <span className="text-[13px] text-muted-foreground">
                            %
                          </span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {splitType !== "equal" && (
                  <p
                    className={`text-xs tabular-nums ${(
                        splitType === "unequal"
                          ? unequalBalanced
                          : percentageBalanced
                      )
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                      }`}
                  >
                    {splitType === "unequal"
                      ? `Total: ${formatCurrency(amountSum)} / ${formatCurrency(total || 0)}`
                      : `Total: ${percentSum}% / 100%`}
                  </p>
                )}
              </div>
            )}

            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium disabled:cursor-not-allowed"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={submitting}
                className="h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium disabled:cursor-not-allowed"
              >
                {submitting ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AddExpenseModal;
