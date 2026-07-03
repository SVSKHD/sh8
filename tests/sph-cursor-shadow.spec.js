import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import SphCursorShadow from "../src/components/ui/SphCursorShadow.vue";

const move = (x, y) => window.dispatchEvent(new MouseEvent("pointermove", { clientX: x, clientY: y }));
const mm = (matches) => () => ({ matches, addListener() {}, removeListener() {} });

/* jsdom doesn't reliably support the TouchEvent constructor; a plain Event
   with a manually-attached `touches` array is all the component reads */
const touch = (type, x, y) => {
  const e = new Event(type, { bubbles: true, cancelable: true });
  e.touches = [{ clientX: x, clientY: y }];
  window.dispatchEvent(e);
};

describe("SphCursorShadow", () => {
  afterEach(() => {
    window.matchMedia = mm(true); // restore the setup default (reduced motion)
  });

  it("defaults to a multiply blend and can switch to screen for dark themes", () => {
    const light = mount(SphCursorShadow);
    expect(light.find(".cursor-love").attributes("style")).toContain("mix-blend-mode: multiply");
    const dark = mount(SphCursorShadow, { props: { blendMode: "screen" } });
    expect(dark.find(".cursor-love").attributes("style")).toContain("mix-blend-mode: screen");
  });

  it("renders a glow tinted by the theme color", () => {
    const w = mount(SphCursorShadow, { props: { heartColor: "#1f8fa8", glowColor: "#1f8fa8" } });
    expect(w.find(".cl-glow").exists()).toBe(true);
    // jsdom normalizes the hex to rgb() in inline styles
    expect(w.find(".cl-glow").attributes("style")).toContain("rgb(31, 143, 168)");
  });

  it("spawns a cluster of theme-colored hearts as the pointer moves", async () => {
    window.matchMedia = mm(false);
    const w = mount(SphCursorShadow, { props: { heartColor: "#1f8fa8", clusterSize: 3, spawnDistance: 20 } });
    move(0, 0); // primes the last-spawn anchor, no cluster yet
    move(200, 200); // far enough → spawns
    await w.vm.$nextTick();
    const hearts = w.findAll(".cl-heart");
    expect(hearts.length).toBeGreaterThanOrEqual(3);
    // colored from the theme prop (shaded → rgb()), never a hardcoded hex pink
    expect(hearts[0].find("path").attributes("fill")).toMatch(/^rgb\(/);
  });

  it("does not spawn when the pointer barely moves (idle)", async () => {
    window.matchMedia = mm(false);
    const w = mount(SphCursorShadow, { props: { spawnDistance: 40 } });
    move(100, 100);
    move(105, 103); // under the threshold
    await w.vm.$nextTick();
    expect(w.findAll(".cl-heart").length).toBe(0);
  });

  it("respects reduced motion: keeps the glow, spawns no hearts", async () => {
    window.matchMedia = mm(true);
    const w = mount(SphCursorShadow);
    move(0, 0);
    move(300, 300);
    await w.vm.$nextTick();
    expect(w.findAll(".cl-heart").length).toBe(0);
    expect(w.find(".cl-glow").exists()).toBe(true);
  });

  it("caps live particles at maxParticles", async () => {
    window.matchMedia = mm(false);
    const w = mount(SphCursorShadow, { props: { clusterSize: 5, maxParticles: 12, spawnDistance: 10 } });
    let x = 0;
    for (let i = 0; i < 30; i++) {
      x += 40;
      move(x, 0);
    }
    await w.vm.$nextTick();
    expect(w.findAll(".cl-heart").length).toBeLessThanOrEqual(12);
  });

  it("removes its listeners on unmount", () => {
    const spy = vi.spyOn(window, "removeEventListener");
    const w = mount(SphCursorShadow);
    w.unmount();
    expect(spy).toHaveBeenCalledWith("pointermove", expect.any(Function));
    expect(spy).toHaveBeenCalledWith("touchstart", expect.any(Function));
    expect(spy).toHaveBeenCalledWith("touchmove", expect.any(Function));
    spy.mockRestore();
  });

  it("spawns a heart cluster and a themed ripple immediately on touchstart", async () => {
    window.matchMedia = mm(false);
    const w = mount(SphCursorShadow, { props: { heartColor: "#1f8fa8", rippleColor: "#1f8fa8", clusterSize: 3 } });
    touch("touchstart", 60, 60);
    await w.vm.$nextTick();
    expect(w.findAll(".cl-heart").length).toBeGreaterThanOrEqual(3);
    const ripples = w.findAll(".cl-ripple");
    expect(ripples.length).toBeGreaterThanOrEqual(1);
    // jsdom normalizes the hex to rgb() in inline styles
    expect(ripples[0].attributes("style")).toContain("rgb(31, 143, 168)");
  });

  it("keeps spawning ripples as a touch drags past the distance threshold", async () => {
    window.matchMedia = mm(false);
    const w = mount(SphCursorShadow, { props: { spawnDistance: 20 } });
    touch("touchstart", 0, 0);
    await w.vm.$nextTick();
    const afterStart = w.findAll(".cl-ripple").length;
    touch("touchmove", 200, 200);
    await w.vm.$nextTick();
    expect(w.findAll(".cl-ripple").length).toBeGreaterThan(afterStart);
  });

  it("does not spawn hearts or ripples on touchstart under reduced motion", async () => {
    window.matchMedia = mm(true);
    const w = mount(SphCursorShadow);
    touch("touchstart", 10, 10);
    await w.vm.$nextTick();
    expect(w.findAll(".cl-heart").length).toBe(0);
    expect(w.findAll(".cl-ripple").length).toBe(0);
  });

  it("caps live ripples at maxRipples", async () => {
    window.matchMedia = mm(false);
    const w = mount(SphCursorShadow, { props: { maxRipples: 4, spawnDistance: 10 } });
    touch("touchstart", 0, 0);
    let x = 0;
    for (let i = 0; i < 20; i++) {
      x += 30;
      touch("touchmove", x, 0);
    }
    await w.vm.$nextTick();
    expect(w.findAll(".cl-ripple").length).toBeLessThanOrEqual(4);
  });
});
