import { Construction } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description?: string;
}

/**
 * Stand-in page for routes that exist in the navigation but are not built yet.
 * Keeps every sidebar link resolvable instead of 404-ing.
 */
const Placeholder = ({ title, description }: PlaceholderProps) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-card px-6 py-20 text-center">
    <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
      <Construction className="size-5" />
    </span>
    <h1 className="mt-4 text-base font-semibold tracking-[-0.01em] text-foreground">
      {title}
    </h1>
    <p className="mt-2 max-w-sm text-[13px] leading-6 text-muted-foreground">
      {description ??
        `${title} is not built yet. This route exists so the sidebar navigation resolves.`}
    </p>
  </div>
);

export default Placeholder;
