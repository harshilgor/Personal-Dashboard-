export type GoalStatus = "active" | "paused" | "completed" | "archived";
export type Priority = "P0" | "P1" | "P2" | "P3";
export type NodeType = "skill" | "project" | "milestone" | "idea" | "habit" | "resource";
export type NodeStatus = "todo" | "in_progress" | "completed" | "blocked";
export type TaskStatus = "todo" | "doing" | "done";
export type EdgeRel = "prerequisite" | "related" | "blocks" | "inspires" | "timeline";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: Priority;
  status: GoalStatus;
  target_date?: string;
  progress: number; // 0..100
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface RoadmapNode {
  id: string;
  title: string;
  description?: string;
  type: NodeType;
  position_x: number;
  position_y: number;
  status: NodeStatus;
  estimated_effort?: string;
  due_date?: string;
  notes?: string;
  parent_goal_id?: string;
  created_at: string;
}

export interface GraphEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: EdgeRel;
  label?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  due_date?: string;
  estimated_time?: number; // minutes
  recurring?: boolean;
  linked_goal_id?: string;
  linked_node_id?: string;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mood: number; // 1..5
  energy_level: number; // 1..5
  accomplishments?: string;
  blockers?: string;
  reflections?: string;
  lessons_learned?: string;
  tags: string[];
}

export interface MetricEntry {
  id: string;
  metric_type: string;
  value: number;
  date: string; // YYYY-MM-DD
}

export interface TimeEntry {
  id: string;
  task_id?: string;
  goal_id?: string;
  label: string;
  minutes: number;
  date: string; // YYYY-MM-DD
  created_at: string;
}