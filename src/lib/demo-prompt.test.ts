import { describe, expect, it } from "vitest";
import { buildDemoRequest } from "./demo-prompt";

describe("buildDemoRequest", () => {
  it("creates a multi-action prompt using the current two dates", () => {
    const prompt = buildDemoRequest(["2026-10-02", "2026-10-03"]);

    expect(prompt).toContain("2026-10-02");
    expect(prompt).toContain("2026-10-03");
    expect(prompt).toContain("180 minutes");
    expect(prompt).toContain("90 minutes");
    expect(prompt).toContain("30 minutes");
    expect(prompt).toContain("Build my study week");
    expect(prompt).toContain("remind me to review the lab sources");
    expect(prompt).toContain("25-minute focus session");
  });

  it("waits until the current and next date are available", () => {
    expect(buildDemoRequest([])).toBeNull();
    expect(buildDemoRequest(["2026-10-02"])).toBeNull();
  });
});
