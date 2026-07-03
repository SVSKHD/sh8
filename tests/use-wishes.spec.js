import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { scheduleWishDelivery, useWishes } from "../src/composables/useWishes";
import { useUsStore } from "../src/stores/us";
import * as google from "../src/googleCalendar";
import * as notifications from "../src/composables/useNotifications";

vi.mock("../src/googleCalendar", async () => {
  const actual = await vi.importActual("../src/googleCalendar");
  return {
    ...actual,
    isConnected: { value: false },
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
  };
});

vi.mock("../src/composables/useNotifications", async () => {
  const actual = await vi.importActual("../src/composables/useNotifications");
  return { ...actual, showWishNotification: vi.fn() };
});

describe("useWishes", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T09:00:00"));
    google.isConnected.value = false;
    google.createEvent.mockReset();
    google.updateEvent.mockReset();
    google.deleteEvent.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("scopes sent vs received by from/to", () => {
    const hithesh = useWishes("Hithesh");
    hithesh.create({ to: "Spoorthy", message: "hi love", scheduledDate: "2026-06-20T10:00" });
    expect(hithesh.sent.value.length).toBe(1);
    expect(hithesh.sent.value[0].to).toBe("Spoorthy");

    const spoorthy = useWishes("Spoorthy");
    expect(spoorthy.sent.value.length).toBe(0);
    // undelivered — must stay invisible to the recipient's visible list
    expect(spoorthy.receivedVisible.value.length).toBe(0);
  });

  it("hides an undelivered wish from the recipient's visible list", () => {
    const hithesh = useWishes("Hithesh");
    hithesh.create({ to: "Spoorthy", message: "surprise!", scheduledDate: "2099-01-01T10:00" });
    const spoorthy = useWishes("Spoorthy");
    expect(spoorthy.receivedVisible.value.length).toBe(0);
    expect(spoorthy.deliveredUnseen.value.length).toBe(0);
  });

  it("checkDeliveries marks a due wish delivered, making it visible to the recipient", () => {
    const hithesh = useWishes("Hithesh");
    hithesh.create({ to: "Spoorthy", message: "surprise!", scheduledDate: "2026-06-11T08:00" }); // in the past
    const spoorthy = useWishes("Spoorthy");
    expect(spoorthy.receivedVisible.value.length).toBe(0);
    spoorthy.checkDeliveries();
    expect(spoorthy.receivedVisible.value.length).toBe(1);
    expect(spoorthy.deliveredUnseen.value.length).toBe(1);
  });

  it("markSeen clears deliveredUnseen without hiding it from receivedVisible", () => {
    const hithesh = useWishes("Hithesh");
    hithesh.create({ to: "Spoorthy", message: "x", scheduledDate: "2026-06-11T08:00" });
    const spoorthy = useWishes("Spoorthy");
    spoorthy.checkDeliveries();
    const id = spoorthy.receivedVisible.value[0].id;
    spoorthy.markSeen(id);
    expect(spoorthy.deliveredUnseen.value.length).toBe(0);
    expect(spoorthy.receivedVisible.value.length).toBe(1);
  });

  it("only the sender can edit or cancel, and only before delivery", () => {
    const hithesh = useWishes("Hithesh");
    hithesh.create({ to: "Spoorthy", message: "x", scheduledDate: "2099-01-01T10:00" });
    const w = hithesh.sent.value[0];
    expect(hithesh.canEdit(w)).toBe(true);

    const spoorthy = useWishes("Spoorthy");
    expect(spoorthy.canEdit(w)).toBe(false); // not the sender

    hithesh.update(w.id, { message: "edited" });
    expect(hithesh.sent.value[0].message).toBe("edited");

    const store = useUsStore();
    store.updateItem("wishes", w.id, { delivered: true });
    expect(hithesh.canEdit(hithesh.sent.value[0])).toBe(false); // already delivered
  });

  it("cancel soft-flags the wish and clears its googleEventId", () => {
    const hithesh = useWishes("Hithesh");
    hithesh.create({ to: "Spoorthy", message: "x", scheduledDate: "2099-01-01T10:00" });
    const w = hithesh.sent.value[0];
    hithesh.cancel(w.id);
    const cancelled = hithesh.sent.value.find((x) => x.id === w.id);
    expect(cancelled.cancelled).toBe(true);
    // a cancelled wish is never visible to the recipient
    const spoorthy = useWishes("Spoorthy");
    expect(spoorthy.receivedVisible.value.some((x) => x.id === w.id)).toBe(false);
  });

  it("the sender can remove their own wish; others cannot", () => {
    const hithesh = useWishes("Hithesh");
    hithesh.create({ to: "Spoorthy", message: "x", scheduledDate: "2099-01-01T10:00" });
    const id = hithesh.sent.value[0].id;
    const spoorthy = useWishes("Spoorthy");
    spoorthy.remove(id);
    expect(hithesh.sent.value.some((x) => x.id === id)).toBe(true); // untouched
    hithesh.remove(id);
    expect(hithesh.sent.value.some((x) => x.id === id)).toBe(false);
  });

  it("creates a Google Calendar invite only when the sender is connected and the recipient's email is known", async () => {
    const store = useUsStore();
    const hithesh = useWishes("Hithesh");

    hithesh.create({ to: "Spoorthy", message: "x", scheduledDate: "2099-01-01T10:00" });
    await Promise.resolve();
    expect(google.createEvent).not.toHaveBeenCalled(); // not connected yet

    google.isConnected.value = true;
    hithesh.create({ to: "Spoorthy", message: "y", scheduledDate: "2099-01-02T10:00" });
    await Promise.resolve();
    expect(google.createEvent).not.toHaveBeenCalled(); // connected, but no recipient email known

    store.setEmail("spoorthy@example.com", "Spoorthy");
    google.createEvent.mockResolvedValue("evt_1");
    hithesh.create({ to: "Spoorthy", message: "z", scheduledDate: "2099-01-03T10:00" });
    await Promise.resolve();
    await Promise.resolve();
    expect(google.createEvent).toHaveBeenCalledWith(expect.any(Object), { sendUpdates: "all" });
    const z = hithesh.sent.value.find((w) => w.message === "z");
    expect(z.googleEventId).toBe("evt_1");
  });

  it("cancel deletes the calendar invite quietly (sendUpdates: none)", async () => {
    const store = useUsStore();
    store.setEmail("spoorthy@example.com", "Spoorthy");
    google.isConnected.value = true;
    google.createEvent.mockResolvedValue("evt_2");
    google.deleteEvent.mockResolvedValue(true);

    const hithesh = useWishes("Hithesh");
    hithesh.create({ to: "Spoorthy", message: "x", scheduledDate: "2099-01-01T10:00" });
    await Promise.resolve();
    await Promise.resolve();
    const id = hithesh.sent.value[0].id;
    hithesh.cancel(id);
    expect(google.deleteEvent).toHaveBeenCalledWith("evt_2", { sendUpdates: "none" });
  });
});

