import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTrajectory } from "@/lib/store";
import { Eyebrow } from "@/components/ui/eyebrow";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/reflect")({
  component: ReflectPage,
});

function ReflectPage() {
  const metrics = useTrajectory((s) => s.metrics);
  const journal = useTrajectory((s) => s.journal);
  const tasks = useTrajectory((s) => s.tasks);
  const goals = useTrajectory((s) => s.goals);
  const streak = useTrajectory((s) => s.streakDays);
  const addJournal = useTrajectory((s) => s.addJournal);

  const focusSeries = useMemo(() => {
    const byDate = new Map<string, number>();
    metrics
      .filter((m) => m.metric_type === "focus_minutes")
      .forEach((m) => byDate.set(m.date, (byDate.get(m.date) ?? 0) + m.value));
    return Array.from(byDate.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-21)
      .map(([date, value]) => ({ date: date.slice(5), minutes: value }));
  }, [metrics]);

  // Heatmap: last 12 weeks of focus
  const heatmap = useMemo(() => {
    const weeks: { date: string; minutes: number }[][] = [];
    const days = 12 * 7;
    const today = new Date();
    const map = new Map<string, number>();
    metrics
      .filter((m) => m.metric_type === "focus_minutes")
      .forEach((m) => map.set(m.date, (map.get(m.date) ?? 0) + m.value));
    for (let w = 0; w < 12; w++) {
      const row: { date: string; minutes: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (days - 1 - (w * 7 + d)));
        const key = date.toISOString().slice(0, 10);
        row.push({ date: key, minutes: map.get(key) ?? 0 });
      }
      weeks.push(row);
    }
    return weeks;
  }, [metrics]);

  const intensity = (m: number) => {
    if (m === 0) return "bg-surface/40";
    if (m < 60) return "bg-brand/20";
    if (m < 120) return "bg-brand/40";
    if (m < 200) return "bg-brand/70";
    return "bg-brand";
  };

  const tasksDone = tasks.filter((t) => t.status === "done").length;
  const completionRate = tasks.length
    ? Math.round((tasksDone / tasks.length) * 100)
    : 0;

  const [reflection, setReflection] = useState("");
  const [lesson, setLesson] = useState("");

  return (
    <div className="flex h-full overflow-y-auto">
      <div className="flex-1 p-10 max-w-5xl mx-auto space-y-12">
        <header className="flex items-end justify-between border-b border-border pb-6">
          <div>
            <Eyebrow>Reflection · Analytics</Eyebrow>
            <h1 className="mt-2 text-4xl font-serif italic">
              The shape of your last 21 days.
            </h1>
          </div>
          <Eyebrow tone="brand">{streak} day streak</Eyebrow>
        </header>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Goals active", value: goals.filter((g) => g.status === "active").length },
            { label: "Tasks complete", value: `${completionRate}%` },
            {
              label: "Focus this week",
              value: `${Math.round(
                metrics
                  .filter(
                    (m) =>
                      m.metric_type === "focus_minutes" &&
                      new Date(m.date) >
                        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  )
                  .reduce((a, b) => a + b.value, 0) / 60,
              )}h`,
            },
            {
              label: "Avg mood",
              value: journal.length
                ? (
                    journal.reduce((a, b) => a + b.mood, 0) / journal.length
                  ).toFixed(1)
                : "—",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="p-5 rounded-xl border border-border bg-surface/40"
            >
              <Eyebrow>{kpi.label}</Eyebrow>
              <div className="mt-2 text-3xl font-serif italic text-foreground">
                {kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Focus chart */}
        <div className="space-y-4">
          <Eyebrow>Focus velocity</Eyebrow>
          <div className="h-56 rounded-xl border border-border bg-surface/30 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={focusSeries}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.82 0.17 86)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.82 0.17 86)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.235 0.005 285)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="oklch(0.55 0.01 285)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.55 0.01 285)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.185 0.005 285)",
                    border: "1px solid oklch(0.235 0.005 285)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "oklch(0.55 0.01 285)" }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="oklch(0.82 0.17 86)"
                  strokeWidth={1.5}
                  fill="url(#g)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap */}
        <div className="space-y-4">
          <Eyebrow>Consistency · 12 weeks</Eyebrow>
          <div className="flex gap-1">
            {heatmap.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date} — ${d.minutes}m`}
                    className={`size-3 rounded-sm ${intensity(d.minutes)} border border-border/40`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Reflection entry */}
        <div className="space-y-4 pb-12">
          <Eyebrow>Today's Reflection</Eyebrow>
          <div className="rounded-xl border border-border bg-surface/40 p-6 space-y-4">
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={3}
              placeholder="What did you actually do today?"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground/30 focus:outline-none resize-none"
            />
            <textarea
              value={lesson}
              onChange={(e) => setLesson(e.target.value)}
              rows={2}
              placeholder="One sentence you'll remember a year from now..."
              className="w-full bg-transparent text-base font-serif italic text-foreground placeholder:text-foreground/30 focus:outline-none resize-none border-t border-border pt-3"
            />
            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (!reflection.trim() && !lesson.trim()) return;
                  addJournal({
                    reflections: reflection.trim() || undefined,
                    lessons_learned: lesson.trim() || undefined,
                  });
                  setReflection("");
                  setLesson("");
                }}
                className="px-4 py-2 bg-brand text-background text-sm font-medium rounded-sm"
              >
                Log Reflection
              </button>
            </div>
          </div>

          {/* Recent journal */}
          <div className="space-y-2">
            {journal.slice(0, 6).map((j) => (
              <div
                key={j.id}
                className="p-4 rounded-lg border border-border bg-background/60"
              >
                <div className="flex items-center justify-between mb-2">
                  <Eyebrow>{j.date}</Eyebrow>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    mood {j.mood} · energy {j.energy_level}
                  </span>
                </div>
                {j.reflections && (
                  <p className="text-sm text-foreground/80">{j.reflections}</p>
                )}
                {j.lessons_learned && (
                  <p className="mt-2 text-base font-serif italic text-foreground">
                    “{j.lessons_learned}”
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}