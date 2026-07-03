import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlaces } from "../src/composables/usePlaces";
import { useUsStore } from "../src/stores/us";

describe("usePlaces", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T09:00:00"));
  });

  it("seeds a mix of visited and not-visited places", () => {
    const P = usePlaces("Hithesh");
    expect(P.notVisited.value.length).toBeGreaterThan(0);
    expect(P.visited.value.length).toBeGreaterThan(0);
    expect(P.visited.value.every((p) => p.visited)).toBe(true);
    expect(P.notVisited.value.every((p) => !p.visited)).toBe(true);
  });

  it("creates a place attributed to the current user, starting not visited", () => {
    const P = usePlaces("Hithesh");
    const before = P.notVisited.value.length;
    P.create({ name: "Rome", note: "Trevi fountain at dawn" });
    expect(P.notVisited.value.length).toBe(before + 1);
    const p = P.notVisited.value.find((x) => x.name === "Rome");
    expect(p.addedBy).toBe("Hithesh");
    expect(p.visited).toBe(false);
    expect(p.visitedDate).toBeNull();
  });

  it("is shared/editable by both users — no ownership gate", () => {
    const owner = usePlaces("Hithesh");
    owner.create({ name: "Lisbon" });
    const id = owner.notVisited.value.find((p) => p.name === "Lisbon").id;
    const partner = usePlaces("Spoorthy");
    // the partner sees the same place and can toggle/edit/remove it
    expect(partner.notVisited.value.some((p) => p.id === id)).toBe(true);
    partner.toggleVisited(id);
    expect(owner.visited.value.some((p) => p.id === id)).toBe(true);
  });

  it("toggleVisited sets visitedDate to today, and clears it going back", () => {
    const P = usePlaces("Hithesh");
    P.create({ name: "Berlin" });
    const id = P.notVisited.value.find((p) => p.name === "Berlin").id;
    P.toggleVisited(id);
    let p = P.visited.value.find((x) => x.id === id);
    expect(p.visitedDate).toBe("2026-06-11");
    P.toggleVisited(id);
    p = P.notVisited.value.find((x) => x.id === id);
    expect(p.visitedDate).toBeNull();
  });

  it("sorts visited places by most recent visitedDate first", () => {
    const store = useUsStore();
    store.places = [];
    const P = usePlaces("Hithesh");
    P.create({ name: "Older" });
    P.create({ name: "Newer" });
    P.toggleVisited(P.notVisited.value.find((p) => p.name === "Older").id);
    P.toggleVisited(P.notVisited.value.find((p) => p.name === "Newer").id);
    store.updateItem("places", store.places.find((p) => p.name === "Older").id, { visitedDate: "2020-01-01" });
    const names = P.visited.value.map((p) => p.name);
    expect(names.indexOf("Newer")).toBeLessThan(names.indexOf("Older"));
  });

  it("sorts not-visited places by added order (oldest first)", () => {
    const store = useUsStore();
    store.places = [];
    const P = usePlaces("Hithesh");
    P.create({ name: "First" });
    vi.advanceTimersByTime(1000); // distinct createdAt, like two real user actions
    P.create({ name: "Second" });
    const names = P.notVisited.value.map((p) => p.name);
    expect(names.indexOf("First")).toBeLessThan(names.indexOf("Second"));
  });

  it("edits and removes a place", () => {
    const P = usePlaces("Hithesh");
    P.create({ name: "Athens" });
    const id = P.notVisited.value.find((p) => p.name === "Athens").id;
    P.update(id, { name: "Athens, Greece", note: "Acropolis at sunset" });
    expect(P.notVisited.value.find((p) => p.id === id).name).toBe("Athens, Greece");
    P.remove(id);
    expect(P.notVisited.value.some((p) => p.id === id)).toBe(false);
  });

  it("ignores creation with a blank name", () => {
    const P = usePlaces("Hithesh");
    const before = P.all.value.length;
    P.create({ name: "   " });
    expect(P.all.value.length).toBe(before);
  });
});
