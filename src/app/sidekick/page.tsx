"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { PageHeading } from "@/components/app-shell";
import { useStudy } from "@/app/study-provider";
import { assistantReplySchema } from "@/lib/assistant-schema";
import { applyAssistantProposal, applyAssistantStudyChanges, validateAssistantActions } from "@/lib/assistant-actions";
import { formatDate, formatDueDate } from "@/lib/date-utils";
import { buildDemoRequest } from "@/lib/demo-prompt";
import { formatInstant, formatMinutes, newId } from "@/lib/format";
import { buildSchedule, completedSessionsForWeek, planInputSignature } from "@/lib/scheduler";
import type { AssistantProvider, AssistantProviderChoice, AssistantStudyContext, Assignment, PendingAssistantAction } from "@/lib/types";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };
type SchedulePreview = ReturnType<typeof buildSchedule>;
type PendingProposal = {
  actions: PendingAssistantAction[];
  assignmentsAfter: Assignment[];
  availabilityAfter: AssistantStudyContext["availability"];
  planPreview: SchedulePreview | null;
};
type PendingGroqRequest = { message: string };

function toStudyContext(assignments: Assignment[], availability: AssistantStudyContext["availability"]): AssistantStudyContext {
  return {
    assignments: assignments.map(({ id, title, course, dueDate, estimateMinutes, completedMinutes }) => ({ id, title, course, dueDate, estimateMinutes, completedMinutes })),
    availability,
  };
}

function describeAction(action: PendingAssistantAction, today: string, assignments: Assignment[], availability: AssistantStudyContext["availability"]) {
  switch (action.type) {
    case "add_assignment":
      return <>Add <strong>{action.title}</strong> for {action.course}, due {formatDueDate(action.dueDate, today)} · {formatMinutes(action.estimateMinutes)} total effort</>;
    case "update_assignment": {
      const current = assignments.find((assignment) => assignment.id === action.assignmentId);
      if (!current) return <>Update an assignment</>;
      const changes = Object.entries(action.changes).map(([field, value]) => {
        const before = field === "estimateMinutes" ? formatMinutes(Number(current[field as keyof Assignment])) : String(current[field as keyof Assignment]);
        const after = field === "estimateMinutes" ? formatMinutes(Number(value)) : String(value);
        const label = field === "dueDate" ? "due date" : field === "estimateMinutes" ? "total effort" : field;
        const formattedBefore = field === "dueDate" ? formatDueDate(before, today) : before;
        const formattedAfter = field === "dueDate" ? formatDueDate(after, today) : after;
        return `${label}: ${formattedBefore} → ${formattedAfter}`;
      });
      return <>Update <strong>{current.title}</strong> · {changes.join("; ")}</>;
    }
    case "set_availability": {
      const before = availability.find((day) => day.date === action.date)?.minutes ?? 0;
      return <>Set study time for {formatDate(action.date)} · {formatMinutes(before)} → {formatMinutes(action.minutes)}</>;
    }
case "add_reminder": {
        const when = formatInstant(action.dueAt);
        return <>Save reminder: <strong>{action.text}</strong>{when ? ` · ${when}` : ""}</>;
      }
    case "start_focus":
      return <>Start a {action.minutes}-minute focus timer</>;
    case "build_plan":
      return <>Build a seven-day study plan from the updated assignments and available hours</>;
  }
}

