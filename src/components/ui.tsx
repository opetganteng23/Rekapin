import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "border border-border bg-surface text-text hover:bg-bg",
  ghost: "text-muted hover:bg-bg hover:text-text",
  danger: "bg-danger text-white hover:opacity-90",
};

export function Button({
  variant = "primary",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cx(
        "inline-flex h-11 items-center justify-center gap-2 rounded-input px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
    >
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
}

export function Field({
  label,
  error,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = props.id ?? props.name;
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-xs font-medium text-text">{label}</label>
      <input
        id={id}
        {...props}
        aria-invalid={!!error}
        className="h-11 w-full rounded-input border border-border bg-surface px-3 text-sm text-text placeholder:text-muted/70 focus:border-primary disabled:bg-bg"
      />
      {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx("rounded-card border border-border bg-surface p-5 shadow-sm sm:p-6", className)}>{children}</section>;
}

export function Alert({ tone, children }: { tone: "error" | "success" | "warning"; children: ReactNode }) {
  const tones = {
    error: "bg-danger/10 text-danger",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-[#8a5f0a]",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cx("rounded-input px-3 py-2.5 text-sm", tones[tone])}>
      {children}
    </div>
  );
}

const badge = {
  approved: ["Disetujui", "bg-success/10 text-success"],
  pending: ["Menunggu", "bg-warning/15 text-[#8a5f0a]"],
  rejected: ["Ditolak", "bg-danger/10 text-danger"],
} as const;

export function StatusBadge({ status }: { status: keyof typeof badge }) {
  const [label, cls] = badge[status];
  return <span className={cx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", cls)}>{label}</span>;
}
