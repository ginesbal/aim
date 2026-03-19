"use client";

import { useState, useMemo, useCallback } from "react";
import { useTasks } from "@/lib/contexts";
import { SUBJECTS, PRIORITIES, type SubjectKey, type Task } from "@/lib/types";
import { cn, formatDate, isOverdue } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

type FilterStatus = "all" | "pending" | "completed";
type FilterSubject = "all" | SubjectKey;

export default function TasksPage() {
  const { tasks, addTask, toggleComplete, deleteTask } = useTasks();

  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterSubject, setFilterSubject] = useState<FilterSubject>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (filterSubject !== "all") {
      result = result.filter((t) => t.subject === filterSubject);
    }
    if (filterStatus === "pending") {
      result = result.filter((t) => !t.completed);
    } else if (filterStatus === "completed") {
      result = result.filter((t) => t.completed);
    }

    // Always sort by due date, completed at bottom
    result.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    result.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

    return result;
  }, [tasks, filterSubject, filterStatus]);

  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-baltic-800 dark:text-baltic-100">Tasks</h1>
          <p className="text-body text-steel-500 dark:text-steel-400 mt-1">
            {pendingCount} pending · {tasks.filter((t) => t.completed).length} completed
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Add task
        </Button>
      </div>

      {/* Simplified filters — 2 groups only, pill-style */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Status pills */}
        <div className="flex items-center gap-1.5 bg-white/60 dark:bg-lavender-900/40 rounded-full p-1">
          {([
            { value: "all", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "completed", label: "Done" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-smooth",
                filterStatus === opt.value
                  ? "bg-white dark:bg-lavender-800 text-baltic-700 dark:text-baltic-200 shadow-sm"
                  : "text-steel-500 hover:text-baltic-600 dark:hover:text-baltic-300"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Subject pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterSubject("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-smooth",
              filterSubject === "all"
                ? "bg-baltic-100 text-baltic-700 dark:bg-baltic-800 dark:text-baltic-200"
                : "text-steel-400 hover:text-baltic-600"
            )}
          >
            All subjects
          </button>
          {Object.entries(SUBJECTS).map(([key, { label, color }]) => (
            <button
              key={key}
              onClick={() => setFilterSubject(key as SubjectKey)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-smooth flex items-center gap-1.5",
                filterSubject === key
                  ? "text-white"
                  : "text-steel-400 hover:text-baltic-600"
              )}
              style={filterSubject === key ? { backgroundColor: color } : undefined}
            >
              {filterSubject !== key && (
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Task list — spacious cards */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => toggleComplete(task.id)}
              onSelect={() => setSelectedTask(task)}
            />
          ))}
        </div>
      ) : (
        <Card padding="lg">
          <div className="py-12 text-center">
            <div className="flex justify-center gap-2 mb-4">
              <div className="w-4 h-4 rounded-full bg-lavender-200/60 animate-float" />
              <div className="w-4 h-4 rounded-full bg-baltic-200/60 animate-float-delay" />
              <div className="w-4 h-4 rounded-full bg-cream-200/60 animate-float-slow" />
            </div>
            <p className="text-sm text-steel-400">No tasks match your filters.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => {
                setFilterSubject("all");
                setFilterStatus("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        </Card>
      )}

      {/* Add Task Modal */}
      <AddTaskModal open={showAddModal} onClose={() => setShowAddModal(false)} onAdd={addTask} />

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onToggle={() => {
            toggleComplete(selectedTask.id);
            setSelectedTask(null);
          }}
          onDelete={() => {
            deleteTask(selectedTask.id);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}

/* ─── Task card — spacious, colored left accent ─── */
function TaskCard({
  task,
  onToggle,
  onSelect,
}: {
  task: Task;
  onToggle: () => void;
  onSelect: () => void;
}) {
  const subject = SUBJECTS[task.subject as keyof typeof SUBJECTS];
  const overdue = !task.completed && isOverdue(task.dueDate);

  return (
    <Card
      padding="md"
      className={cn(
        "group cursor-pointer hover:shadow-md transition-smooth",
        task.completed && "opacity-50"
      )}
    >
      <div className="flex items-center gap-4" onClick={onSelect}>
        {/* Subject color bar — thicker, rounded */}
        <div
          className="w-1.5 h-12 rounded-full flex-shrink-0"
          style={{ backgroundColor: subject?.color || "#60729f" }}
        />

        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={cn(
            "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-smooth",
            task.completed
              ? "bg-ash-500 border-ash-500"
              : "border-lavender-300 dark:border-lavender-600 hover:border-baltic-400"
          )}
        >
          {task.completed && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 5l2.5 2.5L8 3" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-semibold truncate",
            task.completed
              ? "text-steel-400 line-through"
              : "text-baltic-800 dark:text-baltic-100"
          )}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-steel-400 truncate mt-0.5">{task.description}</p>
          )}
        </div>

        {/* Meta — simplified */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: PRIORITIES[task.priority].color }}
          />
          <span className={cn(
            "text-xs font-semibold",
            overdue ? "text-red-500" : "text-steel-400"
          )}>
            {overdue ? "Overdue" : formatDate(task.dueDate)}
          </span>
        </div>
      </div>
    </Card>
  );
}

