import { Bell, Menu, Search } from "lucide-react";
import { getInitials } from "../../lib/format";

interface NavbarProps {
  userName: string;
  userEmail: string;
  unreadCount?: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onOpenSidebar: () => void;
}

const Navbar = ({
  userName,
  userEmail,
  unreadCount = 0,
  searchValue,
  onSearchChange,
  onOpenSidebar,
}: NavbarProps) => {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile: navigation trigger + compact logo */}
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          className="-ml-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu className="size-[18px]" />
        </button>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-[13px] font-semibold text-background">
            S
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            SplitEase
          </span>
        </div>

        {/* Search — filters the group list on this page */}
        <div className="relative hidden min-w-0 flex-1 sm:block sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search groups"
            aria-label="Search groups"
            className="h-10 w-full rounded-lg border border-border/70 bg-card pl-9 pr-3 text-sm text-foreground shadow-[0_1px_2px_rgba(24,25,28,0.03)] outline-none transition-colors placeholder:text-muted-foreground/80 focus:border-ring/60 focus:ring-2 focus:ring-ring/20"
          />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          {/* Mobile search affordance */}
          <button
            type="button"
            aria-label="Search groups"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
          >
            <Search className="size-[18px]" />
          </button>

          <button
            type="button"
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
            className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Bell className="size-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-[var(--auth-accent)] px-1 text-[10px] font-semibold leading-4 text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <span className="mx-1 hidden h-6 w-px bg-border/70 sm:block" />

          <button
            type="button"
            className="flex items-center gap-2.5 rounded-lg p-1 transition-colors hover:bg-muted/70 sm:pr-2.5"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
              {getInitials(userName)}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-[9rem] truncate text-[13px] font-medium text-foreground">
                {userName}
              </span>
              <span className="block max-w-[9rem] truncate text-[11px] text-muted-foreground">
                {userEmail}
              </span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
