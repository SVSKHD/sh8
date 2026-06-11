import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import SphGlassModal from "../src/components/ui/SphGlassModal.vue";

describe("SphGlassModal", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("teleports a dialog to body when open", () => {
    mount(SphGlassModal, { props: { modelValue: true, title: "Add a memory" } });
    const dialog = document.body.querySelector("[role=dialog]");
    expect(dialog).toBeTruthy();
    expect(dialog.textContent).toContain("Add a memory");
  });

  it("renders nothing when closed", () => {
    mount(SphGlassModal, { props: { modelValue: false, title: "Hidden" } });
    expect(document.body.querySelector("[role=dialog]")).toBeNull();
  });

  it("closes on Escape", () => {
    const w = mount(SphGlassModal, { props: { modelValue: true, title: "Esc" } });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(w.emitted("update:modelValue")[0]).toEqual([false]);
  });

  it("closes from the × button", async () => {
    const w = mount(SphGlassModal, { props: { modelValue: true, title: "X" } });
    document.body.querySelector("[aria-label=Close]").click();
    await w.vm.$nextTick();
    expect(w.emitted("update:modelValue")[0]).toEqual([false]);
  });
});
