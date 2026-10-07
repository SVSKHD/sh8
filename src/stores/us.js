/* Us — Pinia store. Synced to Firestore when Firebase is configured
   (every tab's data lives in an "spl"-prefixed collection), with a full
   localStorage fallback so the app works standalone too.

   Offline-first in Firestore mode, three layers deep:
   1. Firestore's own persistent cache + write queue (IndexedDB)
   2. our durable outbox (src/sync/outbox.js): every write is recorded on
      the device before it's sent and only cleared once the server confirms
      it — replayed on reconnect and on the next boot, so a refresh or crash
      while offline never loses an edit
   3. an on-device mirror of every list, so a refresh with no network shows
      the last-known data even if Firestore's cache is unavailable
   Photos picked while offline are held as data URLs and uploaded to Cloud
   Storage (swapping in the real URL) once the connection is back. */
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { defineStore } from "pinia";
import { ref, watchEffect } from "vue";
import { db, storage } from "../firebase";
import { dataUrlToBlob, deleteImage, isDataUrl, uploadBlob } from "../media";
import { kvGet, kvSet } from "../sync/localDb";
import { createOutbox } from "../sync/outbox";
import { themeMode } from "../themeRegistry";
import { userId } from "../users";
import { LIST_NAMES, SEED_THEMES, uid } from "./seed";

const KEY = "us-app-v1";

/* every tab's Firestore collection is prefixed with "spl" */
export const SPL_PREFIX = "spl_";
export const splCollection = (name) => SPL_PREFIX + name;

const LISTS = LIST_NAMES;

