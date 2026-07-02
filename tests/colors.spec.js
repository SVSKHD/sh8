import { describe, expect, it } from "vitest";
import { luminance, parseColor, shade } from "../src/utils/colors";

describe("parseColor", () => {
  it("parses #rrggbb", () => {
    expect(parseColor("#fdf2f5")).toEqual({ r: 253, g: 242, b: 245 });
  });
  it("parses shorthand #rgb", () => {
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255 });
  });
  it("parses rgb()/rgba()", () => {
    expect(parseColor("rgb(18, 23, 42)")).toEqual({ r: 18, g: 23, b: 42 });
    expect(parseColor("rgba(18, 23, 42, 0.5)")).toEqual({ r: 18, g: 23, b: 42 });
  });
  it("returns null for junk", () => {
    expect(parseColor("")).toBeNull();
    expect(parseColor("nope")).toBeNull();
  });
});

describe("shade", () => {
  it("lightens toward white for positive amounts", () => {
    expect(shade("#808080", 0.5)).toBe("rgb(192, 192, 192)");
  });
  it("darkens toward black for negative amounts", () => {
    expect(shade("#808080", -0.5)).toBe("rgb(64, 64, 64)");
  });
  it("returns the original color for zero", () => {
    expect(shade("#e0526f", 0)).toBe("rgb(224, 82, 111)");
  });
  it("passes junk through untouched", () => {
    expect(shade("nope", 0.3)).toBe("nope");
  });
});

describe("luminance", () => {
  it("is bright for light backgrounds and dim for dark ones", () => {
    const light = luminance(parseColor("#fdf2f5")); // rose bg
    const dark = luminance(parseColor("#12172a")); // midnight bg
    expect(light).toBeGreaterThan(0.5);
    expect(dark).toBeLessThan(0.5);
  });
});
