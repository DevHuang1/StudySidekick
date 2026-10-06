import { describe, expect, it } from "vitest";
import { addDays, dateFromKey, getWeekDates, localDateKey } from "./date-utils";

describe("localDateKey", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    expect(localDateKey(new Date(2026, 9, 6))).toBe("2026-10-06");
    expect(localDateKey(new Date(2026, 0, 1))).toBe("2026-01-01");
  });
});

describe("dateFromKey", () => {
  it("reads a date key at midday so DST cannot shift the day", () => {
    const parsed = dateFromKey("2026-10-06");
    expect(localDateKey(parsed)).toBe("2026-10-06");
    expect(parsed.getHours()).toBe(12);
  });

  it("round-trips keys through midday for every day of the year", () => {
    // Guards the daylight-saving boundaries where a naive T00:00 shifts a day.
    for (let day = 1; day <= 365; day += 1) {
      const key = `2026-01-01`;
      const shifted = addDays(key, day - 1);
      expect(localDateKey(dateFromKey(shifted))).toBe(shifted);
    }
  });
});

describe("addDays", () => {
  it("moves forward and backward across a month boundary", () => {
    expect(addDays("2026-10-06", 1)).toBe("2026-10-07");
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("handles a leap day", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-02-29", 1)).toBe("2028-03-01");
  });

  it("crosses a year boundary", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("getWeekDates", () => {
  it("returns seven consecutive days starting today", () => {
    const week = getWeekDates(dateFromKey("2026-10-06"));
    expect(week).toHaveLength(7);
    expect(week[0]).toBe("2026-10-06");
    expect(week[6]).toBe("2026-10-12");
  });

  it("keeps every date unique", () => {
    const week = getWeekDates(dateFromKey("2026-10-06"));
    expect(new Set(week).size).toBe(7);
  });
});
