/* Generic localStorage-backed draft — autosave scratch state that should
   survive a reload but never sync to the shared store (it's private,
   per-device work-in-progress, same rationale as the "us-user" session key
   not being synced). Follows the same try/catch localStorage pattern
   already used throughout the app (us.js, SphLockScreen.vue). */
export function useDraft(key) {
  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch (e) {
      return null;
    }
  };
  const save = (data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  };
  const clear = () => {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  };
  return { load, save, clear };
}
