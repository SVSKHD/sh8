/* Bridge between the theme system (CSS custom properties on <html data-theme>)
   and components that need raw color values as props. This is the single hook
   into the theme source, so visual layers stay theme-agnostic and reusable. */
import { onMounted, ref, watch } from "vue";
import { useUsStore } from "../stores/us";

export function useThemeColors() {
  const store = useUsStore();
  const bg = ref("#fdf2f5");
  const accent = ref("#e0526f");

  const read = () => {
    if (typeof document === "undefined") return;
    const cs = getComputedStyle(document.documentElement);
    const b = cs.getPropertyValue("--bg-base").trim();
    const a = cs.getPropertyValue("--accent").trim();
    if (b) bg.value = b;
    if (a) accent.value = a;
  };

  onMounted(read);
  /* re-read whenever the active theme changes (store.init sets data-theme) */
  watch(
    () => store.theme,
    () => {
      read();
      if (typeof requestAnimationFrame !== "undefined") requestAnimationFrame(read);
    },
  );

  return { bg, accent };
}
