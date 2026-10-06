import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const originalEnvironment = {
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_MODEL: process.env.GROQ_MODEL,
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
};
const savedContext = {
  assignments: [{ id: "private-id-1", title: "PRIVATE HISTORY ESSAY", course: "History", dueDate: "2026-10-06", estimateMinutes: 180 }],
  availability: ["2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"].map((date) => ({ date, minutes: 60 })),
};

function postJson(body: unknown) {
  return POST(new Request("http://localhost/api/assistant", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
}

function mockGroqReply(proposedActions: unknown[] = [{ type: "build_plan" }], status = 200) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify({
    choices: [{ message: { content: JSON.stringify({ reply: "Review the proposed change.", clarification: null, proposedActions }) } }],
  }), { status, headers: { "content-type": "application/json" } }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  for (const [name, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe("Groq assistant provider", () => {
  it("does not call Groq without a per-request confirmation", async () => {
    process.env.GROQ_API_KEY = "server-only-test-key";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await postJson({ message: "Plan my week", provider: "groq" });

    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("Confirm the Groq data-sharing notice");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not make a network request when no server key is configured", async () => {
    delete process.env.GROQ_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await postJson({ message: "Plan my week", provider: "groq", groqConsent: true });

    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("GROQ_API_KEY");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps saved study data out of Groq messages unless that request opts in", async () => {
    process.env.GROQ_API_KEY = "server-only-test-key";
    const fetchMock = mockGroqReply();
    vi.stubGlobal("fetch", fetchMock);

    const response = await postJson({ message: "Build a useful plan", provider: "groq", groqConsent: true, studyContext: savedContext, includeStudyContext: false });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    const remoteMessages = JSON.stringify(body.messages);

    expect(response.status).toBe(200);
    expect(remoteMessages).not.toContain("PRIVATE HISTORY ESSAY");
    expect(remoteMessages).not.toContain("private-id-1");
    expect(remoteMessages).not.toContain('"minutes":60');
  });

  it("includes saved study data in Groq messages only after the explicit opt-in", async () => {
    process.env.GROQ_API_KEY = "server-only-test-key";
    const fetchMock = mockGroqReply();
    vi.stubGlobal("fetch", fetchMock);

    const response = await postJson({ message: "Build a useful plan", provider: "groq", groqConsent: true, studyContext: savedContext, includeStudyContext: true });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));

    expect(response.status).toBe(200);
    expect(JSON.stringify(body.messages)).toContain("PRIVATE HISTORY ESSAY");
    expect(JSON.stringify(body.messages)).toContain("private-id-1");
    const contextMessage = body.messages.find((message: { content: string }) => message.content.includes("Current saved study data"));
    expect(contextMessage?.content).toContain('"completedMinutes":0');
  });

  it("returns the complete demo handoff without sending saved study data to Groq", async () => {
    process.env.GROQ_API_KEY = "server-only-test-key";
    const actions = [
      { type: "add_assignment", title: "Biology lab report", course: "Biology", dueDate: "2026-10-03", estimateMinutes: 180 },
      { type: "set_availability", date: "2026-10-02", minutes: 90 },
      { type: "set_availability", date: "2026-10-03", minutes: 30 },
      { type: "build_plan" },
      { type: "add_reminder", text: "Review the lab sources", dueAt: null },
      { type: "start_focus", minutes: 25 },
    ];
    const fetchMock = mockGroqReply(actions);
    vi.stubGlobal("fetch", fetchMock);

    const response = await postJson({
      message: "Add a Biology lab report due 2026-10-03, estimated 180 minutes. Set 2026-10-02 to 90 minutes and 2026-10-03 to 30 minutes. Build my week, remind me to review the lab sources, and start a 25-minute focus session.",
      provider: "groq",
      groqConsent: true,
      includeStudyContext: false,
      studyContext: savedContext,
      today: "2026-10-02",
    });
    const result = await response.json();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const remoteMessages = JSON.stringify(JSON.parse(String(init.body)).messages);

    expect(response.status).toBe(200);
    expect(result.provider).toBe("groq");
    expect(result.proposedActions).toEqual(actions);
    expect(remoteMessages).not.toContain("PRIVATE HISTORY ESSAY");
    expect(remoteMessages).not.toContain("private-id-1");
  });

  it("validates proposed assignment IDs against the submitted local context", async () => {
    process.env.GROQ_API_KEY = "server-only-test-key";
    const fetchMock = mockGroqReply([{ type: "update_assignment", assignmentId: "not-saved", changes: { title: "Other task" } }]);
    vi.stubGlobal("fetch", fetchMock);

    const response = await postJson({ message: "Rename my saved task", provider: "groq", groqConsent: true, studyContext: savedContext });
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.proposedActions).toEqual([]);
    expect(result.reply).toContain("left out 1 suggestion");
  });

  it("keeps API keys out of provider errors", async () => {
    process.env.GROQ_API_KEY = "secret-that-must-not-leak";
    const fetchMock = vi.fn().mockResolvedValue(new Response("secret-that-must-not-leak", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await postJson({ message: "Build a plan", provider: "groq", groqConsent: true });
    const error = await response.text();

    expect(response.status).toBe(502);
    expect(error).toContain("valid");
    expect(error).not.toContain("secret-that-must-not-leak");
  });
});

describe("local and guided providers", () => {
  it("gives the local Ollama request its study context", async () => {
    process.env.OLLAMA_BASE_URL = "http://localhost:11434";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      message: { content: JSON.stringify({ reply: "I found your assignment.", clarification: null, proposedActions: [{ type: "build_plan" }] }) },
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await postJson({ message: "Build my week", provider: "ollama", studyContext: savedContext, today: "2026-10-02" });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));

    expect(response.status).toBe(200);
    expect(JSON.stringify(body.messages)).toContain("PRIVATE HISTORY ESSAY");
    expect(body.model).toBe("qwen3:4b");
  });

  it("never contacts Groq when Local / guided is selected, even when Groq is configured", async () => {
    process.env.GROQ_API_KEY = "server-only-test-key";
    process.env.OLLAMA_BASE_URL = "http://127.0.0.1:11434";
    const fetchMock = vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await postJson({ message: "Build my study week", provider: "auto", studyContext: savedContext, today: "2026-10-02" });
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.provider).toBe("guided");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://127.0.0.1:11434/api/chat");
  });
});
