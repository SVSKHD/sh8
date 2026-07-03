import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import SphWishForm from "../src/components/cards/SphWishForm.vue";

const typeInto = async (w, selector, value) => {
  const el = document.body.querySelector(selector);
  el.value = value;
  el.dispatchEvent(new Event("input"));
  await w.vm.$nextTick();
};
const clickByText = (text) => {
  [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes(text)).click();
};

describe("SphWishForm", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("titles the modal with the auto-derived recipient", () => {
    mount(SphWishForm, { props: { modelValue: true, wish: null, toName: "Spoorthy" } });
    expect(document.body.textContent).toContain("Schedule a wish for Spoorthy");
  });

  it("prefills from an existing wish when editing", () => {
    mount(SphWishForm, {
      props: {
        modelValue: true,
        wish: { message: "You mean the world to me", scheduledDate: "2026-07-20T18:30" },
        toName: "Spoorthy",
      },
    });
    expect(document.body.querySelector("textarea").value).toBe("You mean the world to me");
    expect(document.body.querySelector('input[type="datetime-local"]').value).toBe("2026-07-20T18:30");
  });

  it("saves with the recipient auto-attached, not user-entered", async () => {
    const w = mount(SphWishForm, { props: { modelValue: true, wish: null, toName: "Spoorthy" } });
    await typeInto(w, "textarea", "A little something for you");
    await typeInto(w, 'input[type="datetime-local"]', "2026-08-01T09:00");
    clickByText("Schedule ♥");
    await w.vm.$nextTick();
    expect(w.emitted("save")[0][0]).toEqual({
      to: "Spoorthy",
      message: "A little something for you",
      scheduledDate: "2026-08-01T09:00",
    });
  });

  it("disables save until both a message and a time are set", async () => {
    const w = mount(SphWishForm, { props: { modelValue: true, wish: null, toName: "Spoorthy" } });
    const submit = [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Schedule ♥"));
    expect(submit.disabled).toBe(true);
    await typeInto(w, "textarea", "hi");
    expect(submit.disabled).toBe(true); // still no date
    await typeInto(w, 'input[type="datetime-local"]', "2026-08-01T09:00");
    expect(submit.disabled).toBe(false);
  });
});
