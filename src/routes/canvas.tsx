import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type NodeChange,
  applyNodeChanges,
  addEdge as rfAddEdge,
  type Connection,
  ConnectionMode,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TrajectoryNode } from "@/components/canvas/TrajectoryNode";
import { useTrajectory } from "@/lib/store";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Plus, X } from "lucide-react";
import type { NodeType } from "@/lib/types";

export const Route = createFileRoute("/canvas")({
  component: CanvasPageWrapper,
});

const nodeTypes = { trajectory: TrajectoryNode };

function CanvasPageWrapper() {
  return (
    <ReactFlowProvider>
      <CanvasPage />
    </ReactFlowProvider>
  );
}

function CanvasPage() {
  const nodes = useTrajectory((s) => s.nodes);
  const edges = useTrajectory((s) => s.edges);
  const selectedId = useTrajectory((s) => s.selectedNodeId);
  const setSelected = useTrajectory((s) => s.setSelectedNode);
  const editingId = useTrajectory((s) => s.editingNodeId);
  const setEditing = useTrajectory((s) => s.setEditingNode);
  const moveNode = useTrajectory((s) => s.moveNode);
  const addEdgeFn = useTrajectory((s) => s.addEdge);
  const removeEdgeFn = useTrajectory((s) => s.removeEdge);
  const addNodeFn = useTrajectory((s) => s.addNode);
  const removeNodeFn = useTrajectory((s) => s.removeNode);
  const updateNode = useTrajectory((s) => s.updateNode);
  const goals = useTrajectory((s) => s.goals);
  const rf = useReactFlow();

  const rfNodes: Node[] = useMemo(
    () =>
      nodes.map((n) => ({
        id: n.id,
        type: "trajectory",
        position: { x: n.position_x, y: n.position_y },
        data: {
          title: n.title,
          description: n.description,
          type: n.type,
          status: n.status,
          due_date: n.due_date,
          effort: n.estimated_effort,
          editing: n.id === editingId,
        },
        selected: n.id === selectedId,
      })),
    [nodes, selectedId, editingId],
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        animated: e.relationship_type === "timeline",
        style: {
          stroke:
            e.relationship_type === "timeline"
              ? "oklch(0.55 0.01 285 / 0.4)"
              : "oklch(0.55 0.01 285 / 0.6)",
          strokeWidth: 1.5,
          strokeDasharray:
            e.relationship_type === "timeline" ? "4 4" : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "oklch(0.55 0.01 285 / 0.7)",
          width: 16,
          height: 16,
        },
        label: e.label,
      })),
    [edges],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const next = applyNodeChanges(changes, rfNodes);
      // persist position changes
      changes.forEach((c) => {
        if (c.type === "position" && c.position && c.dragging === false) {
          moveNode(c.id, c.position.x, c.position.y);
        }
      });
      // also commit live drag positions
      next.forEach((n) => {
        const original = nodes.find((x) => x.id === n.id);
        if (
          original &&
          (original.position_x !== n.position.x || original.position_y !== n.position.y)
        ) {
          moveNode(n.id, n.position.x, n.position.y);
        }
      });
    },
    [moveNode, nodes, rfNodes],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target) return;
      addEdgeFn({
        source_node_id: c.source,
        target_node_id: c.target,
        relationship_type: "related",
      });
      // not used, but keeps RF happy
      rfAddEdge(c, rfEdges);
    },
    [addEdgeFn, rfEdges],
  );

  const selected = nodes.find((n) => n.id === selectedId) ?? null;

  // Keyboard shortcuts
  const addNodeAtCenter = useCallback(() => {
    let x = 0;
    let y = 0;
    try {
      const c = rf.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      x = c.x;
      y = c.y;
    } catch {
      /* not ready */
    }
    const n = addNodeFn({
      title: "",
      type: "idea",
      position_x: x,
      position_y: y,
    });
    setSelected(n.id);
    setEditing(n.id);
  }, [rf, addNodeFn, setSelected, setEditing]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const inField =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (target?.isContentEditable ?? false);
      if (inField) return;

      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        addNodeAtCenter();
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        removeNodeFn(selectedId);
      } else if (e.key === "Escape") {
        setEditing(null);
        setSelected(null);
      } else if (e.key === "Enter" && selectedId && !editingId) {
        e.preventDefault();
        setEditing(selectedId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [addNodeAtCenter, selectedId, editingId, removeNodeFn, setEditing, setSelected]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Canvas */}
      <section className="flex-1 relative bg-background canvas-dots">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onConnect={onConnect}
          onNodeClick={(_, n) => {
            setSelected(n.id);
            if (editingId && editingId !== n.id) setEditing(null);
          }}
          onNodeDoubleClick={(_, n) => setEditing(n.id)}
          onPaneClick={() => {
            setSelected(null);
            setEditing(null);
          }}
          onEdgesDelete={(es) => es.forEach((e) => removeEdgeFn(e.id))}
          fitView
          fitViewOptions={{ padding: 0.4, maxZoom: 1 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          connectionMode={ConnectionMode.Loose}
          defaultEdgeOptions={{
            type: "smoothstep",
            style: { stroke: "oklch(0.55 0.01 285 / 0.6)", strokeWidth: 1.5 },
          }}
        >
          <Background gap={24} size={1} color="oklch(0.3 0.005 285 / 0.5)" />
          <Controls
            className="!bg-surface !border !border-border !rounded-lg !shadow-none [&>button]:!bg-transparent [&>button]:!border-0 [&>button]:!text-foreground/70 [&>button:hover]:!text-foreground"
            showInteractive={false}
          />
          <MiniMap
            pannable
            zoomable
            className="!bg-surface !border !border-border !rounded-lg"
            nodeColor={() => "oklch(0.82 0.17 86)"}
            maskColor="oklch(0.145 0.005 285 / 0.7)"
          />
        </ReactFlow>

        {/* Add node FAB */}
        <button
          onClick={addNodeAtCenter}
          className="absolute top-6 left-6 z-10 flex items-center gap-2 px-3 py-1.5 bg-surface/80 backdrop-blur border border-border rounded-md text-xs font-mono uppercase tracking-widest text-foreground/80 hover:text-foreground hover:border-border-strong transition"
        >
          <Plus className="size-3" />
          Add Node
        </button>

        {/* Shortcuts */}
        <div className="absolute bottom-4 left-4 flex gap-2 pointer-events-none">
          {[
            ["V", "SELECT"],
            ["A", "ADD NODE"],
            ["⏎", "RENAME"],
            ["DEL", "REMOVE"],
          ].map(([k, l]) => (
            <div
              key={k}
              className="px-2 py-1 bg-surface/80 backdrop-blur border border-border rounded flex gap-2 items-center"
            >
              <kbd className="text-[10px] font-mono text-foreground bg-surface-2 px-1 rounded">
                {k}
              </kbd>
              <span className="text-[10px] font-mono text-muted-foreground">
                {l}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Inspector */}
      <aside className="w-80 border-l border-border bg-background flex flex-col">
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <Eyebrow>Inspector</Eyebrow>
            {selected && (
              <button
                onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {selected ? (
            <div className="space-y-8">
              <div className="space-y-3">
                <Eyebrow tone="brand">{selected.type}</Eyebrow>
                <input
                  value={selected.title}
                  onChange={(e) =>
                    updateNode(selected.id, { title: e.target.value })
                  }
                  className="w-full bg-transparent text-lg font-serif italic text-foreground border-none focus:outline-none"
                />
                <textarea
                  value={selected.description ?? ""}
                  onChange={(e) =>
                    updateNode(selected.id, { description: e.target.value })
                  }
                  placeholder="Describe this node..."
                  rows={3}
                  className="w-full bg-surface/40 border border-border rounded-md p-3 text-xs text-foreground/90 focus:outline-none focus:border-border-strong resize-none"
                />
              </div>

              <div className="space-y-3">
                <Eyebrow>Type</Eyebrow>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      "skill",
                      "project",
                      "milestone",
                      "idea",
                      "habit",
                      "resource",
                    ] as const
                  ).map((t: NodeType) => (
                    <button
                      key={t}
                      onClick={() => updateNode(selected.id, { type: t })}
                      className={`px-2 py-1.5 text-[10px] font-mono uppercase tracking-tighter rounded border transition ${
                        selected.type === t
                          ? "bg-brand text-background border-brand"
                          : "bg-surface/40 border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Eyebrow>Status</Eyebrow>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["todo", "in_progress", "completed", "blocked"] as const).map(
                    (s) => (
                      <button
                        key={s}
                        onClick={() => updateNode(selected.id, { status: s })}
                        className={`px-2 py-1.5 text-[10px] font-mono uppercase tracking-tighter rounded border transition ${
                          selected.status === s
                            ? "bg-foreground text-background border-foreground"
                            : "bg-surface/40 border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {s.replace("_", " ")}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Eyebrow>Linked Goal</Eyebrow>
                <select
                  value={selected.parent_goal_id ?? ""}
                  onChange={(e) =>
                    updateNode(selected.id, {
                      parent_goal_id: e.target.value || undefined,
                    })
                  }
                  className="w-full bg-surface/40 border border-border rounded-md p-2 text-xs text-foreground focus:outline-none focus:border-border-strong"
                >
                  <option value="">—</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <Eyebrow>Metadata</Eyebrow>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      Effort
                    </span>
                    <input
                      value={selected.estimated_effort ?? ""}
                      onChange={(e) =>
                        updateNode(selected.id, {
                          estimated_effort: e.target.value,
                        })
                      }
                      placeholder="e.g. 12d"
                      className="mt-1 w-full bg-surface/40 border border-border rounded-md p-2 text-xs text-foreground focus:outline-none focus:border-border-strong"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      Due
                    </span>
                    <input
                      type="date"
                      value={selected.due_date ?? ""}
                      onChange={(e) =>
                        updateNode(selected.id, { due_date: e.target.value })
                      }
                      className="mt-1 w-full bg-surface/40 border border-border rounded-md p-2 text-xs text-foreground focus:outline-none focus:border-border-strong"
                    />
                  </label>
                </div>
              </div>

              <button
                onClick={() => removeNodeFn(selected.id)}
                className="w-full py-2 bg-destructive/10 text-destructive text-xs font-mono uppercase tracking-widest rounded border border-destructive/20 hover:bg-destructive/20 transition"
              >
                Delete Node
              </button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground font-serif italic">
              Select a node to inspect, edit, or connect.
              <p className="mt-3 text-xs not-italic font-sans">
                Drag from the right edge of a node to its neighbor to draw a
                dependency edge.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <button className="w-full py-2 bg-foreground text-background text-sm font-medium rounded-sm ring-1 ring-white/10 hover:bg-foreground/90 transition">
            Begin Execution Block
          </button>
        </div>
      </aside>
    </div>
  );
}