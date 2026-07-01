import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useReminders } from "../src/composables/useReminders";
import { useUsStore } from "../src/stores/us";

describe("useReminders", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T09:00:00"));
  });
  afterEach(() => vi.useRealTimers());

  it("treats seeded reminders as shared/common", () => {
    const R = useReminders("Hithesh");
    expect(R.common.value.length).toBeGreaterThan(0);
    expect(R.common.value.every((r) => r.scope === "common" && r.ownerId === null)).toBe(true);
    expect(R.mine.value.length).toBe(0);
  });

  it("scopes created reminders to the current user", () => {
    const R = useReminders("Hithesh");
    R.create({ title: "Vitamin D", intervalDays: 10, anchorDate: "2026-06-01" });
    expect(R.mine.value.length).toBe(1);
    const mine = R.mine.value[0];
    expect(mine.ownerId).toBe("Hithesh");
    expect(mine.scope).toBe("user");
    // another user cannot see it
    const other = useReminders("Spoorthy");
    expect(other.mine.value.length).toBe(0);
  });

  it("computes next due date and days remaining", () => {
    const R = useReminders("Hithesh");
    R.create({ title: "Every 10", intervalDays: 10, anchorDate: "2026-06-02" });
    const r = R.mine.value[0];
    expect(r.daysLeft).toBe(1); // anchored 9 days ago, +10 → tomorrow
  });

  it("only the owner can manage their reminders; common are read-only", () => {
    const R = useReminders("Hithesh");
    R.create({ title: "Mine", intervalDays: 5, anchorDate: "2026-06-01" });
    expect(R.canManage(R.mine.value[0])).toBe(true);
    expect(R.canManage(R.common.value[0])).toBe(false);
  });

  it("toggles enabled and removes", () => {
    const R = useReminders("Hithesh");
    R.create({ title: "Mine", intervalDays: 5, anchorDate: "2026-06-01" });
    const id = R.mine.value[0].id;
    R.toggle(id);
    expect(R.mine.value[0].enabled).toBe(false);
    R.remove(id);
    expect(R.mine.value.length).toBe(0);
  });

  it("refuses to remove a common reminder", () => {
    const R = useReminders("Hithesh");
    const before = R.common.value.length;
    R.remove(R.common.value[0].id);
    expect(R.common.value.length).toBe(before);
  });

  it("sorts visible reminders soonest-due first", () => {
    const R = useReminders("Hithesh");
    R.create({ title: "Far", intervalDays: 0, anchorDate: "2026-12-25" });
    R.create({ title: "Soon", intervalDays: 0, anchorDate: "2026-06-12" });
    const titles = R.visible.value.map((r) => r.title);
    expect(titles.indexOf("Soon")).toBeLessThan(titles.indexOf("Far"));
  });
});
