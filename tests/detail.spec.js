import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detailState, relDate, showDetail } from "../src/composables/detail";

describe("showDetail", () => {
  it("opens the dialog with the given kind and item", () => {
    const item = { id: "x1", title: "Test" };
    showDetail("milestone", item);
    expect(detailState.open).toBe(true);
    expect(detailState.kind).toBe("milestone");
    // detailState is reactive, so the stored item is a proxy — compare structurally
    expect(detailState.item).toEqual(item);
  });
});

describe("relDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T10:00:00"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("handles today / tomorrow / yesterday", () => {
    expect(relDate("2026-06-11")).toBe("today");
    expect(relDate("2026-06-12")).toBe("tomorrow");
    expect(relDate("2026-06-10")).toBe("yesterday");
  });

  it("counts days within two months", () => {
    expect(relDate("2026-06-23")).toBe("in 12 days");
    expect(relDate("2026-05-30")).toBe("12 days ago");
  });

  it("rolls up to months and years", () => {
    expect(relDate("2026-09-11")).toBe("in 3 months");
    expect(relDate("2022-06-11")).toBe("4 years ago");
  });

  it("returns empty for missing or invalid dates", () => {
    expect(relDate("")).toBe("");
    expect(relDate("nope")).toBe("");
  });
});
