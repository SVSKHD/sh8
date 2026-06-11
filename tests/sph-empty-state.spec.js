import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SphEmptyState from "../src/components/ui/SphEmptyState.vue";

describe("SphEmptyState", () => {
  it("renders defaults", () => {
    const w = mount(SphEmptyState);
    expect(w.text()).toContain("Nothing here yet.");
    expect(w.text()).toContain("Tap the + to add the first one.");
  });

  it("renders custom emoji, message and hint", () => {
    const w = mount(SphEmptyState, { props: { emoji: "💌", message: "Empty inbox.", hint: "Write one." } });
    expect(w.text()).toContain("💌");
    expect(w.text()).toContain("Empty inbox.");
    expect(w.text()).toContain("Write one.");
  });
});
