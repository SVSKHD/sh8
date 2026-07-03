import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SphWishForm from "../src/components/cards/SphWishForm.vue";

/* SphGlassModal teleports to <body>, outside the mount wrapper's own root,
   so form content must be queried/interacted with via raw DOM (matching
   sph-plan-form-draft.spec.js's own approach) rather than VTU's find(). */
const messageInput = () => document.body.querySelectorAll("textarea.ginput")[0];
const typeMessage = async (w, value) => {
  const el = messageInput();
  el.value = value;
  el.dispatchEvent(new Event("input"));
  await w.vm.$nextTick();
};
const clickByText = (text) => {
  const btn = [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes(text));
  btn.click();
};

describe("SphWishForm draft/resume", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("autosaves a debounced draft as the message is typed", async () => {
    const w = mount(SphWishForm, { props: { modelValue: true, wish: null, toName: "Spoorthy", userId: "Hithesh" } });
    await typeMessage(w, "Thinking of you");
    expect(localStorage.getItem("us-wish-draft-Hithesh")).toBeNull(); // not yet — still debouncing
    vi.advanceTimersByTime(800);
    await w.vm.$nextTick();
    expect(JSON.parse(localStorage.getItem("us-wish-draft-Hithesh")).message).toBe("Thinking of you");
  });

  it("offers to resume a draft the next time the form opens", async () => {
    localStorage.setItem("us-wish-draft-Hithesh", JSON.stringify({ message: "Thinking of you", scheduledDate: "" }));
    const w = mount(SphWishForm, { props: { modelValue: false, wish: null, toName: "Spoorthy", userId: "Hithesh" } });
    await w.setProps({ modelValue: true });
    expect(document.body.textContent).toContain("unsaved wish draft");
    expect(document.body.textContent).toContain("Thinking of you");
  });

  it("resume fills the form fields from the draft", async () => {
    localStorage.setItem(
      "us-wish-draft-Hithesh",
      JSON.stringify({ message: "Thinking of you", scheduledDate: "2026-08-01T10:00" }),
    );
    const w = mount(SphWishForm, { props: { modelValue: true, wish: null, toName: "Spoorthy", userId: "Hithesh" } });
    clickByText("Resume draft");
    await w.vm.$nextTick();
    expect(messageInput().value).toBe("Thinking of you");
  });

  it("discard clears the draft and shows a blank form", async () => {
    localStorage.setItem("us-wish-draft-Hithesh", JSON.stringify({ message: "Thinking of you" }));
    const w = mount(SphWishForm, { props: { modelValue: true, wish: null, toName: "Spoorthy", userId: "Hithesh" } });
    clickByText("Discard");
    await w.vm.$nextTick();
    expect(localStorage.getItem("us-wish-draft-Hithesh")).toBeNull();
    expect(messageInput().value).toBe("");
  });

  it("clears the draft once the wish is saved", async () => {
    const w = mount(SphWishForm, { props: { modelValue: true, wish: null, toName: "Spoorthy", userId: "Hithesh" } });
    await typeMessage(w, "Thinking of you");
    vi.advanceTimersByTime(800);
    await w.vm.$nextTick();
    expect(localStorage.getItem("us-wish-draft-Hithesh")).toBeTruthy();
    const dateInput = document.body.querySelectorAll("input.ginput")[0];
    dateInput.value = "2026-08-01T10:00";
    dateInput.dispatchEvent(new Event("input"));
    await w.vm.$nextTick();
    clickByText("Schedule ♥");
    await w.vm.$nextTick();
    expect(w.emitted("save")).toBeTruthy();
    expect(localStorage.getItem("us-wish-draft-Hithesh")).toBeNull();
  });

  it("does not autosave or prompt to resume when editing an existing wish", () => {
    localStorage.setItem("us-wish-draft-Hithesh", JSON.stringify({ message: "Some draft" }));
    mount(SphWishForm, {
      props: {
        modelValue: true,
        wish: { id: "w1", message: "Real wish", scheduledDate: "2026-08-01T10:00" },
        toName: "Spoorthy",
        userId: "Hithesh",
      },
    });
    // the resume prompt should not appear while editing, even though a draft exists
    expect(document.body.textContent).not.toContain("unsaved wish draft");
    expect(messageInput().value).toBe("Real wish");
  });
});
