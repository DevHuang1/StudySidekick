import { describe, expect, it } from "vitest";
import { applyAssistantProposal, applyAssistantStudyChanges, validateAssistantActions } from "./assistant-actions";
import { buildSchedule } from "./scheduler";
import type { AssistantAction, AssistantStudyContext, Assignment, DailyAvailability, PendingAssistantAction } from "./types";

const today = "2026-10-02";
const dates = ["2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"];
const context: AssistantStudyContext = {
  assignments: [{ id: "essay-1", title: "History essay", course: "History", dueDate: "2026-10-06", estimateMinutes: 180 }],
  availability: dates.map((date) => ({ date, minutes: 60 })),
};
const assignments: Assignment[] = [{ ...context.assignments[0], createdAt: "2026-10-01T12:00:00.000Z" }];
const availability: DailyAvailability[] = context.availability;

describe("assistant study actions", () => {
  it("accepts a valid assignment edit and rejects unknown IDs or invalid fields", () => {
    const actions: AssistantAction[] = [
      { type: "update_assignment", assignmentId: "essay-1", changes: { title: "Revised history essay", estimateMinutes: 240 } },
      { type: "update_assignment", assignmentId: "not-saved", changes: { title: "Invented task" } },
      { type: "update_assignment", assignmentId: "essay-1", changes: { title: "  ", estimateMinutes: 0 } },
      { type: "update_assignment", assignmentId: "essay-1", changes: { dueDate: "2026-09-30" } },
    ];

    const result = validateAssistantActions(actions, context, today);

    expect(result.actions).toEqual([actions[0]]);
    expect(result.rejectedCount).toBe(3);
  });

  it("limits availability changes to the supplied week and 0–720 minutes", () => {
    const actions: AssistantAction[] = [
      { type: "set_availability", date: dates[2], minutes: 90 },
      { type: "set_availability", date: "2026-10-09", minutes: 90 },
      { type: "set_availability", date: dates[1], minutes: 721 },
      { type: "set_availability", date: dates[0], minutes: 0 },
    ];

    const result = validateAssistantActions(actions, context, today);

    expect(result.actions).toEqual([actions[0], actions[3]]);
    expect(result.rejectedCount).toBe(2);

    const shiftedContext = { ...context, availability: dates.slice(1).concat("2026-10-09").map((date) => ({ date, minutes: 60 })) };
    const outsideActualWeek = validateAssistantActions([
      { type: "set_availability", date: "2026-10-09", minutes: 90 },
    ], shiftedContext, today);
    expect(outsideActualWeek.actions).toEqual([]);
  });

  it("previews additions, edits, and availability together with a deterministic plan", () => {
    const actions: PendingAssistantAction[] = [
      { type: "add_assignment", previewId: "new-lab", title: "Chemistry lab", course: "Chemistry", dueDate: "2026-10-04", estimateMinutes: 120 },
      { type: "update_assignment", assignmentId: "essay-1", changes: { estimateMinutes: 240 } },
      { type: "set_availability", date: dates[0], minutes: 120 },
    ];
    const changed = applyAssistantStudyChanges(assignments, availability, actions, "preview-time");
    const schedule = buildSchedule(changed.assignments, changed.availability, dates, today);

    expect(changed.assignments).toHaveLength(2);
    expect(changed.assignments[0].estimateMinutes).toBe(240);
    expect(changed.assignments[1]).toMatchObject({ id: "new-lab", createdAt: "preview-time" });
    expect(changed.availability[0].minutes).toBe(120);
    expect(schedule.sessions.length).toBeGreaterThan(0);
    expect(schedule.sessions.every((session) => session.date <= "2026-10-04" || session.assignmentId === "essay-1")).toBe(true);
  });

  it("previews the date-aware demo's mixed handoff and applies it only when confirmed", () => {
    const emptyAssignments: Assignment[] = [];
    const defaultAvailability = dates.map((date) => ({ date, minutes: 120 }));
    const actions: PendingAssistantAction[] = [
      { type: "add_assignment", previewId: "demo-lab", title: "Biology lab report", course: "Biology", dueDate: dates[1], estimateMinutes: 180 },
      { type: "set_availability", date: dates[0], minutes: 90 },
      { type: "set_availability", date: dates[1], minutes: 30 },
      { type: "build_plan" },
      { type: "add_reminder", text: "Review the lab sources", dueAt: null },
      { type: "start_focus", minutes: 25 },
    ];

    const preview = applyAssistantStudyChanges(emptyAssignments, defaultAvailability, actions, "preview-time");
    const schedule = buildSchedule(preview.assignments, preview.availability, dates, today);

    expect(schedule.sessions.map((session) => session.minutes)).toEqual([60, 30, 30]);
    expect(schedule.sessions.map((session) => session.date)).toEqual([today, today, dates[1]]);
    expect(schedule.shortfalls).toEqual([{ assignmentId: "demo-lab", minutes: 60, reason: "capacity" }]);
    expect(defaultAvailability[0].minutes).toBe(120);
    expect(defaultAvailability[1].minutes).toBe(120);

    const applied = applyAssistantProposal(emptyAssignments, defaultAvailability, [], actions, "confirmed-time", () => "demo-reminder");
    expect(applied.assignments).toMatchObject([{ id: "demo-lab", estimateMinutes: 180 }]);
    expect(applied.availability.slice(0, 2)).toEqual([{ date: today, minutes: 90 }, { date: dates[1], minutes: 30 }]);
    expect(applied.reminders).toMatchObject([{ id: "demo-reminder", text: "Review the lab sources", done: false }]);
    expect(applied.focusMinutes).toBe(25);
    expect(applied.shouldBuildPlan).toBe(true);
  });

  it("does not mutate the original state when a proposal is simply discarded", () => {
    const beforeAssignments = structuredClone(assignments);
    const beforeAvailability = structuredClone(availability);
    const preview = applyAssistantStudyChanges(assignments, availability, [
      { type: "update_assignment", assignmentId: "essay-1", changes: { title: "Edited" } },
      { type: "set_availability", date: dates[0], minutes: 0 },
    ], "preview-time");

    expect(preview.assignments[0].title).toBe("Edited");
    expect(preview.availability[0].minutes).toBe(0);
    expect(assignments).toEqual(beforeAssignments);
    expect(availability).toEqual(beforeAvailability);
  });

  it("applies every mixed action only through the approval preparation path", () => {
    const savedReminders = [{ id: "old-reminder", text: "Review notes", dueAt: null, done: false }];
    const actions: PendingAssistantAction[] = [
      { type: "add_assignment", previewId: "new-lab", title: "Chemistry lab", course: "Chemistry", dueDate: "2026-10-04", estimateMinutes: 120 },
      { type: "update_assignment", assignmentId: "essay-1", changes: { title: "Final history essay" } },
      { type: "set_availability", date: dates[0], minutes: 120 },
      { type: "add_reminder", text: "Review the lab brief", dueAt: null },
      { type: "start_focus", minutes: 45 },
      { type: "build_plan" },
    ];
    const applied = applyAssistantProposal(assignments, availability, savedReminders, actions, "confirmed-time", () => "new-reminder");

    expect(applied.assignments.map((assignment) => assignment.id)).toEqual(["essay-1", "new-lab"]);
    expect(applied.assignments[0].title).toBe("Final history essay");
    expect(applied.availability[0].minutes).toBe(120);
    expect(applied.reminders.map((reminder) => reminder.id)).toEqual(["new-reminder", "old-reminder"]);
    expect(applied.focusMinutes).toBe(45);
    expect(applied.shouldBuildPlan).toBe(true);
    expect(assignments[0].title).toBe("History essay");
    expect(availability[0].minutes).toBe(60);
    expect(savedReminders).toHaveLength(1);
  });
});
