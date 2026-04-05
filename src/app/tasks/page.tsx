"use client";

import { useState, useMemo, useCallback } from "react";
import { useTasks, useSubjects } from "@/lib/contexts";
import { PRIORITIES, type Task } from "@/lib/types";
import { cn, formatDate, isOverdue } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

type FilterStatus = "all" | "pending" | "completed";

/* ─── Subject Bookshelf ─── */
function SubjectBookshelf({
  activeSubject,
  onSelect,
}: {
  activeSubject: string;
  onSelect: (subject: string) => void;
}) {
  const { subjects } = useSubjects();
  const { tasks } = useTasks();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const subjectStats = useMemo(() => {
    const stats: Record<string, { pending: number; completed: number }> = {};
    for (const sub of subjects) {
      stats[sub.label] = { pending: 0, completed: 0 };
    }
    for (const task of tasks) {
      if (stats[task.subject]) {
        if (task.completed) stats[task.subject].completed++;
        else stats[task.subject].pending++;
      }
    }
    return stats;
  }, [subjects, tasks]);

  const activeIndex = hoveredIndex !== null
    ? hoveredIndex
    : subjects.findIndex((s) => s.label === activeSubject);

  return (
    <div className="flex items-end gap-1.5 h-[180px]">
      {subjects.map((sub, index) => {
        const isExpanded = index === activeIndex;
        const isSelected = sub.label === activeSubject;
        const stats = subjectStats[sub.label] || { pending: 0, completed: 0 };
        const total = stats.pending + stats.completed;
        const pct = total > 0 ? Math.round((stats.completed / total) * 100) : 0;

        return (
          <div
            key={sub.id}
            className="relative h-full cursor-pointer transition-all duration-700 ease-in-out"
            style={{
              width: isExpanded ? 200 : 36,
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => onSelect(isSelected ? "all" : sub.label)}
          >
            {/* Book spine / expanded panel */}
            <div
              className={cn(
                "absolute inset-0 rounded-xl overflow-hidden transition-all duration-700 ease-in-out",
                isSelected && !isExpanded && "ring-2 ring-offset-2 ring-offset-lavender-50 dark:ring-offset-baltic-900"
              )}
              style={{
                backgroundColor: sub.color,
                borderRadius: isExpanded ? 16 : 20,
                ...(isSelected && !isExpanded ? { ringColor: sub.color } : {}),
              }}
            >
              {/* Subtle inner shadow for book depth */}
              <div
                className="absolute inset-0 transition-opacity duration-700"
                style={{
                  background: isExpanded
                    ? "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.25) 100%)"
                    : "linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.15) 50%, rgba(255,255,255,0.05) 100%)",
                }}
              />

              {/* Spine: vertical label (visible when collapsed) */}
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
                  isExpanded ? "opacity-0" : "opacity-100"
                )}
              >
                <span
                  className="text-white text-xs font-semibold whitespace-nowrap"
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                  }}
                >
                  {sub.label}
                </span>
              </div>

              {/* Expanded content: label + stats at bottom */}
              <div
                className={cn(
                  "absolute inset-0 flex flex-col justify-end p-5 transition-opacity duration-500",
                  isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              >
                <p className="text-white text-lg font-bold leading-tight">
                  {sub.label}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-white/80 text-xs font-medium">
                    {stats.pending} pending
                  </span>
                  <span className="text-white/40">·</span>
                  <span className="text-white/80 text-xs font-medium">
                    {stats.completed} done
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2.5 h-1 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white/70 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TasksPage() {
  const { tasks, addTask, toggleComplete, deleteTask } = useTasks();
  const { subjects, getSubject } = useSubjects();

  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending");
  const [filterSubject, setFilterSubject] = useState<string>("all");
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

    result.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return result;
  }, [tasks, filterSubject, filterStatus]);

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const overdueCount = tasks.filter((t) => !t.completed && isOverdue(t.dueDate)).length;
  const completionPct =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const { overdueTasks, todayTasks, upcomingTasks, completedTasks } = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const overdue: Task[] = [];
    const todayGroup: Task[] = [];
    const upcoming: Task[] = [];
    const completed: Task[] = [];

    for (const task of filteredTasks) {
      if (task.completed) {
        completed.push(task);
      } else if (isOverdue(task.dueDate)) {
        overdue.push(task);
      } else if (task.dueDate === today) {
        todayGroup.push(task);
      } else {
        upcoming.push(task);
      }
    }
    return {
      overdueTasks: overdue,
      todayTasks: todayGroup,
      upcomingTasks: upcoming,
      completedTasks: completed,
    };
  }, [filteredTasks]);

  return (
    <div className="space-y-6">
      {/* ── Header card ── */}
      <div className="rounded-xl bg-white dark:bg-lavender-900 border border-lavender-200 dark:border-lavender-700 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-baltic-800 dark:text-baltic-100">
                Tasks
              </h1>
              {overdueCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[11px] font-bold">
                  {overdueCount} overdue
                </span>
              )}
            </div>
            <p className="text-sm text-steel-400 mt-1">
              Stay on track — one task at a time.
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M7 2v10M2 7h10" />
            </svg>
            New task
          </Button>
        </div>

        {/* Progress bar + counts */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-extrabold text-baltic-800 dark:text-baltic-100 leading-none tracking-tight">
                {pendingCount}
              </span>
              <span className="text-xs font-medium text-steel-400">
                pending
              </span>
              <div className="w-px h-5 bg-lavender-200 dark:bg-lavender-700" />
              <span className="text-3xl font-extrabold text-baltic-800 dark:text-baltic-100 leading-none tracking-tight">
                {completedCount}
              </span>
              <span className="text-xs font-medium text-steel-400">done</span>
            </div>
            <span className="text-sm font-bold text-baltic-600 dark:text-baltic-400">
              {completionPct}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-baltic-100 dark:bg-baltic-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-baltic-500 dark:bg-baltic-400 transition-all duration-700"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Subject Bookshelf ── */}
      <SubjectBookshelf
        activeSubject={filterSubject}
        onSelect={setFilterSubject}
      />

      {/* ── Status filters ── */}
      <div className="flex items-center gap-2 flex-wrap">
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
              "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-smooth",
              filterStatus === opt.value
                ? "bg-baltic-600 text-white dark:bg-baltic-500"
                : "bg-white dark:bg-lavender-900 border border-lavender-200 dark:border-lavender-700 text-steel-400 hover:text-baltic-600 hover:border-lavender-300"
            )}
          >
            {opt.label}
          </button>
        ))}

        {filterSubject !== "all" && (
          <>
            <div className="w-px h-5 bg-lavender-200 dark:bg-lavender-700 mx-1" />
            <button
              onClick={() => setFilterSubject("all")}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-smooth bg-white dark:bg-lavender-900 border border-lavender-200 dark:border-lavender-700 text-steel-400 hover:text-baltic-600 hover:border-lavender-300 flex items-center gap-1.5"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 2l6 6M8 2l-6 6" />
              </svg>
              Clear filter
            </button>
          </>
        )}
      </div>

      {/* ── Task list ── */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-5">
          {overdueTasks.length > 0 && (
            <TaskGroup label="Overdue" accent="text-red-500">
              {overdueTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleComplete(task.id)}
                  onSelect={() => setSelectedTask(task)}
                />
              ))}
            </TaskGroup>
          )}

          {todayTasks.length > 0 && (
            <TaskGroup label="Today" accent="text-baltic-600 dark:text-baltic-400">
              {todayTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleComplete(task.id)}
                  onSelect={() => setSelectedTask(task)}
                />
              ))}
            </TaskGroup>
          )}

          {upcomingTasks.length > 0 && (
            <TaskGroup label="Upcoming" accent="text-steel-400">
              {upcomingTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleComplete(task.id)}
                  onSelect={() => setSelectedTask(task)}
                />
              ))}
            </TaskGroup>
          )}

          {completedTasks.length > 0 && (
            <TaskGroup label="Completed" accent="text-ash-500">
              {completedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleComplete(task.id)}
                  onSelect={() => setSelectedTask(task)}
                />
              ))}
            </TaskGroup>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-lavender-300 dark:border-lavender-600 py-12 text-center">
          <div className="flex justify-center mb-3">
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-lavender-300 dark:text-lavender-600"
            >
              <rect x="6" y="8" width="24" height="22" rx="3" />
              <path d="M13 16l4 4 6-6" />
            </svg>
          </div>
          <p className="text-sm font-medium text-baltic-700 dark:text-baltic-300">
            {filterStatus !== "all" || filterSubject !== "all"
              ? "No tasks match your filters"
              : "No tasks yet"}
          </p>
          <p className="text-xs text-steel-400 mt-0.5">
            {filterStatus !== "all" || filterSubject !== "all" ? (
              <button
                onClick={() => {
                  setFilterStatus("pending");
                  setFilterSubject("all");
                }}
                className="underline hover:text-baltic-600 transition-smooth"
              >
                Clear filters
              </button>
            ) : (
              "Add your first task to get started."
            )}
          </p>
        </div>
      )}

      <AddTaskModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addTask}
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

