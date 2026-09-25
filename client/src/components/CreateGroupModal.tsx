import { useState, type FormEvent } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resolves once the group exists. Rejects with the reason to show inline. */
  onCreate: (name: string) => Promise<void>;
}

/**
 * "Create New Group" dialog: a single name field.
 * The parent owns the API call so the new group lands straight in its list.
 */
const CreateGroupModal = ({
  open,
  onOpenChange,
  onCreate,
}: CreateGroupModalProps) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Group name is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await onCreate(trimmed);
      onOpenChange(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not create the group.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[2px]" />

        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border/70 bg-card p-5 shadow-xl">
          <Dialog.Title className="text-base font-semibold tracking-[-0.01em] text-foreground">
            Create New Group
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="group-name"
                className="text-[13px] text-foreground"
              >
                Group Name
              </Label>
              <Input
                id="group-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Goa Trip"
                maxLength={20}
                autoFocus
                aria-invalid={error ? true : undefined}
                className="h-10 px-3 text-sm"
              />
              {error && (
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  {error}
                </p>
              )}
            </div>

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
                disabled={submitting || name.trim().length === 0}
                className="h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium disabled:cursor-not-allowed"
              >
                {submitting ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CreateGroupModal;
