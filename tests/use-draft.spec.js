import { beforeEach, describe, expect, it } from "vitest";
import { useDraft } from "../src/composables/useDraft";

describe("useDraft", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when there's nothing saved", () => {
    const d = useDraft("us-plan-draft-test");
    expect(d.load()).toBeNull();
  });

  it("saves and loads a draft", () => {
    const d = useDraft("us-plan-draft-test");
    d.save({ title: "Beach day", details: "Bring sunscreen" });
    expect(d.load()).toEqual({ title: "Beach day", details: "Bring sunscreen" });
  });

  it("clears a saved draft", () => {
    const d = useDraft("us-plan-draft-test");
    d.save({ title: "X" });
    d.clear();
    expect(d.load()).toBeNull();
  });

  it("scopes drafts by key so different users/forms don't collide", () => {
    const a = useDraft("us-plan-draft-Hithesh");
    const b = useDraft("us-plan-draft-Spoorthy");
    a.save({ title: "A's draft" });
    b.save({ title: "B's draft" });
    expect(a.load().title).toBe("A's draft");
    expect(b.load().title).toBe("B's draft");
  });

  it("tolerates corrupted JSON without throwing", () => {
    localStorage.setItem("us-plan-draft-test", "{not valid json");
    const d = useDraft("us-plan-draft-test");
    expect(() => d.load()).not.toThrow();
    expect(d.load()).toBeNull();
  });
});
