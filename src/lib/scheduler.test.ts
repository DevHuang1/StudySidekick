import { describe, expect, it } from "vitest";
import { buildSchedule, completedSessionsForWeek, moveSession, planInputSignature } from "./scheduler";
import type { Assignment, DailyAvailability } from "./types";

const today = "2026-10-02";
const dates = [today, "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"];

function task(id: string, dueDate: string, estimateMinutes: number): Assignment {
  return { id, title: `Assignment ${id}`, course: "Biology", dueDate, estimateMinutes, completedMinutes: 0, createdAt: id };
}

function hours(values: number[]): DailyAvailability[] {
  return dates.map((date, index) => ({ date, minutes: values[index] * 60 }));
}

describe("buildSchedule", () => {
  it("prioritizes nearer deadlines and divides large work into manageable blocks", () => {
    const result = buildSchedule([task("later", "2026-10-04", 60), task("soon", "2026-10-03", 125)], hours([2, 2, 2, 0, 0, 0, 0]), dates, today);
    const soon = result.sessions.filter((session) => session.assignmentId === "soon");
    expect(soon.map((session) => session.minutes)).toEqual([42, 42, 41]);
    expect(result.sessions.findIndex((session) => session.assignmentId === "soon")).toBe(0);
    expect(result.sessions.every((session) => session.minutes <= 60)).toBe(true);
    expect(result.shortfalls).toEqual([]);
  });

  it("never schedules later than a task due date and reports a capacity shortfall", () => {
    const result = buildSchedule([task("paper", "2026-10-03", 300)], hours([2, 1, 8, 8, 8, 8, 8]), dates, today);
    expect(result.sessions.map((session) => session.date)).toEqual([today, today, "2026-10-03"]);
    expect(result.sessions.reduce((sum, session) => sum + session.minutes, 0)).toBe(180);
    expect(result.shortfalls).toEqual([{ assignmentId: "paper", minutes: 120, reason: "capacity" }]);
  });

  it("avoids tiny leftover blocks when the remaining work fits tomorrow", () => {
    const result = buildSchedule([task("reading", "2026-10-03", 80)], hours([0.75, 2, 0, 0, 0, 0, 0]), dates, today);
    expect(result.sessions.map((session) => session.minutes)).toEqual([40, 40]);
    expect(result.sessions.every((session) => session.minutes >= 25 && session.minutes <= 60)).toBe(true);
  });

  it("puts assignments due after the seven-day horizon in the backlog", () => {
    const result = buildSchedule([task("later", "2026-10-15", 90)], hours([2, 2, 2, 2, 2, 2, 2]), dates, today);
    expect(result.sessions).toEqual([]);
    expect(result.backlog.map((item) => item.id)).toEqual(["later"]);
    expect(result.shortfalls).toEqual([]);
  });

  it("flags overdue work rather than moving its deadline", () => {
    const result = buildSchedule([task("late", "2026-10-01", 45)], hours([4, 4, 4, 4, 4, 4, 4]), dates, today);
    expect(result.sessions).toEqual([]);
    expect(result.shortfalls).toEqual([{ assignmentId: "late", minutes: 45, reason: "overdue" }]);
  });

  it("schedules only remaining effort and reports remaining backlog", () => {
    const assignment = { ...task("essay", "2026-10-03", 120), completedMinutes: 45 };
    const result = buildSchedule([assignment], hours([2, 2, 0, 0, 0, 0, 0]), dates, today);
    expect(result.sessions.reduce((sum, session) => sum + session.minutes, 0)).toBe(75);

    const backlog = buildSchedule([{ ...assignment, dueDate: "2026-10-15" }], hours([2, 2, 0, 0, 0, 0, 0]), dates, today);
    expect(backlog.backlog[0].remainingMinutes).toBe(75);
  });

  it("preserves completed work, reserves its capacity, and avoids duplicate IDs on replan", () => {
    const assignment = { ...task("essay", "2026-10-03", 120), completedMinutes: 60 };
    const completed = { id: "essay-2026-10-02-0", assignmentId: "essay", date: today, minutes: 60, completed: true };
    const result = buildSchedule([assignment], hours([1, 1, 0, 0, 0, 0, 0]), dates, today, [completed]);

    expect(result.sessions.filter((session) => session.completed)).toEqual([completed]);
    expect(result.sessions.filter((session) => !session.completed).map((session) => session.minutes)).toEqual([60]);
    expect(new Set(result.sessions.map((session) => session.id)).size).toBe(result.sessions.length);
    expect(result.sessions.filter((session) => session.date === today).reduce((sum, session) => sum + session.minutes, 0)).toBeLessThanOrEqual(60);

    const repeated = buildSchedule([assignment], hours([1, 1, 0, 0, 0, 0, 0]), dates, today, result.sessions.filter((session) => session.completed));
    expect(repeated.sessions.filter((session) => !session.completed).reduce((sum, session) => sum + session.minutes, 0)).toBe(60);
  });

  it("keeps a recovery preview read-only until the saved plan is replaced", () => {
    const assignment = { ...task("essay", "2026-10-03", 120), completedMinutes: 60 };
    const completed = { id: "essay-done", assignmentId: "essay", date: today, minutes: 60, completed: true };
    const savedPlan = { sessions: [completed], generatedAt: "2026-10-02T10:00:00.000Z", weekStart: today, inputSignature: "saved" };
    const before = structuredClone(savedPlan);

    const preview = buildSchedule([assignment], hours([1, 1, 0, 0, 0, 0, 0]), dates, today,
      completedSessionsForWeek(savedPlan.sessions, [assignment], dates));

    expect(preview.sessions.some((session) => session.completed)).toBe(true);
    expect(savedPlan).toEqual(before);
  });

  it("keeps assignment completion across a new seven-day window without carrying old weekly sessions", () => {
    const nextDates = dates.slice(1).concat("2026-10-09");
    const assignment = { ...task("essay", "2026-10-09", 120), completedMinutes: 60 };
    const yesterday = { id: "essay-yesterday-0", assignmentId: "essay", date: today, minutes: 60, completed: true };
    const result = buildSchedule([assignment], hours([0, 1, 0, 0, 0, 0, 0]), nextDates, nextDates[0], [yesterday]);

    expect(result.sessions.some((session) => session.id === yesterday.id)).toBe(false);
    expect(result.sessions.reduce((sum, session) => sum + session.minutes, 0)).toBe(60);
    expect(result.shortfalls).toEqual([]);
  });

  it("uses only uncompleted effort for overdue and capacity shortfalls", () => {
    const overdue = { ...task("late", "2026-10-01", 90), completedMinutes: 60 };
    const overdueResult = buildSchedule([overdue], hours([1, 1, 1, 1, 1, 1, 1]), dates, today);
    expect(overdueResult.shortfalls).toEqual([{ assignmentId: "late", minutes: 30, reason: "overdue" }]);

    const constrained = { ...task("paper", "2026-10-03", 180), completedMinutes: 60 };
    const capacityResult = buildSchedule([constrained], hours([0.5, 0.5, 0, 0, 0, 0, 0]), dates, today);
    expect(capacityResult.sessions.reduce((sum, session) => sum + session.minutes, 0)).toBe(60);
    expect(capacityResult.shortfalls).toEqual([{ assignmentId: "paper", minutes: 60, reason: "capacity" }]);
  });

  it("does not mark a saved plan stale solely because completed effort changed", () => {
    const assignment = task("essay", "2026-10-03", 120);
    expect(planInputSignature([assignment], hours([1, 1, 0, 0, 0, 0, 0])))
      .toBe(planInputSignature([{ ...assignment, completedMinutes: 45 }], hours([1, 1, 0, 0, 0, 0, 0])));
  });

  it("does not report complete assignments as overdue work or backlog", () => {
    const complete = { ...task("done", "2026-10-01", 60), completedMinutes: 60 };
    const result = buildSchedule([complete], hours([1, 1, 1, 1, 1, 1, 1]), dates, today);
    expect(result.sessions).toEqual([]);
    expect(result.shortfalls).toEqual([]);
    expect(result.backlog).toEqual([]);
  });
});