describe("scheduleWishDelivery", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T09:00:00"));
    notifications.showWishNotification.mockReset();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("does nothing for a falsy userId", () => {
    expect(() => scheduleWishDelivery(null)).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("delivers a wish and notifies once its scheduled time arrives", () => {
    const hithesh = useWishes("Hithesh");
    hithesh.create({ to: "Spoorthy", message: "surprise!", scheduledDate: "2026-06-11T09:05" }); // 5 min out
    scheduleWishDelivery("Spoorthy");
    expect(notifications.showWishNotification).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5 * 60 * 1000 + 1000);
    const spoorthy = useWishes("Spoorthy");
    expect(spoorthy.receivedVisible.value.length).toBe(1);
    expect(notifications.showWishNotification).toHaveBeenCalledWith(
      "A wish arrived 💌",
      expect.objectContaining({ tag: expect.stringContaining("us-wish-") }),
    );
  });

  it("caps the wait for a far-future wish instead of overflowing setTimeout", () => {
    const hithesh = useWishes("Hithesh");
    hithesh.create({ to: "Spoorthy", message: "x", scheduledDate: "2028-01-01T00:00" }); // ~1.5 years out
    scheduleWishDelivery("Spoorthy");
    // should schedule a re-check within 24h, not attempt to sleep the full gap
    const timers = vi.getTimerCount();
    expect(timers).toBeGreaterThan(0);
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1000);
    // still not delivered — far future — but no notification fired and no crash
    expect(notifications.showWishNotification).not.toHaveBeenCalled();
  });

  it("re-scheduling clears the previous timer instead of stacking duplicates", () => {
    const hithesh = useWishes("Hithesh");
    hithesh.create({ to: "Spoorthy", message: "x", scheduledDate: "2026-06-11T09:05" });
    scheduleWishDelivery("Spoorthy");
    const before = vi.getTimerCount();
    expect(before).toBeGreaterThan(0);
    scheduleWishDelivery("Spoorthy");
    expect(vi.getTimerCount()).toBe(before); // not before + 1
  });
});
