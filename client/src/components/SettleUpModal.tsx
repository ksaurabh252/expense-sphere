import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import type { GroupMember } from "../services/groupApi";

interface SettleUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: GroupMember[];
  currentUserId: string;
  /** Resolves once the payment is saved. Rejects with the reason to show inline. */
  onSettle: (to: string, amount: number) => Promise<void>;
}

/**
 * Modal for recording a payment made to another group member.
 */
const SettleUpModal = ({
  open,
  onOpenChange,
  members,
  currentUserId,
  onSettle,
}: SettleUpModalProps) => {
  // Exclude the current user from the list of members they can pay.
  const others = members.filter((member) => member.id !== currentUserId);

  const [to, setTo] = useState(others[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Validate and save the settlement.
  const handleSubmit = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const value = Number(amount);

    if (others.length === 0) {
      setError("There is no other member to settle with.");
      return;
    }

    if (!to) {
      setError("Pick who you paid.");
      return;
    }

    if (!Number.isFinite(value) || value <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await onSettle(to, value);

      // Close the modal after the settlement is saved.
      onOpenChange(false);
    } catch (caught) {
      // Show API/server error inside the modal.
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save the payment.",
      );
    } finally {
      // Re-enable the form after the request completes.
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[2px]" />

        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border/70 bg-card p-5 shadow-xl">
          <Dialog.Title className="text-base font-semibold tracking-[-0.01em] text-foreground">
            Settle Up
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="settle-to"
                className="text-[13px] text-foreground"
              >
                You paid
              </Label>

              <select
                id="settle-to"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                disabled={submitting || others.length === 0}
                className="h-10 w-full rounded-lg border border-border/70 bg-card px-3 text-sm text-foreground outline-none focus:border-ring/60 focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {others.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="settle-amount"
                className="text-[13px] text-foreground"
              >
                Amount
              </Label>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ₹
                </span>

                <Input
                  id="settle-amount"
                  type="number"
                  min="0"
                  step="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="400"
                  autoFocus
                  disabled={submitting}
                  className="h-10 pl-7 pr-3 text-sm"
                />
              </div>
            </div>

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
                disabled={submitting || others.length === 0}
                className="h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium disabled:cursor-not-allowed"
              >
                {submitting ? "Saving..." : "Settle Up"}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SettleUpModal;