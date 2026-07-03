import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { useThemeColors } from "../src/composables/themeColors";
import { useUsStore } from "../src/stores/us";

/* mount a tiny host component so the composable's onMounted/watch run in a
   real component lifecycle, matching how App.vue actually uses it */
function mountHost() {
  let result;
  const Host = {
    setup() {
      result = useThemeColors();
      return () => null;
    },
  };
  const wrapper = mount(Host);
  return { wrapper, result };
}

describe("useThemeColors mode", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it("derives mode from the active theme", async () => {
    const store = useUsStore();
    store.theme = "rose";
    const { result } = mountHost();
    expect(result.mode.value).toBe("light");
    store.theme = "eclipse";
    await Promise.resolve();
    expect(result.mode.value).toBe("dark");
  });

  it("exposes sane default colors even without a loaded stylesheet", () => {
    const { result } = mountHost();
    expect(result.bg.value).toBeTruthy();
    expect(result.accent.value).toBeTruthy();
  });

  it("live-updates the meta theme-color tag", () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
    mountHost();
    expect(meta.content).toBeTruthy();
    document.head.removeChild(meta);
  });

  it("does not throw when the meta tag or favicon link is missing (jsdom has no canvas 2D)", () => {
    expect(() => mountHost()).not.toThrow();
  });
});
