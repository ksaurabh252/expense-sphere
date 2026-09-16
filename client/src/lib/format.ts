/**
 * Presentation helpers shared across the dashboard.
 * Keeping them here avoids three different date formats on one screen.
 */

const LOCALE = "en-IN";
const CURRENCY = "INR";

/** `2480` → `₹2,480` · `1240.5` → `₹1,240.5` · always unsigned. */
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 1000 * 60 * 60 * 24 * 365],
  ["month", 1000 * 60 * 60 * 24 * 30],
  ["week", 1000 * 60 * 60 * 24 * 7],
  ["day", 1000 * 60 * 60 * 24],
  ["hour", 1000 * 60 * 60],
  ["minute", 1000 * 60],
];

/** `"2026-09-15T09:40:00Z"` → `"2 hours ago"` */
export const formatRelativeTime = (
  value: string | number | Date | null | undefined,
): string => {
  if (!value) return "No activity yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No activity yet";

  const diff = date.getTime() - Date.now();
  const distance = Math.abs(diff);

  if (distance < 60_000) return "Just now";

  const formatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  for (const [unit, ms] of RELATIVE_UNITS) {
    if (distance >= ms) {
      return formatter.format(Math.round(diff / ms), unit);
    }
  }

  return "Just now";
};

/** `"Goa Trip 2026"` → `"GT"` */
export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

/** `"Saurabh"` → `"Saurabh"` · `"Saurabh Mehta"` → `"Saurabh"` */
export const getFirstName = (name: string | undefined): string => {
  if (!name) return "there";
  return name.trim().split(/\s+/)[0] || "there";
};

export const getGreeting = (date = new Date()): string => {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

/** Groups are tinted deterministically so a card keeps its colour across loads. */
export const getAvatarTintClass = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  }
  return hash % 3 === 0 ? "avatar-tint-accent" : "avatar-tint-neutral";
};
