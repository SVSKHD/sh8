import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SphTripStopsEditor from "../src/components/cards/SphTripStopsEditor.vue";
import SphPhotoCarousel from "../src/components/ui/SphPhotoCarousel.vue";
import { parseMapsLink } from "../src/mapsLink";
import { fmtDateRange, tripDays } from "../src/utils/dates";

describe("parseMapsLink", () => {
  it("reads the name and the pin's coordinates from a full place link", () => {
    const p = parseMapsLink(
      "https://www.google.com/maps/place/Baga+Beach/@15.5553,73.7517,15z/data=!4m6!3m5!1s0x3bbfea!8m2!3d15.5569!4d73.7519!16s",
    );
    expect(p).toMatchObject({ name: "Baga Beach", lat: 15.5569, lng: 73.7519, short: false, placeId: null });
  });

  it("decodes accented names and falls back to the map centre", () => {
    const p = parseMapsLink("https://www.google.co.in/maps/place/Sacr%C3%A9-C%C5%93ur/@48.8867,2.3431,17z");
    expect(p).toMatchObject({ name: "Sacré-Cœur", lat: 48.8867, lng: 2.3431 });
  });

  it("reads search links, including a place id", () => {
    const p = parseMapsLink("https://www.google.com/maps/search/?api=1&query=Fort+Aguada&query_place_id=ChIJabc123");
    expect(p).toMatchObject({ name: "Fort Aguada", placeId: "ChIJabc123" });
    expect(parseMapsLink("https://maps.google.com/?q=15.49,73.77")).toMatchObject({ name: "", lat: 15.49, lng: 73.77 });
  });

  it("flags short share links (nothing to read without a server)", () => {
    expect(parseMapsLink("https://maps.app.goo.gl/AbC123xyz")).toMatchObject({ short: true, name: "" });
    expect(parseMapsLink("https://goo.gl/maps/AbC123")).toMatchObject({ short: true });
  });

  it("accepts what the Maps app's Share copies: name + link on separate lines", () => {
    expect(parseMapsLink("Baga Beach\nhttps://maps.app.goo.gl/AbC123xyz")).toMatchObject({
      name: "Baga Beach",
      short: true,
      url: "https://maps.app.goo.gl/AbC123xyz",
    });
    // a one-line input strips the newline on paste
    expect(parseMapsLink("Baga Beachhttps://maps.app.goo.gl/AbC123xyz")).toMatchObject({ name: "Baga Beach", short: true });
  });

  it("accepts links without https:// and Google's newer share hosts", () => {
    expect(parseMapsLink("maps.app.goo.gl/AbC123")).toMatchObject({ short: true, url: "https://maps.app.goo.gl/AbC123" });
    expect(parseMapsLink("www.google.com/maps/place/Baga+Beach/@15.5,73.7,15z")).toMatchObject({ name: "Baga Beach" });
    expect(parseMapsLink("https://share.google/AbCdEf")).toMatchObject({ short: true });
    expect(parseMapsLink("https://g.co/kgs/AbCdEf")).toMatchObject({ short: true });
  });

  it("rejects anything that isn't Google Maps", () => {
    expect(parseMapsLink("https://example.com/maps/place/x")).toBeNull();
    expect(parseMapsLink("https://www.google.com/search?q=goa")).toBeNull();
    expect(parseMapsLink("not a url")).toBeNull();
  });
});

describe("trip date ranges", () => {
  it("formats compactly", () => {
    expect(fmtDateRange("2026-09-12", "2026-09-18")).toBe("Sep 12 – 18, 2026");
    expect(fmtDateRange("2026-09-28", "2026-10-03")).toBe("Sep 28 – Oct 3, 2026");
    expect(fmtDateRange("2025-12-30", "2026-01-02")).toBe("Dec 30, 2025 – Jan 2, 2026");
    expect(fmtDateRange("2026-09-12", "2026-09-12")).toBe("Sep 12, 2026");
    expect(fmtDateRange("2026-09-12", "")).toBe("Sep 12, 2026");
  });

  it("counts days inclusively", () => {
    expect(tripDays("2026-09-12", "2026-09-18")).toBe(7);
    expect(tripDays("2026-09-12", "2026-09-12")).toBe(1);
    expect(tripDays("2026-09-12", null)).toBe(1);
  });
});