export default function SidekickPage() {
  const {
    today, dates, ready, assignments, setAssignments, availability, setAvailability, plan, setPlan,
    reminders, setReminders, startTimer, setToast,
  } = useStudy();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [proposal, setProposal] = useState<PendingProposal | null>(null);
  const [pendingGroq, setPendingGroq] = useState<PendingGroqRequest | null>(null);
  const [includeStudyContext, setIncludeStudyContext] = useState(false);
  const [providerChoice, setProviderChoice] = useState<AssistantProviderChoice>("auto");
  const [provider, setProvider] = useState<AssistantProvider | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function requestMessage(message: string, groqConfirmed = false, includeSavedContext = false) {
    if (!today || !ready || sending || proposal || (pendingGroq && !groqConfirmed)) return;
    const history = messages.slice(-10).map(({ role, content }) => ({ role, content }));
    const studyContext = toStudyContext(assignments, availability);
    setMessages((current) => [...current, { id: newId(), role: "user", content: message }]);
    if (message === draft.trim()) setDraft("");
    setError("");
    setSending(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message,
          history,
          provider: providerChoice,
          today,
          studyContext,
          ...(providerChoice === "groq" ? { groqConsent: groqConfirmed, includeStudyContext: includeSavedContext } : {}),
        }),
      });
      const raw: unknown = await response.json();
      if (!response.ok) {
        const messageFromServer = raw && typeof raw === "object" && "error" in raw && typeof raw.error === "string"
          ? raw.error
          : "Sidekick couldn’t read that request. Retry, or choose Local / guided.";
        throw new Error(messageFromServer);
      }
      const parsed = assistantReplySchema.safeParse(raw);
      if (!parsed.success) throw new Error("Sidekick returned an unexpected reply. Please retry.");

      setProvider(parsed.data.provider);
      const checked = validateAssistantActions(parsed.data.proposedActions, studyContext, today);
      const reply = checked.rejectedCount
        ? `${parsed.data.reply} I left out ${checked.rejectedCount} suggestion${checked.rejectedCount === 1 ? "" : "s"} that no longer matched your saved study data.`
        : parsed.data.reply;
      setMessages((current) => [...current, { id: newId(), role: "assistant", content: reply }]);

      if (checked.actions.length) {
        let actions: PendingAssistantAction[] = checked.actions.map((action) => action.type === "add_assignment"
          ? { ...action, previewId: newId() }
          : action);
        const seenSingles = new Set<string>();
        const lastAvailabilityIndex = new Map<string, number>();
        actions.forEach((action, index) => {
          if (action.type === "set_availability") lastAvailabilityIndex.set(action.date, index);
        });
        actions = actions.filter((action, index) => {
          if (action.type === "build_plan" || action.type === "start_focus") {
            if (seenSingles.has(action.type)) return false;
            seenSingles.add(action.type);
          }
          if (action.type === "set_availability" && lastAvailabilityIndex.get(action.date) !== index) return false;
          return true;
        });

        const proposalCreatedAt = new Date().toISOString();
        const prepared = applyAssistantStudyChanges(assignments, availability, actions, proposalCreatedAt);
        const needsSchedule = actions.some((action) => action.type === "add_assignment" || action.type === "update_assignment" || action.type === "set_availability" || action.type === "build_plan");
        if (needsSchedule && prepared.assignments.length > 0 && !actions.some((action) => action.type === "build_plan")) {
          actions = [...actions, { type: "build_plan" }];
        }
        const updated = actions.length === checked.actions.length
          ? prepared
          : applyAssistantStudyChanges(assignments, availability, actions, proposalCreatedAt);
        const willBuild = actions.some((action) => action.type === "build_plan") && Boolean(today);
        setProposal({
          actions,
          assignmentsAfter: updated.assignments,
          availabilityAfter: updated.availability,
          planPreview: willBuild ? buildSchedule(
            updated.assignments,
            updated.availability,
            dates,
            today,
            completedSessionsForWeek(plan?.sessions ?? [], updated.assignments, dates),
          ) : null,
        });
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong. Retry or choose Local / guided.");
      // An explicitly selected Groq failure stays on Groq; never auto-fallback.
    } finally {
      setSending(false);
    }
  }

  function queueMessage(text = draft) {
    const message = text.trim();
    if (!message || sending || proposal || pendingGroq || !ready) return;
    setError("");
    if (providerChoice === "groq") {
      setIncludeStudyContext(false);
      setPendingGroq({ message });
      return;
    }
    void requestMessage(message);
  }

  function confirmProposal() {
    if (!proposal || !today) return;
    const applied = applyAssistantProposal(assignments, availability, reminders, proposal.actions, new Date().toISOString(), newId);
    const changedAssignments = proposal.actions.some((action) => action.type === "add_assignment" || action.type === "update_assignment");
    const changedAvailability = proposal.actions.some((action) => action.type === "set_availability");
    if (changedAssignments) setAssignments(applied.assignments);
    if (changedAvailability) setAvailability(applied.availability);
    if (applied.addedReminders.length) setReminders(applied.reminders);

    if (applied.shouldBuildPlan) {
      const result = proposal.planPreview ?? buildSchedule(
        applied.assignments,
        applied.availability,
        dates,
        today,
        completedSessionsForWeek(plan?.sessions ?? [], applied.assignments, dates),
      );
      setPlan({ sessions: result.sessions, generatedAt: new Date().toISOString(), weekStart: today, inputSignature: planInputSignature(applied.assignments, applied.availability) });
    }

    if (applied.focusMinutes !== null) startTimer(applied.focusMinutes);

    setToast(`Done — Sidekick applied ${proposal.actions.length} change${proposal.actions.length === 1 ? "" : "s"}.`);
    setMessages((current) => [...current, { id: newId(), role: "assistant", content: "Done. I applied the changes you confirmed." }]);
    setProposal(null);
  }

  function dismissProposal() {
    setProposal(null);
    setMessages((current) => [...current, { id: newId(), role: "assistant", content: "No changes saved. You can adjust your request and try again." }]);
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    queueMessage();
  }

  const providerLabel = provider === "groq" ? "Groq Cloud active" : provider === "ollama" ? "Local AI active" : provider === "guided" ? "Guided mode" : providerChoice === "groq" ? "Groq Cloud selected" : providerChoice === "ollama" ? "Ollama selected" : "Local first · guided fallback";
  const proposalAddsPlan = proposal?.actions.some((action) => action.type === "build_plan") ?? false;
  const proposalCanApply = Boolean(proposal) && (!proposalAddsPlan || proposal!.assignmentsAfter.length > 0);
  const sessionsByDate = new Map<string, SchedulePreview["sessions"]>();
  for (const session of proposal?.planPreview?.sessions ?? []) {
    sessionsByDate.set(session.date, [...(sessionsByDate.get(session.date) ?? []), session]);
  }
  const assignmentsById = new Map(proposal?.assignmentsAfter.map((assignment) => [assignment.id, assignment]) ?? []);

  // Pages must not depend on AppShell's ready gate to satisfy their types.
  if (!today) return null;

  return <>
    <PageHeading title="Let Sidekick handle it" description="Tell Sidekick what you need. Review the full handoff before anything changes." />
    <div className="sidekick-layout">
      <section className="panel sidekick-panel" aria-label="Sidekick assistant">
        <div className="sidekick-bar"><span className="sidekick-status-dot" aria-hidden="true" /><span>{providerLabel}</span><label className="sidekick-provider-label" htmlFor="assistant-provider">Use</label><select id="assistant-provider" className="sidekick-provider" value={providerChoice} onChange={(event) => { setProviderChoice(event.target.value as AssistantProviderChoice); setProvider(null); setError(""); }} disabled={sending || Boolean(proposal) || Boolean(pendingGroq)}><option value="auto">Local / guided</option><option value="ollama">Ollama · local</option><option value="groq">Groq · cloud</option></select><span className="sidekick-approval">Nothing is saved until you approve it.</span></div>

        {/* The log itself is not a live region: announcing the whole transcript on every
            turn would re-read the entire conversation. Only the newest turn and the
            thinking indicator announce themselves. */}
        <div className="sidekick-chat">
          {!messages.length && <div className="sidekick-welcome"><h2>What would you like off your plate?</h2><p>One request can add an assignment, adjust your study time, shape the week, save a reminder, and start a focus session.</p></div>}
          {messages.map((message, index) => {
            const isNewest = index === messages.length - 1;
            return <div className={`chat-message ${message.role}`} key={message.id} aria-live={isNewest ? "polite" : "off"}><span className="chat-speaker">{message.role === "user" ? "You" : "Sidekick"}</span><p>{message.content}</p></div>;
          })}
          {sending && <div className="chat-message assistant" aria-live="polite"><span className="chat-speaker">Sidekick</span><p className="thinking-copy">Putting the pieces together…</p></div>}
        </div>

        {pendingGroq && <section className="groq-consent" aria-labelledby="groq-consent-heading" role="dialog" aria-modal="true">
          <h2 id="groq-consent-heading">Before this goes to Groq</h2>
          <p>Your prompt, current date, and up to 10 recent chat messages will be sent to Groq Cloud for this request. You can cancel without sending anything.</p>
          <label className="groq-consent-option"><input type="checkbox" checked={includeStudyContext} onChange={(event) => setIncludeStudyContext(event.target.checked)} /><span><strong>Also include saved assignments and study hours</strong><span>This may help Sidekick edit tasks or build a more useful plan. Leave unchecked to keep study data out of Groq.</span></span></label>
          <div className="proposal-actions"><button className="primary-button" type="button" onClick={() => { const message = pendingGroq.message; setPendingGroq(null); void requestMessage(message, true, includeStudyContext); }}>Send to Groq</button><button className="quiet-button" type="button" onClick={() => setPendingGroq(null)}>Cancel</button></div>
        </section>}

        {proposal && <section className="proposal-card" aria-labelledby="proposal-heading">
          <h2 id="proposal-heading">Review the handoff</h2>
          <ul className="proposal-list">{proposal.actions.map((action, index) => <li key={`${action.type}-${index}`}><span className="proposal-check" aria-hidden="true">✓</span><span>{today ? describeAction(action, today, assignments, availability) : "Review proposed change"}</span></li>)}</ul>
          {proposal.planPreview && <div className="proposal-plan-preview">
            <div className="proposal-plan-summary"><strong>{proposal.planPreview.sessions.length} study blocks</strong><span>{proposal.planPreview.shortfalls.length ? `${formatMinutes(proposal.planPreview.shortfalls.reduce((sum, item) => sum + item.minutes, 0))} won’t fit before deadlines` : "Within your saved daily hours"}</span>{proposal.planPreview.backlog.length > 0 && <span>{proposal.planPreview.backlog.length} later assignment{proposal.planPreview.backlog.length === 1 ? "" : "s"} stay in the backlog</span>}</div>
            {proposal.planPreview.sessions.length > 0 ? <div className="proposal-schedule-days">{[...sessionsByDate.entries()].map(([date, sessions]) => <div className="proposal-schedule-day" key={date}><strong>{formatDate(date)}</strong><ul>{sessions.map((session) => <li key={session.id}>{assignmentsById.get(session.assignmentId)?.title ?? "Assignment"} · {formatMinutes(session.minutes)}{session.completed ? " · done" : ""}</li>)}</ul></div>)}</div> : <p className="proposal-empty-plan">No study blocks fit into the available hours before these deadlines.</p>}
            {proposal.planPreview.shortfalls.length > 0 && <p className="proposal-tradeoff"><strong>Shortfall:</strong> {proposal.planPreview.shortfalls.map((item) => `${assignmentsById.get(item.assignmentId)?.title ?? "Assignment"} ${formatMinutes(item.minutes)}${item.reason === "overdue" ? " overdue" : " over capacity"}`).join(" · ")}. Increase study time or move a deadline.</p>}
            {proposal.planPreview.backlog.length > 0 && <p className="proposal-tradeoff"><strong>Backlog:</strong> {proposal.planPreview.backlog.map((item) => `${item.title} (${formatMinutes(item.remainingMinutes)} left)`).join(", ")} — due after this seven-day plan.</p>}
          </div>}
          {proposalAddsPlan && !proposal.assignmentsAfter.length && <p className="form-error">Add an assignment before building a study week. <Link href="/assignments">Open assignments</Link>.</p>}
          <div className="proposal-actions"><button className="primary-button" type="button" onClick={confirmProposal} disabled={!proposalCanApply}>Apply all</button><button className="quiet-button" type="button" onClick={dismissProposal}>Not now</button></div>
        </section>}

        {error && <p className="assistant-error" role="alert">{error}</p>}
        <form className="sidekick-composer" onSubmit={submitMessage}>
          <label className="sr-only" htmlFor="sidekick-prompt">Tell Sidekick what you need</label>
          <textarea id="sidekick-prompt" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={800} rows={2} placeholder="Tell Sidekick what you need handled…" disabled={!ready || sending || Boolean(proposal) || Boolean(pendingGroq)} />
          <button className="primary-button" type="submit" disabled={!ready || sending || Boolean(proposal) || Boolean(pendingGroq) || !draft.trim()}>{sending ? "Working…" : "Ask Sidekick"}</button>
        </form>

        <div className="sidekick-quick-actions" aria-label="Quick actions">
          <button type="button" onClick={() => { const request = buildDemoRequest(dates); if (request) setDraft(request); }} disabled={!ready || dates.length < 2 || sending || Boolean(proposal) || Boolean(pendingGroq)} aria-label="Fill in a multi-step demo request without sending it">Try demo request</button>
          <button type="button" onClick={() => queueMessage("Build my study week from my saved assignments.")} disabled={!ready || sending || Boolean(proposal) || Boolean(pendingGroq) || !assignments.length}>Build my week</button>
          <button type="button" onClick={() => queueMessage("Focus for 25 minutes.")} disabled={!ready || sending || Boolean(proposal) || Boolean(pendingGroq)}>Start focus</button>
          <button type="button" onClick={() => queueMessage("Remind me to review my notes.")} disabled={!ready || sending || Boolean(proposal) || Boolean(pendingGroq)}>Save a reminder</button>
          <Link href="/assignments">Manage assignments</Link>
        </div>
      </section>

      <aside className="sidekick-note"><h2>One handoff. Your approval.</h2><p>Choose local Ollama, opt into Groq Cloud, or use guided actions. The planner always builds schedules deterministically.</p><p>Local / guided never sends requests to Groq. Each Groq request asks what to share; assignment and availability data stays out unless you opt in for that request.</p></aside>
    </div>
  </>;
}
