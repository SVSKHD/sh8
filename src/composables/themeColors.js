/* Bridge between the theme system (CSS custom properties on <html data-theme>)
   and components that need raw color values as props. This is the single hook
   into the theme source, so visual layers stay theme-agnostic and reusable. */
import { computed, onMounted, ref, watch } from "vue";
import { useUsStore } from "../stores/us";
import { themeMode } from "../themeRegistry";

/* live-update <meta name="theme-color"> to match the page background — the
   standard way browsers blend mobile chrome (address bar, task switcher)
   with the visible page. */
function syncMetaThemeColor(color) {
  try {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = color;
  } catch (e) {}
}

/* live-tint the browser tab favicon to the theme's accent via an offscreen
   canvas + data URL — genuinely reactive, unlike the static manifest icon
   (which the OS reads once at install time and can't be retinted after).
   No-ops quietly if canvas 2D isn't available (e.g. jsdom in tests). */
function tintFavicon(color) {
  try {
    const link = document.getElementById("app-favicon");
    if (!link) return;
    const size = 32;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const r = 7;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.arcTo(size, 0, size, size, r);
    ctx.arcTo(size, size, 0, size, r);
    ctx.arcTo(0, size, 0, 0, r);
    ctx.arcTo(0, 0, size, 0, r);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff7f9";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("♥", size / 2, size / 2 + 1);
    link.href = canvas.toDataURL("image/png");
  } catch (e) {}
}

export function useThemeColors() {
  const store = useUsStore();
  const bg = ref("#fdf2f5");
  const accent = ref("#e0526f");
  const mode = computed(() => themeMode(store.theme));

  const read = () => {
    if (typeof document === "undefined") return;
    const cs = getComputedStyle(document.documentElement);
    const b = cs.getPropertyValue("--bg-base").trim();
    const a = cs.getPropertyValue("--accent").trim();
    if (b) bg.value = b;
    if (a) accent.value = a;
    syncMetaThemeColor(bg.value);
    tintFavicon(accent.value);
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

  return { bg, accent, mode };
}
