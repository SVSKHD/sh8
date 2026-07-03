/* Us — Pinia store. Synced to Firestore when Firebase is configured
   (every tab's data lives in an "sph"-prefixed collection), with a full
   localStorage fallback so the app works standalone too. */
import { collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, setDoc, writeBatch } from "firebase/firestore";
import { defineStore } from "pinia";
import { watchEffect } from "vue";
import { db } from "../firebase";
import { LIST_SEEDS, SEED_THEMES, uid } from "./seed";

const KEY = "us-app-v1";

/* every tab's Firestore collection is prefixed with "sph" */
export const SPH_PREFIX = "sph_";
export const sphCollection = (name) => SPH_PREFIX + name;

const LISTS = Object.keys(LIST_SEEDS);

function loadLocal() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch (e) {}
  const base = Object.assign({ theme: "rose", themes: { ...SEED_THEMES } }, JSON.parse(JSON.stringify(LIST_SEEDS)));
  const s = Object.assign(base, saved || {});
  // migrate old Me/You data to the two named users
  const NAME_MAP = { Me: "Hithesh", You: "Spoorthy" };
  s.tasks.forEach((t) => {
    if (NAME_MAP[t.assignee]) t.assignee = NAME_MAP[t.assignee];
  });
  s.messages.forEach((m) => {
    if (NAME_MAP[m.from]) m.from = NAME_MAP[m.from];
  });
  // migrate single shared theme -> per-user themes
  if (saved && saved.theme && !saved.themes) s.themes = { Hithesh: saved.theme, Spoorthy: saved.theme };
  return s;
}

function createInitialState() {
  if (!db) return loadLocal();
  // Firestore mode: lists fill from snapshots (offline cache makes this instant)
  return Object.assign({ theme: "rose", themes: { ...SEED_THEMES } }, Object.fromEntries(LISTS.map((l) => [l, []])));
}

/* one-time demo seed so every tab looks alive on a fresh project */
async function seedIfEmpty() {
  const metaRef = doc(db, sphCollection("meta"), "seed");
  if ((await getDoc(metaRef)).exists()) return;
  const batch = writeBatch(db);
  const now = Date.now();
  Object.entries(LIST_SEEDS).forEach(([list, items]) => {
    items.forEach((it, i) => batch.set(doc(db, sphCollection(list), it.id), Object.assign({ createdAt: now - i }, it)));
  });
  batch.set(doc(db, sphCollection("settings"), "themes"), { ...SEED_THEMES });
  batch.set(metaRef, { seededAt: now });
  await batch.commit();
}

export const useUsStore = defineStore("us", {
  state: createInitialState,

  actions: {
    init() {
      if (this._inited) return;
      this._inited = true;
      watchEffect(() => {
        document.documentElement.dataset.theme = this.theme;
      });
      if (db) this._bindFirestore();
      else
        this.$subscribe((_mutation, state) => {
          try {
            localStorage.setItem(KEY, JSON.stringify(state));
          } catch (e) {}
        });
    },

    _bindFirestore() {
      LISTS.forEach((list) => {
        const order = list === "messages" ? orderBy("ts") : orderBy("createdAt", "desc");
        onSnapshot(query(collection(db, sphCollection(list)), order), (snap) => {
          this[list] = snap.docs.map((d) => d.data());
        });
      });
      onSnapshot(doc(db, sphCollection("settings"), "themes"), (snap) => {
        if (snap.exists()) this.themes = Object.assign({}, this.themes, snap.data());
      });
      seedIfEmpty().catch(() => {});
    },

    /* local mutation happens first, so the UI never waits on the network */
    _write(list, item) {
      if (!db) return;
      setDoc(doc(db, sphCollection(list), item.id), JSON.parse(JSON.stringify(item))).catch(() => {});
    },
    _delete(list, id) {
      if (!db) return;
      deleteDoc(doc(db, sphCollection(list), id)).catch(() => {});
    },

    addItem(list, item) {
      const it = Object.assign({ id: uid(), createdAt: Date.now() }, item);
      this[list].unshift(it);
      this._write(list, it);
      return it;
    },
    addMessage(from, text) {
      const m = { id: uid(), from, text, ts: new Date().toISOString() };
      this.messages.push(m);
      this._write("messages", m);
    },
    removeItem(list, id) {
      const i = this[list].findIndex((x) => x.id === id);
      if (i > -1) this[list].splice(i, 1);
      this._delete(list, id);
    },
    /* generic patch: merge fields into an existing item and sync it */
    updateItem(list, id, patch) {
      const it = this[list].find((x) => x.id === id);
      if (!it) return null;
      Object.assign(it, patch);
      this._write(list, it);
      return it;
    },
    toggleFavorite(id) {
      const m = this.memories.find((x) => x.id === id);
      if (!m) return;
      m.favorite = !m.favorite;
      this._write("memories", m);
    },
    toggleTask(id) {
      const t = this.tasks.find((x) => x.id === id);
      if (!t) return false;
      t.done = !t.done;
      this._write("tasks", t);
      return t.done;
    },
    bumpGoal(id, delta) {
      const g = this.goals.find((x) => x.id === id);
      if (!g) return 0;
      g.progress = Math.max(0, Math.min(100, g.progress + delta));
      this._write("goals", g);
      return g.progress;
    },
    markVisited(id) {
      const i = this.wishlist.findIndex((x) => x.id === id);
      if (i === -1) return;
      const p = this.wishlist[i];
      this.wishlist.splice(i, 1);
      const v = {
        id: p.id,
        name: p.name,
        date: new Date().toISOString().slice(0, 10),
        rating: 5,
        story: p.note || "",
        createdAt: Date.now(),
      };
      this.visited.unshift(v);
      this._delete("wishlist", p.id);
      this._write("visited", v);
    },
    setTheme(themeId, userName) {
      this.theme = themeId;
      if (!userName) return;
      if (!this.themes) this.themes = {};
      this.themes[userName] = themeId;
      if (db) setDoc(doc(db, sphCollection("settings"), "themes"), { [userName]: themeId }, { merge: true }).catch(() => {});
    },
  },
});
