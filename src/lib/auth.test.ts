import { describe, expect, it } from "vitest";
import {
  DEMO_PASSWORD,
  isAuthUsername,
  isDemoPassword,
  parseAuthSession,
} from "./auth";

describe("isDemoPassword", () => {
  it("accepts the demo password and ignores surrounding whitespace", () => {
    expect(isDemoPassword(DEMO_PASSWORD)).toBe(true);
    expect(isDemoPassword(`  ${DEMO_PASSWORD}\n`)).toBe(true);
  });

  it("rejects other values and the wrong case", () => {
    expect(isDemoPassword("")).toBe(false);
    expect(isDemoPassword("devpost")).toBe(false);
    expect(isDemoPassword("DEVPOST!")).toBe(false);
  });
});

describe("isAuthUsername", () => {
  it("accepts only the demo identities", () => {
    expect(isAuthUsername("User")).toBe(true);
    expect(isAuthUsername("Judge")).toBe(true);
    expect(isAuthUsername("user")).toBe(false);
    expect(isAuthUsername("Admin")).toBe(false);
  });
});

describe("parseAuthSession", () => {
  const valid = JSON.stringify({ username: "Judge", signedInAt: "2026-10-23T12:00:00.000Z" });

  it("reads a valid stored session", () => {
    expect(parseAuthSession(valid)).toEqual({
      username: "Judge",
      signedInAt: "2026-10-23T12:00:00.000Z",
    });
  });

  it("survives empty or corrupt payloads", () => {
    for (const raw of [null, "", "{not json", "null", "[]", "42"]) {
      expect(parseAuthSession(raw)).toBeNull();
    }
  });

  it("rejects unknown users and malformed timestamps", () => {
    expect(parseAuthSession(JSON.stringify({ username: "Admin", signedInAt: "2026-10-23T12:00:00.000Z" }))).toBeNull();
    expect(parseAuthSession(JSON.stringify({ username: "Judge", signedInAt: "not-a-date" }))).toBeNull();
    expect(parseAuthSession(JSON.stringify({ username: "Judge" }))).toBeNull();
  });
});
