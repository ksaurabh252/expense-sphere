import { useEffect } from "react";
import { NavLink } from "react-router";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { getInitials } from "../../lib/format";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  unreadCount?: number;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/groups", label: "Groups", icon: Users },
  { to: "/friends", label: "Friends", icon: UserPlus },
  { to: "/notifications", label: "Notifications", icon: Bell, showsBadge: true },
  { to: "/profile", label: "Profile", icon: User },
] as const;

interface SidebarBodyProps {
  userName: string;
  userEmail: string;
  unreadCount: number;
  onNavigate: () => void;
  onLogout: () => void;
}

const SidebarBody = ({
  userName,
  userEmail,
  unreadCount,
  onNavigate,
  onLogout,
}: SidebarBodyProps) => (
  <>
    <div className="flex h-16 shrink-0 items-center gap-2 px-5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-[13px] font-semibold text-background">
        S
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        SplitEase
      </span>
    </div>

    <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Main">
      <ul className="space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                [
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
                  isActive
                    ? "bg-foreground/[0.055] font-medium text-foreground"
                    : "font-normal text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-4.5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--auth-accent)]" />
                  )}
                  <item.icon className="size-[18px] shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {"showsBadge" in item && item.showsBadge && unreadCount > 0 && (
                    <span className="flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-medium leading-5 text-muted-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>

    <div className="shrink-0 border-t border-border/70 p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
          {getInitials(userName)}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13px] font-medium text-foreground">
            {userName}
          </span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {userEmail}
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted/70 hover:text-foreground"
      >
        <LogOut className="size-[18px] shrink-0" />
        <span>Log out</span>
      </button>
    </div>
  </>
);

const Sidebar = ({
  open,
  onClose,
  userName,
  userEmail,
  unreadCount = 0,
  onLogout,
}: SidebarProps) => {
  // Escape closes the mobile drawer; lock body scroll while it is open.
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const sharedProps = { userName, userEmail, unreadCount, onLogout };

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border/70 bg-card lg:flex">
        <SidebarBody {...sharedProps} onNavigate={() => undefined} />
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          open ? "" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div
          onClick={onClose}
          className={`absolute inset-0 bg-foreground/25 backdrop-blur-[2px] transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={`absolute inset-y-0 left-0 flex w-64 flex-col bg-card shadow-xl transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="absolute right-3 top-4 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
          <SidebarBody {...sharedProps} onNavigate={onClose} />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