/* ─── Task group with label ─── */
function TaskGroup({
  label,
  accent,
  children,
}: {
  label: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label && (
        <div className="flex items-center gap-3 mb-2">
          <span className={cn("text-[11px] font-bold uppercase tracking-wider", accent)}>
            {label}
          </span>
          <div className="flex-1 h-px bg-lavender-200 dark:bg-lavender-700" />
        </div>
      )}
      <div className="space-y-1.5">{children}</div>
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
  const { getSubject } = useSubjects();
  const subject = getSubject(task.subject);
  const overdue = !task.completed && isOverdue(task.dueDate);
  const color = subject?.color || "#60729f";

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-smooth",
        "bg-white dark:bg-lavender-900 border border-lavender-200 dark:border-lavender-700",
        "hover:shadow-sm hover:border-lavender-300 dark:hover:border-lavender-600",
        task.completed && "opacity-50"
      )}
    >
      {/* Check circle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={cn(
          "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-smooth",
          task.completed
            ? "border-ash-500 bg-ash-500"
            : "hover:scale-110"
        )}
        style={!task.completed ? { borderColor: color } : undefined}
      >
        {task.completed ? (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 5l2.5 2.5L8 3" />
          </svg>
        ) : (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <path d="M2 5l2.5 2.5L8 3" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            task.completed
              ? "text-steel-400 line-through"
              : "text-baltic-800 dark:text-baltic-100"
          )}
        >
          {task.title}
        </p>
        {task.description && !task.completed && (
          <p className="text-xs text-steel-400 truncate mt-0.5">
            {task.description}
          </p>
        )}
      </div>

      {/* Meta: subject + date + priority */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs text-steel-400 hidden sm:inline">
          {subject?.label || task.subject}
        </span>
        <span
          className={cn(
            "text-xs font-medium",
            overdue ? "text-red-500" : "text-steel-400"
          )}
        >
          {overdue ? "Overdue" : formatDate(task.dueDate)}
        </span>
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none"
          style={{
            backgroundColor: PRIORITIES[task.priority].color + "18",
            color: PRIORITIES[task.priority].color,
          }}
        >
          {PRIORITIES[task.priority].label}
        </span>
      </div>
    </div>
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
  const { subjects } = useSubjects();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState<string>(subjects[0]?.label || "");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    "medium"
  );
  const [dueDate, setDueDate] = useState(
    new Date().toISOString().split("T")[0]
  );

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
          <label className="text-label text-baltic-600 dark:text-baltic-300">
            Description
          </label>
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
            <label className="text-label text-baltic-600 dark:text-baltic-300">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-lavender-200 dark:border-lavender-700 bg-white dark:bg-lavender-900 text-baltic-800 dark:text-baltic-100 outline-none focus:ring-2 focus:ring-baltic-400/30"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.label}>
                  {sub.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-label text-baltic-600 dark:text-baltic-300">
              Due date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-lavender-200 dark:border-lavender-700 bg-white dark:bg-lavender-900 text-baltic-800 dark:text-baltic-100 outline-none focus:ring-2 focus:ring-baltic-400/30"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-label text-baltic-600 dark:text-baltic-300">
            Priority
          </label>
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
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim()}>
            Create task
          </Button>
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
  const color = subject?.color || "#60729f";

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
              <span className="text-red-500 ml-1.5 font-medium">Overdue</span>
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
