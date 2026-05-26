import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTrajectory } from "@/lib/store";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Check, ArrowUpRight, X } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const goals = useTrajectory((s) => s.goals);
  const tasks = useTrajectory((s) => s.tasks);
  const focusTaskId = useTrajectory((s) => s.focusTaskId);
  const toggleTask = useTrajectory((s) => s.toggleTask);
  const addJournal = useTrajectory((s) => s.addJournal);
  const streak = useTrajectory((s) => s.streakDays);
  const journal = useTrajectory((s) => s.journal);
  const nodes = useTrajectory((s) => s.nodes);

  const focusTask = useMemo(
    () => tasks.find((t) => t.id === focusTaskId) ?? tasks[0],
    [tasks, focusTaskId],
  );

  const upcoming = useMemo(() => {
    return goals
      .filter((g) => g.target_date)
      .sort((a, b) => (a.target_date! < b.target_date! ? -1 : 1))
      .slice(0, 4);
  }, [goals]);

  const [capture, setCapture] = useState("");

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left column — focus + goals + capture */}
      <section className="w-[420px] border-r border-border flex flex-col bg-background overflow-y-auto">
        <div className="p-8 space-y-12">
          {/* Current vector */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Eyebrow>Current Vector</Eyebrow>
              <Eyebrow tone="brand">{streak} day streak</Eyebrow>
            </div>
            <div className="space-y-2">
              <motion.h1
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-3xl font-serif italic text-foreground leading-tight text-balance"
              >
                {focusTask?.title ?? "Choose what matters today."}
              </motion.h1>
              <p className="text-muted-foreground text-sm max-w-[40ch] text-pretty">
                The cornerstone of this week. Keep it singular — execution beats
                arrangement.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => focusTask && toggleTask(focusTask.id)}
                className="bg-brand text-background text-sm font-medium py-2 pr-3 pl-2 flex items-center gap-2 rounded-sm ring-1 ring-brand/20 hover:brightness-110 transition"
              >
                <Check className="size-3.5" strokeWidth={2.5} />
                {focusTask?.status === "done" ? "Completed" : "Mark Complete"}
              </button>
              <button className="bg-surface text-foreground/70 text-sm font-medium py-2 px-4 rounded-sm border border-border hover:border-border-strong transition flex items-center gap-1.5">
                <X className="size-3.5" strokeWidth={2} />
                Decline
              </button>
            </div>
          </div>

          {/* Strategic targets */}
          <div className="space-y-6">
            <Eyebrow>Strategic Targets</Eyebrow>
            <div className="space-y-5">
              {goals.map((g) => (
                <Link
                  key={g.id}
                  to="/goals/$id"
                  params={{ id: g.id }}
                  className={`block space-y-2 group ${
                    g.progress < 20 ? "opacity-60 hover:opacity-100" : ""
                  } transition-opacity`}
                >
                  <div className="flex justify-between items-baseline">
                    <span className="text-foreground font-medium text-sm group-hover:text-brand transition-colors">
                      {g.title}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {g.progress}%
                    </span>
                  </div>
                  <div className="h-1 bg-surface rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${g.progress}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className={`h-full ${
                        g.progress >= 60 ? "bg-brand/70" : "bg-surface-2"
                      }`}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick capture */}
          <div className="pt-2">
            <div className="bg-surface/40 border border-border p-4 rounded-lg focus-within:border-border-strong transition">
              <input
                value={capture}
                onChange={(e) => setCapture(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && capture.trim()) {
                    addJournal({
                      reflections: capture.trim(),
                      tags: ["capture"],
                    });
                    setCapture("");
                  }
                }}
                placeholder="Capture a thought..."
                className="bg-transparent border-none text-foreground w-full focus:outline-none placeholder:text-foreground/30 font-serif italic text-lg"
              />
              <div className="mt-3 flex justify-between items-center">
                <div className="flex gap-2">
                  <span className="text-[10px] font-mono bg-surface px-1.5 py-0.5 rounded text-muted-foreground">
                    #idea
                  </span>
                  <span className="text-[10px] font-mono bg-surface px-1.5 py-0.5 rounded text-muted-foreground">
                    @growth
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground/60">
                  RETURN TO LOG
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Center column — today + upcoming */}
      <section className="flex-1 overflow-y-auto bg-background canvas-dots">
        <div className="p-10 max-w-3xl mx-auto space-y-12">
          {/* Today's focus */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Eyebrow>Today</Eyebrow>
              <Link
                to="/today"
                className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                Enter execution <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="rounded-xl border border-border bg-background/70 backdrop-blur-sm divide-y divide-border">
              {tasks
                .filter((t) => t.due_date)
                .slice(0, 5)
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleTask(t.id)}
                    className="w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-surface/40 transition group"
                  >
                    <span
                      className={`size-4 rounded-full border ${
                        t.status === "done"
                          ? "bg-brand border-brand"
                          : "border-border-strong group-hover:border-brand"
                      } grid place-items-center transition`}
                    >
                      {t.status === "done" && (
                        <Check className="size-2.5 text-background" strokeWidth={3} />
                      )}
                    </span>
                    <span
                      className={`flex-1 text-sm ${
                        t.status === "done"
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {t.title}
                    </span>
                    <span className="label-eyebrow">{t.priority}</span>
                    <span className="label-eyebrow">
                      {t.estimated_time ? `${t.estimated_time}m` : ""}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          {/* Upcoming */}
          <div className="space-y-4">
            <Eyebrow>Upcoming Deadlines</Eyebrow>
            <div className="grid grid-cols-2 gap-3">
              {upcoming.map((g) => (
                <Link
                  key={g.id}
                  to="/goals/$id"
                  params={{ id: g.id }}
                  className="p-5 rounded-xl border border-border bg-surface/40 hover:border-border-strong transition group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Eyebrow>{g.category}</Eyebrow>
                    <span className="label-eyebrow">{g.priority}</span>
                  </div>
                  <div className="font-serif italic text-xl text-foreground mb-2 group-hover:text-brand transition-colors">
                    {g.title}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span>DUE {g.target_date}</span>
                    <span>{g.progress}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent journal */}
          <div className="space-y-4 pb-12">
            <Eyebrow>Recent Log</Eyebrow>
            <div className="space-y-3">
              {journal.slice(0, 3).map((j) => (
                <div
                  key={j.id}
                  className="p-5 rounded-xl border border-border bg-background/40"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Eyebrow>{j.date}</Eyebrow>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      mood {j.mood} · energy {j.energy_level}
                    </span>
                  </div>
                  {j.reflections && (
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {j.reflections}
                    </p>
                  )}
                  {j.lessons_learned && (
                    <p className="mt-2 text-xs italic font-serif text-muted-foreground">
                      “{j.lessons_learned}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Right inspector — graph snapshot */}
      <aside className="w-80 border-l border-border bg-background flex flex-col overflow-hidden">
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <Eyebrow>Graph Snapshot</Eyebrow>
            <Link
              to="/canvas"
              className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Open
            </Link>
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-3xl font-serif italic text-foreground">
                {nodes.length}
              </div>
              <Eyebrow>active nodes</Eyebrow>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(["project", "milestone", "habit", "idea"] as const).map((t) => {
                const count = nodes.filter((n) => n.type === t).length;
                return (
                  <div key={t} className="space-y-1">
                    <div className="text-xl font-medium">{count}</div>
                    <Eyebrow>{t}</Eyebrow>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border pt-6 space-y-3">
              <Eyebrow>Active Milestones</Eyebrow>
              {nodes
                .filter((n) => n.status === "in_progress")
                .map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-md border border-border bg-surface/40"
                  >
                    <Eyebrow tone="brand">{n.type}</Eyebrow>
                    <div className="text-sm text-foreground font-medium mt-1">
                      {n.title}
                    </div>
                    {n.due_date && (
                      <div className="mt-2 text-[10px] font-mono text-muted-foreground">
                        ETA {n.due_date}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <Link
            to="/today"
            className="block w-full text-center py-2 bg-foreground text-background text-sm font-medium rounded-sm ring-1 ring-white/10 hover:bg-foreground/90 transition"
          >
            Begin Execution Block
          </Link>
        </div>
      </aside>
    </div>
  );
}
