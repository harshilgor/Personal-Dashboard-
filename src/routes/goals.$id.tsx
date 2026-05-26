import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTrajectory } from "@/lib/store";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ArrowLeft, Check } from "lucide-react";

export const Route = createFileRoute("/goals/$id")({
  component: GoalDetail,
});

function GoalDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const goal = useTrajectory((s) => s.goals.find((g) => g.id === id));
  const nodes = useTrajectory((s) =>
    s.nodes.filter((n) => n.parent_goal_id === id),
  );
  const tasks = useTrajectory((s) =>
    s.tasks.filter((t) => t.linked_goal_id === id),
  );
  const updateGoal = useTrajectory((s) => s.updateGoal);
  const toggleTask = useTrajectory((s) => s.toggleTask);

  if (!goal) {
    return (
      <div className="p-10 text-muted-foreground">
        Goal not found.{" "}
        <Link to="/" className="text-brand">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-10 space-y-12">
        <button
          onClick={() => navigate({ to: "/" })}
          className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Back
        </button>

        <header className="space-y-4 border-b border-border pb-8">
          <div className="flex items-center gap-3">
            <Eyebrow>{goal.category}</Eyebrow>
            <span className="label-eyebrow">{goal.priority}</span>
            <span className="label-eyebrow">
              {goal.status.toUpperCase()}
            </span>
          </div>
          <h1 className="text-5xl font-serif italic text-balance leading-tight">
            {goal.title}
          </h1>
          {goal.description && (
            <p className="text-lg text-muted-foreground max-w-[60ch] text-pretty">
              {goal.description}
            </p>
          )}
        </header>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Eyebrow>Progress</Eyebrow>
            <span className="text-[10px] font-mono text-muted-foreground">
              {goal.progress}% · target {goal.target_date}
            </span>
          </div>
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-brand transition-all"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={goal.progress}
            onChange={(e) =>
              updateGoal(goal.id, { progress: Number(e.target.value) })
            }
            className="w-full accent-brand"
          />
        </div>

        {/* Linked nodes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Eyebrow>Linked Roadmap</Eyebrow>
            <Link
              to="/canvas"
              className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Open canvas
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {nodes.map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-xl border border-border bg-surface/40"
              >
                <Eyebrow tone="brand">{n.type}</Eyebrow>
                <div className="mt-1 text-sm font-medium">{n.title}</div>
                {n.description && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {n.description}
                  </p>
                )}
                <div className="mt-3 text-[10px] font-mono text-muted-foreground uppercase">
                  {n.status.replace("_", " ")}
                </div>
              </div>
            ))}
            {nodes.length === 0 && (
              <div className="text-sm text-muted-foreground font-serif italic">
                No nodes linked yet.
              </div>
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-4 pb-12">
          <Eyebrow>Linked Tasks</Eyebrow>
          <div className="rounded-xl border border-border bg-surface/40 divide-y divide-border">
            {tasks.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface/60 transition"
              >
                <span
                  className={`size-4 rounded-full border grid place-items-center ${
                    t.status === "done"
                      ? "bg-brand border-brand"
                      : "border-border-strong"
                  }`}
                >
                  {t.status === "done" && (
                    <Check className="size-2.5 text-background" strokeWidth={3} />
                  )}
                </span>
                <span
                  className={`flex-1 text-sm ${
                    t.status === "done"
                      ? "line-through text-muted-foreground"
                      : ""
                  }`}
                >
                  {t.title}
                </span>
                <span className="label-eyebrow">{t.priority}</span>
              </button>
            ))}
            {tasks.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground font-serif italic">
                No tasks attached.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}