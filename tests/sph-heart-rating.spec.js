import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SphHeartRating from "../src/components/ui/SphHeartRating.vue";

describe("SphHeartRating", () => {
  it("renders five hearts and lights up to the model value", () => {
    const w = mount(SphHeartRating, { props: { modelValue: 3 } });
    const btns = w.findAll("button");
    expect(btns).toHaveLength(5);
    expect(btns.filter((b) => b.classes().includes("lit"))).toHaveLength(3);
    expect(btns.filter((b) => b.classes().includes("dim"))).toHaveLength(2);
  });

  it("emits update:modelValue when a heart is clicked", async () => {
    const w = mount(SphHeartRating, { props: { modelValue: 0 } });
    await w.findAll("button")[3].trigger("click");
    expect(w.emitted("update:modelValue")[0]).toEqual([4]);
  });

  it("does not emit when readonly", async () => {
    const w = mount(SphHeartRating, { props: { modelValue: 2, readonly: true } });
    await w.findAll("button")[4].trigger("click");
    expect(w.emitted("update:modelValue")).toBeUndefined();
  });
});
