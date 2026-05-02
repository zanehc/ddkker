import { cn } from "@/lib/utils";
import Link from "next/link";
import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "secondary-dark" | "text" | "youtube";
  size?: "md" | "lg";
  href?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  href,
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes = {
    md: "h-10 px-5 text-sm",
    lg: "h-12 px-7 text-base",
  };

  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary-active",
    secondary:
      "bg-canvas text-ink border border-hairline hover:bg-surface-soft",
    "secondary-dark":
      "bg-surface-dark-elevated text-on-dark hover:bg-surface-dark",
    text: "text-primary hover:underline",
    youtube:
      "bg-youtube-red text-white hover:opacity-90",
  };

  const cls = cn(base, sizes[size], variants[variant], className);

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
