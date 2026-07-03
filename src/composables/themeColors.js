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

/* Draws the app's rounded-square heart glyph at `size` px onto an offscreen
   canvas and returns a PNG data URL — shared by the favicon (small, rounded)
   and the apple-touch-icon (larger, full-bleed square; iOS applies its own
   corner rounding, so no radius is drawn there). Returns null quietly if
   canvas 2D isn't available (e.g. jsdom in tests). */
function drawHeartIcon(color, size, radius) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const r = radius;
  ctx.fillStyle = color;
  if (r > 0) {
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.arcTo(size, 0, size, size, r);
    ctx.arcTo(size, size, 0, size, r);
    ctx.arcTo(0, size, 0, 0, r);
    ctx.arcTo(0, 0, size, 0, r);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, size, size);
  }
  ctx.fillStyle = "#fff7f9";
  ctx.font = Math.round(size * 0.625) + "px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("♥", size / 2, size / 2 + size * 0.03);
  return canvas.toDataURL("image/png");
}

/* live-tint the browser tab favicon to the theme's accent — genuinely
   reactive, unlike the static manifest icon (which the OS reads once at
   install time and can't be retinted after). */
function tintFavicon(color) {
  try {
    const link = document.getElementById("app-favicon");
    if (!link) return;
    const url = drawHeartIcon(color, 32, 7);
    if (url) link.href = url;
  } catch (e) {}
}

/* live-tint the apple-touch-icon (home-screen icon on iOS's own "Add to
   Home Screen" share-sheet preview) the same way. The manifest's own
   maskable icon stays a static file — only this <link> tag can be
   rewritten reactively. */
function tintAppleTouchIcon(color) {
  try {
    const link = document.getElementById("app-apple-touch-icon");
    if (!link) return;
    const url = drawHeartIcon(color, 180, 0);
    if (url) link.href = url;
  } catch (e) {}
}

/* Rewrite the <link rel="manifest"> to a Blob URL carrying the ACTIVE
   theme's colors, so `theme_color`/`background_color` (used for the splash
   screen and OS chrome once installed) track the current theme instead of
   the static file's rose default. Revokes the previous blob URL so this
   doesn't leak one per theme switch. */
let lastManifestUrl = null;
let baseManifestPromise = null;
async function updateManifest(bg, accent) {
  try {
    const link = document.getElementById("app-manifest");
    if (!link) return;
    if (!baseManifestPromise) baseManifestPromise = fetch("/manifest.webmanifest").then((r) => r.json());
    const base = await baseManifestPromise;
    const manifest = { ...base, theme_color: accent, background_color: bg };
    const url = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: "application/json" }));
    link.href = url;
    if (lastManifestUrl) URL.revokeObjectURL(lastManifestUrl);
    lastManifestUrl = url;
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
    tintAppleTouchIcon(accent.value);
    updateManifest(bg.value, accent.value);
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
