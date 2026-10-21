"use client";

import { useState, type FormEvent } from "react";
import { PageHeading } from "@/components/app-shell";
import { useStudy } from "@/app/study-provider";
import { addDays, formatDueDate } from "@/lib/date-utils";
import { formatMinutes, newId } from "@/lib/format";
import { remainingEffort } from "@/lib/progress";
import type { Assignment } from "@/lib/types";

export default function AssignmentsPage() {
  const { today, assignments, setAssignments, setPlan, setToast } = useStudy();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [dueDateOverride, setDueDateOverride] = useState<string | null>(null);
  const [hours, setHours] = useState("2");

  // Suggest a nearby default date, while an explicit empty value (cleared by
  // the reader) stays empty so the field can be retyped.
  const dueDate = dueDateOverride ?? (today ? addDays(today, 3) : "");

  // Pages must not depend on AppShell's ready gate to satisfy their types.
  if (!today) return null;

  function clearForm() {
    setEditingId(null);
    setFormError("");
    setTitle("");
    setCourse("");
    setDueDateOverride(null);
    setHours("2");
  }

  function submitAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!today) return;
    const cleanTitle = title.trim();
    const cleanCourse = course.trim();
    const estimateHours = Number(hours);
    const selectedDueDate = dueDate || addDays(today, 3);
    if (!cleanTitle || !cleanCourse || selectedDueDate < today || !Number.isFinite(estimateHours) || estimateHours <= 0 || estimateHours > 168) {
      setFormError("Add a title, course, upcoming due date, and estimate between 0.25 and 168 hours.");
      return;
    }
    const estimateMinutes = Math.max(15, Math.round(estimateHours * 60));
    if (editingId) {
      setAssignments((current) => current.map((item) => item.id === editingId ? { ...item, title: cleanTitle, course: cleanCourse, dueDate: selectedDueDate, estimateMinutes } : item));
      setToast(`Updated “${cleanTitle}”. Review a replan to apply the change to your week.`);
    } else {
      setAssignments((current) => [...current, { id: newId(), title: cleanTitle, course: cleanCourse, dueDate: selectedDueDate, estimateMinutes, completedMinutes: 0, createdAt: new Date().toISOString() }]);
      setToast(`Added “${cleanTitle}”. Build your week when you are ready.`);
    }
    clearForm();
  }

  function editAssignment(assignment: Assignment) {
    setEditingId(assignment.id);
    setTitle(assignment.title);
    setCourse(assignment.course);
    setDueDateOverride(assignment.dueDate);
    setHours(String(Number((assignment.estimateMinutes / 60).toFixed(2))));
    setFormError("");
    document.getElementById("assignment-title")?.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("assignment-title")?.focus({ preventScroll: true });
  }

  function removeAssignment(id: string) {
    const assignment = assignments.find((item) => item.id === id);
    const remaining = assignments.filter((item) => item.id !== id);
    setAssignments(remaining);
    setPlan((current) => current ? remaining.length === 0 ? null : { ...current, sessions: current.sessions.filter((session) => session.assignmentId !== id) } : current);
    if (editingId === id) clearForm();
    setToast(`Removed “${assignment?.title ?? "assignment"}”. Review a replan to refresh your week.`);
  }

  return <>
    <PageHeading title="Your assignments" description="Capture what’s due and your total effort estimate. Completed blocks count toward what remains." />
    <div className="assignment-page-grid">
      <section className="panel side-panel" aria-labelledby="assignment-form-heading">
        <div className="panel-header"><div><h2 className="panel-title" id="assignment-form-heading">{editingId ? "Edit assignment" : "Add an assignment"}</h2></div></div>
        <form className="form-body" onSubmit={submitAssignment}>
          <div className="field full-field"><label htmlFor="assignment-title">Assignment title</label><input id="assignment-title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={100} placeholder="e.g. Research paper draft" /></div>
          <div className="field full-field"><label htmlFor="assignment-course">Course</label><input id="assignment-course" value={course} onChange={(event) => setCourse(event.target.value)} required maxLength={80} placeholder="e.g. Biology 101" /></div>
          <div className="field-grid"><div className="field"><label htmlFor="assignment-due">Due date</label><input id="assignment-due" value={dueDate} onChange={(event) => setDueDateOverride(event.target.value)} type="date" required min={today} /></div><div className="field"><label htmlFor="assignment-hours">Estimated total effort</label><input id="assignment-hours" value={hours} onChange={(event) => setHours(event.target.value)} type="number" required min="0.25" max="168" step="0.25" /></div></div>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <button className="primary-button form-button" type="submit">{editingId ? "Save assignment" : "+ Add assignment"}</button>
          {editingId && <button className="quiet-button" type="button" onClick={clearForm}>Cancel edit</button>}
        </form>
      </section>

      <section className="panel assignments-list-panel" aria-labelledby="saved-assignments-heading">
        <div className="panel-header"><h2 className="panel-title" id="saved-assignments-heading">Saved assignments</h2></div>
        {assignments.length ? <div className="assignment-list page-assignment-list">{assignments.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((assignment) => <div className="assignment-row" key={assignment.id}><div className="assignment-copy"><strong>{assignment.title}</strong><span>{assignment.course} · {formatDueDate(assignment.dueDate, today)}</span><span>{formatMinutes(assignment.completedMinutes)} done of {formatMinutes(assignment.estimateMinutes)} · {formatMinutes(remainingEffort(assignment))} left</span></div><div className="inline-actions"><button className="quiet-button" type="button" onClick={() => editAssignment(assignment)} aria-label={`Edit ${assignment.title}`}>Edit</button><button className="icon-button" type="button" onClick={() => removeAssignment(assignment.id)} aria-label={`Remove ${assignment.title}`}>×</button></div></div>)}</div> : <div className="empty-list assignments-empty"><strong>Nothing on your list yet.</strong><span>Add one deadline to give your week a starting point.</span></div>}
        <div className="panel-footnote">Changes apply to a saved week only after you review and use a replan.</div>
      </section>
    </div>
  </>;
}
