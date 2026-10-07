#!/usr/bin/env node
/* Load / remove the example documents in firebase/sample-data.json.

     pnpm sample:import            add the samples (skips ones already there)
     pnpm sample:import --force    overwrite existing sample docs
     pnpm sample:clear             delete every doc whose id starts with "sample-"
     pnpm sample:import --dry-run  show what would happen, write nothing

   Uses the same Firebase web config as the app (.env.local / .env), so it
   writes exactly where the app reads. Only ids starting with "sample-" are
   ever written or deleted — your real data is never touched. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp } from "firebase/app";
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  terminate,
  writeBatch,
} from "firebase/firestore";
import { loadEnv, root } from "./env.mjs";

const PREFIX = "sample-";

const args = process.argv.slice(2);
const command = args[0];
const force = args.includes("--force");
const dryRun = args.includes("--dry-run");
if (!["import", "clear"].includes(command)) {
  console.log("usage: node scripts/sample-data.mjs <import|clear> [--force] [--dry-run]");
  process.exit(1);
}

const env = loadEnv();
const cfg = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};
if (!cfg.apiKey || !cfg.projectId || !cfg.appId) {
  console.error("Firebase isn't configured — copy .env.example to .env.local and fill in the VITE_FIREBASE_* values.");
  process.exit(1);
}

const data = JSON.parse(readFileSync(resolve(root, "firebase/sample-data.json"), "utf8"));
const app = initializeApp(cfg);
const db = getFirestore(app);
if (env.VITE_FIRESTORE_EMULATOR_HOST) {
  const [host, port] = env.VITE_FIRESTORE_EMULATOR_HOST.split(":");
  connectFirestoreEmulator(db, host, Number(port));
}
console.log(`${dryRun ? "[dry run] " : ""}${command} → project "${cfg.projectId}"`);

/* Firestore batches take at most 500 writes */
async function commitAll(ops) {
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    ops.slice(i, i + 450).forEach((op) => op(batch));
    await batch.commit();
  }
}

let total = 0;
const ops = [];
try {
  for (const [coll, { docs = [] }] of Object.entries(data.collections)) {
    if (command === "import") {
      let added = 0;
      for (const d of docs) {
        if (!String(d.id || "").startsWith(PREFIX)) {
          console.warn(`  skip ${coll}: id "${d.id}" must start with "${PREFIX}"`);
          continue;
        }
        const ref = doc(db, coll, d.id);
        if (!force && (await getDoc(ref)).exists()) continue;
        ops.push((b) => b.set(ref, d));
        added++;
      }
      if (added) console.log(`  ${coll}: +${added}`);
      total += added;
    } else {
      const snap = await getDocs(collection(db, coll));
      const samples = snap.docs.filter((d) => d.id.startsWith(PREFIX));
      samples.forEach((d) => ops.push((b) => b.delete(d.ref)));
      if (samples.length) console.log(`  ${coll}: −${samples.length}`);
      total += samples.length;
    }
  }
  if (!dryRun) await commitAll(ops);
  console.log(
    total ? `${dryRun ? "would " : ""}${command === "import" ? "write" : "delete"} ${total} sample doc(s).` : "nothing to do.",
  );
} catch (e) {
  console.error("failed:", e.code || "", e.message);
  if (/permission-denied/.test(e.code || ""))
    console.error("→ deploy firestore.rules first (firebase deploy --only firestore:rules).");
  process.exitCode = 1;
} finally {
  await terminate(db);
}
