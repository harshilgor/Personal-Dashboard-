import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Goal,
  GraphEdge,
  JournalEntry,
  MetricEntry,
  RoadmapNode,
  Task,
} from "./types";

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const id = () => Math.random().toString(36).slice(2, 10);

interface State {
  goals: Goal[];
  nodes: RoadmapNode[];
  edges: GraphEdge[];
  tasks: Task[];
  journal: JournalEntry[];
  metrics: MetricEntry[];
  selectedNodeId: string | null;
  focusTaskId: string | null;
  streakDays: number;

  setSelectedNode: (id: string | null) => void;
  setFocusTask: (id: string | null) => void;

  addGoal: (g: Partial<Goal>) => Goal;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  removeGoal: (id: string) => void;

  addNode: (n: Partial<RoadmapNode>) => RoadmapNode;
  updateNode: (id: string, patch: Partial<RoadmapNode>) => void;
  removeNode: (id: string) => void;
  moveNode: (id: string, x: number, y: number) => void;

  addEdge: (e: Omit<GraphEdge, "id">) => GraphEdge;
  removeEdge: (id: string) => void;

  addTask: (t: Partial<Task>) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;

  addJournal: (j: Partial<JournalEntry>) => JournalEntry;

  logMetric: (type: string, value: number) => void;
}

// ---- Seed data --------------------------------------------------------------

const seedGoals: Goal[] = [
  {
    id: "g_research",
    title: "Quantitative Research",
    description:
      "Build a working knowledge of modern statistical learning and apply it to a publishable side project.",
    category: "Craft",
    priority: "P0",
    status: "active",
    target_date: "2026-09-30",
    progress: 82,
    tags: ["research", "math"],
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "g_physical",
    title: "Physical Optimization",
    description: "Sustained 4x/week training with measurable strength gains.",
    category: "Body",
    priority: "P1",
    status: "active",
    target_date: "2026-12-31",
    progress: 45,
    tags: ["health"],
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "g_legacy",
    title: "Architectural Legacy",
    description: "Ship one durable open-source primitive this year.",
    category: "Make",
    priority: "P2",
    status: "active",
    target_date: "2026-12-31",
    progress: 12,
    tags: ["build", "oss"],
    created_at: now(),
    updated_at: now(),
  },
];

const seedNodes: RoadmapNode[] = [
  {
    id: "n_baseline",
    title: "Baseline Vision Model",
    description: "Reference implementation, fully reproducible.",
    type: "project",
    position_x: -260,
    position_y: -120,
    status: "completed",
    estimated_effort: "5d",
    parent_goal_id: "g_research",
    created_at: now(),
  },
  {
    id: "n_compute",
    title: "Computational Budget",
    description: "Secured 200 GPU-hours / month.",
    type: "resource",
    position_x: -260,
    position_y: 140,
    status: "completed",
    parent_goal_id: "g_research",
    created_at: now(),
  },
  {
    id: "n_neural",
    title: "Neural Architecture",
    description:
      "Defining the core trajectory for spatial recognition nodes and temporal synthesis.",
    type: "milestone",
    position_x: 60,
    position_y: 0,
    status: "in_progress",
    estimated_effort: "High (12d)",
    due_date: "2026-10-24",
    parent_goal_id: "g_research",
    created_at: now(),
  },
  {
    id: "n_scale",
    title: "Scale Deployment",
    description: "Future — multi-region rollout.",
    type: "idea",
    position_x: 420,
    position_y: 0,
    status: "todo",
    parent_goal_id: "g_research",
    created_at: now(),
  },
  {
    id: "n_train4x",
    title: "Strength 4x / week",
    description: "Push / Pull / Legs / Conditioning split.",
    type: "habit",
    position_x: 60,
    position_y: 260,
    status: "in_progress",
    parent_goal_id: "g_physical",
    created_at: now(),
  },
];

const seedEdges: GraphEdge[] = [
  {
    id: "e1",
    source_node_id: "n_baseline",
    target_node_id: "n_neural",
    relationship_type: "prerequisite",
  },
  {
    id: "e2",
    source_node_id: "n_compute",
    target_node_id: "n_neural",
    relationship_type: "prerequisite",
  },
  {
    id: "e3",
    source_node_id: "n_neural",
    target_node_id: "n_scale",
    relationship_type: "timeline",
  },
];

const seedTasks: Task[] = [
  {
    id: "t1",
    title: "Deep work: finalize neural architecture spec",
    status: "doing",
    priority: "P0",
    due_date: today(),
    estimated_time: 120,
    linked_goal_id: "g_research",
    linked_node_id: "n_neural",
    created_at: now(),
  },
  {
    id: "t2",
    title: "Read: Database Internals — Chapter 8",
    status: "todo",
    priority: "P2",
    due_date: today(),
    estimated_time: 45,
    linked_goal_id: "g_research",
    created_at: now(),
  },
  {
    id: "t3",
    title: "Pull workout — heavy",
    status: "todo",
    priority: "P1",
    due_date: today(),
    estimated_time: 60,
    linked_goal_id: "g_physical",
    linked_node_id: "n_train4x",
    created_at: now(),
  },
  {
    id: "t4",
    title: "Sketch OSS primitive API surface",
    status: "todo",
    priority: "P2",
    estimated_time: 30,
    linked_goal_id: "g_legacy",
    created_at: now(),
  },
];

