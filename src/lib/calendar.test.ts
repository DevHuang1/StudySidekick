import { describe, expect, it } from "vitest";
import { buildStudyCalendar, calendarFileName, countCalendarItems, foldCalendarLine } from "./calendar";
import type { Assignment, Reminder, WeeklyPlan } from "./types";

const dates = ["2026-10-23", "2026-10-24", "2026-10-25"];

const assignment: Assignment = {
  id: "essay",
  title: "Lab report, draft; final",
  course: "Biology",
  dueDate: "2026-10-26",
  estimateMinutes: 120,
  completedMinutes: 30,
  createdAt: "2026-10-01T12:00:00.000Z",
};

const plan: WeeklyPlan = {
  sessions: [
    { id: "block-1", assignmentId: "essay", date: "2026-10-24", minutes: 30, completed: true },
    { id: "block-2", assignmentId: "essay", date: "2026-10-25", minutes: 45, completed: false },
    { id: "outside", assignmentId: "essay", date: "2026-11-01", minutes: 20, completed: false },
  ],
  generatedAt: "2026-10-23T10:00:00.000Z",
  weekStart: "2026-10-23",
  inputSignature: "signature",
};

const reminders: Reminder[] = [{
  id: "r1",
  text: "Bring notes, lab coat",
  dueAt: "2026-10-24T15:30:00.000Z",
  done: false,
}];

const generatedAt = new Date("2026-10-23T12:00:00.000Z");

describe("calendar export", () => {
  it("builds a calendar with study blocks and active dated reminders", () => {
    const calendar = buildStudyCalendar({ plan, assignments: [assignment], reminders, dates, generatedAt });

    expect(calendar.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(calendar.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(calendar.match(/BEGIN:VEVENT/g)).toHaveLength(3);
    expect(calendar).toContain("DTSTART;VALUE=DATE:20261024");
    expect(calendar).toContain("DTEND;VALUE=DATE:20261025");
    expect(calendar).toContain("SUMMARY:Lab report\\, draft\\; final");
    expect(calendar).toContain("· completed · Study Sidekick");
    expect(calendar).toContain("DTSTART:20261024T153000Z");
    expect(calendar).toContain("SUMMARY:Reminder · Bring notes\\, lab coat");
    expect(calendar).toContain("DTSTAMP:20261023T120000Z");
    expect(calendar).not.toContain("20261101");
  });

  it("counts the same items the export writes", () => {
    expect(countCalendarItems({ plan, assignments: [assignment], reminders, dates })).toEqual({
      studyBlocks: 2,
      reminders: 1,
      total: 3,
    });
    expect(countCalendarItems({ plan: null, assignments: [], reminders: [], dates })).toEqual({
      studyBlocks: 0,
      reminders: 0,
      total: 0,
    });
  });

  it("skips missing assignments, done reminders, and undated reminders", () => {
    const calendar = buildStudyCalendar({
      plan: { ...plan, sessions: [{ id: "missing", assignmentId: "gone", date: "2026-10-24", minutes: 30, completed: false }] },
      assignments: [],
      reminders: [
        { ...reminders[0], done: true },
        { ...reminders[0], id: "r2", dueAt: null },
      ],
      dates,
      generatedAt,
    });

    expect(calendar).not.toContain("BEGIN:VEVENT");
  });

  it("still exports dated reminders without a plan", () => {
    const calendar = buildStudyCalendar({ plan: null, assignments: [], reminders, dates, generatedAt });
    expect(calendar.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });

  it("folds long lines by UTF-8 bytes without splitting a character", () => {
    const line = `SUMMARY:${"Review notes ".repeat(12)}🧪`;
    const folded = foldCalendarLine(line);
    const lines = folded.split("\r\n");

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.slice(1).every((part) => part.startsWith(" "))).toBe(true);
    const encoder = new TextEncoder();
    expect(lines.every((part) => encoder.encode(part).length <= 75)).toBe(true);
    expect(folded.replace(/\r\n /g, "")).toBe(line);
  });

  it("names the download after the week start", () => {
    expect(calendarFileName("2026-10-23")).toBe("study-sidekick-2026-10-23.ics");
    expect(calendarFileName(undefined)).toBe("study-sidekick-week.ics");
  });
});
