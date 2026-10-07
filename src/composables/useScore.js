/* a small persisted scoreboard ({ [name]: number }) for the Games tab —
   per device, like the other UI prefs in localStorage */
import { ref, watch } from "vue";

export function useScore(key, keys) {
  const blank = () => Object.fromEntries(keys.map((k) => [k, 0]));
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(key) || "null");
  } catch (e) {}
  const score = ref(Object.assign(blank(), saved || {}));
  watch(
    score,
    (v) => {
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch (e) {}
    },
    { deep: true },
  );
  const bump = (k) => {
    score.value[k] = (score.value[k] || 0) + 1;
  };
  const reset = () => {
    score.value = blank();
  };
  return { score, bump, reset };
}
