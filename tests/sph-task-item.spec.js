import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SphTaskItem from "../src/components/cards/SphTaskItem.vue";

const item = (over = {}) => ({ id: "t1", title: "Book dinner", forWhom: "Hithesh", due: "2026-06-20", done: false, ...over });

describe("SphTaskItem", () => {
  it("renders the title and due date", () => {
    const w = mount(SphTaskItem, { props: { item: item(), me: "Hithesh" } });
    expect(w.text()).toContain("Book dinner");
    expect(w.text()).toContain("due Jun 20, 2026");
  });

  it("shows a solid Me chip for your own tasks", () => {
    const w = mount(SphTaskItem, { props: { item: item(), me: "Hithesh" } });
    const chip = w.find(".chip");
    expect(chip.text()).toBe("Me");
    expect(chip.classes()).not.toContain("chip-outline");
  });

  it("shows the partner's name outlined for their tasks", () => {
    const w = mount(SphTaskItem, { props: { item: item({ forWhom: "Spoorthy" }), me: "Hithesh" } });
    const chip = w.find(".chip");
    expect(chip.text()).toBe("Spoorthy");
    expect(chip.classes()).toContain("chip-outline");
  });

  it("shows Both outlined when a task is for both of you", () => {
    const w = mount(SphTaskItem, { props: { item: item({ forWhom: "Both" }), me: "Hithesh" } });
    const chip = w.find(".chip");
    expect(chip.text()).toBe("Both");
    expect(chip.classes()).toContain("chip-outline");
  });

  it("emits toggle when the checkbox is pressed", async () => {
    const w = mount(SphTaskItem, { props: { item: item(), me: "Hithesh" } });
    await w.find(".task-check").trigger("click");
    expect(w.emitted("toggle")).toHaveLength(1);
  });

  it("strikes through completed tasks", () => {
    const w = mount(SphTaskItem, { props: { item: item({ done: true }), me: "Hithesh" } });
    expect(w.find(".task-title").classes()).toContain("done");
    expect(w.find(".task-check").classes()).toContain("done");
  });
});
