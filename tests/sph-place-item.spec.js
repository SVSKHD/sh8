import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SphPlaceItem from "../src/components/cards/SphPlaceItem.vue";

describe("SphPlaceItem", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T09:00:00"));
  });
  afterEach(() => vi.useRealTimers());

  it("shows a not-visited place with a mark-visited action", () => {
    const w = mount(SphPlaceItem, {
      props: { item: { id: "p1", name: "Kyoto", note: "Cherry blossoms", visited: false, addedBy: "Hithesh" } },
    });
    expect(w.text()).toContain("Kyoto");
    expect(w.text()).toContain("Cherry blossoms");
    expect(w.text()).toContain("added by Hithesh");
    expect(w.text()).toContain("Mark as visited");
    expect(w.find(".chip").exists()).toBe(false); // no "visited" chip for a not-yet-visited place
  });

  it("shows a visited place with its date and an undo action", () => {
    const w = mount(SphPlaceItem, {
      props: { item: { id: "p2", name: "Paris", visited: true, visitedDate: "2023-05-19", addedBy: "Spoorthy" } },
    });
    expect(w.text()).toContain("Paris");
    expect(w.text()).toContain("visited");
    expect(w.text()).toContain("May 19, 2023");
    expect(w.text()).toContain("Mark as not visited");
  });

  it("renders the photo when an image is set", () => {
    const w = mount(SphPlaceItem, {
      props: { item: { id: "p3", name: "Rome", visited: false, image: "https://example.com/rome.jpg" } },
    });
    const img = w.find("img");
    expect(img.exists()).toBe(true);
    expect(img.attributes("src")).toBe("https://example.com/rome.jpg");
  });

  it("emits toggle-visited, edit and remove", async () => {
    const item = { id: "p4", name: "Berlin", visited: false };
    const w = mount(SphPlaceItem, { props: { item } });
    await w.find('[aria-label="Edit place"]').trigger("click");
    await w.find('[aria-label="Delete place"]').trigger("click");
    await w.get(".card-foot button").trigger("click");
    expect(w.emitted("edit")).toBeTruthy();
    expect(w.emitted("remove")).toBeTruthy();
    expect(w.emitted("toggle-visited")).toBeTruthy();
  });
});
