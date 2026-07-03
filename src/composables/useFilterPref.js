/* Persisted per-person filter choice for a tab (Tasks/Reminders/Wishes/
   Plans) — private, per-device UI state, same localStorage try/catch
   pattern as useDraft.js. Keyed by list + user so each named user keeps
   their own last-picked filter on a shared device. */
import { ref, watch } from "vue";

export function useFilterPref(key, fallback) {
  let saved = null;
  try {
    saved = localStorage.getItem(key);
  } catch (e) {}
  const value = ref(saved || fallback);
  watch(value, (v) => {
    try {
      localStorage.setItem(key, v);
    } catch (e) {}
  });
  return value;
}
