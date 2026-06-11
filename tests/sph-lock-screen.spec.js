import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SphLockScreen from "../src/components/SphLockScreen.vue";

const press = async (w, digits) => {
  for (const d of digits) {
    await w
      .findAll(".pad-key")
      .find((b) => b.text() === d)
      .trigger("click");
  }
};

describe("SphLockScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("unlocks Hithesh with 2607", async () => {
    const w = mount(SphLockScreen, { attachTo: document.body });
    await press(w, "2607");
    vi.advanceTimersByTime(300);
    expect(w.emitted("unlock")[0][0]).toMatchObject({ name: "Hithesh", pet: "cuore mio" });
    expect(sessionStorage.getItem("us-user")).toBe("Hithesh");
    w.unmount();
  });

  it("unlocks Spoorthy with 1710", async () => {
    const w = mount(SphLockScreen, { attachTo: document.body });
    await press(w, "1710");
    vi.advanceTimersByTime(300);
    expect(w.emitted("unlock")[0][0]).toMatchObject({ name: "Spoorthy", pet: "cuore mia" });
    w.unmount();
  });

  it("shakes and resets on a wrong code", async () => {
    const w = mount(SphLockScreen, { attachTo: document.body });
    await press(w, "0000");
    expect(w.find(".lock-card").classes()).toContain("shake");
    expect(w.emitted("unlock")).toBeUndefined();
    vi.advanceTimersByTime(500);
    await w.vm.$nextTick();
    expect(w.find(".lock-card").classes()).not.toContain("shake");
    expect(w.findAll(".pin-dot.filled")).toHaveLength(0);
    w.unmount();
  });

  it("accepts keyboard digits and backspace", async () => {
    const w = mount(SphLockScreen, { attachTo: document.body });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "2" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "9" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "6" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "0" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "7" }));
    vi.advanceTimersByTime(300);
    await w.vm.$nextTick();
    expect(w.emitted("unlock")[0][0]).toMatchObject({ name: "Hithesh" });
    w.unmount();
  });
});
