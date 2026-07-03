import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SphPlanItem from "../src/components/cards/SphPlanItem.vue";

describe("SphPlanItem", () => {
  it("shows a plan's title, date, and attribution", () => {
    const w = mount(SphPlanItem, {
      props: { item: { id: "p1", title: "Rooftop picnic", date: "2026-07-18", status: "planned", addedBy: "Hithesh" } },
    });
    expect(w.text()).toContain("Rooftop picnic");
    expect(w.text()).toContain("Jul 18, 2026");
    expect(w.text()).toContain("added by Hithesh");
  });

  it("highlights the current status in the segmented control", () => {
    const w = mount(SphPlanItem, { props: { item: { id: "p2", title: "X", status: "planned" } } });
    const buttons = w.findAll(".seg button");
    const on = buttons.find((b) => b.classes().includes("on"));
    expect(on.text()).toBe("Planned");
  });

  it("shows linked-item chips when linked ids and names are provided", () => {
    const w = mount(SphPlanItem, {
      props: {
        item: { id: "p3", title: "X", status: "idea", linkedPlaceId: "pl1", linkedReminderId: "r1" },
        linkedNames: { place: "Kyoto", reminder: "Flowers" },
      },
    });
    expect(w.text()).toContain("linked: Kyoto");
    expect(w.text()).toContain("linked: Flowers");
  });

  it("emits edit, set-status, and remove", async () => {
    const item = { id: "p4", title: "X", status: "idea" };
    const w = mount(SphPlanItem, { props: { item } });
    await w.find('[aria-label="Edit plan"]').trigger("click");
    await w.find('[aria-label="Delete plan"]').trigger("click");
    await w.findAll(".seg button")[1].trigger("click"); // "Planned"
    expect(w.emitted("edit")).toBeTruthy();
    expect(w.emitted("remove")).toBeTruthy();
    expect(w.emitted("set-status")[0]).toEqual(["planned"]);
  });
});
