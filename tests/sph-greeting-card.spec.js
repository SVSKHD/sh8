import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SphGreetingCard from "../src/components/SphGreetingCard.vue";
import { LOVE_QUOTES } from "../src/quotes";

describe("SphGreetingCard", () => {
  it("greets the user by name", () => {
    const w = mount(SphGreetingCard, { props: { user: { name: "Hithesh", pet: "cuore mio" } } });
    expect(w.text().toLowerCase()).toContain("hithesh");
  });

  it("shows one love quote from the shared set, frozen for the session", () => {
    const w = mount(SphGreetingCard, { props: { user: { name: "Hithesh", pet: "cuore mio" } } });
    const shown = LOVE_QUOTES.some((q) => w.text().includes(q.text));
    expect(shown).toBe(true);
  });

  it("keeps the same quote across re-renders (not cycling)", async () => {
    const w = mount(SphGreetingCard, { props: { user: { name: "Hithesh", pet: "cuore mio" } } });
    const first = w.find(".greet-love-quote").text();
    await w.setProps({ user: { name: "Hithesh", pet: "cuore mio" } });
    expect(w.find(".greet-love-quote").text()).toBe(first);
  });
});
