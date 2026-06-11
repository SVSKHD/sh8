import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SphGlassCard from "../src/components/ui/SphGlassCard.vue";

describe("SphGlassCard", () => {
  it("renders slot content on a glass surface", () => {
    const w = mount(SphGlassCard, { slots: { default: "<p>hello</p>" } });
    expect(w.classes()).toContain("glass");
    expect(w.html()).toContain("hello");
  });

  it("applies hover and strong variants", () => {
    const w = mount(SphGlassCard, { props: { hover: true, strong: true } });
    expect(w.classes()).toContain("glass-hover");
    expect(w.classes()).toContain("glass-strong");
  });

  it("applies radius and padding props", () => {
    const w = mount(SphGlassCard, { props: { radius: "2rem", pad: "0.5rem" } });
    expect(w.attributes("style")).toContain("border-radius: 2rem");
    expect(w.attributes("style")).toContain("padding: 0.5rem");
  });
});