const seedJournal: JournalEntry[] = [
  {
    id: "j1",
    date: today(),
    mood: 4,
    energy_level: 4,
    accomplishments: "Drafted the neural architecture diagram. Two pages, no fluff.",
    blockers: "Need clarity on the loss objective.",
    reflections: "Working in 90-minute uninterrupted blocks is the unlock.",
    lessons_learned: "Constraint > options. Pick the metric, then move.",
    tags: ["focus", "deepwork"],
  },
];

const seedMetrics: MetricEntry[] = (() => {
  const arr: MetricEntry[] = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    arr.push({ id: `m_focus_${i}`, metric_type: "focus_minutes", value: Math.round(60 + Math.random() * 180), date });
    arr.push({ id: `m_study_${i}`, metric_type: "study_hours", value: +(1 + Math.random() * 3).toFixed(1), date });
    if (i % 2 === 0)
      arr.push({ id: `m_workout_${i}`, metric_type: "workout", value: 1, date });
  }
  return arr;
})();

// ---- Store ------------------------------------------------------------------

export const useTrajectory = create<State>()(
  persist(
    (set, get) => ({
      goals: seedGoals,
      nodes: seedNodes,
      edges: seedEdges,
      tasks: seedTasks,
      journal: seedJournal,
      metrics: seedMetrics,
      selectedNodeId: "n_neural",
      focusTaskId: "t1",
      streakDays: 142,

      setSelectedNode: (id) => set({ selectedNodeId: id }),
      setFocusTask: (id) => set({ focusTaskId: id }),

      addGoal: (g) => {
        const goal: Goal = {
          id: id(),
          title: g.title ?? "Untitled goal",
          description: g.description ?? "",
          category: g.category ?? "General",
          priority: g.priority ?? "P2",
          status: g.status ?? "active",
          target_date: g.target_date,
          progress: g.progress ?? 0,
          tags: g.tags ?? [],
          created_at: now(),
          updated_at: now(),
        };
        set({ goals: [goal, ...get().goals] });
        return goal;
      },
      updateGoal: (gid, patch) =>
        set({
          goals: get().goals.map((g) =>
            g.id === gid ? { ...g, ...patch, updated_at: now() } : g,
          ),
        }),
      removeGoal: (gid) => set({ goals: get().goals.filter((g) => g.id !== gid) }),

      addNode: (n) => {
        const node: RoadmapNode = {
          id: id(),
          title: n.title ?? "New node",
          description: n.description ?? "",
          type: n.type ?? "idea",
          position_x: n.position_x ?? 0,
          position_y: n.position_y ?? 0,
          status: n.status ?? "todo",
          estimated_effort: n.estimated_effort,
          due_date: n.due_date,
          notes: n.notes,
          parent_goal_id: n.parent_goal_id,
          created_at: now(),
        };
        set({ nodes: [...get().nodes, node] });
        return node;
      },
      updateNode: (nid, patch) =>
        set({
          nodes: get().nodes.map((n) => (n.id === nid ? { ...n, ...patch } : n)),
        }),
      removeNode: (nid) =>
        set({
          nodes: get().nodes.filter((n) => n.id !== nid),
          edges: get().edges.filter(
            (e) => e.source_node_id !== nid && e.target_node_id !== nid,
          ),
          selectedNodeId: get().selectedNodeId === nid ? null : get().selectedNodeId,
        }),
      moveNode: (nid, x, y) =>
        set({
          nodes: get().nodes.map((n) =>
            n.id === nid ? { ...n, position_x: x, position_y: y } : n,
          ),
        }),

      addEdge: (e) => {
        const edge: GraphEdge = { id: id(), ...e };
        set({ edges: [...get().edges, edge] });
        return edge;
      },
      removeEdge: (eid) => set({ edges: get().edges.filter((e) => e.id !== eid) }),

      addTask: (t) => {
        const task: Task = {
          id: id(),
          title: t.title ?? "New task",
          description: t.description,
          status: t.status ?? "todo",
          priority: t.priority ?? "P2",
          due_date: t.due_date,
          estimated_time: t.estimated_time,
          recurring: t.recurring,
          linked_goal_id: t.linked_goal_id,
          linked_node_id: t.linked_node_id,
          created_at: now(),
        };
        set({ tasks: [task, ...get().tasks] });
        return task;
      },
      updateTask: (tid, patch) =>
        set({
          tasks: get().tasks.map((t) => (t.id === tid ? { ...t, ...patch } : t)),
        }),
      toggleTask: (tid) =>
        set({
          tasks: get().tasks.map((t) =>
            t.id === tid
              ? { ...t, status: t.status === "done" ? "todo" : "done" }
              : t,
          ),
        }),
      removeTask: (tid) => set({ tasks: get().tasks.filter((t) => t.id !== tid) }),

      addJournal: (j) => {
        const entry: JournalEntry = {
          id: id(),
          date: j.date ?? today(),
          mood: j.mood ?? 3,
          energy_level: j.energy_level ?? 3,
          accomplishments: j.accomplishments,
          blockers: j.blockers,
          reflections: j.reflections,
          lessons_learned: j.lessons_learned,
          tags: j.tags ?? [],
        };
        set({ journal: [entry, ...get().journal] });
        return entry;
      },

      logMetric: (type, value) =>
        set({
          metrics: [
            { id: id(), metric_type: type, value, date: today() },
            ...get().metrics,
          ],
        }),
    }),
    { name: "trajectory.v1" },
  ),
);