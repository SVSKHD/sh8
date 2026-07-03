import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlans } from "../src/composables/usePlans";
import { useUsStore } from "../src/stores/us";

describe("usePlans", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T09:00:00"));
  });

  it("seeds a mix of idea/planned/done plans", () => {
    const P = usePlans("Hithesh");
    const statuses = new Set(P.all.value.map((p) => p.status));
    expect(statuses.has("idea")).toBe(true);
    expect(statuses.has("planned")).toBe(true);
    expect(statuses.has("done")).toBe(true);
  });

  it("creates a plan attributed to the current user, defaulting to idea", () => {
    const P = usePlans("Hithesh");
    const before = P.all.value.length;
    P.create({ title: "Beach day" });
    expect(P.all.value.length).toBe(before + 1);
    const p = P.all.value.find((x) => x.title === "Beach day");
    expect(p.addedBy).toBe("Hithesh");
    expect(p.status).toBe("idea");
  });

  it("is shared/editable by both users — no ownership gate", () => {
    const owner = usePlans("Hithesh");
    owner.create({ title: "Anniversary trip" });
    const id = owner.all.value.find((p) => p.title === "Anniversary trip").id;
    const partner = usePlans("Spoorthy");
    partner.setStatus(id, "planned");
    expect(owner.all.value.find((p) => p.id === id).status).toBe("planned");
  });

  it("sorts planned items by soonest date first, ahead of idea and done", () => {
    const store = useUsStore();
    store.plans = [];
    const P = usePlans("Hithesh");
    P.create({ title: "Someday idea" });
    P.create({ title: "Far planned", status: "planned", date: "2026-12-25" });
    P.create({ title: "Soon planned", status: "planned", date: "2026-06-20" });
    P.create({ title: "Already done", status: "done" });
    const titles = P.sorted.value.map((p) => p.title);
    expect(titles).toEqual(["Soon planned", "Far planned", "Someday idea", "Already done"]);
  });

  it("setStatus moves a plan between idea/planned/done", () => {
    const P = usePlans("Hithesh");
    P.create({ title: "Weekend getaway" });
    const id = P.all.value.find((p) => p.title === "Weekend getaway").id;
    P.setStatus(id, "planned");
    expect(P.all.value.find((p) => p.id === id).status).toBe("planned");
    P.setStatus(id, "done");
    expect(P.all.value.find((p) => p.id === id).status).toBe("done");
  });

  it("ignores an invalid status", () => {
    const P = usePlans("Hithesh");
    P.create({ title: "Test" });
    const id = P.all.value.find((p) => p.title === "Test").id;
    P.setStatus(id, "bogus");
    expect(P.all.value.find((p) => p.id === id).status).toBe("idea");
  });

  it("edits and removes a plan", () => {
    const P = usePlans("Hithesh");
    P.create({ title: "Museum date" });
    const id = P.all.value.find((p) => p.title === "Museum date").id;
    P.update(id, { title: "Art museum date", details: "The new exhibit" });
    expect(P.all.value.find((p) => p.id === id).title).toBe("Art museum date");
    P.remove(id);
    expect(P.all.value.some((p) => p.id === id)).toBe(false);
  });

  it("stores optional linked ids", () => {
    const P = usePlans("Hithesh");
    P.create({ title: "Linked plan", linkedPlaceId: "place-1", linkedReminderId: "rem-1" });
    const p = P.all.value.find((x) => x.title === "Linked plan");
    expect(p.linkedPlaceId).toBe("place-1");
    expect(p.linkedReminderId).toBe("rem-1");
    expect(p.linkedWishId).toBeNull();
  });

  it("ignores creation with a blank title", () => {
    const P = usePlans("Hithesh");
    const before = P.all.value.length;
    P.create({ title: "   " });
    expect(P.all.value.length).toBe(before);
  });
});
