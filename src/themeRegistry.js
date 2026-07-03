/* Single source of truth for every theme: id, display label, light/dark
   mode, and the two swatch colors the theme picker previews. Components
   that need to know whether the ACTIVE theme is light or dark (cursor
   blend mode, ambient layers, native date pickers) read `themeMode()`
   rather than hardcoding theme ids — this is what lets new themes drop in
   without touching every mode-aware component. */
export const THEMES = [
  { id: "rose", label: "Rose Blush", mode: "light", a: "#e0526f", b: "#ffd2e1" },
  { id: "lavender", label: "Lavender Dream", mode: "light", a: "#8b5fd6", b: "#ddd0ff" },
  { id: "sunset", label: "Sunset Lovers", mode: "light", a: "#e8703f", b: "#ffd8b3" },
  { id: "ocean", label: "Ocean Hearts", mode: "light", a: "#1f8fa8", b: "#c2e6ee" },
  { id: "meadow", label: "Meadow Picnic", mode: "light", a: "#4f9c63", b: "#d2ecc6" },
  { id: "mocha", label: "Cozy Mocha", mode: "light", a: "#a4663f", b: "#e6d3bd" },
  { id: "cherry", label: "Cherry Soda", mode: "light", a: "#d23950", b: "#ffc7cc" },
  { id: "golden", label: "Golden Hour", mode: "light", a: "#c2861c", b: "#ffe2a6" },
  { id: "periwinkle", label: "Periwinkle Dusk", mode: "light", a: "#5b74d1", b: "#cdd6f7" },
  { id: "seafoam", label: "Seafoam Morning", mode: "light", a: "#2ea88c", b: "#b8ecda" },
  { id: "midnight", label: "Midnight Romance", mode: "dark", a: "#1c2440", b: "#e3a4b2" },
  { id: "noir", label: "Velvet Noir", mode: "dark", a: "#241a2e", b: "#c9a0dc" },
  { id: "eclipse", label: "Eclipse", mode: "dark", a: "#0f1626", b: "#7fb2e3" },
  { id: "wine", label: "Midnight Wine", mode: "dark", a: "#241017", b: "#d68a63" },
];

const MODE_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t.mode]));

export const themeMode = (id) => MODE_BY_ID[id] || "light";
