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

  const [activeTab, setActiveTab] = useState<string>("all");
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

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (activeTab !== "all") {
      result = result.filter((t) => t.subject === activeTab);
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
  }, [tasks, activeTab, filterStatus]);

  // Tabs: "All" + each subject
  const tabs = useMemo(() => {
    const all = { id: "all", label: "All", color: "#9faac6" };
    const subs = subjects.map((s) => ({ id: s.label, label: s.label, color: s.color }));
    return [all, ...subs];
  }, [subjects]);

  const activeColor = tabs.find((t) => t.id === activeTab)?.color || "#9faac6";
  const currentStats = subjectStats[activeTab] || subjectStats.all;
  const pct = currentStats.total > 0 ? Math.round((currentStats.completed / currentStats.total) * 100) : 0;

  // Helper: lighten a hex color
  function lighten(hex: string, amount: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.round(r + (255 - r) * amount)}, ${Math.round(g + (255 - g) * amount)}, ${Math.round(b + (255 - b) * amount)})`;
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
              <span className="text-red-400 font-medium ml-1">· {currentStats.overdue} overdue</span>
            )}
            {currentStats.completed > 0 && (
              <span className="ml-1">· {currentStats.completed} done</span>
            )}
          </p>
        </div>
        <Button onClick={() => {
          setAddModalSubject(activeTab !== "all" ? activeTab : null);
          setShowAddModal(true);
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M7 2v10M2 7h10" />
          </svg>
          New task
        </Button>
      </div>

      {/* ─── Folder Tabs ─── */}
      <div className="relative">
        {/* Tab row */}
        <div className="flex items-end gap-0.5 px-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            const stats = subjectStats[tab.id] || { pending: 0, completed: 0, overdue: 0, total: 0 };

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0",
                  "rounded-t-xl border border-b-0",
                  isActive
                    ? "bg-white dark:bg-lavender-900 z-10 -mb-px"
                    : "hover:bg-white/50 dark:hover:bg-lavender-900/50 cursor-pointer"
                )}
                style={{
                  borderColor: isActive ? lighten(tab.color, 0.6) : "transparent",
                  backgroundColor: isActive ? undefined : lighten(tab.color, 0.92),
                  color: isActive ? tab.color : undefined,
                }}
              >
                {/* Colored dot */}
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tab.color, opacity: isActive ? 1 : 0.5 }}
                />

                {/* Label */}
                <span className={cn(!isActive && "text-steel-500")}>
                  {tab.label}
                </span>

                {/* Pending count */}
                {stats.pending > 0 && (
                  <span
                    className={cn(
                      "text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1",
                    )}
                    style={{
                      backgroundColor: isActive ? lighten(tab.color, 0.85) : lighten(tab.color, 0.75),
                      color: tab.color,
                    }}
                  >
                    {stats.pending}
                  </span>
                )}

                {/* Overdue dot */}
                {stats.overdue > 0 && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* ─── Folder Body ─── */}
        <div
          className="bg-white dark:bg-lavender-900 rounded-b-2xl rounded-tr-2xl shadow-sm border overflow-hidden"
          style={{ borderColor: lighten(activeColor, 0.6) }}
        >
          {/* Info bar: stats + progress + filter + add */}
          <div
            className="px-5 py-3 flex items-center gap-4 border-b"
            style={{
              backgroundColor: lighten(activeColor, 0.94),
              borderColor: lighten(activeColor, 0.8),
            }}
          >
            {/* Stats */}
            <div className="flex items-center gap-3 text-xs flex-1 min-w-0">
              <span className="font-semibold" style={{ color: activeColor }}>
                {currentStats.pending} pending
              </span>
              <span className="text-steel-300">·</span>
              <span className="text-steel-400">{currentStats.completed} done</span>
              {currentStats.overdue > 0 && (
                <>
                  <span className="text-steel-300">·</span>
                  <span className="text-red-400 font-medium">{currentStats.overdue} overdue</span>
                </>
              )}

              {/* Progress */}
              <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                <div className="w-24 h-1 rounded-full overflow-hidden" style={{ backgroundColor: lighten(activeColor, 0.75) }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: activeColor }}
                  />
                </div>
                <span className="text-[11px] text-steel-400 tabular-nums w-7 text-right">{pct}%</span>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-0.5 bg-baltic-50/80 dark:bg-lavender-800/40 rounded-lg p-0.5 flex-shrink-0">
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
                    "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
                    filterStatus === opt.value
                      ? "bg-white dark:bg-lavender-900 shadow-sm text-baltic-700 dark:text-baltic-200"
                      : "text-steel-400 hover:text-steel-600"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Quick add */}
            <button
              onClick={() => {
                setAddModalSubject(activeTab !== "all" ? activeTab : null);
                setShowAddModal(true);
              }}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
              style={{ color: activeColor, backgroundColor: lighten(activeColor, 0.85) }}
              title="Add task"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M7 3v8M3 7h8" />
              </svg>
            </button>
          </div>

          {/* Task list */}
          <div className="min-h-[360px] max-h-[calc(100vh-20rem)] overflow-y-auto px-3 py-2">
            {filteredTasks.length > 0 ? (
              <div className="space-y-0.5">
                {filteredTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    showSubject={activeTab === "all"}
                    onToggle={() => toggleComplete(task.id)}
                    onSelect={() => setSelectedTask(task)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-steel-400">
                  {filterStatus !== "all" ? "No matching tasks" : "No tasks yet"}
                </p>
                <button
                  onClick={() => {
                    if (filterStatus !== "all") {
                      setFilterStatus("pending");
                    } else {
                      setAddModalSubject(activeTab !== "all" ? activeTab : null);
                      setShowAddModal(true);
                    }
                  }}
                  className="text-xs mt-1.5 font-medium underline transition-smooth"
                  style={{ color: activeColor }}
                >
                  {filterStatus !== "all" ? "Show pending" : "Add a task"}
                </button>
              </div>
            )}
          </div>
        </div>
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