describe("moveSession", () => {
  const assignment = task("lab", "2026-10-04", 60);
  const session = { id: "lab-block", assignmentId: "lab", date: today, minutes: 40, completed: false };

  it("previews a move only when the target day has enough room and is before the deadline", () => {
    const result = moveSession([session], session.id, "2026-10-03", hours([1, 1, 0, 0, 0, 0, 0]), [assignment]);
    expect(result.error).toBeNull();
    expect(result.sessions[0].date).toBe("2026-10-03");
  });

  it("rejects a move that would overbook a day or pass the deadline", () => {
    const busy = { ...session, id: "busy", date: "2026-10-03", minutes: 40 };
    const tooFull = moveSession([session, busy], session.id, "2026-10-03", hours([1, 1, 0, 0, 0, 0, 0]), [assignment]);
    const tooLate = moveSession([session], session.id, "2026-10-05", hours([1, 1, 1, 1, 0, 0, 0]), [assignment]);
    expect(tooFull.error).toMatch(/enough free study time/);
    expect(tooLate.error).toMatch(/past its due date/);
  });

  it("does not allow completed sessions to be moved", () => {
    const completed = { ...session, completed: true };
    const result = moveSession([completed], completed.id, "2026-10-03", hours([1, 1, 0, 0, 0, 0, 0]), [assignment]);
    expect(result.error).toMatch(/Completed study blocks/);
  });
});
