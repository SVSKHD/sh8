import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SphReminderCard from "../src/components/cards/SphReminderCard.vue";

describe("SphReminderCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T09:00:00"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes the next occurrence from the interval", () => {
    // started 9 days ago, repeats every 30 → next is in 21 days
    const w = mount(SphReminderCard, {
      props: { item: { id: "r1", title: "Monthsary", startDate: "2026-06-02", intervalDays: 30 } },
    });
    expect(w.text()).toContain("every 30 days");
    expect(w.text()).toContain("in 21 days");
    expect(w.text()).toContain("Jul 2, 2026");
  });

  it("shows tomorrow when one day is left", () => {
    const w = mount(SphReminderCard, {
      props: { item: { id: "r2", title: "Flowers", startDate: "2026-06-12", intervalDays: 0 } },
    });
    expect(w.text()).toContain("tomorrow");
  });

  it("celebrates when the day arrives", () => {
    const w = mount(SphReminderCard, {
      props: { item: { id: "r3", title: "Anniversary", startDate: "2026-06-11", intervalDays: 0 } },
    });
    expect(w.text()).toContain("today ♥");
    expect(w.find(".glass").classes()).toContain("rem-today");
  });

  it("labels one-time reminders", () => {
    const w = mount(SphReminderCard, {
      props: { item: { id: "r4", title: "Cake", startDate: "2026-06-20", intervalDays: 0 } },
    });
    expect(w.text()).toContain("once");
    expect(w.text()).toContain("one-time reminder");
  });
});
