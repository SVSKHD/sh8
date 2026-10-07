import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SphLoveBook from "../src/components/SphLoveBook.vue";
import { BOOK_PAGES, buildLoveBook, checkinsFor, dancesByLetter, LOVE_LANGS } from "../src/loveBook";

describe("loveBook content", () => {
  const pages = buildLoveBook({ name: "Spoorthy", pet: "cuore mia", from: "Hithesh" });

  it("has exactly 100 pages: cover, love pages, finale", () => {
    expect(pages).toHaveLength(BOOK_PAGES);
    expect(pages[0]).toMatchObject({ kind: "cover", line: "Spoorthy's", foot: "with love, Hithesh" });
    expect(pages[99]).toMatchObject({ kind: "finale", line: "Happy birthday", sub: "Spoorthy" });
    expect(pages[99].foot).toContain("Hithesh");
  });

  it("says I love you in many languages, with milestones and pet-name pages", () => {
    const langs = new Set(pages.filter((p) => p.kind === "love").map((p) => p.lang));
    expect(langs.size).toBeGreaterThan(40);
    expect(langs).toContain("Telugu");
    expect(pages[50]).toMatchObject({ kind: "milestone", line: "Halfway" });
    expect(pages[50].sub).toContain("cuore mia");
    expect(pages[10]).toMatchObject({ line: "I love you", sub: "cuore mia" });
    expect(new Set(LOVE_LANGS.map(([l]) => l)).size).toBe(LOVE_LANGS.length); // no duplicate languages
  });

  it("dances Latin script by letter, other scripts by word", () => {
    expect(dancesByLetter("Je t'aime")).toBe(true);
    expect(dancesByLetter("Ég elska þig")).toBe(true);
    expect(dancesByLetter("నేను నిన్ను ప్రేమిస్తున్నాను")).toBe(false);
    expect(dancesByLetter("أحبك")).toBe(false);
  });
});

describe("check-ins", () => {
  it("has a question, two answers and a letter at pages 10, 20, 40 and 70", () => {
    const c = checkinsFor("Spoorthy");
    expect(Object.keys(c).map(Number)).toEqual([10, 20, 40, 70]);
    for (const page of [10, 20, 40, 70]) {
      expect(c[page].question, page).toBeTruthy();
      expect(c[page].answers.length, page).toBeGreaterThanOrEqual(2);
      for (const a of c[page].answers) expect(a.label && a.reply, page).toBeTruthy();
      expect(c[page].body.trim().length, page).toBeGreaterThan(0);
    }
  });
});

