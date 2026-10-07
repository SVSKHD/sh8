import { describe, expect, it } from "vitest";
import { drawPrompt, HEAT_LEVELS, PROMPTS } from "../src/spicyPrompts";

describe("After Dark prompts", () => {
  it("has truths and dares for every heat level", () => {
    for (const { id } of HEAT_LEVELS) {
      expect(PROMPTS[id].truth.length).toBeGreaterThanOrEqual(10);
      expect(PROMPTS[id].dare.length).toBeGreaterThanOrEqual(10);
    }
  });

  it("never repeats a card until the pool runs out, then reshuffles", () => {
    const used = new Set();
    const pool = PROMPTS.spicy.dare;
    const drawn = pool.map(() => drawPrompt("spicy", "dare", used));
    expect(new Set(drawn).size).toBe(pool.length);
    expect(pool).toContain(drawPrompt("spicy", "dare", used));
  });
});
