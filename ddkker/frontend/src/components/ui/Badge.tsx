import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "primary"
  | "free"
  | "beginner"
  | "intermediate"
  | "advanced";

const STYLES: Record<BadgeVariant, string> = {
  default:      "bg-surface-card text-ink",
  primary:      "bg-primary text-white",
  free:         "bg-success text-white",
  beginner:     "bg-accent-teal text-white",
  intermediate: "bg-accent-amber text-white",
  advanced:     "bg-primary text-white",
};

export function Badge({
  variant = "default",
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-semibold uppercase tracking-wide",
        STYLES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
