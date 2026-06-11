import { describe, expect, it } from "vitest";
import { fmtDate } from "../src/utils/dates";

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
