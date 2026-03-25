"use client";

import { useMemo } from "react";
import { useFocus, useSubjects } from "@/lib/contexts";
import { QUALITY_LEVELS, type FocusQuality } from "@/lib/types";
import { formatTime } from "@/lib/utils";

export default function JournalPage() {
  const { sessions } = useFocus();
  const { getSubject } = useSubjects();

  const sorted = useMemo(
    () =>
      [...sessions].sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      ),
    [sessions]
  );

  const grouped = useMemo(() => {
    const groups: {
      label: string;
      fullDate: string;
      dateKey: string;
      sessions: typeof sorted;
    }[] = [];
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const map = new Map<string, typeof sorted>();
    for (const s of sorted) {
      const d = new Date(s.completedAt);
      const key = d.toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }

    for (const [dateKey, items] of Array.from(map.entries())) {
      const d = new Date(dateKey);
      let label: string;
      if (d.toDateString() === now.toDateString()) label = "Today";
      else if (d.toDateString() === yesterday.toDateString())
        label = "Yesterday";
      else
        label = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

      const fullDate = d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      groups.push({ label, fullDate, dateKey, sessions: items });
    }

    return groups;
  }, [sorted]);

  /** Resolve a subject key/label to display info */
  function resolveSubject(subjectKey: string) {
    const sub = getSubject(subjectKey);
    return {
      label: sub?.label || subjectKey,
      color: sub?.color || "#60729f",
    };
  }

  /** Quality to a short handwritten-style description */
  function qualityNote(q: FocusQuality): string {
    return QUALITY_LEVELS[q].label.toLowerCase();
  }

  return (
    <div className="max-w-2xl mx-auto journal-notebook journal-fade">
      {/* Notebook page */}
      <div className="journal-page">
        {/* Hole punches */}
        <div className="journal-holes">
          <div className="journal-hole" style={{ top: "60px" }} />
          <div className="journal-hole" style={{ top: "50%" }} />
          <div className="journal-hole" style={{ bottom: "60px" }} />
        </div>

        {/* Content area with ruled lines */}
        <div className="journal-lines" style={{ paddingLeft: "88px", paddingRight: "32px", paddingTop: "32px", paddingBottom: "48px", minHeight: "600px" }}>
          {/* Title — written large like a journal cover page heading */}
          <div className="journal-entry-line" style={{ fontSize: "32px", fontWeight: 600 }}>
            <span className="journal-ink">Study Journal</span>
          </div>
          <div className="journal-entry-line" style={{ fontSize: "16px" }}>
            <span className="journal-ink-light">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded
            </span>
          </div>

          {/* Spacer line */}
          <div className="journal-entry-line" />

          {grouped.length > 0 ? (
            grouped.map((group, gi) => (
              <div key={group.dateKey}>
                {/* Date header — like writing the date at the top of a new day */}
                <div className="journal-entry-line" style={{ fontSize: "20px", fontWeight: 600 }}>
                  <span className="journal-ink-accent">
                    {group.label === "Today" || group.label === "Yesterday"
                      ? `${group.label} — `
                      : ""}
                    {group.fullDate}
                  </span>
                </div>

                {/* Underline beneath date — like a pen stroke */}
                <div
                  className="mb-1"
                  style={{
                    height: "1.5px",
                    background: "linear-gradient(to right, rgba(74, 111, 165, 0.4), transparent 80%)",
                    marginTop: "-2px",
                  }}
                />

                {/* Session entries — written like journal paragraphs */}
                {group.sessions.map((session) => {
                  const sub = resolveSubject(session.subject);
                  const time = new Date(session.completedAt).toLocaleTimeString(
                    "en-US",
                    { hour: "numeric", minute: "2-digit" }
                  );

                  return (
                    <div key={session.id} className="mb-1">
                      {/* Main entry line */}
                      <div className="journal-entry-line" style={{ fontSize: "18px" }}>
                        <span className="journal-ink">
                          <span
                            className="journal-dot"
                            style={{ backgroundColor: sub.color }}
                          />
                          Studied{" "}
                          <strong>{sub.label}</strong> for{" "}
                          <strong>{formatTime(session.duration)}</strong>
                          <span className="journal-ink-light">
                            {" "}
                            &mdash; {time}
                          </span>
                        </span>
                      </div>

                      {/* Reflection — like a personal note in lighter ink */}
                      {session.reflection && (
                        <div
                          className="journal-entry-line journal-ink-light"
                          style={{ fontSize: "16px", paddingLeft: "14px" }}
                        >
                          <em>
                            Feeling {qualityNote(session.reflection.quality)}
                            {session.reflection.note
                              ? ` — "${session.reflection.note}"`
                              : ""}
                          </em>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Blank line between day groups */}
                {gi < grouped.length - 1 && (
                  <div className="journal-entry-line" />
                )}
              </div>
            ))
          ) : (
            <>
              <div className="journal-entry-line" style={{ fontSize: "18px" }}>
                <span className="journal-ink-light">
                  <em>No sessions recorded yet...</em>
                </span>
              </div>
              <div className="journal-entry-line" style={{ fontSize: "16px" }}>
                <span className="journal-ink-light">
                  <em>Complete a focus session to start writing your story.</em>
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Subtle page edge shadow beneath */}
      <div
        className="mx-4 h-2 rounded-b-lg"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.04), transparent)",
        }}
      />
    </div>
  );
}
