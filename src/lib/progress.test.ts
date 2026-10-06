import { describe, expect, it } from "vitest";
import { applySessionCompletion, completePlannedSession, normalizeAssignmentProgress, remainingEffort } from "./progress";
import type { Assignment, StudySession } from "./types";

const assignment: Assignment = {
  id: "essay",
  title: "History essay",
  course: "History",
  dueDate: "2026-10-08",
  estimateMinutes: 180,
  completedMinutes: 0,
  createdAt: "2026-10-01T12:00:00.000Z",
};

describe("assignment progress", () => {
  it("tracks a checked block and its undo without going below zero", () => {
    const session = { assignmentId: assignment.id, minutes: 45 };
    const completed = applySessionCompletion([assignment], session, false, true);
    expect(completed[0].completedMinutes).toBe(45);
    expect(remainingEffort(completed[0])).toBe(135);
    expect(applySessionCompletion(completed, session, true, false)[0].completedMinutes).toBe(0);
    expect(applySessionCompletion(completed, session, true, true)[0].completedMinutes).toBe(45);
    expect(applySessionCompletion([assignment], { ...session, minutes: 90 }, false, false)[0].completedMinutes).toBe(0);
  });

  it("clamps remaining effort when completed work reaches or exceeds a revised estimate", () => {
    expect(remainingEffort({ estimateMinutes: 60, completedMinutes: 90 })).toBe(0);
  });

  it("migrates old checked sessions only when the assignment has no saved completion total", () => {
    const legacy = { ...assignment } as Omit<Assignment, "completedMinutes"> & { completedMinutes?: number };
    delete legacy.completedMinutes;
    const sessions: StudySession[] = [
      { id: "done-1", assignmentId: "essay", date: "2026-10-02", minutes: 30, completed: true },
      { id: "done-2", assignmentId: "essay", date: "2026-10-03", minutes: 45, completed: true },
      { id: "open", assignmentId: "essay", date: "2026-10-04", minutes: 60, completed: false },
      { id: "orphan", assignmentId: "removed", date: "2026-10-02", minutes: 90, completed: true },
    ];

    expect(normalizeAssignmentProgress([legacy], sessions)[0].completedMinutes).toBe(75);
    expect(normalizeAssignmentProgress([{ ...assignment, completedMinutes: 10 }], sessions)[0].completedMinutes).toBe(10);
  });
});

describe("planned focus completion", () => {
  const focusAssignment = { ...assignment, id: "paper", title: "Research paper" };
  const session = { id: "paper-block", assignmentId: "paper", date: "2026-10-04", minutes: 20, completed: false };
  const plan = { sessions: [session], generatedAt: "2026-10-04T00:00:00.000Z", weekStart: "2026-10-04", inputSignature: "test" };

  it("credits the block only when the caller confirms it", () => {
    const result = completePlannedSession(plan, [focusAssignment], session.id);
    expect(result.completed).toBe(true);
    expect(result.plan?.sessions[0].completed).toBe(true);
    expect(result.assignments[0].completedMinutes).toBe(20);
  });

  it("does not credit a block twice", () => {
    const first = completePlannedSession(plan, [focusAssignment], session.id);
    const second = completePlannedSession(first.plan, first.assignments, session.id);
    expect(second.completed).toBe(false);
    expect(second.assignments[0].completedMinutes).toBe(20);
  });

  it("leaves missing sessions and removed assignments unchanged", () => {
    expect(completePlannedSession(plan, [focusAssignment], "missing").completed).toBe(false);
    expect(completePlannedSession(plan, [], session.id).plan).toEqual(plan);
  });

  it("does not credit a replacement block with the same ID but a different duration", () => {
    const revisedPlan = { ...plan, sessions: [{ ...session, minutes: 35 }] };
    const result = completePlannedSession(revisedPlan, [focusAssignment], session.id, session.minutes);
    expect(result.completed).toBe(false);
    expect(result.plan).toEqual(revisedPlan);
    expect(result.assignments[0].completedMinutes).toBe(0);
  });
});
