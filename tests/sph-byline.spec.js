import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import SphByline from "../src/components/ui/SphByline.vue";
import { actorName } from "../src/stores/us";

describe("SphByline", () => {
  afterEach(() => (actorName.value = null));

  it("names who added it, and says 'you' for your own items", () => {
    actorName.value = "Spoorthy";
    const w = mount(SphByline, { props: { item: { addedBy: "Hithesh" } } });
    expect(w.text()).toContain("added by Hithesh");
    expect(w.find(".byline").classes()).not.toContain("mine");
    actorName.value = "Hithesh";
    return w.vm.$nextTick().then(() => {
      expect(w.text()).toContain("added by you");
      expect(w.find(".byline").classes()).toContain("mine");
    });
  });

  it("shows the editor only when someone else changed it last", () => {
    actorName.value = "Hithesh";
    const same = mount(SphByline, { props: { item: { addedBy: "Hithesh", updatedBy: "Hithesh" } } });
    expect(same.text()).not.toContain("edited");
    const other = mount(SphByline, { props: { item: { addedBy: "Hithesh", updatedBy: "Spoorthy" } } });
    expect(other.text()).toContain("edited by Spoorthy");
  });

  it("falls back to a reminder's owner and renders nothing for unstamped items", () => {
    expect(mount(SphByline, { props: { item: { ownerId: "Spoorthy" } } }).text()).toContain("added by Spoorthy");
    expect(
      mount(SphByline, { props: { item: {} } })
        .find(".byline")
        .exists(),
    ).toBe(false);
  });
});
