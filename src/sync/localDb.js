/* tiny key-value store on IndexedDB (room for photos, survives refresh),
   falling back to localStorage where IndexedDB isn't available (some private
   modes, old browsers, tests). Values are structured-cloned / JSON'd. */
const DB_NAME = "us-offline";
const STORE = "kv";
const LS_PREFIX = "us-kv-";

let dbPromise = null;
function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
  return dbPromise;
}

const tx = (db, mode, fn) =>
  new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req && req.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });

export async function kvGet(key) {
  const db = await open();
  if (db) {
    try {
      return await tx(db, "readonly", (s) => s.get(key));
    } catch (e) {}
  }
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw == null ? undefined : JSON.parse(raw);
  } catch (e) {
    return undefined;
  }
}

export async function kvSet(key, value) {
  const db = await open();
  if (db) {
    try {
      // plain JSON copy: strips Vue proxies so structured clone can't choke
      await tx(db, "readwrite", (s) => s.put(JSON.parse(JSON.stringify(value)), key));
      return true;
    } catch (e) {}
  }
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

export async function kvDel(key) {
  const db = await open();
  if (db) {
    try {
      await tx(db, "readwrite", (s) => s.delete(key));
    } catch (e) {}
  }
  try {
    localStorage.removeItem(LS_PREFIX + key);
  } catch (e) {}
}
