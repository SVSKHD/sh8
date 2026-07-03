import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { SPH_PREFIX, sphCollection, useUsStore } from "../src/stores/us";

describe("sph collection naming", () => {
  it("prefixes every collection with sph", () => {
    expect(SPH_PREFIX).toBe("sph_");
    for (const list of [
      "milestones",
      "memories",
      "gallery",
      "wishlist",
      "visited",
      "places",
      "plans",
      "wishes",
      "goals",
      "tasks",
      "reminders",
      "notes",
      "gratitudeForMe",
      "gratitudeForYou",
      "messages",
      "settings",
      "meta",
    ]) {
      expect(sphCollection(list)).toBe("sph_" + list);
    }
  });
});

describe("useUsStore (localStorage fallback)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setActivePinia(createPinia());
  });

  it("seeds every tab with demo data", () => {
    const store = useUsStore();
    expect(store.milestones.length).toBeGreaterThan(0);
    expect(store.memories.length).toBeGreaterThan(0);
    expect(store.wishlist.length).toBeGreaterThan(0);
    expect(store.visited.length).toBeGreaterThan(0);
    expect(store.places.length).toBeGreaterThan(0);
    expect(store.plans.length).toBeGreaterThan(0);
    expect(store.wishes).toEqual([]); // no demo wishes — private per-couple content, not seeded
    expect(store.goals.length).toBeGreaterThan(0);
    expect(store.tasks.length).toBeGreaterThan(0);
    expect(store.reminders.length).toBeGreaterThan(0);
    expect(store.notes.length).toBeGreaterThan(0);
    expect(store.gratitudeForMe.length).toBeGreaterThan(0);
    expect(store.gratitudeForYou.length).toBeGreaterThan(0);
    expect(store.gallery.length).toBeGreaterThan(0);
    expect(store.messages.length).toBeGreaterThan(0);
  });

  it("addItem unshifts with a generated id and createdAt", () => {
    const store = useUsStore();
    const before = store.notes.length;
    store.addItem("notes", { title: "t", body: "b", date: "2026-06-11" });
    expect(store.notes.length).toBe(before + 1);
    expect(store.notes[0].title).toBe("t");
    expect(store.notes[0].id).toBeTruthy();
    expect(store.notes[0].createdAt).toBeTypeOf("number");
  });

  it("addItem returns the created item", () => {
    const store = useUsStore();
    const created = store.addItem("notes", { title: "t", body: "b", date: "2026-06-11" });
    expect(created.title).toBe("t");
    expect(created.id).toBe(store.notes[0].id);
  });

  it("updateItem merges a patch and returns the updated item", () => {
    const store = useUsStore();
    const id = store.notes[0].id;
    const updated = store.updateItem("notes", id, { title: "changed" });
    expect(updated.title).toBe("changed");
    expect(store.notes[0].title).toBe("changed");
    expect(store.updateItem("notes", "nope", { title: "x" })).toBeNull();
  });

  it("removeItem deletes by id", () => {
    const store = useUsStore();
    const id = store.notes[0].id;
    const before = store.notes.length;
    store.removeItem("notes", id);
    expect(store.notes.length).toBe(before - 1);
    expect(store.notes.find((n) => n.id === id)).toBeUndefined();
  });

  it("addMessage appends to the end of the chat", () => {
    const store = useUsStore();
    store.addMessage("Hithesh", "hello love");
    const last = store.messages[store.messages.length - 1];
    expect(last.from).toBe("Hithesh");
    expect(last.text).toBe("hello love");
    expect(last.ts).toBeTruthy();
  });

  it("toggleFavorite flips a memory's favorite flag", () => {
    const store = useUsStore();
    const m = store.memories[0];
    const was = m.favorite;
    store.toggleFavorite(m.id);
    expect(store.memories[0].favorite).toBe(!was);
  });

  it("toggleTask flips done and returns the new value", () => {
    const store = useUsStore();
    const t = store.tasks.find((x) => !x.done);
    expect(store.toggleTask(t.id)).toBe(true);
    expect(store.toggleTask(t.id)).toBe(false);
  });

  it("bumpGoal clamps progress between 0 and 100", () => {
    const store = useUsStore();
    const g = store.goals[0];
    g.progress = 95;
    expect(store.bumpGoal(g.id, 10)).toBe(100);
    g.progress = 5;
    expect(store.bumpGoal(g.id, -10)).toBe(0);
  });

  it("markVisited moves a wishlist place into visited", () => {
    const store = useUsStore();
    const p = store.wishlist[0];
    const wishBefore = store.wishlist.length;
    const visitBefore = store.visited.length;
    store.markVisited(p.id);
    expect(store.wishlist.length).toBe(wishBefore - 1);
    expect(store.visited.length).toBe(visitBefore + 1);
    expect(store.visited[0].id).toBe(p.id);
    expect(store.visited[0].name).toBe(p.name);
    expect(store.visited[0].rating).toBe(5);
  });

  it("setTheme saves the choice to the user's own slot", () => {
    const store = useUsStore();
    store.setTheme("ocean", "Hithesh");
    expect(store.theme).toBe("ocean");
    expect(store.themes.Hithesh).toBe("ocean");
    store.setTheme("noir", "Spoorthy");
    expect(store.themes.Hithesh).toBe("ocean");
    expect(store.themes.Spoorthy).toBe("noir");
  });

  it("setEmail saves each user's Google account email to their own slot", () => {
    const store = useUsStore();
    expect(store.emails).toEqual({});
    store.setEmail("hithesh@example.com", "Hithesh");
    expect(store.emails.Hithesh).toBe("hithesh@example.com");
    store.setEmail("spoorthy@example.com", "Spoorthy");
    expect(store.emails.Hithesh).toBe("hithesh@example.com");
    expect(store.emails.Spoorthy).toBe("spoorthy@example.com");
  });

  it("persists state to localStorage after init", async () => {
    const store = useUsStore();
    store.init();
    store.addItem("notes", { title: "persisted", body: "x", date: "2026-06-11" });
    await nextTick(); // $subscribe flushes with the watcher queue
    const saved = JSON.parse(localStorage.getItem("us-app-v1"));
    expect(saved.notes[0].title).toBe("persisted");
  });

  it("applies the active theme to <html data-theme>", () => {
    const store = useUsStore();
    store.init();
    store.setTheme("golden", "Hithesh");
    return Promise.resolve().then(() => {
      expect(document.documentElement.dataset.theme).toBe("golden");
    });
  });

  it("applies the active theme's light/dark mode to <html data-mode>", () => {
    const store = useUsStore();
    store.init();
    store.setTheme("golden", "Hithesh");
    return Promise.resolve()
      .then(() => {
        expect(document.documentElement.dataset.mode).toBe("light");
        store.setTheme("eclipse", "Hithesh");
        return Promise.resolve();
      })
      .then(() => {
        expect(document.documentElement.dataset.mode).toBe("dark");
      });
  });
});
