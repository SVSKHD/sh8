/* offline sync: the outbox must survive a "refresh" and be replayed until
   the server confirms each write. Firestore is mocked; jsdom has no
   IndexedDB, so this exercises the localStorage fallback of localDb. */
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const server = vi.hoisted(() => ({ writes: [], resolvers: [], auto: false }));

vi.mock("../src/firebase", () => ({ db: {}, storage: null, firebaseEnabled: true }));
vi.mock("firebase/firestore", () => {
  const send = (kind, ref, data) => {
    server.writes.push({ kind, path: ref.path, data });
    if (server.auto) return Promise.resolve();
    return new Promise((resolve) => server.resolvers.push(resolve));
  };
  return {
    collection: (_db, name) => ({ path: name }),
    doc: (_db, coll, id) => ({ path: coll + "/" + id }),
    query: (c) => c,
    orderBy: () => null,
    onSnapshot: () => () => {},
    setDoc: (ref, data) => send("set", ref, data),
    deleteDoc: (ref) => send("delete", ref),
  };
});

const flushAsync = () => new Promise((r) => setTimeout(r, 0));

async function freshStore() {
  vi.resetModules();
  setActivePinia(createPinia());
  const { useUsStore } = await import("../src/stores/us");
  const store = useUsStore();
  store.init();
  await flushAsync();
  await flushAsync();
  return store;
}

describe("createOutbox", () => {
  beforeEach(() => localStorage.clear());

  it("coalesces writes per document and drops only the confirmed version", async () => {
    const { createOutbox } = await import("../src/sync/outbox");
    const ob = createOutbox();
    await ob.ready;
    const a = ob.put("set", "spl_notes", "n1", { id: "n1", body: "one" });
    const b = ob.put("set", "spl_notes", "n1", { id: "n1", body: "two" });
    expect(ob.size).toBe(1);
    ob.ack(a); // stale ack — the newer write must stay queued
    expect(ob.size).toBe(1);
    ob.ack(b);
    expect(ob.size).toBe(0);
  });

  it("merges settings patches", async () => {
    const { createOutbox } = await import("../src/sync/outbox");
    const ob = createOutbox();
    await ob.ready;
    ob.put("merge", "spl_settings", "themes", { Hithesh: "rose" });
    ob.put("merge", "spl_settings", "themes", { Spoorthy: "ocean" });
    expect(ob.all()[0].data).toEqual({ Hithesh: "rose", Spoorthy: "ocean" });
  });

  it("persists across a reload", async () => {
    const { createOutbox } = await import("../src/sync/outbox");
    const ob = createOutbox();
    await ob.ready;
    ob.put("delete", "spl_tasks", "t1");
    await ob.saved();
    const again = createOutbox();
    await again.ready;
    expect(again.all().map((e) => e.key)).toEqual(["spl_tasks/t1"]);
  });
});

describe("store offline sync (Firestore mode)", () => {
  beforeEach(() => {
    localStorage.clear();
    server.writes = [];
    server.resolvers = [];
    server.auto = false;
  });

  it("queues a write, counts it as pending, and clears it once the server confirms", async () => {
    const store = await freshStore();
    store.addItem("notes", { body: "hello" });
    expect(store.notes[0].body).toBe("hello");
    expect(store.pendingCount).toBe(1);
    expect(server.writes[0]).toMatchObject({ kind: "set", data: { body: "hello" } });
    server.resolvers.forEach((r) => r());
    await flushAsync();
    expect(store.pendingCount).toBe(0);
  });

  it("survives a refresh while offline and replays the write on the next boot", async () => {
    const first = await freshStore();
    const note = first.addItem("notes", { body: "written offline" });
    first.removeItem("tasks", "gone-task");
    // never confirmed (offline) … then the page is refreshed
    await flushAsync();
    await flushAsync();
    server.writes = [];
    server.auto = true;

    const second = await freshStore();
    await flushAsync();
    const paths = server.writes.map((w) => w.kind + ":" + w.path).sort();
    expect(paths).toEqual(["delete:spl_tasks/gone-task", "set:spl_notes/" + note.id]);
    // the unconfirmed note is shown even though no snapshot has arrived
    expect(second.notes.map((n) => n.id)).toContain(note.id);
    await flushAsync();
    expect(second.pendingCount).toBe(0);
  });

  it("re-sends pending writes when the connection comes back", async () => {
    const store = await freshStore();
    store.addItem("notes", { body: "retry me" });
    const before = server.writes.length;
    // the first attempt is still hanging; a reconnect must not double-send it
    window.dispatchEvent(new Event("online"));
    expect(server.writes.length).toBe(before);
    expect(store.online).toBe(true);
  });
});
