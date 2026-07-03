import { describe, expect, it } from "vitest";
import { buildWishEventPayload, createEvent, deleteEvent, updateEvent } from "../src/googleCalendar";

describe("buildWishEventPayload (pure)", () => {
  it("builds a timed, one-off event (no all-day, no recurrence)", () => {
    const payload = buildWishEventPayload({ scheduledDate: "2026-07-20T18:30" }, "spoorthy@example.com");
    expect(payload.summary).toBe("Open the app 💌");
    expect(payload.start.dateTime).toBe("2026-07-20T18:30:00");
    expect(payload.start.timeZone).toBeTruthy();
    expect(payload.recurrence).toBeUndefined();
  });

  it("sets the end time 30 minutes after the start", () => {
    const payload = buildWishEventPayload({ scheduledDate: "2026-07-20T23:50" }, "a@b.com");
    // crosses midnight — confirms real date math, not string concatenation
    expect(payload.end.dateTime).toBe("2026-07-21T00:20:00");
  });

  it("invites the recipient as an attendee when an email is given", () => {
    const payload = buildWishEventPayload({ scheduledDate: "2026-07-20T18:30" }, "spoorthy@example.com");
    expect(payload.attendees).toEqual([{ email: "spoorthy@example.com" }]);
  });

  it("omits attendees when no recipient email is known", () => {
    const payload = buildWishEventPayload({ scheduledDate: "2026-07-20T18:30" }, "");
    expect(payload.attendees).toBeUndefined();
  });

  it("never embeds the wish's private message in the calendar description", () => {
    const payload = buildWishEventPayload({ scheduledDate: "2026-07-20T18:30", message: "a very private secret" }, "a@b.com");
    expect(payload.description).not.toContain("a very private secret");
  });
});

describe("googleCalendar generic CRUD (unconfigured environment)", () => {
  // VITE_GOOGLE_CLIENT_ID is unset in tests, so every call below hits the
  // "no token available" path without any network mocking required.

  it("createEvent/updateEvent resolve to null without a configured session", async () => {
    expect(await createEvent({ summary: "x" })).toBeNull();
    expect(await updateEvent("evt1", { summary: "x" })).toBeNull();
  });

  it("deleteEvent resolves to true for a falsy eventId (nothing to delete)", async () => {
    expect(await deleteEvent(null)).toBe(true);
    expect(await deleteEvent("")).toBe(true);
  });

  it("deleteEvent resolves to false — not true — when nothing could be attempted", async () => {
    // regression test: this used to return true (falsely claiming success)
    // whenever there was no token available, making "not connected" and
    // "confirmed deleted" indistinguishable to callers
    expect(await deleteEvent("evt1")).toBe(false);
  });
});
