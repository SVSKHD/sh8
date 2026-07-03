import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SphThemeSwitcher from "../src/components/ui/SphThemeSwitcher.vue";
import { THEMES } from "../src/themeRegistry";

describe("SphThemeSwitcher", () => {
  it("groups themes under Light and Dark headings", async () => {
    const w = mount(SphThemeSwitcher, { props: { modelValue: "rose" } });
    await w.find('[aria-label="Choose theme"]').trigger("click");
    expect(w.text()).toContain("Light");
    expect(w.text()).toContain("Dark");
    const lightCount = THEMES.filter((t) => t.mode === "light").length;
    const darkCount = THEMES.filter((t) => t.mode === "dark").length;
    expect(w.findAll('[role="option"]').length).toBe(lightCount + darkCount);
  });

  it("marks the active theme regardless of which section it's in", async () => {
    const w = mount(SphThemeSwitcher, { props: { modelValue: "eclipse" } });
    await w.find('[aria-label="Choose theme"]').trigger("click");
    const active = w.find(".theme-opt.active");
    expect(active.text()).toContain("Eclipse");
  });

  it("emits update:modelValue and closes on pick", async () => {
    const w = mount(SphThemeSwitcher, { props: { modelValue: "rose" } });
    await w.find('[aria-label="Choose theme"]').trigger("click");
    const wineOpt = w.findAll(".theme-opt").find((o) => o.text().includes("Midnight Wine"));
    await wineOpt.trigger("click");
    expect(w.emitted("update:modelValue")[0]).toEqual(["wine"]);
    expect(w.find('[role="listbox"]').exists()).toBe(false);
  });
});
