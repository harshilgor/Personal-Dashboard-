import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Eyebrow } from "@/components/ui/eyebrow";
import type { NodeStatus, NodeType } from "@/lib/types";

export interface TrajectoryNodeData {
  title: string;
  description?: string;
  type: NodeType;
  status: NodeStatus;
  due_date?: string;
  effort?: string;
  selected?: boolean;
  [key: string]: unknown;
}

const statusDot: Record<NodeStatus, string> = {
  completed: "bg-success",
  in_progress: "bg-brand animate-pulse",
  todo: "bg-muted-foreground/50",
  blocked: "bg-destructive",
};

const statusLabel: Record<NodeStatus, string> = {
  completed: "COMPLETED",
  in_progress: "ACTIVE",
  todo: "PLANNED",
  blocked: "BLOCKED",
};

export function TrajectoryNode({ data, selected }: NodeProps) {
  const d = data as TrajectoryNodeData;
  const isFuture = d.status === "todo" && d.type === "idea";
  return (
    <div
      className={[
        "rounded-xl p-4 backdrop-blur-md transition-all",
        selected
          ? "w-64 bg-surface border border-border-strong ring-2 ring-brand ring-offset-2 ring-offset-background shadow-2xl"
          : "w-48 bg-surface/80 border",
        !selected && isFuture && "bg-background/40 border-border border-dashed",
        !selected && !isFuture && "border-border",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-border !border-0 !w-1.5 !h-1.5"
      />
      <div className="flex items-start justify-between mb-2">
        <Eyebrow tone={selected ? "brand" : "muted"}>
          {selected ? "Active " : ""}
          {d.type}
        </Eyebrow>
        {selected && d.status === "in_progress" && (
          <span className="size-2 bg-brand rounded-full animate-pulse" />
        )}
      </div>
      <h3
        className={`${
          selected ? "text-lg font-serif italic" : "text-sm font-medium"
        } text-foreground leading-tight`}
      >
        {d.title}
      </h3>
      {selected && d.description && (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          {d.description}
        </p>
      )}
      <div
        className={`mt-3 flex items-center ${
          selected ? "justify-between" : "gap-2"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className={`size-1.5 rounded-full ${statusDot[d.status]}`} />
          <span className="text-[10px] font-mono text-muted-foreground">
            {statusLabel[d.status]}
          </span>
        </div>
        {selected && d.due_date && (
          <span className="text-[10px] font-mono text-muted-foreground">
            ETA {d.due_date}
          </span>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-border !border-0 !w-1.5 !h-1.5"
      />
    </div>
  );
}