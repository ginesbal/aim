"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useTasks, useSubjects } from "@/lib/contexts";
import { PRIORITIES, type Task } from "@/lib/types";
import { cn, formatDate, isOverdue } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

export default function TasksPage() {
  const { tasks, addTask, toggleComplete, deleteTask } = useTasks();
  const { subjects, getSubject } = useSubjects();

  const [expandedSubject, setExpandedSubject] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed">("pending");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalSubject, setAddModalSubject] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Stats per subject
  const subjectStats = useMemo(() => {
    const stats: Record<string, { pending: number; completed: number; overdue: number; total: number }> = {
      all: { pending: 0, completed: 0, overdue: 0, total: 0 },
    };
    for (const sub of subjects) {
      stats[sub.label] = { pending: 0, completed: 0, overdue: 0, total: 0 };
    }
    for (const task of tasks) {
      const s = stats[task.subject];
      if (s) {
        s.total++;
        if (task.completed) s.completed++;
        else {
          s.pending++;
          if (isOverdue(task.dueDate)) s.overdue++;
        }
      }
      stats.all.total++;
      if (task.completed) stats.all.completed++;
      else {
        stats.all.pending++;
        if (!task.completed && isOverdue(task.dueDate)) stats.all.overdue++;
      }
    }
    return stats;
  }, [tasks, subjects]);

  // Filtered tasks for expanded panel
  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (expandedSubject !== "all") {
      result = result.filter((t) => t.subject === expandedSubject);
    }
    if (filterStatus === "pending") {
      result = result.filter((t) => !t.completed);
    } else if (filterStatus === "completed") {
      result = result.filter((t) => t.completed);
    }
    result.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const aOverdue = !a.completed && isOverdue(a.dueDate);
      const bOverdue = !b.completed && isOverdue(b.dueDate);
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    return result;
  }, [tasks, expandedSubject, filterStatus]);

  const currentStats = subjectStats[expandedSubject] || subjectStats.all;

  // Accordion panels: "All" + each subject
  const panels = useMemo(() => {
    const all = { id: "all", label: "All", color: "#9faac6" };
    const subs = subjects.map((s) => ({ id: s.label, label: s.label, color: s.color }));
    return [all, ...subs];
  }, [subjects]);

  // Helper: lighten a hex color for background tint
  function lighten(hex: string, amount: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lr = Math.round(r + (255 - r) * amount);
    const lg = Math.round(g + (255 - g) * amount);
    const lb = Math.round(b + (255 - b) * amount);
    return `rgb(${lr}, ${lg}, ${lb})`;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-display text-baltic-800 dark:text-baltic-100">Tasks</h1>
          <p className="text-sm text-steel-400 mt-1">
            {currentStats.pending} pending
            {currentStats.overdue > 0 && (
              <span className="text-red-500 font-medium ml-1">
                · {currentStats.overdue} overdue
              </span>
            )}
            {currentStats.completed > 0 && (
              <span className="ml-1">· {currentStats.completed} done</span>
            )}
          </p>
        </div>
        <Button onClick={() => {
          setAddModalSubject(expandedSubject !== "all" ? expandedSubject : null);
          setShowAddModal(true);
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M7 2v10M2 7h10" />
          </svg>
          New task
        </Button>
      </div>

      {/* ─── Accordion ─── */}
      <div className="flex gap-1.5 h-[calc(100vh-13rem)] min-h-[420px]">
        {panels.map((panel) => {
          const isExpanded = panel.id === expandedSubject;
          const stats = subjectStats[panel.id] || { pending: 0, completed: 0, overdue: 0, total: 0 };
          const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

          return (
            <div
              key={panel.id}
              className={cn(
                "relative transition-all duration-500 ease-in-out rounded-2xl overflow-hidden",
                isExpanded ? "shadow-sm" : "cursor-pointer"
              )}
              style={{
                flex: isExpanded ? "1 1 0%" : "0 0 52px",
                minWidth: isExpanded ? 0 : 52,
              }}
            >
              {/* ── Collapsed tab ── */}
              {!isExpanded && (
                <button
                  onClick={() => setExpandedSubject(panel.id)}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl transition-all duration-200 group"
                  style={{
                    backgroundColor: lighten(panel.color, 0.82),
                    borderLeft: `3px solid ${panel.color}`,
                  }}
                >
                  {stats.overdue > 0 && (
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                  )}
                  <span
                    className="text-[11px] font-semibold whitespace-nowrap select-none transition-colors"
                    style={{
                      color: panel.color,
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                    }}
                  >
                    {panel.label}
                  </span>
                  {stats.pending > 0 && (
                    <span
                      className="text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
                      style={{
                        backgroundColor: lighten(panel.color, 0.7),
                        color: panel.color,
                      }}
                    >
                      {stats.pending}
                    </span>
                  )}
                </button>
              )}

              {/* ── Expanded panel ── */}
              {isExpanded && (
                <div className="h-full flex flex-col bg-white dark:bg-lavender-900 rounded-2xl">
                  {/* Light colored header */}
                  <div
                    className="flex-shrink-0 px-5 pt-4 pb-3"
                    style={{ backgroundColor: lighten(panel.color, 0.88) }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: panel.color }}
                        />
                        <h2
                          className="text-base font-bold"
                          style={{ color: panel.color }}
                        >
                          {panel.label}
                        </h2>
                      </div>
                      <button
                        onClick={() => {
                          setAddModalSubject(panel.id !== "all" ? panel.id : null);
                          setShowAddModal(true);
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/60"
                        style={{ color: panel.color }}
                        title="Add task"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M8 3v10M3 8h10" />
                        </svg>
                      </button>
                    </div>

                    {/* Compact stats row */}
                    <div className="flex items-center gap-4 text-xs">
                      <span style={{ color: panel.color }} className="font-semibold">
                        {stats.pending} pending
                      </span>
                      <span className="text-steel-300">·</span>
                      <span className="text-steel-400">
                        {stats.completed} done
                      </span>
                      {stats.overdue > 0 && (
                        <>
                          <span className="text-steel-300">·</span>
                          <span className="text-red-400 font-medium">
                            {stats.overdue} overdue
                          </span>
                        </>
                      )}
                      <span className="text-steel-300 ml-auto">{pct}%</span>
                    </div>

                    {/* Thin progress bar */}
                    <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: lighten(panel.color, 0.7) }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: panel.color }}
                      />
                    </div>
                  </div>

                  {/* Filter tabs — simple text tabs */}
                  <div className="flex-shrink-0 flex items-center gap-4 px-5 py-2.5 border-b border-lavender-100 dark:border-lavender-800">
                    {(
                      [
                        { value: "pending", label: "Pending" },
                        { value: "completed", label: "Done" },
                        { value: "all", label: "All" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFilterStatus(opt.value)}
                        className={cn(
                          "text-xs font-medium pb-0.5 transition-all border-b-2",
                          filterStatus === opt.value
                            ? "border-current"
                            : "border-transparent text-steel-400 hover:text-steel-600"
                        )}
                        style={filterStatus === opt.value ? { color: panel.color } : undefined}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Task list */}
                  <div className="flex-1 overflow-y-auto px-3 py-2">
                    {filteredTasks.length > 0 ? (
                      <div className="space-y-0.5">
                        {filteredTasks.map((task) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            showSubject={expandedSubject === "all"}
                            onToggle={() => toggleComplete(task.id)}
                            onSelect={() => setSelectedTask(task)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <p className="text-sm text-steel-400">
                          {filterStatus !== "all" ? "No matching tasks" : "No tasks yet"}
                        </p>
                        <button
                          onClick={() => {
                            if (filterStatus !== "all") {
                              setFilterStatus("pending");
                            } else {
                              setAddModalSubject(panel.id !== "all" ? panel.id : null);
                              setShowAddModal(true);
                            }
                          }}
                          className="text-xs mt-1 underline transition-smooth hover:text-baltic-600"
                          style={{ color: panel.color }}
                        >
                          {filterStatus !== "all" ? "Show pending" : "Add a task"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <AddTaskModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setAddModalSubject(null);
        }}
        onAdd={addTask}
        initialSubject={addModalSubject}
      />

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
  showSubject,
  onToggle,
  onSelect,
}: {
  task: Task;
  showSubject: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  const { getSubject } = useSubjects();
  const subject = getSubject(task.subject);
  const overdue = !task.completed && isOverdue(task.dueDate);
  const color = subject?.color || "#9faac6";

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-150",
        "hover:bg-baltic-50/60 dark:hover:bg-lavender-800/30",
        task.completed && "opacity-40"
      )}
    >
      {/* Check circle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={cn(
          "w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-smooth",
          task.completed ? "border-ash-400 bg-ash-400" : "hover:scale-110"
        )}
        style={!task.completed ? { borderColor: color } : undefined}
      >
        {task.completed && (
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 5l2.5 2.5L8 3" />
          </svg>
        )}
        {!task.completed && (
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <path d="M2 5l2.5 2.5L8 3" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          task.completed ? "text-steel-400 line-through" : "text-baltic-800 dark:text-baltic-100"
        )}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {showSubject && (
            <>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[11px] text-steel-400 truncate">
                {subject?.label || task.subject}
              </span>
              <span className="text-steel-300 text-[11px]">·</span>
            </>
          )}
          <span className={cn("text-[11px]", overdue ? "text-red-400 font-medium" : "text-steel-400")}>
            {overdue ? "Overdue" : formatDate(task.dueDate)}
          </span>
          <span
            className="px-1.5 py-0.5 rounded text-[9px] font-bold leading-none uppercase tracking-wide"
            style={{
              backgroundColor: PRIORITIES[task.priority].color + "12",
              color: PRIORITIES[task.priority].color,
            }}
          >
            {PRIORITIES[task.priority].label}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Add Task Modal ─── */
function AddTaskModal({
  open,
  onClose,
  onAdd,
  initialSubject,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (task: Omit<Task, "id" | "createdAt" | "completed">) => void;
  initialSubject?: string | null;
}) {
  const { subjects } = useSubjects();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState<string>(initialSubject || subjects[0]?.label || "");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (open && initialSubject) {
      setSubject(initialSubject);
    }
  }, [open, initialSubject]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;
      onAdd({
        title: title.trim(),
        description: description.trim(),
        subject,
        priority,
        dueDate,
      });
      setTitle("");
      setDescription("");
      setSubject(subjects[0]?.label || "");
      setPriority("medium");
      setDueDate(new Date().toISOString().split("T")[0]);
      onClose();
    },
    [title, description, subject, priority, dueDate, onAdd, onClose, subjects]
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
            className="w-full px-3 py-2 text-sm rounded-xl border border-lavender-200 dark:border-lavender-700 bg-white dark:bg-lavender-900 text-baltic-800 dark:text-baltic-100 placeholder:text-steel-400 outline-none focus:ring-2 focus:ring-baltic-400/30 focus:border-baltic-400 transition-smooth resize-none"
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
              className="w-full px-3 py-2 text-sm rounded-xl border border-lavender-200 dark:border-lavender-700 bg-white dark:bg-lavender-900 text-baltic-800 dark:text-baltic-100 outline-none focus:ring-2 focus:ring-baltic-400/30"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.label}>{sub.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-label text-baltic-600 dark:text-baltic-300">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-lavender-200 dark:border-lavender-700 bg-white dark:bg-lavender-900 text-baltic-800 dark:text-baltic-100 outline-none focus:ring-2 focus:ring-baltic-400/30"
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
                  "flex-1 py-2 rounded-xl text-xs font-medium transition-smooth border",
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
  const { getSubject } = useSubjects();
  const subject = getSubject(task.subject);
  const color = subject?.color || "#9faac6";

  return (
    <Modal open={true} onClose={onClose} title={task.title} width="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: color }}
          >
            {subject?.label || task.subject}
          </span>
          <span
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: PRIORITIES[task.priority].color + "18",
              color: PRIORITIES[task.priority].color,
            }}
          >
            {PRIORITIES[task.priority].label} priority
          </span>
          {task.completed && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-ash-100 dark:bg-ash-900/30 text-ash-600 dark:text-ash-400">
              Completed
            </span>
          )}
        </div>

        {task.description && (
          <p className="text-sm text-steel-500 dark:text-steel-400 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-steel-400">
          <span>
            Due: {formatDate(task.dueDate)}
            {!task.completed && isOverdue(task.dueDate) && (
              <span className="text-red-400 ml-1.5 font-medium">Overdue</span>
            )}
          </span>
          {task.createdAt && (
            <>
              <span className="text-steel-300 dark:text-steel-600">·</span>
              <span>Created: {formatDate(task.createdAt.split("T")[0])}</span>
            </>
          )}
        </div>

        <div className="flex gap-3 pt-2 border-t border-lavender-100 dark:border-lavender-800">
          <Button variant="secondary" onClick={onToggle} className="flex-1">
            {task.completed ? "Mark pending" : "Mark complete"}
          </Button>
          <Button variant="danger" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
