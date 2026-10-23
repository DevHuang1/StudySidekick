import { describe, expect, it } from "vitest";
import { bestStudyStreak, buildStudyInsights, completedDateKey, currentStudyStreak } from "./insights";
import type { Assignment, StudyLogEntry } from "./types";

function entry(id: string, date: string, minutes = 30, course = "Biology"): StudyLogEntry {
  return {
    id,
    assignmentId: "essay",
    title: "Lab report",
    course,
    date,
    minutes,
    completedAt: new Date(`${date}T12:00:00`).toISOString(),
  };
}

const today = "2026-10-23";
const assignment: Assignment = {
  id: "essay",
  title: "Lab report",
  course: "Biology",
  dueDate: "2026-10-25",
  estimateMinutes: 120,
  completedMinutes: 120,
  createdAt: "2026-10-01T12:00:00.000Z",
};

describe("insights", () => {
  it("groups completed minutes by the local day they were checked off", () => {
    const entries = [entry("a", "2026-10-23", 25), entry("b", "2026-10-23", 35), entry("c", "2026-10-21", 50)];
    const insights = buildStudyInsights(entries, [assignment], today);

    expect(insights.lastSevenDays.map((day) => day.date)).toEqual([
      "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23",
    ]);
    expect(insights.lastSevenDays.at(-1)).toEqual({ date: today, minutes: 60, blocks: 2 });
    expect(insights.lastSevenDays[4]).toEqual({ date: "2026-10-21", minutes: 50, blocks: 1 });
    expect(insights.totalMinutes).toBe(110);
    expect(insights.totalBlocks).toBe(3);
  });

  it("keeps a streak alive when today has not been studied yet", () => {
    const entries = [entry("a", "2026-10-22"), entry("b", "2026-10-21"), entry("c", "2026-10-20")];
    expect(currentStudyStreak(entries, today)).toBe(3);
    expect(currentStudyStreak([...entries, entry("d", today)], today)).toBe(4);
  });

  it("breaks a streak after a full missed day", () => {
    expect(currentStudyStreak([entry("a", "2026-10-21")], today)).toBe(0);
  });

  it("finds the best run of consecutive days", () => {
    const entries = [
      entry("a", "2026-10-01"),
      entry("b", "2026-10-02"),
      entry("c", "2026-10-03"),
      entry("d", "2026-10-10"),
    ];
    expect(bestStudyStreak(entries)).toBe(3);
  });

  it("limits course totals to the last 30 local days while keeping all-time totals", () => {
    const entries = [
      entry("recent", "2026-10-20", 40, "Chemistry"),
      entry("older", "2026-08-01", 90, "History"),
    ];
    const insights = buildStudyInsights(entries, [assignment], today);

    expect(insights.totalMinutes).toBe(130);
    expect(insights.lastThirtyDayMinutes).toBe(40);
    expect(insights.courseTotals).toEqual([{ course: "Chemistry", minutes: 40, blocks: 1 }]);
  });

  it("counts finished assignments against the current list", () => {
    const insights = buildStudyInsights([], [
      assignment,
      { ...assignment, id: "open", completedMinutes: 30 },
    ], today);

    expect(insights.assignmentsFinished).toBe(1);
    expect(insights.assignmentsTotal).toBe(2);
  });

  it("returns null for an unparseable completion time", () => {
    expect(completedDateKey({ completedAt: "not-a-date" })).toBeNull();
  });
});
