import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, LayoutGrid, ListChecks, LineChart, Command } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Home", icon: LayoutGrid, hint: "G H" },
  { to: "/canvas", label: "Canvas", icon: Compass, hint: "G C" },
  { to: "/today", label: "Today", icon: ListChecks, hint: "G T" },
  { to: "/reflect", label: "Reflect", icon: LineChart, hint: "G R" },
] as const;

function pathLabel(p: string) {
  if (p === "/") return "Main_Trajectory / Home";
  if (p.startsWith("/canvas")) return "Main_Trajectory / Roadmap_Canvas";
  if (p.startsWith("/today")) return "Main_Trajectory / Today_Execution";
  if (p.startsWith("/reflect")) return "Main_Trajectory / Reflection_Analytics";
  if (p.startsWith("/goals")) return "Main_Trajectory / Goal_Detail";
  return "Main_Trajectory";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-screen w-full bg-background text-foreground antialiased overflow-hidden">
      {/* Left rail */}
      <nav className="w-16 flex flex-col items-center py-6 border-r border-border bg-background/50 z-30">
        <Link
          to="/"
          className="size-8 bg-brand rounded-full mb-12 grid place-items-center text-background font-serif italic text-lg tracking-tighter"
          aria-label="Trajectory home"
        >
          T
        </Link>

        <div className="flex flex-col gap-2">
          {nav.map(({ to, label, icon: Icon }) => {
            const active =
              to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`group relative size-10 grid place-items-center rounded-md transition-colors ${
                  active
                    ? "text-foreground bg-surface-2"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label={label}
              >
                <Icon className="size-4" strokeWidth={1.6} />
                <span className="pointer-events-none absolute left-12 px-2 py-1 rounded bg-surface border border-border text-[10px] font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col items-center gap-3">
          <div className="size-8 rounded-full bg-surface-2 ring-1 ring-border" />
        </div>
      </nav>

      {/* Main stage */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center px-8 justify-between bg-background/80 backdrop-blur-sm z-20">
          <div className="flex items-center gap-4">
            <span className="label-eyebrow">{pathLabel(pathname)}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-surface/60 border border-border rounded-md">
              <Command className="size-3 text-muted-foreground" strokeWidth={1.6} />
              <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
                Search
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-surface-2 rounded text-foreground/70 font-mono">
                ⌘K
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      </main>
    </div>
  );
}