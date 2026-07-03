import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SphWishItem from "../src/components/cards/SphWishItem.vue";

describe("SphWishItem", () => {
  it("shows the recipient, status, and message in sent view", () => {
    const w = mount(SphWishItem, {
      props: {
        item: {
          id: "w1",
          to: "Spoorthy",
          message: "You mean everything to me",
          scheduledDate: "2026-07-20T18:30",
          delivered: false,
        },
        view: "sent",
        canEdit: true,
      },
    });
    expect(w.text()).toContain("To Spoorthy");
    expect(w.text()).toContain("Scheduled");
    expect(w.text()).toContain("You mean everything to me");
  });

  it("shows the sender in received view", () => {
    const w = mount(SphWishItem, {
      props: {
        item: { id: "w2", from: "Hithesh", message: "Surprise!", scheduledDate: "2026-07-20T18:30", delivered: true },
        view: "received",
      },
    });
    expect(w.text()).toContain("From Hithesh");
    expect(w.text()).toContain("Delivered");
  });

  it("shows a synced chip when a calendar event exists", () => {
    const w = mount(SphWishItem, {
      props: { item: { id: "w3", to: "Spoorthy", message: "x", googleEventId: "evt1" }, view: "sent" },
    });
    expect(w.text()).toContain("Synced");
  });

  it("shows edit/cancel controls only when canEdit, else a delete control", async () => {
    const editable = mount(SphWishItem, {
      props: { item: { id: "w4", to: "Spoorthy", message: "x", delivered: false }, view: "sent", canEdit: true },
    });
    expect(editable.find('[aria-label="Edit wish"]').exists()).toBe(true);
    expect(editable.find('[aria-label="Cancel wish"]').exists()).toBe(true);
    expect(editable.find('[aria-label="Delete wish"]').exists()).toBe(false);

    const delivered = mount(SphWishItem, {
      props: { item: { id: "w5", to: "Spoorthy", message: "x", delivered: true }, view: "sent", canEdit: false },
    });
    expect(delivered.find('[aria-label="Edit wish"]').exists()).toBe(false);
    expect(delivered.find('[aria-label="Delete wish"]').exists()).toBe(true);

    await editable.find('[aria-label="Edit wish"]').trigger("click");
    await editable.find('[aria-label="Cancel wish"]').trigger("click");
    expect(editable.emitted("edit")).toBeTruthy();
    expect(editable.emitted("cancel")).toBeTruthy();

    await delivered.find('[aria-label="Delete wish"]').trigger("click");
    expect(delivered.emitted("remove")).toBeTruthy();
  });
});
