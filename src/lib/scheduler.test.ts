import { describe, expect, it } from "vitest";
import { buildSchedule, moveSession } from "./scheduler";
import type { Assignment, DailyAvailability } from "./types";

const today = "2026-10-02";
const dates = [today, "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"];

function task(id: string, dueDate: string, estimateMinutes: number): Assignment {
  return { id, title: `Assignment ${id}`, course: "Biology", dueDate, estimateMinutes, createdAt: id };
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
});
