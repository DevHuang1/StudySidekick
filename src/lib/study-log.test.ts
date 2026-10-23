import { describe, expect, it } from "vitest";
import {
  MAX_STUDY_LOG_ENTRIES,
  addStudyLogEntry,
  createStudyLogEntry,
  normalizeStudyLog,
  removeStudyLogEntry,
  studyLogFromCompletedSessions,
} from "./study-log";
import type { Assignment, StudyLogEntry } from "./types";

const assignment: Assignment = {
  id: "essay",
  title: "History essay",
  course: "History",
  dueDate: "2026-10-09",
  estimateMinutes: 180,
  completedMinutes: 0,
  createdAt: "2026-10-01T12:00:00.000Z",
};

const entry: StudyLogEntry = {
  id: "essay-2026-10-06-0",
  assignmentId: "essay",
  title: "History essay",
  course: "History",
  date: "2026-10-06",
  minutes: 45,
  completedAt: "2026-10-06T18:00:00.000Z",
};

describe("study log", () => {
  it("creates a snapshot entry from a session", () => {
    const created = createStudyLogEntry(
      { id: entry.id, assignmentId: "essay", date: "2026-10-06", minutes: 45 },
      assignment,
      new Date("2026-10-06T18:00:00.000Z"),
    );
    expect(created).toEqual(entry);
  });

  it("adds newest first and replaces an existing entry", () => {
    const second = { ...entry, id: "second", title: "Newer", completedAt: "2026-10-07T18:00:00.000Z" };
    const withSecond = addStudyLogEntry([entry], second);
    expect(withSecond.map((item) => item.id)).toEqual(["second", entry.id]);

    const replaced = addStudyLogEntry(withSecond, { ...entry, minutes: 30 });
    expect(replaced).toHaveLength(2);
    expect(replaced.find((item) => item.id === entry.id)?.minutes).toBe(30);
  });

  it("removes one checked-off session without touching the rest", () => {
    expect(removeStudyLogEntry([entry, { ...entry, id: "other" }], entry.id).map((item) => item.id)).toEqual(["other"]);
  });

  it("validates untrusted storage and deduplicates sessions", () => {
    const entries = normalizeStudyLog([
      entry,
      { ...entry, minutes: 90 },
      { ...entry, id: "bad-minutes", minutes: 0 },
      { ...entry, id: "bad-date", date: "tomorrow" },
      { ...entry, id: "bad-completed", completedAt: "soon" },
      { ...entry, id: "missing-course", course: "" },
      null,
      "nope",
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].minutes).toBe(45);
  });

  it("keeps browser storage bounded", () => {
    const many = Array.from({ length: MAX_STUDY_LOG_ENTRIES + 4 }, (_, index) => ({
      ...entry,
      id: `entry-${index}`,
      completedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
    }));
    expect(normalizeStudyLog(many)).toHaveLength(MAX_STUDY_LOG_ENTRIES);
  });

  it("backfills checked sessions for records saved before Insights existed", () => {
    const backfilled = studyLogFromCompletedSessions([
      { id: "done", assignmentId: "essay", date: "2026-10-06", minutes: 30, completed: true },
      { id: "open", assignmentId: "essay", date: "2026-10-07", minutes: 60, completed: false },
      { id: "missing", assignmentId: "missing", date: "2026-10-07", minutes: 20, completed: true },
    ], [assignment]);

    expect(backfilled).toHaveLength(1);
    expect(backfilled[0]).toMatchObject({
      id: "done",
      title: "History essay",
      course: "History",
      minutes: 30,
      date: "2026-10-06",
    });
  });
});
