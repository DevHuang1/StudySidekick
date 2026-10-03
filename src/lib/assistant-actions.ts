import type {
  AssistantAction,
  AssistantStudyContext,
  Assignment,
  DailyAvailability,
  PendingAssistantAction,
  Reminder,
} from "@/lib/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function nextSevenDateKeys(today: string): Set<string> {
  const start = new Date(`${today}T00:00:00.000Z`);
  return new Set(Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  }));
}

function isValidAssignmentFields(action: Extract<AssistantAction, { type: "add_assignment" }>): boolean {
  return action.title.trim().length > 0 && action.title.trim().length <= 100
    && action.course.trim().length > 0 && action.course.trim().length <= 80
    && isRealIsoDate(action.dueDate)
    && Number.isInteger(action.estimateMinutes) && action.estimateMinutes >= 15 && action.estimateMinutes <= 10080;
}

function isValidUpdateFields(changes: Extract<AssistantAction, { type: "update_assignment" }>['changes']): boolean {
  const entries = Object.entries(changes);
  if (!entries.length) return false;
  return entries.every(([key, value]) => {
    if (key === "title") return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 100;
    if (key === "course") return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 80;
    if (key === "dueDate") return typeof value === "string" && isRealIsoDate(value);
    if (key === "estimateMinutes") return typeof value === "number" && Number.isInteger(value) && value >= 15 && value <= 10080;
    return false;
  });
}

/** Keep only well-formed actions that apply to the current browser study context. */
export function validateAssistantActions(
  actions: AssistantAction[],
  context: AssistantStudyContext | undefined,
  today: string,
): { actions: AssistantAction[]; rejectedCount: number } {
  const knownAssignmentIds = new Set(context?.assignments.map((assignment) => assignment.id) ?? []);
  const allowedDates = nextSevenDateKeys(today);
  const knownAvailabilityDates = new Set(context?.availability.map((day) => day.date).filter((date) => allowedDates.has(date)) ?? []);
  const validated = actions.filter((action) => {
    switch (action.type) {
      case "add_assignment":
        return isValidAssignmentFields(action) && action.dueDate >= today;
      case "update_assignment":
        return knownAssignmentIds.has(action.assignmentId) && isValidUpdateFields(action.changes)
          && (action.changes.dueDate === undefined || action.changes.dueDate >= today);
      case "set_availability":
        return knownAvailabilityDates.has(action.date) && Number.isInteger(action.minutes)
          && action.minutes >= 0 && action.minutes <= 720;
      case "add_reminder":
        return action.text.trim().length > 0 && action.text.trim().length <= 180
          && (action.dueAt === null || (typeof action.dueAt === "string" && action.dueAt.length <= 40));
      case "start_focus":
        return Number.isInteger(action.minutes) && action.minutes >= 1 && action.minutes <= 180;
      case "build_plan":
        return true;
    }
  });
  return { actions: validated, rejectedCount: actions.length - validated.length };
}

/** Apply only assignment and availability edits to a preview; caller commits on approval. */
export function applyAssistantStudyChanges(
  assignments: Assignment[],
  availability: DailyAvailability[],
  actions: PendingAssistantAction[],
  createdAt: string,
): { assignments: Assignment[]; availability: DailyAvailability[] } {
  let nextAssignments = [...assignments];
  let nextAvailability = [...availability];

  for (const action of actions) {
    if (action.type === "add_assignment") {
      nextAssignments = [...nextAssignments, {
        id: action.previewId,
        title: action.title.trim(),
        course: action.course.trim(),
        dueDate: action.dueDate,
        estimateMinutes: action.estimateMinutes,
        createdAt,
      }];
    } else if (action.type === "update_assignment") {
      nextAssignments = nextAssignments.map((assignment) => assignment.id === action.assignmentId
        ? { ...assignment, ...action.changes }
        : assignment);
    } else if (action.type === "set_availability") {
      nextAvailability = nextAvailability.map((day) => day.date === action.date
        ? { ...day, minutes: action.minutes }
        : day);
    }
  }

  return { assignments: nextAssignments, availability: nextAvailability };
}

/** Prepare the complete handoff result for a single explicit approval click. */
export function applyAssistantProposal(
  assignments: Assignment[],
  availability: DailyAvailability[],
  reminders: Reminder[],
  actions: PendingAssistantAction[],
  createdAt: string,
  createReminderId: () => string,
) {
  const study = applyAssistantStudyChanges(assignments, availability, actions, createdAt);
  const addedReminders: Reminder[] = actions
    .filter((action): action is Extract<PendingAssistantAction, { type: "add_reminder" }> => action.type === "add_reminder")
    .map((action) => ({ id: createReminderId(), text: action.text, dueAt: action.dueAt, done: false }));
  const focus = actions.find((action): action is Extract<PendingAssistantAction, { type: "start_focus" }> => action.type === "start_focus");

  return {
    ...study,
    reminders: [...addedReminders, ...reminders],
    addedReminders,
    focusMinutes: focus?.minutes ?? null,
    shouldBuildPlan: actions.some((action) => action.type === "build_plan"),
  };
}
