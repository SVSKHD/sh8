/* read-aloud in dialogs — jsdom has no speech engine, so a fake one records
   what would be spoken */
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const spoken = [];
beforeEach(() => {
  spoken.length = 0;
  vi.resetModules();
  window.SpeechSynthesisUtterance = function (text) {
    this.text = text;
  };
  window.speechSynthesis = {
    getVoices: () => [],
    speak: (u) => spoken.push(u),
    cancel: vi.fn(),
  };
});
afterEach(() => {
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
  document.body.innerHTML = "";
});

const mountModal = async (props) => {
  const { default: SphGlassModal } = await import("../src/components/ui/SphGlassModal.vue");
  return mount(SphGlassModal, { props: { modelValue: true, title: "Note", ...props }, attachTo: document.body });
};
const speakBtn = () => document.body.querySelector('[aria-label="Read aloud"], [aria-label="Stop reading"]');

describe("read aloud", () => {
  it("has no speaker button without text (e.g. forms)", async () => {
    const w = await mountModal({});
    expect(speakBtn()).toBeNull();
    w.unmount();
  });

  it("reads the text without emoji, and the same button stops it", async () => {
    const w = await mountModal({ speak: "A wish from Hithesh 💌. Love you ❤️" });
    speakBtn().click();
    await w.vm.$nextTick();
    expect(spoken.map((u) => u.text)).toEqual(["A wish from Hithesh . Love you"]);
    expect(speakBtn().getAttribute("aria-label")).toBe("Stop reading");
    speakBtn().click();
    await w.vm.$nextTick();
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    expect(speakBtn().getAttribute("aria-label")).toBe("Read aloud");
    w.unmount();
  });

  it("stops reading when the dialog closes", async () => {
    const w = await mountModal({ speak: "hello" });
    speakBtn().click();
    window.speechSynthesis.cancel.mockClear();
    await w.setProps({ modelValue: false });
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    w.unmount();
  });
});
