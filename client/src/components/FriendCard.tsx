import { UserPlus } from "lucide-react";
import { Button } from "./ui/button";
import type { Friend } from "../services/friendApi";
import { getAvatarTintClass, getInitials } from "../lib/format";

interface FriendCardProps {
  friend: Friend;
  onAddToGroup: (friend: Friend) => void;
}

/** One person, with the action to put them into one of your groups. */
const FriendCard = ({ friend, onAddToGroup }: FriendCardProps) => (
  <div className="flex items-center gap-3 px-5 py-4">
    <span
      className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold ${getAvatarTintClass(
        friend.id,
      )}`}
    >
      {getInitials(friend.name)}
    </span>

    <div className="min-w-0 flex-1">
      <p className="truncate text-[14px] font-medium text-foreground">
        {friend.name}
      </p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {friend.email || "No email on file"}
      </p>
    </div>

    <Button
      type="button"
      variant="outline"
      onClick={() => onAddToGroup(friend)}
      className="h-8 shrink-0 cursor-pointer rounded-lg px-3 text-[12px] font-medium"
    >
      <UserPlus className="size-3.5" />
      Add to Group
    </Button>
  </div>
);

export default FriendCard;
