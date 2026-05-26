import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
  tone = "muted",
}: {
  children: ReactNode;
  className?: string;
  tone?: "muted" | "brand";
}) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] uppercase tracking-widest",
        tone === "muted" ? "text-muted-foreground" : "text-brand",
        className,
      )}
    >
      {children}
    </span>
  );
}