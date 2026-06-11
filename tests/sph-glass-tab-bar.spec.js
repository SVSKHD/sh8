import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SphGlassTabBar from "../src/components/ui/SphGlassTabBar.vue";

const tabs = [
  { id: "one", icon: "Heart", label: "Hearts" },
  { id: "two", icon: "Calendar", label: "Dates" },
  { id: "three", icon: "MessageCircle", label: "Chat" },
];

describe("SphGlassTabBar", () => {
  it("renders a button per tab with its label tooltip", () => {
    const w = mount(SphGlassTabBar, { props: { tabs, modelValue: "one" } });
    const btns = w.findAll(".tab-btn");
    expect(btns).toHaveLength(3);
    expect(btns[1].find(".tab-tip").text()).toBe("Dates");
  });

  it("marks the active tab", () => {
    const w = mount(SphGlassTabBar, { props: { tabs, modelValue: "two" } });
    const active = w.findAll(".tab-btn.active");
    expect(active).toHaveLength(1);
    expect(active[0].attributes("aria-label")).toBe("Dates");
  });

  it("emits update:modelValue on click", async () => {
    const w = mount(SphGlassTabBar, { props: { tabs, modelValue: "one" } });
    await w.findAll(".tab-btn")[2].trigger("click");
    expect(w.emitted("update:modelValue")[0]).toEqual(["three"]);
  });
});
