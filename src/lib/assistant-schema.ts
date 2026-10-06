import { z } from "zod";

const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("add_assignment"), title: z.string().trim().min(1).max(100), course: z.string().trim().min(1).max(80), dueDate: z.iso.date(), estimateMinutes: z.number().int().min(15).max(10080) }).strict(),
  z.object({
    type: z.literal("update_assignment"),
    assignmentId: z.string().min(1).max(120),
    changes: z.object({
      title: z.string().trim().min(1).max(100),
      course: z.string().trim().min(1).max(80),
      dueDate: z.iso.date(),
      estimateMinutes: z.number().int().min(15).max(10080),
    }).partial().strict().refine((changes) => Object.keys(changes).length > 0, "Provide at least one field to update."),
  }).strict(),
  z.object({ type: z.literal("set_availability"), date: z.iso.date(), minutes: z.number().int().min(0).max(720) }).strict(),
  z.object({ type: z.literal("add_reminder"), text: z.string().trim().min(1).max(180), dueAt: z.string().max(40).nullable() }).strict(),
  z.object({ type: z.literal("start_focus"), minutes: z.number().int().min(1).max(180) }).strict(),
  z.object({ type: z.literal("build_plan") }).strict(),
]);

const studyContextSchema = z.object({
  assignments: z.array(z.object({
    id: z.string().min(1).max(120),
    title: z.string().min(1).max(100),
    course: z.string().min(1).max(80),
    dueDate: z.iso.date(),
    estimateMinutes: z.number().int().min(15).max(10080),
    completedMinutes: z.number().int().min(0).max(2_147_483_647).default(0),
  }).strict()).max(120),
  availability: z.array(z.object({ date: z.iso.date(), minutes: z.number().int().min(0).max(720) }).strict())
    .length(7)
    .refine((days) => new Set(days.map((day) => day.date)).size === days.length, "Availability dates must be unique."),
}).strict();

export const assistantOutputSchema = z.object({
  reply: z.string().min(1).max(1200),
  clarification: z.string().max(300).nullable(),
  proposedActions: z.array(actionSchema).max(8),
}).strict();

export const assistantRequestSchema = z.object({
  message: z.string().trim().min(1).max(800),
  provider: z.enum(["auto", "ollama", "groq"]).default("auto"),
  groqConsent: z.boolean().default(false),
  includeStudyContext: z.boolean().default(false),
  studyContext: studyContextSchema.optional(),
  today: z.iso.date().optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(1200),
  }).strict()).max(10).default([]),
}).strict().refine((request) => request.provider !== "groq" || !request.includeStudyContext || Boolean(request.studyContext), {
  message: "Study context is required when you opt to include it.",
  path: ["studyContext"],
}).refine((request) => request.provider !== "groq" || request.groqConsent, {
  message: "Confirm the Groq data-sharing notice before sending a request.",
  path: ["groqConsent"],
});

export const assistantReplySchema = assistantOutputSchema.extend({
  provider: z.enum(["ollama", "groq", "guided"]),
});

export type AssistantOutput = z.infer<typeof assistantOutputSchema>;
