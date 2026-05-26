import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTrajectory } from "@/lib/store";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Check, Play, Pause, RotateCcw, Plus } from "lucide-react";

export const Route = createFileRoute("/today")({
  component: TodayPage,
});

function TodayPage() {
  const tasks = useTrajectory((s) => s.tasks);
  const toggleTask = useTrajectory((s) => s.toggleTask);
  const updateTask = useTrajectory((s) => s.updateTask);
  const addTask = useTrajectory((s) => s.addTask);
  const goals = useTrajectory((s) => s.goals);
  const focusTaskId = useTrajectory((s) => s.focusTaskId);
  const setFocusTask = useTrajectory((s) => s.setFocusTask);
  const logMetric = useTrajectory((s) => s.logMetric);

  const focus = tasks.find((t) => t.id === focusTaskId) ?? tasks[0];

  const columns = [
    { key: "todo" as const, label: "Backlog" },
    { key: "doing" as const, label: "In Motion" },
    { key: "done" as const, label: "Complete" },
  ];

  // Focus timer
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      if (tickRef.current) window.clearInterval(tickRef.current);
      return;
    }
    tickRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          window.clearInterval(tickRef.current!);
          setRunning(false);
          logMetric("focus_minutes", 25);
          return 25 * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [running, logMetric]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const [newTitle, setNewTitle] = useState("");

  return (
    <div className="flex h-full overflow-hidden">
      {/* Focus column */}
      <section className="w-[420px] border-r border-border p-8 flex flex-col gap-10 bg-background overflow-y-auto">
        <div className="space-y-4">
          <Eyebrow>Focus Block</Eyebrow>
          <h1 className="text-3xl font-serif italic leading-tight text-balance">
            {focus?.title ?? "Pick a task to focus on."}
          </h1>
          <p className="text-sm text-muted-foreground">
            One task. One block. Everything else is rearrangement.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface/40 p-8 text-center">
          <Eyebrow>Pomodoro</Eyebrow>
          <div className="font-mono text-6xl tracking-tighter text-foreground mt-3 mb-6 tabular-nums">
            {mm}:{ss}
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setRunning((r) => !r)}
              className="px-4 py-2 bg-brand text-background text-sm font-medium rounded-sm flex items-center gap-2 hover:brightness-110 transition"
            >
              {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              {running ? "Pause" : "Start"}
            </button>
            <button
              onClick={() => {
                setRunning(false);
                setSeconds(25 * 60);
              }}
              className="px-4 py-2 bg-surface border border-border text-sm rounded-sm flex items-center gap-2 hover:border-border-strong transition"
            >
              <RotateCcw className="size-3.5" /> Reset
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <Eyebrow>Quick Add</Eyebrow>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newTitle.trim()) return;
              const t = addTask({
                title: newTitle.trim(),
                due_date: new Date().toISOString().slice(0, 10),
              });
              setFocusTask(t.id);
              setNewTitle("");
            }}
            className="flex gap-2"
          >
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What needs to happen?"
              className="flex-1 bg-surface/40 border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-border-strong"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-foreground text-background rounded-sm"
              aria-label="Add task"
            >
              <Plus className="size-4" />
            </button>
          </form>
        </div>
      </section>

      {/* Kanban */}
      <section className="flex-1 p-8 overflow-y-auto">
        <div className="grid grid-cols-3 gap-6 h-full">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                  <Eyebrow>{col.label}</Eyebrow>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {colTasks.length}
                  </span>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {colTasks.map((t) => {
                    const goal = goals.find((g) => g.id === t.linked_goal_id);
                    return (
                      <div
                        key={t.id}
                        className={`group p-4 rounded-xl border bg-surface/40 hover:border-border-strong transition cursor-pointer ${
                          t.id === focusTaskId
                            ? "border-brand ring-2 ring-brand/20"
                            : "border-border"
                        }`}
                        onClick={() => setFocusTask(t.id)}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTask(t.id);
                            }}
                            className={`mt-0.5 size-4 rounded-full border grid place-items-center shrink-0 transition ${
                              t.status === "done"
                                ? "bg-brand border-brand"
                                : "border-border-strong group-hover:border-brand"
                            }`}
                          >
                            {t.status === "done" && (
                              <Check
                                className="size-2.5 text-background"
                                strokeWidth={3}
                              />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-sm leading-snug ${
                                t.status === "done"
                                  ? "line-through text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {t.title}
                            </div>
                            <div className="mt-2 flex items-center gap-3 flex-wrap">
                              <span className="label-eyebrow">{t.priority}</span>
                              {t.estimated_time && (
                                <span className="label-eyebrow">
                                  {t.estimated_time}m
                                </span>
                              )}
                              {goal && (
                                <span className="text-[10px] font-mono text-brand/80 uppercase">
                                  · {goal.title}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* status quick toggle */}
                          <select
                            value={t.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              updateTask(t.id, {
                                status: e.target.value as
                                  | "todo"
                                  | "doing"
                                  | "done",
                              })
                            }
                            className="opacity-0 group-hover:opacity-100 transition bg-surface border border-border rounded text-[10px] font-mono uppercase px-1 py-0.5"
                          >
                            <option value="todo">todo</option>
                            <option value="doing">doing</option>
                            <option value="done">done</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                  {colTasks.length === 0 && (
                    <div className="text-xs text-muted-foreground font-serif italic px-2 py-6">
                      Nothing here. Good.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}