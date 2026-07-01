import { describe, expect, it } from "vitest";
import { daysUntil, fmtDate, getNextDueDate } from "../src/utils/dates";

describe("fmtDate", () => {
  it("formats an ISO date in en-US style", () => {
    expect(fmtDate("2026-06-20")).toBe("Jun 20, 2026");
  });

  it("returns an empty string for empty input", () => {
    expect(fmtDate("")).toBe("");
    expect(fmtDate(null)).toBe("");
    expect(fmtDate(undefined)).toBe("");
  });

  it("passes through unparseable values", () => {
    expect(fmtDate("not-a-date")).toBe("not-a-date");
  });
});

const iso = (d) => d.toISOString().slice(0, 10);

describe("getNextDueDate", () => {
  const from = new Date("2026-06-11T09:00:00");

  it("rolls a past anchor forward by whole intervals", () => {
    // anchored 9 days ago, every 10 days → next lands tomorrow
    expect(iso(getNextDueDate("2026-06-02", 10, from))).toBe("2026-06-12");
  });

  it("handles arbitrary intervals like 26 days", () => {
    // anchored 30 days ago, every 26 → one full cycle already passed, next in 22 days
    expect(iso(getNextDueDate("2026-05-12", 26, from))).toBe("2026-07-03");
  });

  it("returns today when the anchor lands exactly on today", () => {
    expect(iso(getNextDueDate("2026-05-12", 30, from))).toBe("2026-06-11");
  });

  it("keeps a future anchor as the next due date", () => {
    expect(iso(getNextDueDate("2026-06-20", 30, from))).toBe("2026-06-20");
  });

  it("treats a zero interval as one-time (the anchor itself)", () => {
    expect(iso(getNextDueDate("2026-06-20", 0, from))).toBe("2026-06-20");
  });

  it("returns null for a missing anchor", () => {
    expect(getNextDueDate("", 10, from)).toBeNull();
  });
});

describe("daysUntil", () => {
  const from = new Date("2026-06-11T09:00:00");
  it("counts whole days ahead", () => {
    expect(daysUntil("2026-06-12", from)).toBe(1);
    expect(daysUntil("2026-06-11", from)).toBe(0);
    expect(daysUntil("2026-06-10", from)).toBe(-1);
  });
});
