export const Skeleton = ({ className = "h-4 w-full" }: { className?: string }) => <div className={`skeleton ${className}`} aria-hidden />;

export function EmptyState({ title, body, tone = "light" }: { title: string; body?: string; tone?: "light" | "dark" }) {
  return (
    <div className="grid h-full min-h-[80px] place-content-center gap-1 p-3 text-center" role="status">
      <p className="text-sm font-semibold" style={{ color: tone === "dark" ? "#FFE2A0" : "var(--ink)" }}>{title}</p>
      {body && <p className="max-w-[34ch] text-xs" style={{ color: tone === "dark" ? "#D8C2B6" : "var(--ink-soft)" }}>{body}</p>}
    </div>
  );
}