describe("SphTripStopsEditor", () => {
  const last = (w) => {
    const e = w.emitted("update:modelValue");
    return e[e.length - 1][0];
  };
  const [linkSel, nameSel] = ['input[aria-label="Google Maps link"]', 'input[aria-label="Place name"]'];
  const addBtn = (w) => w.findAll("button").find((b) => b.text().includes("Add"));

  it("pasting a full Maps link fills the name, and Add saves the place", async () => {
    const w = mount(SphTripStopsEditor, { props: { modelValue: [] } });
    await w.find(linkSel).setValue("https://www.google.com/maps/place/Baga+Beach/@15.5553,73.7517,15z");
    expect(w.find(nameSel).element.value).toBe("Baga Beach");
    await addBtn(w).trigger("click");
    expect(last(w)).toEqual([
      expect.objectContaining({
        name: "Baga Beach",
        url: "https://www.google.com/maps/place/Baga+Beach/@15.5553,73.7517,15z",
        lat: 15.5553,
        lng: 73.7517,
      }),
    ]);
  });

  it("short links need a typed name; non-Maps links are refused", async () => {
    const w = mount(SphTripStopsEditor, { props: { modelValue: [] } });
    await w.find(linkSel).setValue("https://maps.app.goo.gl/AbC123");
    expect(w.text()).toContain("Type the place's name");
    expect(addBtn(w).attributes("disabled")).toBeDefined();
    await w.find(nameSel).setValue("Fort Aguada");
    expect(addBtn(w).attributes("disabled")).toBeUndefined();

    await w.find(linkSel).setValue("https://example.com/x");
    expect(w.text()).toContain("doesn't look like a Google Maps link");
    expect(addBtn(w).attributes("disabled")).toBeDefined();
  });

  it("Save adds a place left in the inputs; a link with no name holds the form open", async () => {
    const w = mount(SphTripStopsEditor, { props: { modelValue: [] } });
    await w.find(linkSel).setValue("Baga Beach\nhttps://maps.app.goo.gl/AbC123xyz");
    expect(w.find(nameSel).element.value).toBe("Baga Beach");
    expect(w.vm.commit()).toBe(true);
    expect(last(w)).toEqual([expect.objectContaining({ name: "Baga Beach", url: "https://maps.app.goo.gl/AbC123xyz" })]);

    const w2 = mount(SphTripStopsEditor, { props: { modelValue: [] } });
    await w2.find(linkSel).setValue("https://maps.app.goo.gl/NoName");
    expect(w2.vm.commit()).toBe(false);
    await w2.vm.$nextTick();
    expect(w2.find(".stops-add").classes()).toContain("attention");
    expect(w2.emitted("update:modelValue")).toBeUndefined();

    // nothing pending → nothing to do
    expect(mount(SphTripStopsEditor, { props: { modelValue: [] } }).vm.commit()).toBe(true);
  });

  it("the link box isn't a browser URL field (that would block the form's Save)", () => {
    const w = mount(SphTripStopsEditor, { props: { modelValue: [] } });
    expect(w.find(linkSel).attributes("type")).toBe("text");
  });

  it("removes and reorders places", async () => {
    const stops = [
      { id: "a", name: "Beach", url: "" },
      { id: "b", name: "Fort", url: "" },
    ];
    const w = mount(SphTripStopsEditor, { props: { modelValue: stops } });
    await w.find('[aria-label="Move Fort up"]').trigger("click");
    expect(last(w).map((s) => s.id)).toEqual(["b", "a"]);
    await w.find('[aria-label="Remove Beach"]').trigger("click");
    expect(last(w).map((s) => s.id)).toEqual(["b"]);
  });
});

describe("SphPhotoCarousel", () => {
  const slides = [
    { src: "a.jpg", alt: "a", caption: "Beach", credit: "Asha", creditUrl: "https://x.test/asha" },
    { src: "b.jpg", alt: "b" },
    { src: "c.jpg", alt: "c" },
  ];

  it("renders a slide per photo with dots, caption and photographer credit", () => {
    const w = mount(SphPhotoCarousel, { props: { slides, source: "Google Maps" } });
    expect(w.findAll(".car-slide")).toHaveLength(3);
    expect(w.findAll(".car-dot")).toHaveLength(3);
    expect(w.find(".car-title").text()).toBe("Beach");
    expect(w.find(".car-credit").attributes("href")).toBe("https://x.test/asha");
    expect(w.find(".car-source").text()).toBe("Google Maps");
  });

  it("dots jump to a slide", async () => {
    const w = mount(SphPhotoCarousel, { props: { slides } });
    w.find(".car-track").element.scrollTo = () => {};
    await w.findAll(".car-dot")[2].trigger("click");
    expect(w.findAll(".car-dot")[2].classes()).toContain("on");
  });

  it("shows a loading shimmer, then a placeholder when there are no photos", () => {
    expect(
      mount(SphPhotoCarousel, { props: { slides: [], loading: true } })
        .find(".car-skeleton")
        .exists(),
    ).toBe(true);
    const empty = mount(SphPhotoCarousel, { props: { slides: [], emptyLabel: "nothing here" } });
    expect(empty.text()).toContain("nothing here");
  });
});
