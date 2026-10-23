import { describe, expect, it } from "vitest";
import {
  parseLegacyReminders,
  parseStoredStudyData,
  rollForwardPlan,
} from "./study-storage";
import type { WeeklyPlan } from "./types";

const today = "2026-10-06";
const dates = ["2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12"];

const assignment = {
  id: "essay",
  title: "History essay",
  course: "History",
  dueDate: "2026-10-09",
  estimateMinutes: 180,
  completedMinutes: 0,
  createdAt: "2026-10-01T12:00:00.000Z",
};

describe("parseStoredStudyData", () => {
  it("returns usable defaults when storage is empty", () => {
    const parsed = parseStoredStudyData(null, dates, today);
    expect(parsed.assignments).toEqual([]);
    expect(parsed.plan).toBeNull();
    expect(parsed.reminders).toEqual([]);
    expect(parsed.focusMinutes).toBe(25);
    expect(parsed.availability).toHaveLength(7);
    expect(parsed.availability.every((day) => day.minutes === 120)).toBe(true);
  });

  it("survives corrupt JSON, non-object payloads, and wrong types", () => {
    for (const raw of ["{not json", "null", '"a string"', "[]", "42"]) {
      const parsed = parseStoredStudyData(raw, dates, today);
      expect(parsed.assignments).toEqual([]);
      expect(parsed.availability).toHaveLength(7);
    }
  });

  it("drops individual malformed records instead of the whole payload", () => {
    const raw = JSON.stringify({
      assignments: [assignment, { id: "broken" }, null, { title: "no id" }],
      availability: "not-an-array",
      reminders: "not-an-array",
      focusMinutes: "not-a-number",
    });
    const parsed = parseStoredStudyData(raw, dates, today);

    expect(parsed.assignments.map((item) => item.id)).toEqual(["essay"]);
    expect(parsed.reminders).toEqual([]);
    expect(parsed.focusMinutes).toBe(25);
    // Availability falls back to the default for every day rather than being lost.
    expect(parsed.availability.every((day) => day.minutes === 120)).toBe(true);
  });

  it("clamps out-of-range stored minutes", () => {
    const raw = JSON.stringify({
      focusMinutes: 9999,
      availability: dates.map((date) => ({ date, minutes: date === dates[0] ? 9999 : -50 })),
    });
    const parsed = parseStoredStudyData(raw, dates, today);

    expect(parsed.focusMinutes).toBe(180);
    expect(parsed.availability[0].minutes).toBe(720);
    expect(parsed.availability[1].minutes).toBe(0);
  });

  it("rebuilds only the current seven-day window", () => {
    const raw = JSON.stringify({
      availability: [
        ...dates.map((date) => ({ date, minutes: 60 })),
        { date: "2026-09-01", minutes: 300 },
      ],
    });
    const parsed = parseStoredStudyData(raw, dates, today);

    expect(parsed.availability.map((day) => day.date)).toEqual(dates);
    expect(parsed.availability.every((day) => day.minutes === 60)).toBe(true);
  });

  it("derives completion for legacy assignments that predate completedMinutes", () => {
    const legacy = { ...assignment } as Record<string, unknown>;
    delete legacy.completedMinutes;
    const raw = JSON.stringify({
      assignments: [legacy],
      plan: {
        sessions: [
          { id: "a", assignmentId: "essay", date: today, minutes: 30, completed: true },
          { id: "b", assignmentId: "essay", date: dates[1], minutes: 45, completed: true },
          { id: "c", assignmentId: "essay", date: dates[2], minutes: 60, completed: false },
        ],
        generatedAt: "2026-10-06T09:00:00.000Z",
        weekStart: today,
        inputSignature: "saved",
      },
    });

    expect(parseStoredStudyData(raw, dates, today).assignments[0].completedMinutes).toBe(75);
  });

  it("keeps a stored completedMinutes rather than re-deriving it", () => {
    const raw = JSON.stringify({
      assignments: [{ ...assignment, completedMinutes: 10 }],
      plan: {
        sessions: [{ id: "a", assignmentId: "essay", date: today, minutes: 90, completed: true }],
        generatedAt: "2026-10-06T09:00:00.000Z",
        weekStart: today,
        inputSignature: "saved",
      },
    });

    expect(parseStoredStudyData(raw, dates, today).assignments[0].completedMinutes).toBe(10);
  });

  it("discards a plan that is missing its shape", () => {
    for (const plan of [{ sessions: "nope" }, { generatedAt: 123 }, null, "text"]) {
      const parsed = parseStoredStudyData(JSON.stringify({ plan }), dates, today);
      expect(parsed.plan).toBeNull();
    }
  });

  it("fills a missing weekStart so the plan still belongs to a window", () => {
    const raw = JSON.stringify({
      plan: { sessions: [], generatedAt: "2026-10-06T09:00:00.000Z", inputSignature: "saved" },
    });
    expect(parseStoredStudyData(raw, dates, today).plan?.weekStart).toBe(today);
  });

  it("restores a running focus session from an absolute deadline", () => {
    const endsAt = "2026-10-06T09:30:00.000Z";
    const raw = JSON.stringify({ focusSession: { endsAt, pausedSeconds: null, durationMinutes: 45, sessionId: "block-1" } });
    const parsed = parseStoredStudyData(raw, dates, today);

    expect(parsed.focusSession.endsAt).toBe(endsAt);
    expect(parsed.focusSession.durationMinutes).toBe(45);
    expect(parsed.focusSession.sessionId).toBe("block-1");
  });

  it("restores a paused session with its remaining seconds", () => {
    const raw = JSON.stringify({ focusSession: { endsAt: null, pausedSeconds: 300, durationMinutes: 45, sessionId: null } });
    const parsed = parseStoredStudyData(raw, dates, today);

    expect(parsed.focusSession.pausedSeconds).toBe(300);
    expect(parsed.focusSession.endsAt).toBeNull();
  });

  it("rejects an unparseable deadline and a stale deadline beside a pause", () => {
    const bad = parseStoredStudyData(JSON.stringify({ focusSession: { endsAt: "soon", pausedSeconds: 120, durationMinutes: 45 } }), dates, today);
    expect(bad.focusSession.endsAt).toBeNull();
    expect(bad.focusSession.pausedSeconds).toBe(120);

    // A running deadline wins, so a leftover pause value cannot resurrect the timer.
    const both = parseStoredStudyData(JSON.stringify({ focusSession: { endsAt: "2026-10-06T09:30:00.000Z", pausedSeconds: 900, durationMinutes: 45 } }), dates, today);
    expect(both.focusSession.endsAt).toBe("2026-10-06T09:30:00.000Z");
    expect(both.focusSession.pausedSeconds).toBeNull();
  });

  it("falls back to the saved preference when no focus session was stored", () => {
    const raw = JSON.stringify({ focusMinutes: 45 });
    expect(parseStoredStudyData(raw, dates, today).focusSession.durationMinutes).toBe(45);
  });

  it("keeps an explicit 25-minute session instead of rewriting it to the saved preference", () => {
    const raw = JSON.stringify({
      focusMinutes: 45,
      focusSession: { endsAt: null, pausedSeconds: null, durationMinutes: 25, sessionId: "block-1" },
    });
    const parsed = parseStoredStudyData(raw, dates, today);

    expect(parsed.focusSession.durationMinutes).toBe(25);
    expect(parsed.focusSession.sessionId).toBe("block-1");
  });

  it("ignores a malformed focus session and keeps the saved preference", () => {
    for (const focusSession of ["nonsense", { endsAt: null }, 42, { durationMinutes: 0 }]) {
      const parsed = parseStoredStudyData(JSON.stringify({ focusMinutes: 45, focusSession }), dates, today);
      expect(parsed.focusSession.durationMinutes).toBe(45);
    }
  });

  it("migrates a legacy display-string reminder time to an ISO instant", () => {
    const legacy = "10/6/2026, 3:30:00 PM";
    const raw = JSON.stringify({ reminders: [{ id: "r1", text: "Legacy", dueAt: legacy, done: false }] });
    const parsed = parseStoredStudyData(raw, dates, today);

    expect(parsed.reminders[0].dueAt).toBe(new Date(legacy).toISOString());
    expect(parsed.reminders[0].dueAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("drops an unparseable reminder time instead of sorting it as text", () => {
    const raw = JSON.stringify({ reminders: [{ id: "r1", text: "Broken", dueAt: "sometime soon", done: false }] });
    expect(parseStoredStudyData(raw, dates, today).reminders[0].dueAt).toBeNull();
  });

  it("starts new browser records with an empty study log", () => {
    expect(parseStoredStudyData(null, dates, today).studyLog).toEqual([]);
  });

  it("backfills a missing study log from checked plan sessions", () => {
    const raw = JSON.stringify({
      assignments: [assignment],
      plan: {
        sessions: [
          { id: "done", assignmentId: "essay", date: today, minutes: 30, completed: true },
          { id: "open", assignmentId: "essay", date: dates[1], minutes: 45, completed: false },
        ],
        generatedAt: "2026-10-06T09:00:00.000Z",
        weekStart: today,
        inputSignature: "saved",
      },
    });
    const log = parseStoredStudyData(raw, dates, today).studyLog;

    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({
      id: "done",
      assignmentId: "essay",
      title: "History essay",
      course: "History",
      date: today,
      minutes: 30,
    });
  });

  it("respects an explicitly cleared study log instead of backfilling it again", () => {
    const raw = JSON.stringify({
      assignments: [assignment],
      studyLog: [],
      plan: {
        sessions: [{ id: "done", assignmentId: "essay", date: today, minutes: 30, completed: true }],
        generatedAt: "2026-10-06T09:00:00.000Z",
        weekStart: today,
        inputSignature: "saved",
      },
    });

    expect(parseStoredStudyData(raw, dates, today).studyLog).toEqual([]);
  });

  it("restores a persisted study log with its snapshot details", () => {
    const raw = JSON.stringify({
      studyLog: [{
        id: "done",
        assignmentId: "essay",
        title: "Older title",
        course: "History",
        date: today,
        minutes: 30,
        completedAt: "2026-10-06T18:00:00.000Z",
      }],
    });
    const log = parseStoredStudyData(raw, dates, today).studyLog;

    expect(log[0].title).toBe("Older title");
    expect(log[0].completedAt).toBe("2026-10-06T18:00:00.000Z");
  });
});

describe("parseLegacyReminders", () => {
  it("migrates the original prototype's due field to dueAt", () => {
    const raw = JSON.stringify([{ id: "r1", text: "Bring notes", due: "2026-10-07T09:00:00.000Z", done: true }]);
    expect(parseLegacyReminders(raw)).toEqual([
      { id: "r1", text: "Bring notes", dueAt: "2026-10-07T09:00:00.000Z", done: true },
    ]);
  });

  it("ignores unusable legacy data", () => {
    expect(parseLegacyReminders("{not json")).toEqual([]);
    expect(parseLegacyReminders(JSON.stringify({}))).toEqual([]);
    expect(parseLegacyReminders(JSON.stringify([{ due: "x" }, { text: "   " }]))).toEqual([]);
  });
});

describe("rollForwardPlan", () => {
  const plan: WeeklyPlan = {
    sessions: [
      { id: "old", assignmentId: "essay", date: "2026-10-05", minutes: 60, completed: true },
      { id: "kept", assignmentId: "essay", date: "2026-10-07", minutes: 30, completed: false },
    ],
    generatedAt: "2026-10-06T09:00:00.000Z",
    weekStart: "2026-10-06",
    inputSignature: "saved",
  };

  it("advances the window and drops sessions that fall outside it", () => {
    const nextDates = ["2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13"];
    const rolled = rollForwardPlan(plan, nextDates, "2026-10-07");

    expect(rolled?.weekStart).toBe("2026-10-07");
    expect(rolled?.sessions.map((session) => session.id)).toEqual(["kept"]);
  });

  it("does not touch a plan already anchored to today", () => {
    expect(rollForwardPlan(plan, dates, "2026-10-06")).toBe(plan);
  });

  it("passes a missing plan through", () => {
    expect(rollForwardPlan(null, dates, "2026-10-07")).toBeNull();
  });
});
