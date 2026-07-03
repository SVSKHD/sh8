import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useReminders } from "../src/composables/useReminders";
import * as google from "../src/googleCalendar";

/* Mock only the connection/network surface; buildEventPayload and
   googleCalendarConfigured stay real via the ...actual spread, so the pure
   payload tests below exercise the real implementation. */
vi.mock("../src/googleCalendar", async () => {
  const actual = await vi.importActual("../src/googleCalendar");
  return {
    ...actual,
    isConnected: { value: false },
    createReminderEvent: vi.fn(),
    updateReminderEvent: vi.fn(),
    deleteReminderEvent: vi.fn(),
  };
});

describe("buildEventPayload (pure)", () => {
  it("builds a recurring all-day event with a daily-interval RRULE", () => {
    const payload = google.buildEventPayload({
      title: "Flowers",
      note: "Somewhere new",
      anchorDate: "2026-06-02",
      intervalDays: 10,
    });
    expect(payload.summary).toBe("Flowers");
    expect(payload.description).toBe("Somewhere new");
    expect(payload.start).toEqual({ date: "2026-06-02" });
    // exclusive end date = anchor + 1 day, standard for a single-day all-day event
    expect(payload.end).toEqual({ date: "2026-06-03" });
    expect(payload.recurrence).toEqual(["RRULE:FREQ=DAILY;INTERVAL=10"]);
  });

  it("omits recurrence for a one-time (intervalDays 0) reminder", () => {
    const payload = google.buildEventPayload({ title: "Cake", anchorDate: "2026-06-20", intervalDays: 0 });
    expect(payload.recurrence).toBeUndefined();
  });

  it("always attaches a default popup notification", () => {
    const payload = google.buildEventPayload({ title: "X", anchorDate: "2026-06-20", intervalDays: 5 });
    expect(payload.reminders).toEqual({ useDefault: false, overrides: [{ method: "popup", minutes: 60 }] });
  });

  it("handles a month-end rollover for the exclusive end date", () => {
    const payload = google.buildEventPayload({ title: "X", anchorDate: "2026-06-30", intervalDays: 26 });
    expect(payload.end).toEqual({ date: "2026-07-01" });
  });
});

describe("useReminders + Google sync gating", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T09:00:00"));
    google.isConnected.value = false;
    google.createReminderEvent.mockReset();
    google.updateReminderEvent.mockReset();
    google.deleteReminderEvent.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("never calls into the Google module when not connected", async () => {
    const R = useReminders("Hithesh");
    R.create({ title: "Flowers", intervalDays: 10, anchorDate: "2026-06-01" });
    await Promise.resolve();
    expect(google.createReminderEvent).not.toHaveBeenCalled();
  });

  it("creates a calendar event and stores the returned eventId when connected", async () => {
    google.isConnected.value = true;
    google.createReminderEvent.mockResolvedValue("evt_123");
    const R = useReminders("Hithesh");
    R.create({ title: "Flowers", intervalDays: 10, anchorDate: "2026-06-01" });
    await Promise.resolve();
    await Promise.resolve();
    const r = R.mine.value.find((x) => x.title === "Flowers");
    expect(r.googleEventId).toBe("evt_123");
  });

  it("updates the existing event (not a fresh create) when a synced reminder changes", async () => {
    google.isConnected.value = true;
    google.createReminderEvent.mockResolvedValue("evt_789");
    google.updateReminderEvent.mockResolvedValue("evt_789");
    const R = useReminders("Hithesh");
    R.create({ title: "Note", intervalDays: 5, anchorDate: "2026-06-01" });
    await Promise.resolve();
    await Promise.resolve();
    const id = R.mine.value.find((x) => x.title === "Note").id;
    R.update(id, { title: "Note, edited" });
    await Promise.resolve();
    await Promise.resolve();
    expect(google.updateReminderEvent).toHaveBeenCalledWith("evt_789", expect.objectContaining({ title: "Note, edited" }));
  });

  it("deletes the calendar event when a synced reminder is removed", async () => {
    google.isConnected.value = true;
    google.createReminderEvent.mockResolvedValue("evt_456");
    google.deleteReminderEvent.mockResolvedValue(true);
    const R = useReminders("Hithesh");
    R.create({ title: "Note", intervalDays: 5, anchorDate: "2026-06-01" });
    await Promise.resolve();
    await Promise.resolve();
    const id = R.mine.value.find((x) => x.title === "Note").id;
    R.remove(id);
    expect(google.deleteReminderEvent).toHaveBeenCalledWith("evt_456");
  });

  it("deletes the calendar event when a synced reminder is paused, and recreates it on resume", async () => {
    google.isConnected.value = true;
    google.createReminderEvent.mockResolvedValue("evt_999");
    google.deleteReminderEvent.mockResolvedValue(true);
    const R = useReminders("Hithesh");
    R.create({ title: "Pausable", intervalDays: 5, anchorDate: "2026-06-01" });
    await Promise.resolve();
    await Promise.resolve();
    const id = R.mine.value.find((x) => x.title === "Pausable").id;
    R.toggle(id); // pause
    expect(google.deleteReminderEvent).toHaveBeenCalledWith("evt_999");
    expect(R.mine.value.find((x) => x.id === id).googleEventId).toBeFalsy();

    google.createReminderEvent.mockResolvedValue("evt_1000");
    R.toggle(id); // resume
    await Promise.resolve();
    await Promise.resolve();
    expect(R.mine.value.find((x) => x.id === id).googleEventId).toBe("evt_1000");
  });
});
