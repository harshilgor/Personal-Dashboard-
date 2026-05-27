import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const timeEntries = useTrajectory((s) => s.timeEntries);
  const logTime = useTrajectory((s) => s.logTime);
  const removeTimeEntry = useTrajectory((s) => s.removeTimeEntry);

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
          if (focus) {
            logTime({
              task_id: focus.id,
              goal_id: focus.linked_goal_id,
              label: focus.title,
              minutes: 25,
            });
          }
          return 25 * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [running, logMetric, logTime, focus]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const [newTitle, setNewTitle] = useState("");

  return (
    <div className="flex h-full overflow-hidden">
      {/* Focus column */}
      <section className="w-[380px] border-r border-border p-8 flex flex-col gap-10 bg-background overflow-y-auto shrink-0">
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
      <section className="flex-1 p-8 overflow-y-auto min-w-0">
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

      {/* Time tracker */}
      <TimeTrackerPanel
        entries={timeEntries}
        goals={goals}
        tasks={tasks}
        focusId={focus?.id}
        focusLabel={focus?.title}
        focusGoalId={focus?.linked_goal_id}
        onLog={logTime}
        onRemove={removeTimeEntry}
      />
    </div>
  );
}

// ---- Time tracker panel -----------------------------------------------------

type Goal = { id: string; title: string };
type Task = { id: string; title: string; linked_goal_id?: string };
type Entry = {
  id: string;
  task_id?: string;
  goal_id?: string;
  label: string;
  minutes: number;
  date: string;
};

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function fmt(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function TimeTrackerPanel({
  entries,
  goals,
  tasks,
  focusId,
  focusLabel,
  focusGoalId,
  onLog,
  onRemove,
}: {
  entries: Entry[];
  goals: Goal[];
  tasks: Task[];
  focusId?: string;
  focusLabel?: string;
  focusGoalId?: string;
  onLog: (e: {
    task_id?: string;
    goal_id?: string;
    label: string;
    minutes: number;
  }) => void;
  onRemove: (id: string) => void;
}) {
  const [range, setRange] = useState<"day" | "week" | "month">("day");
  const [minutes, setMinutes] = useState("25");
  const [label, setLabel] = useState("");
  const [taskId, setTaskId] = useState<string>(focusId ?? "");

  useEffect(() => {
    if (focusId && !taskId) setTaskId(focusId);
  }, [focusId, taskId]);

  const { filtered, totalMin } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    let cutoff: Date;
    if (range === "day") {
      cutoff = new Date(todayStr);
    } else if (range === "week") {
      cutoff = startOfWeek(now);
    } else {
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const cutStr = cutoff.toISOString().slice(0, 10);
    const f = entries.filter((e) => e.date >= cutStr);
    const total = f.reduce((s, e) => s + e.minutes, 0);
    return { filtered: f, totalMin: total };
  }, [entries, range]);

  const byGoal = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((e) => {
      const k = e.goal_id ?? "unassigned";
      map.set(k, (map.get(k) ?? 0) + e.minutes);
    });
    return Array.from(map.entries())
      .map(([gid, mins]) => ({
        id: gid,
        title: goals.find((g) => g.id === gid)?.title ?? "Unassigned",
        minutes: mins,
      }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [filtered, goals]);

  const byTask = useMemo(() => {
    const map = new Map<string, { label: string; minutes: number }>();
    filtered.forEach((e) => {
      const k = e.task_id ?? e.label;
      const prev = map.get(k);
      map.set(k, {
        label: e.label,
        minutes: (prev?.minutes ?? 0) + e.minutes,
      });
    });
    return Array.from(map.entries())
      .map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 8);
  }, [filtered]);

  const recent = useMemo(
    () => [...entries].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6),
    [entries],
  );

  const handleQuickLog = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseInt(minutes, 10);
    if (!m || m <= 0) return;
    const task = tasks.find((t) => t.id === taskId);
    onLog({
      task_id: task?.id,
      goal_id: task?.linked_goal_id ?? focusGoalId,
      label: label.trim() || task?.title || focusLabel || "Untracked",
      minutes: m,
    });
    setLabel("");
    setMinutes("25");
  };

  const maxGoal = byGoal[0]?.minutes ?? 1;
  const maxTask = byTask[0]?.minutes ?? 1;

  return (
    <aside className="w-[360px] border-l border-border bg-background flex flex-col shrink-0">
      <div className="p-6 border-b border-border">
        <Eyebrow>Time Ledger</Eyebrow>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-serif italic text-4xl text-foreground">
            {fmt(totalMin)}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            this {range}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-1 p-1 bg-surface/40 border border-border rounded-md">
          {(["day", "week", "month"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2 py-1.5 text-[10px] font-mono uppercase tracking-widest rounded transition ${
                range === r
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-3 border-b border-border">
          <Eyebrow>By Goal</Eyebrow>
          {byGoal.length === 0 ? (
            <p className="text-xs font-serif italic text-muted-foreground">
              Nothing tracked yet for this {range}.
            </p>
          ) : (
            <div className="space-y-2">
              {byGoal.map((g) => (
                <div key={g.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground truncate pr-2">
                      {g.title}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                      {fmt(g.minutes)}
                    </span>
                  </div>
                  <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand"
                      style={{ width: `${(g.minutes / maxGoal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 space-y-3 border-b border-border">
          <Eyebrow>By Task</Eyebrow>
          {byTask.length === 0 ? (
            <p className="text-xs font-serif italic text-muted-foreground">
              No task time logged.
            </p>
          ) : (
            <div className="space-y-2">
              {byTask.map((t) => (
                <div key={t.key} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-foreground truncate">
                      {t.label}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                      {fmt(t.minutes)}
                    </span>
                  </div>
                  <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground/60"
                      style={{ width: `${(t.minutes / maxTask) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 space-y-3">
          <Eyebrow>Recent Entries</Eyebrow>
          <div className="space-y-1.5">
            {recent.map((e) => (
              <div
                key={e.id}
                className="group flex items-center justify-between gap-2 py-1.5 border-b border-border/60 last:border-0"
              >
                <div className="min-w-0">
                  <div className="text-xs text-foreground truncate">{e.label}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {e.date.slice(5)}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                    {fmt(e.minutes)}
                  </span>
                  <button
                    onClick={() => onRemove(e.id)}
                    aria-label="Remove entry"
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition text-xs"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleQuickLog}
        className="border-t border-border p-4 space-y-2 bg-surface/30"
      >
        <Eyebrow>Log Time</Eyebrow>
        <select
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          className="w-full bg-surface/60 border border-border rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-border-strong"
        >
          <option value="">— No task —</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="w-full bg-surface/60 border border-border rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-border-strong"
        />
        <div className="flex gap-2">
          <input
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            type="number"
            min={1}
            placeholder="min"
            className="flex-1 bg-surface/60 border border-border rounded-sm px-2 py-1.5 text-xs font-mono tabular-nums focus:outline-none focus:border-border-strong"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-brand text-background text-xs font-medium rounded-sm hover:brightness-110 transition"
          >
            Log
          </button>
        </div>
      </form>
    </aside>
  );
}