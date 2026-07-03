import { describe, expect, it } from "vitest";
import { THEMES, themeMode } from "../src/themeRegistry";

describe("themeRegistry", () => {
  it("tags every theme with a light or dark mode", () => {
    expect(THEMES.length).toBeGreaterThan(0);
    for (const t of THEMES) {
      expect(["light", "dark"]).toContain(t.mode);
      expect(t.id).toBeTruthy();
      expect(t.label).toBeTruthy();
    }
  });

  it("has unique ids", () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes at least 4 dark themes and several light ones", () => {
    const dark = THEMES.filter((t) => t.mode === "dark");
    const light = THEMES.filter((t) => t.mode === "light");
    expect(dark.length).toBeGreaterThanOrEqual(4);
    expect(light.length).toBeGreaterThanOrEqual(8);
  });

  it("themeMode looks up a theme's mode by id", () => {
    expect(themeMode("rose")).toBe("light");
    expect(themeMode("midnight")).toBe("dark");
    expect(themeMode("eclipse")).toBe("dark");
    expect(themeMode("wine")).toBe("dark");
    expect(themeMode("periwinkle")).toBe("light");
    expect(themeMode("seafoam")).toBe("light");
  });

  it("defaults to light for an unknown theme id", () => {
    expect(themeMode("not-a-real-theme")).toBe("light");
  });
});
