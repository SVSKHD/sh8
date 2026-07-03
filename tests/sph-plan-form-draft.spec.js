import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SphPlanForm from "../src/components/cards/SphPlanForm.vue";

/* SphGlassModal teleports to <body>, outside the mount wrapper's own root,
   so form content must be queried/interacted with via raw DOM (matching
   sph-glass-modal.spec.js's own approach) rather than VTU's find(). */
const titleInput = () => document.body.querySelectorAll("input.ginput")[0];
const typeTitle = async (w, value) => {
  const el = titleInput();
  el.value = value;
  el.dispatchEvent(new Event("input"));
  await w.vm.$nextTick();
};
const clickByText = (text) => {
  const btn = [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes(text));
  btn.click();
};

describe("SphPlanForm draft/resume", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("autosaves a debounced draft as the title is typed", async () => {
    const w = mount(SphPlanForm, { props: { modelValue: true, plan: null, userId: "Hithesh" } });
    await typeTitle(w, "Beach day");
    expect(localStorage.getItem("us-plan-draft-Hithesh")).toBeNull(); // not yet — still debouncing
    vi.advanceTimersByTime(800);
    await w.vm.$nextTick();
    expect(JSON.parse(localStorage.getItem("us-plan-draft-Hithesh")).title).toBe("Beach day");
  });

  it("offers to resume a draft the next time the form opens", async () => {
    localStorage.setItem("us-plan-draft-Hithesh", JSON.stringify({ title: "Beach day", details: "", date: "", status: "idea" }));
    const w = mount(SphPlanForm, { props: { modelValue: false, plan: null, userId: "Hithesh" } });
    await w.setProps({ modelValue: true });
    expect(document.body.textContent).toContain("unsaved plan draft");
    expect(document.body.textContent).toContain("Beach day");
  });

  it("resume fills the form fields from the draft", async () => {
    localStorage.setItem(
      "us-plan-draft-Hithesh",
      JSON.stringify({ title: "Beach day", details: "Sunscreen", date: "", status: "idea" }),
    );
    const w = mount(SphPlanForm, { props: { modelValue: true, plan: null, userId: "Hithesh" } });
    clickByText("Resume draft");
    await w.vm.$nextTick();
    expect(titleInput().value).toBe("Beach day");
  });

  it("discard clears the draft and shows a blank form", async () => {
    localStorage.setItem("us-plan-draft-Hithesh", JSON.stringify({ title: "Beach day" }));
    const w = mount(SphPlanForm, { props: { modelValue: true, plan: null, userId: "Hithesh" } });
    clickByText("Discard");
    await w.vm.$nextTick();
    expect(localStorage.getItem("us-plan-draft-Hithesh")).toBeNull();
    expect(titleInput().value).toBe("");
  });

  it("clears the draft once the plan is saved", async () => {
    const w = mount(SphPlanForm, { props: { modelValue: true, plan: null, userId: "Hithesh" } });
    await typeTitle(w, "Beach day");
    vi.advanceTimersByTime(800);
    await w.vm.$nextTick();
    expect(localStorage.getItem("us-plan-draft-Hithesh")).toBeTruthy();
    clickByText("Save ♥");
    await w.vm.$nextTick();
    expect(w.emitted("save")).toBeTruthy();
    expect(localStorage.getItem("us-plan-draft-Hithesh")).toBeNull();
  });

  it("does not autosave or prompt to resume when editing an existing plan", () => {
    localStorage.setItem("us-plan-draft-Hithesh", JSON.stringify({ title: "Some draft" }));
    mount(SphPlanForm, {
      props: { modelValue: true, plan: { id: "p1", title: "Real plan", status: "idea" }, userId: "Hithesh" },
    });
    // the resume prompt should not appear while editing, even though a draft exists
    expect(document.body.textContent).not.toContain("unsaved plan draft");
    expect(titleInput().value).toBe("Real plan");
  });
});
