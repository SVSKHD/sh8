/* Firebase init — reads config from Vite env vars.
   Leave them unset and the app runs fully on localStorage instead. */
import { initializeApp } from "firebase/app";
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled = !!(cfg.apiKey && cfg.projectId && cfg.appId);

let db = null;
if (firebaseEnabled) {
  const app = initializeApp(cfg);
  try {
    // offline-first cache keeps reads instant and survives refreshes
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch (e) {
    db = getFirestore(app);
  }
  // e.g. VITE_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 for local development
  const emu = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST;
  if (emu) {
    const [host, port] = emu.split(":");
    connectFirestoreEmulator(db, host, Number(port));
  }
}

export { db };