function loadLocal() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch (e) {}
  // no demo content — tabs start empty until you add something
  const base = Object.assign(
    { theme: "rose", themes: { ...SEED_THEMES }, emails: {} },
    Object.fromEntries(LISTS.map((l) => [l, []])),
  );
  const s = Object.assign(base, saved || {});
  // migrate old Me/You data to the two named users
  const NAME_MAP = { Me: "Hithesh", You: "Spoorthy" };
  s.tasks.forEach((t) => {
    // legacy field name: tasks used to carry `assignee` — now `forWhom`,
    // consistent with the addedBy/forWhom pattern places/plans already use
    if (!t.forWhom && t.assignee) t.forWhom = t.assignee;
    if (NAME_MAP[t.forWhom]) t.forWhom = NAME_MAP[t.forWhom];
    if (!t.forWhom) t.forWhom = "Both";
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
  return Object.assign(
    {
      theme: "rose",
      themes: { ...SEED_THEMES },
      emails: {},
      syncing: true,
      syncError: false,
      lastSyncedAt: null,
      online: typeof navigator === "undefined" ? true : navigator.onLine !== false,
      pendingCount: 0,
    },
    Object.fromEntries(LISTS.map((l) => [l, []])),
  );
}

/* fields that may hold an uploaded photo URL (gallery `src`, places/plans
   `image`, milestones/memories `photo`) — cleaned out of Storage when the
   item is deleted or the photo is replaced */
const MEDIA_FIELDS = ["src", "image", "photo"];
const mediaUrls = (item) => MEDIA_FIELDS.map((k) => item && item[k]).filter((v) => typeof v === "string");

/* same order the Firestore queries use */
const sortList = (list, items) =>
  list === "messages"
    ? items.sort((a, b) => String(a.ts).localeCompare(String(b.ts)))
    : items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

/* sync internals — module scope (one store per app), deliberately not
   reactive state */
let outbox = null;
const inflight = new Set();
/* offline photos waiting for upload: "list/id/field" keys, persisted */
const pendingMedia = new Set();
let mediaBusy = false;
let mirrorTimer = null;
/* lists that have had a real Firestore snapshot (the mirror mustn't override them) */
const snapped = new Set();
/* whoever unlocked this device ({ id: dob, name }) — every record they add
   or change is stamped with it, so each of us can see who did what */
let actor = null;
/* reactive name of the unlocked person, so bylines can say "you" */
export const actorName = ref(null);

export const useUsStore = defineStore("us", {
  state: createInitialState,

  actions: {
    init() {
      if (this._inited) return;
      this._inited = true;
      watchEffect(() => {
        document.documentElement.dataset.theme = this.theme;
        if (this.theme !== "custom") document.documentElement.dataset.mode = themeMode(this.theme);
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
      outbox = createOutbox({ onChange: () => this._countPending() });
      let pending = LISTS.length + 2;
      const markLoaded = (error = false) => {
        if (error) this.syncError = true;
        pending -= 1;
        if (pending <= 0) {
          this.syncing = false;
          this.lastSyncedAt = Date.now();
        }
      };

      // on-device mirror first, so an offline refresh isn't empty
      kvGet("mirror")
        .then((m) => {
          if (!m) return;
          LISTS.forEach((list) => {
            if (!snapped.has(list) && Array.isArray(m[list])) this[list] = this._overlay(list, m[list]);
          });
          if (m.themes) this.themes = Object.assign({}, m.themes, this.themes);
          if (m.emails) this.emails = Object.assign({}, m.emails, this.emails);
        })
        .catch(() => {});

      this._listen(markLoaded);

      // keep the mirror current (debounced — it's a full copy)
      this.$subscribe(() => {
        clearTimeout(mirrorTimer);
        mirrorTimer = setTimeout(() => {
          const m = { themes: this.themes, emails: this.emails };
          LISTS.forEach((l) => (m[l] = this[l]));
          kvSet("mirror", m);
        }, 400);
      });

      // replay anything left over from last time, then again on every reconnect
      kvGet("pending-media")
        .then((keys) => (keys || []).forEach((k) => pendingMedia.add(k)))
        .catch(() => {})
        .then(() => outbox.ready)
        .then(() => {
          LISTS.forEach((list) => (this[list] = this._overlay(list, this[list].slice())));
          this._countPending();
          this.flush();
        });
      window.addEventListener("online", () => {
        this.online = true;
        this.flush();
      });
      window.addEventListener("offline", () => {
        this.online = false;
      });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && navigator.onLine !== false) this.flush();
      });
    },

    _listen(markLoaded) {
      LISTS.forEach((list) => {
        const order = list === "messages" ? orderBy("ts") : orderBy("createdAt", "desc");
        onSnapshot(
          query(collection(db, splCollection(list)), order),
          (snap) => {
            // an empty *cached* result while we already hold data means the
            // local cache just isn't available (e.g. private mode) — keep what
            // we have until the server answers
            if (snap.metadata.fromCache && snap.empty) {
              // …and it doesn't count as authoritative, so the mirror can still fill in
              if (this[list].length) return markLoaded();
            } else snapped.add(list);
            this[list] = this._overlay(
              list,
              snap.docs.map((d) => d.data()),
            );
            markLoaded();
          },
          () => markLoaded(true),
        );
      });
      onSnapshot(
        doc(db, splCollection("settings"), "themes"),
        (snap) => {
          if (snap.exists()) this.themes = Object.assign({}, this.themes, snap.data());
          markLoaded();
        },
        () => markLoaded(true),
      );
      onSnapshot(
        doc(db, splCollection("settings"), "emails"),
        (snap) => {
          if (snap.exists()) this.emails = Object.assign({}, this.emails, snap.data());
          markLoaded();
        },
        () => markLoaded(true),
      );
    },

    /* re-apply writes the server hasn't confirmed yet on top of incoming data,
       so a snapshot (or the mirror) can never roll back a local change */
    _overlay(list, items) {
      if (!outbox) return items;
      const pend = outbox.forColl(splCollection(list));
      if (!pend.length) return items;
      const byId = new Map(items.map((i) => [i.id, i]));
      pend.forEach((e) => {
        if (e.op === "delete") byId.delete(e.id);
        // copies: state items get mutated in place, outbox entries must not
        else if (e.op === "merge") byId.set(e.id, Object.assign({}, byId.get(e.id), JSON.parse(JSON.stringify(e.data))));
        else byId.set(e.id, JSON.parse(JSON.stringify(e.data)));
      });
      return sortList(list, Array.from(byId.values()));
    },

    _countPending() {
      this.pendingCount = (outbox ? outbox.size : 0) + pendingMedia.size;
    },

    _send(entry) {
      const tag = entry.key + "@" + entry.ts;
      if (inflight.has(tag)) return;
      inflight.add(tag);
      const ref = doc(db, entry.coll, entry.id);
      const p = entry.op === "delete" ? deleteDoc(ref) : setDoc(ref, entry.data, entry.op === "merge" ? { merge: true } : {});
      // resolves only once the server has the write (it waits out offline spells)
      p.then(() => outbox.ack(entry))
        .catch((err) => {
          const code = (err && err.code) || "";
          if (/permission-denied/.test(code)) {
            // rules not published / misconfigured: keep it queued, it's
            // re-sent on the next reconnect, foreground or launch
            console.warn("[spl] write rejected by Firestore rules:", entry.key);
            this.syncError = true;
          } else if (/invalid-argument|failed-precondition/.test(code)) {
            // malformed data: retrying won't help
            this.syncError = true;
            outbox.ack(entry);
          }
        })
        .finally(() => inflight.delete(tag));
    },

    /* push every unconfirmed write, then any offline photos */
    flush() {
      if (!db || !outbox) return;
      outbox.all().forEach((e) => this._send(e));
      this._syncMedia();
    },

    async _syncMedia() {
      if (!storage || mediaBusy || !pendingMedia.size || navigator.onLine === false) return;
      mediaBusy = true;
      try {
        for (const key of Array.from(pendingMedia)) {
          const [list, id, field] = key.split("/");
          const it = (this[list] || []).find((x) => x.id === id);
          const local = it && it[field];
          if (!isDataUrl(local)) {
            pendingMedia.delete(key);
            continue;
          }
          let url;
          try {
            url = await uploadBlob(await dataUrlToBlob(local), list);
          } catch (e) {
            break; // still offline / flaky — try again on the next reconnect
          }
          const cur = (this[list] || []).find((x) => x.id === id);
          if (cur && cur[field] === local) this.updateItem(list, id, { [field]: url });
          else deleteImage(url); // the photo was changed or removed meanwhile
          pendingMedia.delete(key);
        }
      } finally {
        mediaBusy = false;
        kvSet("pending-media", Array.from(pendingMedia));
        this._countPending();
      }
    },

    /* local mutation happens first, so the UI never waits on the network;
       the write is recorded in the outbox before it's sent */
    _queue(op, coll, id, data) {
      if (!db || !outbox) return;
      this._send(outbox.put(op, coll, id, data));
    },
    _write(list, item) {
      if (actor) Object.assign(item, { updatedBy: actor.name, updatedById: actor.id });
      if (!db) return;
      if (storage) {
        const offlinePhotos = MEDIA_FIELDS.filter((k) => isDataUrl(item[k]));
        if (offlinePhotos.length) {
          offlinePhotos.forEach((k) => pendingMedia.add(list + "/" + item.id + "/" + k));
          kvSet("pending-media", Array.from(pendingMedia));
          setTimeout(() => this._syncMedia(), 0);
        }
      }
      this._queue("set", splCollection(list), item.id, item);
    },
    _delete(list, id) {
      this._queue("delete", splCollection(list), id);
    },

    /* called on unlock (null on lock) */
    setActor(u) {
      actor = u ? { id: userId(u), name: u.name } : null;
      actorName.value = actor && actor.name;
    },

    addItem(list, item) {
      const by = actor ? { addedBy: actor.name, addedById: actor.id } : {};
      const it = Object.assign({ id: uid(), createdAt: Date.now() }, by, item);
      this[list].unshift(it);
      this._write(list, it);
      return it;
    },
    addMessage(from, text) {
      const m = { id: uid(), from, text, ts: new Date().toISOString() };
      if (actor) m.fromId = actor.id;
      this.messages.push(m);
      this._write("messages", m);
    },
    removeItem(list, id) {
      const i = this[list].findIndex((x) => x.id === id);
      if (i > -1) {
        mediaUrls(this[list][i]).forEach(deleteImage);
        this[list].splice(i, 1);
      }
      this._delete(list, id);
    },
    /* generic patch: merge fields into an existing item and sync it; a photo
       that the patch replaces or clears is deleted from Storage */
    updateItem(list, id, patch) {
      const it = this[list].find((x) => x.id === id);
      if (!it) return null;
      MEDIA_FIELDS.forEach((k) => {
        if (k in patch && it[k] !== patch[k] && typeof it[k] === "string") deleteImage(it[k]);
      });
      Object.assign(it, patch, { updatedAt: Date.now() });
      this._write(list, it);
      return it;
    },
    /* chat: only your own messages can be edited or deleted */
    editMessage(id, from, text) {
      const m = this.messages.find((x) => x.id === id);
      if (!m || m.from !== from || !text.trim()) return;
      m.text = text.trim();
      m.edited = true;
      this._write("messages", m);
    },
    removeMessage(id, from) {
      const m = this.messages.find((x) => x.id === id);
      if (!m || m.from !== from) return;
      this.removeItem("messages", id);
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
      const day = new Date().toISOString().slice(0, 10);
      const v = {
        id: p.id,
        name: p.name,
        date: day,
        dateFrom: day,
        dateTo: day,
        stops: [],
        rating: 5,
        story: p.note || "",
        photo: typeof p.photo === "string" ? p.photo : null,
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
      this._queue("merge", splCollection("settings"), "themes", { [userName]: themeId });
    },
    /* each user's own Google account email, entered once — used to invite
       them as an attendee when their partner sends a scheduled wish */
    setEmail(email, userName) {
      if (!userName) return;
      if (!this.emails) this.emails = {};
      this.emails[userName] = email;
      this._queue("merge", splCollection("settings"), "emails", { [userName]: email });
    },
  },
});
