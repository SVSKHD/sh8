import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SphGlassDatePicker from "../src/components/ui/SphGlassDatePicker.vue";
import SphGlassInput from "../src/components/ui/SphGlassInput.vue";

const last = (w) => {
  const e = w.emitted("update:modelValue");
  return e ? e[e.length - 1][0] : undefined;
};
const day = (w, ymd) => w.find(`[data-day="${ymd}"]`);

describe("SphGlassDatePicker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 10, 0)); // Wed 30 Sep 2026
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("shows the chosen date on the field, with a relative hint", () => {
    const w = mount(SphGlassDatePicker, { props: { modelValue: "2026-10-01", label: "Date" } });
    expect(w.find(".dp-value").text()).toBe("Thu, Oct 1, 2026");
    expect(w.find(".dp-rel").text()).toBe("tomorrow");
  });

  it("opens on the selected month and emits YYYY-MM-DD when a day is picked, then closes", async () => {
    const w = mount(SphGlassDatePicker, { props: { modelValue: "2026-07-20" } });
    await w.find(".dp-trigger").trigger("click");
    expect(w.find(".dp-title").text()).toContain("July 2026");
    expect(day(w, "2026-07-20").classes()).toContain("selected");
    await day(w, "2026-07-25").trigger("click");
    expect(last(w)).toBe("2026-07-25");
    expect(w.find(".dp-panel").exists()).toBe(false);
  });

  it("marks today, and quick picks set today / tomorrow", async () => {
    const w = mount(SphGlassDatePicker, { props: { modelValue: "" } });
    await w.find(".dp-trigger").trigger("click");
    expect(day(w, "2026-09-30").classes()).toContain("today");
    const tomorrow = w.findAll(".dp-chip").find((b) => b.text() === "Tomorrow");
    await tomorrow.trigger("click");
    expect(last(w)).toBe("2026-10-01");
  });

  it("moves between months and jumps via the month grid", async () => {
    const w = mount(SphGlassDatePicker, { props: { modelValue: "2026-09-10" } });
    await w.find(".dp-trigger").trigger("click");
    await w.find('[aria-label="Next month"]').trigger("click");
    expect(w.find(".dp-title").text()).toContain("October 2026");
    await w.find(".dp-title").trigger("click");
    await w.find('[aria-label="Next year"]').trigger("click");
    await w
      .findAll(".dp-month")
      .find((b) => b.text() === "Feb")
      .trigger("click");
    expect(w.find(".dp-title").text()).toContain("February 2027");
  });

  it("keyboard: arrows move the focused day, Enter picks it", async () => {
    const w = mount(SphGlassDatePicker, { props: { modelValue: "2026-09-10" }, attachTo: document.body });
    await w.find(".dp-trigger").trigger("click");
    const grid = w.find(".dp-grid");
    await grid.trigger("keydown", { key: "ArrowDown" }); // +7 → 17th
    await grid.trigger("keydown", { key: "ArrowRight" }); // +1 → 18th
    await grid.trigger("keydown", { key: "Enter" });
    expect(last(w)).toBe("2026-09-18");
    w.unmount();
  });

  it("Escape closes only the panel — the dialog's window listener never sees it", async () => {
    const onWindowKey = vi.fn();
    window.addEventListener("keydown", onWindowKey);
    const w = mount(SphGlassDatePicker, { props: { modelValue: "" }, attachTo: document.body });
    await w.find(".dp-trigger").trigger("click");
    w.find(".dp-panel").element.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await w.vm.$nextTick();
    expect(w.find(".dp-panel").exists()).toBe(false);
    expect(onWindowKey).not.toHaveBeenCalled();
    window.removeEventListener("keydown", onWindowKey);
    w.unmount();
  });

  it("clear empties the value", async () => {
    const w = mount(SphGlassDatePicker, { props: { modelValue: "2026-09-10" } });
    await w.find(".dp-clear").trigger("click");
    expect(last(w)).toBe("");
  });

  it("respects min / max", async () => {
    const w = mount(SphGlassDatePicker, { props: { modelValue: "2026-09-15", min: "2026-09-10", max: "2026-09-20" } });
    await w.find(".dp-trigger").trigger("click");
    expect(day(w, "2026-09-09").attributes("disabled")).toBeDefined();
    expect(day(w, "2026-09-21").attributes("disabled")).toBeDefined();
    expect(day(w, "2026-09-12").attributes("disabled")).toBeUndefined();
  });

  describe("with time", () => {
    it("keeps the time when changing the day, defaulting to 9:00 AM", async () => {
      const w = mount(SphGlassDatePicker, { props: { modelValue: "", withTime: true } });
      await w.find(".dp-trigger").trigger("click");
      await day(w, "2026-10-02").trigger("click");
      expect(last(w)).toBe("2026-10-02T09:00");
      // stays open so the time can be set
      expect(w.find(".dp-panel").exists()).toBe(true);
    });

    it("steps hours and 5-minute slots, and flips AM/PM", async () => {
      const w = mount(SphGlassDatePicker, { props: { modelValue: "2026-10-02T18:30", withTime: true } });
      expect(w.find(".dp-value").text()).toBe("Fri, Oct 2, 2026 · 06:30 PM");
      await w.find(".dp-trigger").trigger("click");
      await w.find('[aria-label="Hour up"]').trigger("click");
      expect(last(w)).toBe("2026-10-02T19:30");
      await w.setProps({ modelValue: "2026-10-02T23:55" });
      await w.find('[aria-label="Minutes up"]').trigger("click");
      expect(last(w)).toBe("2026-10-02T00:00");
      await w.setProps({ modelValue: "2026-10-02T18:30" });
      await w
        .findAll(".dp-ampm button")
        .find((b) => b.text() === "AM")
        .trigger("click");
      expect(last(w)).toBe("2026-10-02T06:30");
    });

    it("time presets set the clock", async () => {
      const w = mount(SphGlassDatePicker, { props: { modelValue: "2026-10-02T09:00", withTime: true } });
      await w.find(".dp-trigger").trigger("click");
      await w
        .findAll(".dp-chip")
        .find((b) => b.text() === "Evening")
        .trigger("click");
      expect(last(w)).toBe("2026-10-02T19:00");
    });
  });
});

describe("SphGlassInput routes date types to the glass picker", () => {
  it.each([
    ["date", false],
    ["datetime-local", true],
  ])("type=%s", (type, withTime) => {
    const w = mount(SphGlassInput, { props: { type, modelValue: "", label: "When" } });
    const picker = w.findComponent(SphGlassDatePicker);
    expect(picker.exists()).toBe(true);
    expect(picker.props("withTime")).toBe(withTime);
    expect(w.find("input").exists()).toBe(false);
  });

  it("still renders a normal text input", () => {
    const w = mount(SphGlassInput, { props: { type: "text", modelValue: "hi" } });
    expect(w.findComponent(SphGlassDatePicker).exists()).toBe(false);
    expect(w.find("input.ginput").element.value).toBe("hi");
  });
});
