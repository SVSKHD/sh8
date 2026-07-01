import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SphReminderItem from "../src/components/cards/SphReminderItem.vue";

describe("SphReminderItem", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T09:00:00"));
  });
  afterEach(() => vi.useRealTimers());

  it("computes the next occurrence from the interval", () => {
    const w = mount(SphReminderItem, {
      props: { item: { id: "r1", title: "Monthsary", anchorDate: "2026-06-02", intervalDays: 30, scope: "user" } },
    });
    expect(w.text()).toContain("every 30 days");
    expect(w.text()).toContain("in 21 days");
    expect(w.text()).toContain("Jul 2, 2026");
    expect(w.text()).toContain("Yours");
  });

  it("still reads legacy startDate reminders", () => {
    const w = mount(SphReminderItem, {
      props: { item: { id: "r2", title: "Flowers", startDate: "2026-06-12", intervalDays: 0 } },
    });
    expect(w.text()).toContain("tomorrow");
    expect(w.text()).toContain("Shared");
  });

  it("celebrates when the day arrives", () => {
    const w = mount(SphReminderItem, {
      props: { item: { id: "r3", title: "Anniversary", anchorDate: "2026-06-11", intervalDays: 0 } },
    });
    expect(w.text()).toContain("today ♥");
    expect(w.find(".glass").classes()).toContain("rem-today");
  });

  it("hides management controls unless canManage", () => {
    const item = { id: "r4", title: "Cake", anchorDate: "2026-06-20", intervalDays: 0, scope: "user" };
    const ro = mount(SphReminderItem, { props: { item } });
    expect(ro.find('[aria-label="Delete reminder"]').exists()).toBe(false);
    const rw = mount(SphReminderItem, { props: { item, canManage: true } });
    expect(rw.find('[aria-label="Delete reminder"]').exists()).toBe(true);
    expect(rw.find('[aria-label="Edit reminder"]').exists()).toBe(true);
  });

  it("emits management events", async () => {
    const item = { id: "r5", title: "X", anchorDate: "2026-06-20", intervalDays: 5, scope: "user" };
    const w = mount(SphReminderItem, { props: { item, canManage: true } });
    await w.find('[aria-label="Delete reminder"]').trigger("click");
    await w.find('[aria-label="Edit reminder"]').trigger("click");
    expect(w.emitted("remove")).toBeTruthy();
    expect(w.emitted("edit")).toBeTruthy();
  });
});
