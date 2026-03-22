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

    result.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    result.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

    return result;
  }, [tasks, filterSubject, filterStatus]);

  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-baltic-800 dark:text-baltic-100">Tasks</h1>
          <p className="text-sm text-steel-400 mt-1">
            {pendingCount} pending · {tasks.filter((t) => t.completed).length} completed
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M7 2v10M2 7h10" />
          </svg>
          Add task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status */}
        <div className="flex items-center gap-1 border border-lavender-100 dark:border-lavender-800 rounded-md p-0.5">
          {([
            { value: "all", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "completed", label: "Done" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-smooth",
                filterStatus === opt.value
                  ? "bg-baltic-600 text-white dark:bg-baltic-500"
                  : "text-steel-400 hover:text-baltic-600"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Subject */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setFilterSubject("all")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium transition-smooth",
              filterSubject === "all"
                ? "bg-baltic-100 text-baltic-700 dark:bg-baltic-800 dark:text-baltic-200"
                : "text-steel-400 hover:text-baltic-600"
            )}
          >
            All
          </button>
          {Object.entries(SUBJECTS).map(([key, { label, color }]) => (
            <button
              key={key}
              onClick={() => setFilterSubject(key as SubjectKey)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium transition-smooth flex items-center gap-1.5",
                filterSubject === key
                  ? "text-white"
                  : "text-steel-400 hover:text-baltic-600"
              )}
              style={filterSubject === key ? { backgroundColor: color } : undefined}
            >
              {filterSubject !== key && (
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => toggleComplete(task.id)}
              onSelect={() => setSelectedTask(task)}
            />
          ))}
        </div>
      ) : (
        <Card padding="md">
          <div className="py-8 text-center">
            <p className="text-sm text-steel-400">No tasks match your filters.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
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

      <AddTaskModal open={showAddModal} onClose={() => setShowAddModal(false)} onAdd={addTask} />

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

/* ─── Task row ─── */
function TaskRow({
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
      padding="sm"
      className={cn(
        "group cursor-pointer hover:border-lavender-200 dark:hover:border-lavender-600 transition-smooth",
        task.completed && "opacity-50"
      )}
    >
      <div className="flex items-center gap-3" onClick={onSelect}>
        {/* Color bar */}
        <div
          className="w-1 h-10 rounded-sm flex-shrink-0"
          style={{ backgroundColor: subject?.color || "#60729f" }}
        />

        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={cn(
            "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-smooth",
            task.completed
              ? "bg-ash-500 border-ash-500"
              : "border-lavender-300 dark:border-lavender-600 hover:border-baltic-400"
          )}
        >
          {task.completed && (
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 5l2.5 2.5L8 3" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm truncate",
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

        {/* Meta */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: PRIORITIES[task.priority].color }}
            title={PRIORITIES[task.priority].label}
          />
          <span className={cn(
            "text-xs font-medium",
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
            className="w-full px-3 py-2 text-sm rounded-md border border-lavender-200 dark:border-lavender-700 bg-white dark:bg-lavender-900 text-baltic-800 dark:text-baltic-100 placeholder:text-steel-400 outline-none focus:ring-2 focus:ring-baltic-400/30 focus:border-baltic-400 transition-smooth resize-none"
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
              className="w-full px-3 py-2 text-sm rounded-md border border-lavender-200 dark:border-lavender-700 bg-white dark:bg-lavender-900 text-baltic-800 dark:text-baltic-100 outline-none focus:ring-2 focus:ring-baltic-400/30"
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
              className="w-full px-3 py-2 text-sm rounded-md border border-lavender-200 dark:border-lavender-700 bg-white dark:bg-lavender-900 text-baltic-800 dark:text-baltic-100 outline-none focus:ring-2 focus:ring-baltic-400/30"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-label text-baltic-600 dark:text-baltic-300">Priority</label>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  "flex-1 py-2 rounded-md text-xs font-medium transition-smooth border",
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
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: subject?.color || "#60729f" }}
          />
          <span className="text-sm text-baltic-700 dark:text-baltic-300">
            {subject?.label || task.subject}
          </span>
          <Badge color={PRIORITIES[task.priority].color}>{PRIORITIES[task.priority].label}</Badge>
          {task.completed && <Badge color="#76946b">Completed</Badge>}
        </div>

        {task.description && (
          <p className="text-sm text-steel-500 dark:text-steel-400 leading-relaxed">{task.description}</p>
        )}

        <div className="text-xs text-steel-400">
          Due: {formatDate(task.dueDate)}
          {!task.completed && isOverdue(task.dueDate) && (
            <span className="text-red-500 ml-2">Overdue</span>
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