/* ─── Add Task Modal ─── */
function AddTaskModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (task: Omit<Task, "id" | "createdAt" | "completed">) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState<string>("mathematics");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;
      onAdd({ title: title.trim(), description: description.trim(), subject, priority, dueDate });
      setTitle("");
      setDescription("");
      setSubject("mathematics");
      setPriority("medium");
      setDueDate(new Date().toISOString().split("T")[0]);
      onClose();
    },
    [title, description, subject, priority, dueDate, onAdd, onClose]
  );

  return (
    <Modal open={open} onClose={onClose} title="New task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="task-title"
          label="Title"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <div className="space-y-1.5">
          <label className="text-label text-baltic-600 dark:text-baltic-300">Description</label>
          <textarea
            className="w-full px-4 py-3 text-sm rounded-xl border border-lavender-200 dark:border-lavender-700 bg-white dark:bg-lavender-900 text-baltic-800 dark:text-baltic-100 placeholder:text-steel-400 outline-none focus:ring-2 focus:ring-baltic-400/30 focus:border-baltic-400 transition-smooth resize-none"
            rows={2}
            placeholder="Additional details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-label text-baltic-600 dark:text-baltic-300">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-lavender-200 dark:border-lavender-700 bg-white dark:bg-lavender-900 text-baltic-800 dark:text-baltic-100 outline-none focus:ring-2 focus:ring-baltic-400/30"
            >
              {Object.entries(SUBJECTS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-label text-baltic-600 dark:text-baltic-300">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-lavender-200 dark:border-lavender-700 bg-white dark:bg-lavender-900 text-baltic-800 dark:text-baltic-100 outline-none focus:ring-2 focus:ring-baltic-400/30"
            />
          </div>
        </div>

        {/* Priority selection */}
        <div className="space-y-1.5">
          <label className="text-label text-baltic-600 dark:text-baltic-300">Priority</label>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-xs font-semibold transition-smooth border",
                  priority === p
                    ? "border-baltic-400 bg-baltic-50 text-baltic-700 dark:bg-baltic-900/50 dark:text-baltic-300 dark:border-baltic-600"
                    : "border-lavender-200 dark:border-lavender-700 text-steel-500 hover:border-lavender-300"
                )}
              >
                {PRIORITIES[p].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!title.trim()}>Create task</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Task Detail Modal ─── */
function TaskDetailModal({
  task,
  onClose,
  onToggle,
  onDelete,
}: {
  task: Task;
  onClose: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const subject = SUBJECTS[task.subject as keyof typeof SUBJECTS];

  return (
    <Modal open={true} onClose={onClose} title={task.title} width="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: subject?.color || "#60729f" }}
          />
          <span className="text-sm font-semibold text-baltic-700 dark:text-baltic-300">
            {subject?.label || task.subject}
          </span>
          <Badge color={PRIORITIES[task.priority].color}>{PRIORITIES[task.priority].label}</Badge>
          {task.completed && <Badge color="#76946b">Completed</Badge>}
        </div>

        {task.description && (
          <p className="text-sm text-steel-600 dark:text-steel-400 leading-relaxed">{task.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-steel-400">
          <span>Due: {formatDate(task.dueDate)}</span>
          {!task.completed && isOverdue(task.dueDate) && (
            <span className="text-red-500 font-semibold">Overdue</span>
          )}
        </div>

        <div className="flex gap-3 pt-2 border-t border-lavender-100 dark:border-lavender-800">
          <Button variant="secondary" onClick={onToggle} className="flex-1">
            {task.completed ? "Mark pending" : "Mark complete"}
          </Button>
          <Button variant="danger" onClick={onDelete}>Delete</Button>
        </div>
      </div>
    </Modal>
  );
}