describe("SphLoveBook", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });
  const mountBook = () =>
    mount(SphLoveBook, {
      props: { modelValue: true, name: "Spoorthy", pet: "cuore mia", from: "Hithesh" },
      attachTo: document.body,
    });
  const count = () => document.body.querySelector(".lb-count").textContent;

  it("opens on the cover with dancing letters", () => {
    const w = mountBook();
    expect(count()).toBe("Page 1 of 100");
    expect(document.body.querySelector(".lb-front .lb-page.live")).not.toBeNull();
    expect(document.body.querySelectorAll(".lb-front .lb-ch").length).toBe("Spoorthy's".length);
    w.unmount();
  });

  /* advance time, answering every check-in on the way; returns the pages they appeared on */
  const readThrough = async (w, ms) => {
    const asked = [];
    for (let t = 0; t < ms; t += 500) {
      vi.advanceTimersByTime(500);
      await w.vm.$nextTick();
      const answerBtn = document.body.querySelector(".lb-answer");
      if (answerBtn) {
        asked.push(Number(count().match(/Page (\d+)/)[1]));
        answerBtn.click();
        await w.vm.$nextTick();
        [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Keep reading")).click();
        await w.vm.$nextTick();
      }
    }
    return asked;
  };

  it("turns pages on its own, stops for each check-in, and finishes on the finale", async () => {
    const w = mountBook();
    vi.advanceTimersByTime(4000);
    await w.vm.$nextTick();
    const early = Number(count().match(/Page (\d+)/)[1]);
    expect(early).toBeGreaterThan(1);
    const asked = await readThrough(w, 180000);
    expect(asked).toEqual([10, 20, 40, 70]);
    expect(count()).toBe("Page 100 of 100");
    expect(document.body.textContent.replace(/\u00a0/g, " ")).toContain("Happy birthday");
    expect(document.body.textContent).toContain("Read again");
    w.unmount();
  });

  it("check-in: waits on page 10, asks, then opens the letter for the chosen answer", async () => {
    const w = mountBook();
    for (let t = 0; t < 60000 && !document.body.querySelector(".lb-answer"); t += 250) {
      vi.advanceTimersByTime(250);
      await w.vm.$nextTick();
    }
    expect(count()).toBe("Page 10 of 100");
    const ask = document.body.querySelector(".lb-ask");
    expect(ask.textContent.replace(/\u00a0/g, " ")).toContain("are you tired yet?");
    // the book waits — no pages turn while the question is up
    vi.advanceTimersByTime(20000);
    await w.vm.$nextTick();
    expect(count()).toBe("Page 10 of 100");
    // pause is hidden during a check-in
    expect(document.body.querySelector('[aria-label="Pause"]')).toBeNull();

    [...document.body.querySelectorAll(".lb-answer")].find((b) => b.textContent.includes("A little")).click();
    await w.vm.$nextTick();
    const letter = document.body.querySelector(".lb-letter");
    expect(letter.textContent).toContain("Okay — rest your eyes on this one.");
    expect(letter.querySelectorAll(".lb-letter-p").length).toBe(2); // blank line → two paragraphs
    expect(letter.querySelector(".lb-letter-sign").textContent).toContain("Hithesh");
    expect(document.body.querySelector(".lb-seal")).not.toBeNull(); // sealed envelope

    [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Keep reading")).click();
    await w.vm.$nextTick();
    expect(document.body.querySelector(".lb-checkin")).toBeNull();
    vi.advanceTimersByTime(3000);
    await w.vm.$nextTick();
    expect(Number(count().match(/Page (\d+)/)[1])).toBeGreaterThan(10);
    w.unmount();
  });

  it("pause stops the pages; skip jumps to the finale; replay starts over", async () => {
    const w = mountBook();
    document.body.querySelector('[aria-label="Pause"]').click();
    await w.vm.$nextTick();
    vi.advanceTimersByTime(10000);
    await w.vm.$nextTick();
    expect(count()).toBe("Page 1 of 100");

    document.body.querySelector('[aria-label="Skip to the last page"]').click();
    await w.vm.$nextTick();
    expect(count()).toBe("Page 100 of 100");

    [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Read again")).click();
    await w.vm.$nextTick();
    expect(count()).toBe("Page 1 of 100");
    w.unmount();
  });

  describe("seek bar", () => {
    const slider = () => document.body.querySelector(".lb-seek-input");
    const drag = async (w, n) => {
      slider().value = String(n);
      slider().dispatchEvent(new Event("input"));
      await w.vm.$nextTick();
    };
    const release = async (w, n) => {
      slider().value = String(n);
      slider().dispatchEvent(new Event("change"));
      await w.vm.$nextTick();
    };

    it("previews the page while dragging, then jumps there and keeps playing", async () => {
      const w = mountBook();
      await drag(w, 36);
      const tip = document.body.querySelector(".lb-seek-tip");
      expect(tip.textContent).toContain("Page 36");
      expect(count()).toBe("Page 36 of 100");
      // paused while dragging: time passes, nothing turns
      vi.advanceTimersByTime(10000);
      await w.vm.$nextTick();
      expect(count()).toBe("Page 36 of 100");

      await release(w, 36);
      expect(document.body.querySelector(".lb-seek-tip")).toBeNull();
      expect(count()).toBe("Page 36 of 100");
      vi.advanceTimersByTime(5000);
      await w.vm.$nextTick();
      expect(Number(count().match(/Page (\d+)/)[1])).toBeGreaterThan(36);
      w.unmount();
    });

    it("landing on an unanswered check-in page asks its question", async () => {
      const w = mountBook();
      await drag(w, 40);
      await release(w, 40);
      vi.advanceTimersByTime(1500);
      await w.vm.$nextTick();
      expect(document.body.querySelector(".lb-ask").textContent.replace(/\u00a0/g, " ")).toContain("Forty pages");
      w.unmount();
    });

    it("seeking to the end finishes; seeking back from the finale plays again", async () => {
      const w = mountBook();
      await drag(w, 100);
      await release(w, 100);
      expect(document.body.textContent).toContain("Read again");
      await drag(w, 60);
      await release(w, 60);
      expect(document.body.textContent).not.toContain("Read again");
      vi.advanceTimersByTime(5000);
      await w.vm.$nextTick();
      expect(Number(count().match(/Page (\d+)/)[1])).toBeGreaterThan(60);
      w.unmount();
    });

    it("marks check-ins and milestone pages on the track", () => {
      const w = mountBook();
      expect(document.body.querySelectorAll(".lb-seek-mark.checkin")).toHaveLength(4);
      expect(document.body.querySelectorAll(".lb-seek-mark.milestone")).toHaveLength(4);
      w.unmount();
    });
  });

  describe("hover + drag", () => {
    /* jsdom has no PointerEvent — a plain Event carrying the fields Vue's handlers read */
    const fire = (type, props = {}) => {
      const book = document.body.querySelector(".lb-book");
      const e = new Event(type, { bubbles: true });
      Object.assign(e, { pointerType: "mouse", pointerId: 1, button: 0, clientX: 0, clientY: 100, ...props });
      book.dispatchEvent(e);
    };
    const pageNo = () => Number(count().match(/Page (\d+)/)[1]);
    const sizeBook = () => {
      document.body.querySelector(".lb-book").getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 500 });
    };
    const dragPage = async (w, fromX, toX) => {
      sizeBook();
      fire("pointerdown", { clientX: fromX, pointerType: "touch" });
      fire("pointermove", { clientX: (fromX + toX) / 2, pointerType: "touch" });
      fire("pointermove", { clientX: toX, pointerType: "touch" });
      await w.vm.$nextTick();
      fire("pointerup", { clientX: toX, pointerType: "touch" });
      vi.advanceTimersByTime(400);
      await w.vm.$nextTick();
    };

    it("hovering the book pauses it (with a badge); leaving carries on", async () => {
      const w = mountBook();
      fire("pointerenter");
      await w.vm.$nextTick();
      expect(document.body.querySelector(".lb-paused")).not.toBeNull();
      vi.advanceTimersByTime(15000);
      await w.vm.$nextTick();
      expect(pageNo()).toBe(1);
      fire("pointerleave");
      await w.vm.$nextTick();
      expect(document.body.querySelector(".lb-paused")).toBeNull();
      vi.advanceTimersByTime(5000);
      await w.vm.$nextTick();
      expect(pageNo()).toBeGreaterThan(1);
      w.unmount();
    });

    it("touch hover doesn't pause", async () => {
      const w = mountBook();
      fire("pointerenter", { pointerType: "touch" });
      await w.vm.$nextTick();
      expect(document.body.querySelector(".lb-paused")).toBeNull();
      w.unmount();
    });

    it("dragging a page left past halfway turns it; a small drag falls back", async () => {
      const w = mountBook();
      document.body.querySelector('[aria-label="Pause"]').click();
      await w.vm.$nextTick();
      await dragPage(w, 700, 650); // small pull → falls back
      expect(pageNo()).toBe(1);
      await dragPage(w, 700, 100); // big pull → turns
      expect(pageNo()).toBe(2);
      // it was paused, so it stays paused after the turn
      vi.advanceTimersByTime(10000);
      await w.vm.$nextTick();
      expect(pageNo()).toBe(2);
      w.unmount();
    });

    it("dragging right turns back a page", async () => {
      const w = mountBook();
      document.body.querySelector('[aria-label="Pause"]').click();
      await w.vm.$nextTick();
      await dragPage(w, 700, 100);
      await dragPage(w, 700, 100);
      expect(pageNo()).toBe(3);
      await dragPage(w, 100, 700);
      expect(pageNo()).toBe(2);
      w.unmount();
    });

    it("can't drag back before the cover", async () => {
      const w = mountBook();
      document.body.querySelector('[aria-label="Pause"]').click();
      await w.vm.$nextTick();
      await dragPage(w, 100, 700);
      expect(pageNo()).toBe(1);
      w.unmount();
    });
  });

  it("Escape closes the book without reaching the dialog underneath", async () => {
    const behind = vi.fn();
    window.addEventListener("keydown", behind);
    const w = mountBook();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(w.emitted("update:modelValue")[0]).toEqual([false]);
    expect(behind).not.toHaveBeenCalled();
    window.removeEventListener("keydown", behind);
    w.unmount();
  });
});
