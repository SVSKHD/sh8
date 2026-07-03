import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import FloatingLoveField from "../src/components/ui/FloatingLoveField.vue";

describe("FloatingLoveField", () => {
  it("renders `count` elements", () => {
    const w = mount(FloatingLoveField, { props: { count: 12 } });
    expect(w.findAll(".flf-item").length).toBe(12);
  });

  it("only uses the requested shapes", () => {
    const w = mount(FloatingLoveField, { props: { count: 20, shapes: ["heart"] } });
    const paths = w.findAll(".flf-item path");
    const heartD =
      "M12 21s-1-.7-3.2-2.6C5.9 15.4 3 12.9 3 9.5 3 7 5 5 7.5 5c1.6 0 3.1.8 4.5 2.6C13.4 5.8 14.9 5 16.5 5 19 5 21 7 21 9.5c0 3.4-2.9 5.9-5.8 8.9C13 20.3 12 21 12 21z";
    expect(paths.every((p) => p.attributes("d") === heartD)).toBe(true);
  });

  it("colors elements from the theme, never a hardcoded hex", () => {
    const w = mount(FloatingLoveField, { props: { count: 6, themeColor: "#1f8fa8" } });
    const fills = w.findAll(".flf-item path").map((p) => p.attributes("fill"));
    expect(fills.every((f) => f.startsWith("rgb("))).toBe(true);
  });

  it("is stable across re-renders (same seeded layout, no flicker)", () => {
    const w = mount(FloatingLoveField, { props: { count: 8 } });
    const first = w.findAll(".flf-item").map((el) => el.attributes("style"));
    w.vm.$forceUpdate();
    const second = w.findAll(".flf-item").map((el) => el.attributes("style"));
    expect(first).toEqual(second);
  });

  it("switches blend mode with mode: brightens (screen) on dark, tints (multiply) on light", () => {
    const light = mount(FloatingLoveField, { props: { mode: "light" } });
    expect(light.find(".floating-love-field").attributes("style")).toContain("mix-blend-mode: multiply");
    const dark = mount(FloatingLoveField, { props: { mode: "dark" } });
    expect(dark.find(".floating-love-field").attributes("style")).toContain("mix-blend-mode: screen");
  });

  it("renders nothing with count 0", () => {
    const w = mount(FloatingLoveField, { props: { count: 0 } });
    expect(w.findAll(".flf-item").length).toBe(0);
  });
});
