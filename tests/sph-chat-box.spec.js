import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SphChatBox from "../src/components/cards/SphChatBox.vue";

const messages = [
  { id: "m1", from: "Spoorthy", text: "Movie night?", ts: "2026-06-09T19:42:00" },
  { id: "m2", from: "Hithesh", text: "Only if I pick", ts: "2026-06-09T19:44:00" },
];

describe("SphChatBox", () => {
  it("puts the logged-in user's messages on the right", () => {
    const w = mount(SphChatBox, { props: { items: messages, me: "Hithesh" } });
    const rows = w.findAll(".bubble-row");
    expect(rows[0].classes()).not.toContain("own");
    expect(rows[1].classes()).toContain("own");
    expect(rows[1].find(".bubble").classes()).toContain("own");
  });

  it("flips alignment for the other partner", () => {
    const w = mount(SphChatBox, { props: { items: messages, me: "Spoorthy" } });
    const rows = w.findAll(".bubble-row");
    expect(rows[0].classes()).toContain("own");
    expect(rows[1].classes()).not.toContain("own");
  });

  it("emits send with the trimmed text and clears the input", async () => {
    const w = mount(SphChatBox, { props: { items: messages, me: "Hithesh" } });
    const input = w.find("input");
    await input.setValue("  miss you  ");
    await w.find("form").trigger("submit");
    expect(w.emitted("send")[0]).toEqual(["miss you"]);
    expect(input.element.value).toBe("");
  });

  it("does not emit for empty messages", async () => {
    const w = mount(SphChatBox, { props: { items: messages, me: "Hithesh" } });
    await w.find("input").setValue("   ");
    await w.find("form").trigger("submit");
    expect(w.emitted("send")).toBeUndefined();
  });

  it("shows an empty state when there are no messages", () => {
    const w = mount(SphChatBox, { props: { items: [], me: "Hithesh" } });
    expect(w.text()).toContain("No messages yet.");
  });
});
