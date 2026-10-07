/* durable outbox of Firestore writes that haven't been confirmed by the
   server yet. Every write is recorded here *before* it's sent and removed
   only once Firestore acknowledges it, so nothing is lost to a refresh, a
   crash, or a dropped connection — on the next boot / reconnect the store
   replays whatever is left.

   Entries are coalesced per document (latest wins; merges combine), which
   keeps replays idempotent and order-independent:
     { key, op: "set" | "merge" | "delete", coll, id, data, ts } */
import { kvGet, kvSet } from "./localDb";

const KV_KEY = "outbox";

export function createOutbox({ onChange = () => {} } = {}) {
  const entries = new Map();
  let seq = 0;
  // serialise saves so an older snapshot can never land after a newer one
  let saving = Promise.resolve();
  const persist = () => {
    const snapshot = Object.fromEntries(entries);
    saving = saving.then(() => kvSet(KV_KEY, snapshot)).catch(() => {});
    onChange(entries.size);
    return saving;
  };

  const ready = kvGet(KV_KEY)
    .then((saved) => {
      const before = entries.size;
      if (saved && typeof saved === "object") {
        Object.values(saved).forEach((e) => {
          // anything recorded since boot is newer than what was saved
          if (e && e.key && !entries.has(e.key)) entries.set(e.key, e);
        });
      }
      // writes made before the load finished overwrote the saved copy — re-save the union
      if (before && entries.size > before) persist();
      else onChange(entries.size);
    })
    .catch(() => {});

  const put = (op, coll, id, data) => {
    const key = coll + "/" + id;
    const prev = entries.get(key);
    const copy = data ? JSON.parse(JSON.stringify(data)) : null;
    const next =
      op === "merge" && prev && prev.op !== "delete"
        ? { ...prev, data: Object.assign({}, prev.data, copy) }
        : { key, op, coll, id, data: copy };
    next.ts = Date.now() + ++seq / 1000;
    entries.set(key, next);
    persist();
    return next;
  };

  /* drop an entry once the server has it — unless a newer write replaced it */
  const ack = (entry) => {
    const cur = entries.get(entry.key);
    if (cur && cur.ts === entry.ts) {
      entries.delete(entry.key);
      persist();
    }
  };

  const all = () => Array.from(entries.values());

  return {
    ready,
    put,
    ack,
    all,
    forColl: (coll) => all().filter((e) => e.coll === coll),
    get size() {
      return entries.size;
    },
    /* resolves once everything so far is on disk */
    saved: () => saving,
  };
}
