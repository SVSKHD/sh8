import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoveQuotes from "../src/components/ui/LoveQuotes.vue";

describe("LoveQuotes", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("renders a quote from the built-in default set when none is provided", () => {
    const w = mount(LoveQuotes);
    expect(w.find(".love-quotes-card").exists()).toBe(true);
    expect(w.text().length).toBeGreaterThan(0);
  });

  it("renders a provided quote and its author", () => {
    const w = mount(LoveQuotes, { props: { quotes: [{ text: "hello love", author: "Us" }] } });
    expect(w.text()).toContain("hello love");
    expect(w.text()).toContain("Us");
  });

  it("cycles to the next quote after the interval elapses", async () => {
    const w = mount(LoveQuotes, {
      props: { quotes: [{ text: "first quote" }, { text: "second quote" }], interval: 5 },
    });
    expect(w.text()).toContain("first quote");
    vi.advanceTimersByTime(5000);
    await w.vm.$nextTick();
    expect(w.text()).toContain("second quote");
  });

  it("positions itself in the requested corner", () => {
    const w = mount(LoveQuotes, { props: { corner: "top-right" } });
    expect(w.find(".love-quotes").classes()).toContain("top-right");
  });

  it("is marked aria-hidden (decorative, non-blocking; pointer-events: none is declared in its scoped CSS)", () => {
    const w = mount(LoveQuotes);
    expect(w.find(".love-quotes").attributes("aria-hidden")).toBe("true");
  });

  it("stops its interval on unmount", () => {
    const spy = vi.spyOn(global, "clearInterval");
    const w = mount(LoveQuotes);
    w.unmount();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
