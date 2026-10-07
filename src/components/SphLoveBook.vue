<script setup>
/* Birthday love book — a full-screen 3D book that riffles through 100 pages
   of "I love you" in dancing letters, around the world. It eases in, races
   through the middle, slows for the milestone pages, and lands on a
   "Happy birthday" finale with heart bursts.

   How the flip works: the right side shows the page *under* the current one;
   a "leaf" (front = current page, back = a decorated verso) sits on top and
   rotates −180° around the spine. When it lands, the left side becomes that
   verso and the next leaf mounts — only ~3 pages are ever in the DOM.
   Reduced motion: no 3D turns or dancing, pages cross-fade at a calm pace. */
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { burstHearts } from "../composables/burstHearts";
import { buildLoveBook, BOOK_PAGES, checkinsFor } from "../loveBook";
import SphLoveBookCupids from "./SphLoveBookCupids.vue";
import SphLoveBookPage from "./SphLoveBookPage.vue";
import SphIcon from "./ui/SphIcon.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  name: { type: String, default: "" }, // birthday person
  pet: { type: String, default: "" },
  from: { type: String, default: "" }, // who it's from
});
const emit = defineEmits(["update:modelValue"]);

const reduced =
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const pages = computed(() => buildLoveBook({ name: props.name, pet: props.pet, from: props.from }));
const LAST = BOOK_PAGES - 1;

const current = ref(0); // page on the leaf (top of the right side)
const turning = ref(false);
const playing = ref(false);
const finished = ref(false);
const flipMs = ref(900);
let timer = null;

/* check-ins: at certain pages the book stops, asks a little question, and
   opens a letter (see BOOK_CHECKINS in loveBook.js) */
const checkins = computed(() => checkinsFor(props.name));
const checkin = ref(null); // { page, question, answers, title, body, step: "ask" | "letter", reply }
const seen = new Set();
const paragraphs = computed(() =>
  checkin.value
    ? String(checkin.value.body || "")
        .split(/\n\s*\n/)
        .map((t) => t.trim())
        .filter(Boolean)
    : [],
);
const answer = (a) => {
  if (!checkin.value) return;
  checkin.value = { ...checkin.value, step: "letter", reply: a.reply || "" };
};
const keepReading = () => {
  if (!checkin.value) return;
  seen.add(checkin.value.page);
  checkin.value = null;
  schedule();
};

/* the letter doesn't scroll freely: when it's longer than the envelope shows,
   arrows (or the wheel, a swipe, ↑/↓) move it a paragraph at a time */
const letterEl = ref(null);
const canUp = ref(false);
const canDown = ref(false);
const updateLetterArrows = () => {
  const el = letterEl.value;
  canUp.value = !!el && el.scrollTop > 2;
  canDown.value = !!el && el.scrollTop < el.scrollHeight - el.clientHeight - 2;
};
const stepLetter = (dir) => {
  const el = letterEl.value;
  if (!el) return;
  const cs = getComputedStyle(el);
  const padTop = parseFloat(cs.paddingTop) || 0;
  const hidden = parseFloat(cs.paddingBottom) || 0; // the pocket covers about this much at the bottom
  const max = el.scrollHeight - el.clientHeight;
  const top = el.scrollTop;
  const blocks = [...el.querySelectorAll(".lb-letter-p, .lb-letter-end")];
  let target;
  if (dir > 0) {
    // bring the first paragraph that isn't fully in view up to the top
    const bottom = top + el.clientHeight - hidden;
    const next = blocks.find((b) => b.offsetTop + b.offsetHeight > bottom + 1);
    target = next ? next.offsetTop - padTop : max;
    if (target <= top + 1) target = top + Math.max(40, el.clientHeight - hidden - padTop); // one very long paragraph
  } else {
    const prev = blocks.filter((b) => b.offsetTop - padTop < top - 1).pop();
    target = prev ? prev.offsetTop - padTop : 0;
  }
  target = Math.max(0, Math.min(max, target));
  if (el.scrollTo) el.scrollTo({ top: target, behavior: reduced ? "auto" : "smooth" });
  else el.scrollTop = target;
  if (reduced || !el.scrollTo) updateLetterArrows();
};
let wheelAt = 0;
const onLetterWheel = (e) => {
  if (Math.abs(e.deltaY) < 4 || Date.now() - wheelAt < 450) return;
  wheelAt = Date.now();
  stepLetter(Math.sign(e.deltaY));
};
let touchY = null;
const onLetterTouchStart = (e) => (touchY = e.touches[0].clientY);
const onLetterTouchEnd = (e) => {
  if (touchY === null) return;
  const dy = touchY - e.changedTouches[0].clientY;
  touchY = null;
  if (Math.abs(dy) > 30) stepLetter(Math.sign(dy));
};
watch(
  () => checkin.value && checkin.value.step,
  (step) => {
    canUp.value = canDown.value = false;
    if (step !== "letter") return;
    // the arrows wait for the letter to rise out of the envelope (and its fonts)
    setTimeout(
      () => {
        updateLetterArrows();
        if (typeof document !== "undefined" && document.fonts && document.fonts.ready)
          document.fonts.ready.then(updateLetterArrows);
      },
      reduced ? 0 : 1600,
    );
  },
);

/* flip speed (ms per page turn): slowest at both ends, quickest in the middle.
   Raise these to slow the whole book down — the full read is ~2 minutes
   (plus time on the check-in letters). */
const SLOW = 1500;
const FAST = 380;
/* how long each page rests before turning, as a share of its turn time */
const REST = 0.7;
const MIN_REST = 380;
const durationFor = (i) => {
  if (reduced) return 0;
  const s = Math.sin((Math.PI * i) / LAST);
  return Math.round(FAST + (SLOW - FAST) * Math.pow(1 - s, 2.4));
};
/* a beat on each page before turning it — longer on cover and milestones */
const holdFor = (i) => {
  const p = pages.value[i];
  if (reduced) return p.kind === "love" ? 900 : 1800;
  if (i === 0) return 1500;
  if (p.kind === "milestone") return 1700;
  return Math.max(MIN_REST, Math.round(durationFor(i) * REST));
};

const clear = () => {
  clearTimeout(timer);
  timer = null;
};
const schedule = () => {
  clear();
  if (!playing.value) return;
  if (current.value >= LAST) return finish();
  // a check-in on this page? wait here until it's answered and read
  const n = current.value + 1;
  const c = checkins.value[n];
  if (c && !seen.has(n)) {
    timer = setTimeout(() => (checkin.value = { page: n, ...c, step: "ask", reply: "" }), reduced ? 300 : 700);
    return;
  }
  timer = setTimeout(turn, holdFor(current.value));
};
const turn = () => {
  if (!playing.value) return;
  flipMs.value = durationFor(current.value);
  turning.value = true;
  timer = setTimeout(() => {
    current.value += 1;
    turning.value = false;
    schedule();
  }, flipMs.value);
};

/* finale: heart bursts from the book */
const burstAt = (n) => {
  const el = document.querySelector(".lb-book");
  const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  for (let k = 0; k < n; k++) {
    setTimeout(
      () => burstHearts(r.left + r.width * (0.3 + Math.random() * 0.6), r.top + r.height * (0.25 + Math.random() * 0.5), 22),
      k * 380,
    );
  }
};
const finish = () => {
  clear();
  playing.value = false;
  finished.value = true;
  burstAt(4);
};

const play = () => {
  if (finished.value) return;
  playing.value = true;
  // a turn already in flight finishes and schedules the next one itself
  if (!turning.value) schedule();
};
const pause = () => {
  playing.value = false;
  clear();
  turning.value = false;
};
const togglePlay = () => (playing.value ? pause() : play());

/* ---- hover to pause (mouse only) ----
   A soft pause: a page that's mid-turn still lands, then the book waits. */
const hoverPaused = ref(false);
let mouseInside = false;
const onBookEnter = (e) => {
  if (e.pointerType === "mouse") mouseInside = true;
  if (e.pointerType !== "mouse" || !playing.value || checkin.value) return;
  hoverPaused.value = true;
  playing.value = false;
  if (!turning.value) clear();
};
const onBookLeave = (e) => {
  if (e.pointerType === "mouse") mouseInside = false;
  if (e.pointerType !== "mouse" || !hoverPaused.value || drag.active) return;
  hoverPaused.value = false;
  play();
};

/* ---- drag a page to turn it ----
   Right page dragged left → next; left side dragged right → previous (on
   phones, where one page shows, the drag direction decides). The leaf
   follows the finger in 3D; past the halfway mark it turns, else it falls
   back. */
const drag = reactive({ active: false, settling: false, dir: null, angle: 0, settleMs: 0 });
let gesture = null; // { id, x0, y0, pageW, side, wasPlaying, started }
const SETTLE_MS = 380;
const singlePage = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 640px)").matches;

const onPointerDown = (e) => {
  if (checkin.value || drag.settling || turning.value || e.button > 0) return;
  if (e.target.closest && e.target.closest("button, a, input")) return;
  const r = e.currentTarget.getBoundingClientRect();
  const single = singlePage();
  gesture = {
    id: e.pointerId,
    x0: e.clientX,
    y0: e.clientY,
    pageW: single ? r.width : r.width / 2,
    side: single ? null : e.clientX - r.left > r.width / 2 ? "next" : "prev",
    wasPlaying: playing.value || hoverPaused.value,
    started: false,
    el: e.currentTarget,
  };
};
const onPointerMove = (e) => {
  if (!gesture || e.pointerId !== gesture.id) return;
  const dx = e.clientX - gesture.x0;
  if (!gesture.started) {
    if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - gesture.y0)) return;
    const dir = gesture.side || (dx < 0 ? "next" : "prev");
    if ((dir === "next" && current.value >= LAST) || (dir === "prev" && current.value <= 0)) return (gesture = null);
    gesture.started = true;
    try {
      gesture.el.setPointerCapture(e.pointerId);
    } catch (err) {}
    pause();
    hoverPaused.value = false;
    Object.assign(drag, { active: true, dir, angle: 0, settleMs: 0 });
  }
  const pull = drag.dir === "next" ? -dx : dx;
  drag.angle = Math.max(0, Math.min(180, (pull / gesture.pageW) * 180));
};
const onPointerUp = (e) => {
  if (!gesture || e.pointerId !== gesture.id) return;
  const g = gesture;
  gesture = null;
  if (!g.started) return;
  const commit = drag.angle > 70;
  Object.assign(drag, { active: false, settling: true, settleMs: SETTLE_MS, angle: commit ? 180 : 0 });
  setTimeout(() => {
    if (commit) current.value += drag.dir === "next" ? 1 : -1;
    Object.assign(drag, { settling: false, dir: null, angle: 0, settleMs: 0 });
    if (commit && current.value >= LAST) return finish();
    if (commit) finished.value = false;
    // carry on only if it was playing — and not while the mouse still rests on the book
    if (!g.wasPlaying) return;
    if (mouseInside) hoverPaused.value = true;
    else play();
  }, SETTLE_MS);
};

/* inline 3D transforms while dragging / settling (otherwise CSS drives it) */
const dragging = computed(() => drag.active || drag.settling);
const leafStyle = computed(() =>
  dragging.value && drag.dir === "next"
    ? {
        transform: "rotateY(" + -drag.angle + "deg)",
        transition: drag.settleMs ? "transform " + drag.settleMs + "ms cubic-bezier(0.3, 0.7, 0.3, 1)" : "none",
      }
    : null,
);
const prevLeafStyle = computed(() => ({
  transform: "rotateY(" + (drag.angle - 180) + "deg)",
  transition: drag.settleMs ? "transform " + drag.settleMs + "ms cubic-bezier(0.3, 0.7, 0.3, 1)" : "none",
}));
const shadeStyle = computed(() =>
  dragging.value ? { opacity: Math.sin((drag.angle * Math.PI) / 180), animation: "none" } : null,
);
/* left side shows the verso under whatever is being turned back */
const leftNum = computed(() => current.value - (dragging.value && drag.dir === "prev" ? 1 : 0));
const skip = () => {
  pause();
  checkin.value = null;
  current.value = LAST;
  finish();
};
const replay = () => {
  pause();
  seen.clear();
  checkin.value = null;
  finished.value = false;
  current.value = 0;
  play();
};
const close = () => emit("update:modelValue", false);

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      seen.clear();
      checkin.value = null;
      finished.value = false;
      current.value = 0;
      play();
    } else pause();
  },
  { immediate: true },
);
onBeforeUnmount(clear);

const onKey = (e) => {
  if (!props.modelValue) return;
  const reading = checkin.value && checkin.value.step === "letter";
  if (e.key === "Escape") close();
  else if (e.key === " " && !checkin.value) togglePlay();
  else if (reading && (e.key === "ArrowDown" || e.key === "PageDown")) stepLetter(1);
  else if (reading && (e.key === "ArrowUp" || e.key === "PageUp")) stepLetter(-1);
  else return;
  e.preventDefault();
  e.stopPropagation();
};
watch(
  () => props.modelValue,
  (open) => {
    if (open) window.addEventListener("keydown", onKey, true);
    else window.removeEventListener("keydown", onKey, true);
  },
  { immediate: true },
);
onBeforeUnmount(() => window.removeEventListener("keydown", onKey, true));

/* what each side shows */
const leaf = computed(() => pages.value[current.value]);
const under = computed(() => pages.value[Math.min(current.value + 1, LAST)]);
const pageLabel = computed(() => "Page " + sliderValue.value + " of " + BOOK_PAGES);
/* ---- seek bar: drag to any page ----
   Dragging pauses the book and previews the page under your finger; letting
   go jumps there and carries on if it was playing (or had finished).
   Landing on an unanswered check-in page still asks its question. */
const seeking = ref(false);
const seekValue = ref(1); // page number (1-based) while dragging
let resumeAfterSeek = false;
const sliderValue = computed(() => (seeking.value ? seekValue.value : current.value + 1));
const seekPct = computed(() => ((sliderValue.value - 1) / LAST) * 100);
const seekPage = computed(() => pages.value[seekValue.value - 1]);
const onSeekInput = (n) => {
  if (!seeking.value) {
    seeking.value = true;
    resumeAfterSeek = playing.value || finished.value;
    pause();
  }
  seekValue.value = n;
};
const onSeekChange = (n) => {
  if (!seeking.value) onSeekInput(n); // keyboard: input + change arrive together
  seeking.value = false;
  checkin.value = null;
  turning.value = false;
  current.value = Math.min(Math.max(n, 1), BOOK_PAGES) - 1;
  if (current.value >= LAST) return finish();
  finished.value = false;
  if (resumeAfterSeek) play();
};
/* little markers on the track: check-ins (hearts) and milestone pages */
const marks = computed(() =>
  [
    // only check-ins the book actually stops at (the finale page doesn't ask)
    ...Object.keys(checkins.value)
      .map(Number)
      .filter((n) => n < BOOK_PAGES)
      .map((n) => ({ kind: "checkin", page: n })),
    ...pages.value.map((p, i) => (p.kind === "milestone" ? { kind: "milestone", page: i + 1 } : null)).filter(Boolean),
  ].map((m) => ({ ...m, pct: ((m.page - 1) / LAST) * 100 })),
);

/* ambient hearts drifting up behind the book */
const drift = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: ((i * 37) % 100) + "%",
  size: 10 + ((i * 7) % 22) + "px",
  dur: 9 + ((i * 5) % 11) + "s",
  delay: -((i * 3) % 17) + "s",
}));
</script>

<template>
  <teleport to="body">
    <transition name="lb-fade">
      <div v-if="modelValue" class="lb-veil" role="dialog" aria-modal="true" :aria-label="name + '\'s birthday book'">
        <div class="lb-glow" aria-hidden="true"></div>
        <span
          v-for="h in drift"
          :key="h.id"
          class="lb-drift"
          aria-hidden="true"
          :style="{ left: h.left, fontSize: h.size, animationDuration: h.dur, animationDelay: h.delay }"
          >♥</span
        >

        <button type="button" class="lb-close gbtn gbtn-icon" aria-label="Close the book" @click="close()">
          <sph-icon name="X" :size="18" />
        </button>

        <div class="lb-stage" :class="{ reduced }">
          <div
            class="lb-book"
            :class="{ finished, asking: !!checkin, grabbing: drag.active, 'hover-paused': hoverPaused }"
            :style="{ '--flip': flipMs + 'ms' }"
            @pointerenter="onBookEnter"
            @pointerleave="onBookLeave"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          >
            <transition name="lb-tip">
              <span v-if="hoverPaused" class="lb-paused" aria-live="polite">
                <sph-icon name="Pause" :size="12" /> paused — move away to continue
              </span>
            </transition>
            <div class="lb-spine" aria-hidden="true"></div>

            <!-- left: back of the last turned page (or the inside cover) -->
            <div class="lb-side lb-left" aria-hidden="true">
              <div class="lb-verso" :class="{ inside: leftNum === 0 }">
                <template v-if="leftNum === 0">
                  <span class="lb-verso-heart">♥</span>
                  <span class="lb-verso-note">for {{ name || "you" }}</span>
                </template>
                <template v-else>
                  <span class="lb-verso-heart small">♥</span>
                  <span class="lb-verso-num">{{ leftNum }}</span>
                </template>
              </div>
            </div>

            <!-- right: the page waiting underneath -->
            <div class="lb-side lb-right" aria-hidden="true">
              <sph-love-book-page :key="'u' + current" :page="under" :index="Math.min(current + 1, LAST)" />
            </div>

            <!-- the turning leaf: current page on the front -->
            <div :key="current" class="lb-leaf" :class="{ turning: turning && !dragging }" :style="leafStyle">
              <div class="lb-face lb-front">
                <sph-love-book-page :page="leaf" :index="current" :live="!turning && !dragging" aria-live="polite" />
                <div class="lb-shade" :style="drag.dir === 'next' ? shadeStyle : null" aria-hidden="true"></div>
              </div>
              <div class="lb-face lb-back" aria-hidden="true">
                <div class="lb-verso">
                  <span class="lb-verso-heart small">♥</span>
                  <span class="lb-verso-num">{{ current + 1 }}</span>
                </div>
              </div>
            </div>

            <!-- turning back: the previous page swings in from the left -->
            <div v-if="dragging && drag.dir === 'prev'" class="lb-leaf lb-leaf-prev" :style="prevLeafStyle" aria-hidden="true">
              <div class="lb-face lb-front">
                <sph-love-book-page :page="pages[current - 1]" :index="current - 1" />
                <div class="lb-shade" :style="shadeStyle"></div>
              </div>
              <div class="lb-face lb-back">
                <div class="lb-verso">
                  <span class="lb-verso-heart small">♥</span>
                  <span class="lb-verso-num">{{ current }}</span>
                </div>
              </div>
            </div>

            <!-- two cupids tossing a heart across the spine -->
            <sph-love-book-cupids />
          </div>

          <!-- check-in: a little question, then a letter in an envelope -->
          <transition name="lb-card" mode="out-in">
            <div
              v-if="checkin && checkin.step === 'ask'"
              key="ask"
              class="lb-checkin lb-ask"
              role="dialog"
              aria-live="polite"
              :aria-label="checkin.question"
            >
              <p class="lb-ask-kicker"><span class="lb-ask-heart">♥</span> page {{ checkin.page }} · a little check-in</p>
              <p class="lb-ask-q">
                <span
                  v-for="(w, k) in checkin.question.split(' ')"
                  :key="k"
                  class="lb-ask-w"
                  :style="{ animationDelay: k * 0.09 + 's' }"
                  >{{ w }}&nbsp;</span
                >
              </p>
              <div class="lb-ask-answers">
                <button
                  v-for="(a, k) in checkin.answers"
                  :key="k"
                  type="button"
                  class="gbtn lb-answer"
                  :class="{ 'gbtn-primary': k === checkin.answers.length - 1 }"
                  :style="{ animationDelay: 0.35 + k * 0.12 + 's' }"
                  @click="answer(a)"
                >
                  {{ a.label }}
                </button>
              </div>
            </div>

            <div
              v-else-if="checkin && checkin.step === 'letter'"
              key="letter"
              class="lb-checkin lb-envelope"
              role="dialog"
              :aria-label="checkin.title || 'A letter'"
            >
              <div class="lb-env">
                <div class="lb-env-ground" aria-hidden="true"></div>
                <!-- envelope back + lining -->
                <div class="lb-env-back" aria-hidden="true"></div>
                <!-- top flap with its wax seal: swings open, then sits behind the letter -->
                <div class="lb-env-flap" aria-hidden="true">
                  <svg viewBox="0 0 200 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="lb-flap-g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" style="stop-color: var(--env-dark)" />
                        <stop offset="1" style="stop-color: var(--env-paper)" />
                      </linearGradient>
                    </defs>
                    <path
                      class="lb-flap-shape"
                      d="M0 0 H200 C176 18 132 62 113 82 Q100 95 87 82 C68 62 24 18 0 0 Z"
                      fill="url(#lb-flap-g)"
                    />
                    <path class="lb-flap-edge" d="M0 0 C24 18 68 62 87 82 Q100 95 113 82 C132 62 176 18 200 0" />
                  </svg>
                  <span class="lb-seal">♥</span>
                </div>
                <!-- the letter rises out of the pocket -->
                <div class="lb-letter-slot">
                  <transition name="lb-arrow">
                    <button
                      v-if="canUp"
                      type="button"
                      class="lb-letter-arrow up"
                      aria-label="Previous paragraph"
                      @click="stepLetter(-1)"
                    >
                      <sph-icon name="ChevronUp" :size="16" />
                    </button>
                  </transition>
                  <article
                    ref="letterEl"
                    class="lb-letter"
                    @scroll.passive="updateLetterArrows"
                    @wheel.prevent="onLetterWheel"
                    @touchstart.passive="onLetterTouchStart"
                    @touchend="onLetterTouchEnd"
                  >
                    <p v-if="checkin.reply" class="lb-letter-reply">{{ checkin.reply }}</p>
                    <h3 v-if="checkin.title" class="lb-letter-title">{{ checkin.title }}</h3>
                    <p
                      v-for="(para, k) in paragraphs"
                      :key="k"
                      class="lb-letter-p"
                      :style="{ animationDelay: 1.35 + k * 0.3 + 's' }"
                    >
                      {{ para }}
                    </p>
                    <div v-if="from" class="lb-letter-end" :style="{ animationDelay: 1.45 + paragraphs.length * 0.3 + 's' }">
                      <span class="lb-letter-divider" aria-hidden="true"><i></i>♥<i></i></span>
                      <p class="lb-letter-sign">
                        {{ from }}
                        <svg class="lb-sign-line" viewBox="0 0 120 14" aria-hidden="true">
                          <path d="M2 9 C 20 2, 34 13, 52 7 S 84 3, 98 8 S 114 10, 118 5" />
                        </svg>
                      </p>
                    </div>
                  </article>
                </div>
                <!-- front pocket: side flaps + bottom flap, drawn over the letter's foot -->
                <div class="lb-env-front" aria-hidden="true">
                  <svg viewBox="0 0 200 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="lb-pocket-lg" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0" style="stop-color: var(--env-dark)" />
                        <stop offset="1" style="stop-color: var(--env-deep)" />
                      </linearGradient>
                      <linearGradient id="lb-pocket-rg" x1="1" y1="0" x2="0" y2="0">
                        <stop offset="0" style="stop-color: var(--env-dark)" />
                        <stop offset="1" style="stop-color: var(--env-deep)" />
                      </linearGradient>
                      <linearGradient id="lb-pocket-bg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" style="stop-color: var(--env-paper)" />
                        <stop offset="1" style="stop-color: var(--env-dark)" />
                      </linearGradient>
                    </defs>
                    <path class="lb-pocket-l" d="M0 0 C30 14 78 42 104 60 C70 74 30 88 0 100 Z" fill="url(#lb-pocket-lg)" />
                    <path
                      class="lb-pocket-r"
                      d="M200 0 C170 14 122 42 96 60 C130 74 170 88 200 100 Z"
                      fill="url(#lb-pocket-rg)"
                    />
                    <path
                      class="lb-pocket-b"
                      d="M0 100 C34 78 70 54 90 45 Q100 40 110 45 C130 54 166 78 200 100 Z"
                      fill="url(#lb-pocket-bg)"
                    />
                    <path class="lb-pocket-edge" d="M0 100 C34 78 70 54 90 45 Q100 40 110 45 C130 54 166 78 200 100" />
                    <path class="lb-pocket-edge soft" d="M0 0 C30 14 78 42 104 60 M200 0 C170 14 122 42 96 60" />
                  </svg>
                </div>
                <!-- more below: step down a paragraph -->
                <transition name="lb-arrow">
                  <button
                    v-if="canDown"
                    type="button"
                    class="lb-letter-arrow down"
                    aria-label="Next paragraph"
                    @click="stepLetter(1)"
                  >
                    <sph-icon name="ChevronDown" :size="18" />
                  </button>
                </transition>
                <div class="lb-env-go" :style="{ animationDelay: 1.6 + paragraphs.length * 0.3 + 's' }">
                  <button type="button" class="gbtn gbtn-primary" @click="keepReading()">Keep reading ♥</button>
                </div>
              </div>
            </div>
          </transition>

          <!-- progress + controls -->
          <div class="lb-controls">
            <div class="lb-seek" :class="{ seeking }" :style="{ '--pct': seekPct + '%' }">
              <transition name="lb-tip">
                <div v-if="seeking && seekPage" class="lb-seek-tip" aria-hidden="true">
                  <span class="lb-seek-tip-n">Page {{ seekValue }}</span>
                  <span class="lb-seek-tip-line">{{ seekPage.line }}</span>
                  <span v-if="checkins[seekValue]" class="lb-seek-tip-meta">♥ a check-in</span>
                  <span v-else-if="seekPage.lang && seekPage.lang !== 'always'" class="lb-seek-tip-meta">{{
                    seekPage.lang
                  }}</span>
                  <span v-else-if="seekPage.sub" class="lb-seek-tip-meta">{{ seekPage.sub }}</span>
                </div>
              </transition>
              <span
                v-for="m in marks"
                :key="m.kind + m.page"
                class="lb-seek-mark"
                :class="m.kind"
                :style="{ left: m.pct + '%' }"
                aria-hidden="true"
                >{{ m.kind === "checkin" ? "♥" : "" }}</span
              >
              <input
                class="lb-seek-input"
                type="range"
                min="1"
                :max="BOOK_PAGES"
                step="1"
                :value="sliderValue"
                aria-label="Seek to page"
                :aria-valuetext="pageLabel"
                @input="onSeekInput(Number($event.target.value))"
                @change="onSeekChange(Number($event.target.value))"
              />
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="lb-count">{{ pageLabel }}</span>
              <div class="flex items-center gap-2">
                <template v-if="!finished">
                  <button
                    v-if="!checkin"
                    type="button"
                    class="gbtn gbtn-icon"
                    :aria-label="playing ? 'Pause' : 'Play'"
                    @click="togglePlay()"
                  >
                    <sph-icon :name="playing ? 'Pause' : 'Play'" :size="16" />
                  </button>
                  <button type="button" class="gbtn gbtn-icon" aria-label="Skip to the last page" @click="skip()">
                    <sph-icon name="SkipForward" :size="16" />
                  </button>
                </template>
                <template v-else>
                  <button type="button" class="gbtn" @click="replay()">
                    <sph-icon name="RotateCcw" :size="15" /> Read again
                  </button>
                  <button type="button" class="gbtn gbtn-primary" @click="close()">Close ♥</button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style>
/* not scoped: SphLoveBookPage renders inside — every class is lb- prefixed */
/* ---------- veil + ambience ---------- */
.lb-veil {
  position: fixed;
  inset: 0;
  z-index: 95; /* above dialogs (60); burst hearts sit at 99 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: hidden;
  background: rgba(16, 6, 14, 0.62);
  -webkit-backdrop-filter: blur(14px) saturate(1.2);
  backdrop-filter: blur(14px) saturate(1.2);
}
.lb-glow {
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(40% 35% at 50% 45%, color-mix(in srgb, var(--accent) 45%, transparent), transparent 70%),
    radial-gradient(30% 30% at 20% 80%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%),
    radial-gradient(30% 30% at 85% 15%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%);
  animation: lb-breathe 6s ease-in-out infinite;
  pointer-events: none;
}
@keyframes lb-breathe {
  50% {
    opacity: 0.65;
    transform: scale(1.06);
  }
}
.lb-drift {
  position: absolute;
  bottom: -2rem;
  color: var(--accent);
  opacity: 0.35;
  animation: lb-rise linear infinite;
  pointer-events: none;
}
@keyframes lb-rise {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.4;
  }
  100% {
    transform: translateY(-115vh) rotate(40deg);
    opacity: 0;
  }
}
.lb-close {
  position: absolute;
  top: max(1rem, env(safe-area-inset-top));
  right: 1rem;
  z-index: 3;
}
.lb-fade-enter-active,
.lb-fade-leave-active {
  transition: opacity 0.35s ease;
}
.lb-fade-enter-from,
.lb-fade-leave-to {
  opacity: 0;
}
.lb-fade-enter-active .lb-book {
  animation: lb-arrive 0.8s cubic-bezier(0.2, 1.2, 0.3, 1) both;
}
@keyframes lb-arrive {
  from {
    transform: translateY(40px) rotateX(18deg) scale(0.85);
    opacity: 0;
  }
}

/* ---------- book ---------- */
.lb-stage {
  position: relative;
  z-index: 2;
  width: min(760px, 100%);
  display: grid;
  gap: 1.25rem;
  justify-items: center;
}
.lb-book {
  --w: min(760px, calc(100vw - 2rem));
  --h: min(calc(var(--w) * 0.66), 62vh);
  /* the paper's ruling: --rows lines per page (SphLoveBookPage's ROWS) */
  --rows: 16;
  --rule: calc(var(--h) / var(--rows));
  position: relative;
  width: var(--w);
  height: var(--h);
  perspective: 2200px;
  transform-style: preserve-3d;
  filter: drop-shadow(0 30px 40px rgba(0, 0, 0, 0.45));
}
.lb-book.finished {
  animation: lb-glowpulse 2.4s ease-in-out infinite;
}
@keyframes lb-glowpulse {
  50% {
    filter: drop-shadow(0 30px 40px rgba(0, 0, 0, 0.45)) drop-shadow(0 0 30px color-mix(in srgb, var(--accent) 60%, transparent));
  }
}
.lb-side,
.lb-leaf {
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
}
.lb-left {
  left: 0;
}
.lb-right,
.lb-leaf {
  left: 50%;
}
.lb-spine {
  position: absolute;
  z-index: 4;
  left: calc(50% - 14px);
  top: 0;
  width: 28px;
  height: 100%;
  background: linear-gradient(
    to right,
    transparent,
    rgba(0, 0, 0, 0.22) 45%,
    rgba(0, 0, 0, 0.3) 50%,
    rgba(0, 0, 0, 0.22) 55%,
    transparent
  );
  pointer-events: none;
}

/* paper */
.lb-page,
.lb-verso {
  position: absolute;
  inset: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8% 9%;
  color: #3a2230;
  background:
    radial-gradient(120% 90% at 50% 40%, rgba(255, 255, 255, 0.55), transparent 70%),
    repeating-linear-gradient(
      to bottom,
      transparent 0 calc(var(--rule, 28px) - 1px),
      color-mix(in srgb, var(--accent) 16%, transparent) calc(var(--rule, 28px) - 1px) var(--rule, 28px)
    ),
    linear-gradient(135deg, #fff9f4, #fbeee6 60%, #f6e3d8);
}
.lb-right .lb-page,
.lb-front .lb-page {
  border-radius: 4px 14px 14px 4px;
  box-shadow: inset 12px 0 18px -12px rgba(0, 0, 0, 0.25);
}
.lb-left .lb-verso,
.lb-back .lb-verso {
  border-radius: 14px 4px 4px 14px;
  box-shadow: inset -12px 0 18px -12px rgba(0, 0, 0, 0.25);
}
html[data-mode="dark"] .lb-page,
html[data-mode="dark"] .lb-verso {
  color: #f7e9ef;
  background:
    radial-gradient(120% 90% at 50% 40%, rgba(255, 255, 255, 0.06), transparent 70%),
    repeating-linear-gradient(
      to bottom,
      transparent 0 calc(var(--rule, 28px) - 1px),
      color-mix(in srgb, var(--accent) 20%, transparent) calc(var(--rule, 28px) - 1px) var(--rule, 28px)
    ),
    linear-gradient(135deg, #2c1d28, #241722 60%, #1d121b);
}
.lb-verso {
  gap: 0.4rem;
}
.lb-verso-heart {
  font-size: clamp(2.5rem, 9vw, 4.5rem);
  color: var(--accent);
  opacity: 0.85;
}
.lb-verso-heart.small {
  font-size: clamp(1.5rem, 5vw, 2.4rem);
  opacity: 0.35;
}
.lb-verso-note {
  font-family: "Cormorant Garamond", Georgia, serif;
  font-style: italic;
  font-size: clamp(1rem, 3vw, 1.5rem);
  opacity: 0.8;
}
.lb-verso-num {
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  opacity: 0.4;
}

/* the leaf: 3D turn around the spine */
.lb-leaf {
  z-index: 3;
  transform-origin: left center;
  transform-style: preserve-3d;
  transform: rotateY(0deg);
  transition: transform var(--flip) cubic-bezier(0.45, 0.05, 0.25, 1);
}
.lb-leaf.turning {
  transform: rotateY(-180deg);
}
.lb-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.lb-back {
  transform: rotateY(180deg);
}
/* light sweeping across the page as it lifts */
.lb-shade {
  position: absolute;
  inset: 0;
  border-radius: 4px 14px 14px 4px;
  background: linear-gradient(to left, rgba(0, 0, 0, 0.28), transparent 60%);
  opacity: 0;
  pointer-events: none;
}
.lb-leaf.turning .lb-shade {
  animation: lb-shade var(--flip) ease-in-out both;
}
@keyframes lb-shade {
  50% {
    opacity: 1;
  }
}

/* ---------- page type: written on the ruled lines ----------
   Every block's line-height (--lh) is a whole number of rules, and it's
   nudged down by half that minus --sit so its baseline lands on a rule
   (--sit ≈ half the font's ascent − descent: ~0.32em Cormorant, ~0.35em
   Figtree, plus a hair so the ink sits just above the line). Margins are
   whole rules too. SphLoveBookPage sets --fit (shrink to fit) and --top
   (which row the block starts on). */
.lb-page {
  display: block;
  padding: 0;
}
.lb-body {
  position: absolute;
  left: 9%;
  right: 9%;
  top: calc(var(--rule, 28px) * var(--top, 6));
  display: flex;
  flex-direction: column;
  text-align: center;
}
.lb-body > * {
  --lh: var(--rule, 28px);
  --sit: 0.38em;
  position: relative;
  top: calc(var(--lh) / 2 - var(--sit));
  margin: 0;
  line-height: var(--lh);
}
.lb-line {
  --lh: calc(var(--rule, 28px) * 2);
  --sit: 0.36em;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-weight: 600;
  font-style: italic;
  font-size: calc(var(--rule, 28px) * 1.5 * var(--fit, 1));
  color: var(--accent);
  text-wrap: balance;
}
.k-finale .lb-line {
  font-size: calc(var(--rule, 28px) * 1.6 * var(--fit, 1));
}
.k-cover .lb-line {
  font-size: calc(var(--rule, 28px) * 1.7 * var(--fit, 1));
}
.lb-word {
  display: inline-block;
  white-space: nowrap;
}
.lb-ch {
  display: inline-block;
}
/* dancing letters: a bouncy wave with a little sway */
.lb-page.live .lb-ch {
  animation: lb-dance 1.6s cubic-bezier(0.3, 1.5, 0.5, 1) infinite;
}
@keyframes lb-dance {
  0%,
  100% {
    transform: translateY(0) rotate(0deg) scale(1);
  }
  20% {
    transform: translateY(-0.32em) rotate(-8deg) scale(1.12);
    text-shadow: 0 0.25em 0.35em color-mix(in srgb, var(--accent) 35%, transparent);
  }
  40% {
    transform: translateY(0.04em) rotate(5deg) scale(0.96);
  }
  60% {
    transform: translateY(-0.1em) rotate(-2deg) scale(1.03);
  }
}
.lb-kicker {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  opacity: 0.55;
}
.lb-body > .lb-sub {
  --lh: calc(var(--rule, 28px) * 2); /* skips a line below the big one */
  --sit: 0.36em;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-style: italic;
  font-size: calc(var(--rule, 28px) * 0.75);
  opacity: 0.85;
}
.lb-body > .lb-foot {
  margin-top: var(--rule, 28px);
  font-size: clamp(0.7rem, 2vw, 0.85rem);
  opacity: 0.65;
}
/* the language and page number sit on the last two ruled lines */
.lb-lang,
.lb-num {
  position: absolute;
  margin: 0;
  line-height: var(--rule, 28px);
}
.lb-lang {
  left: 0;
  right: 0;
  top: calc(var(--rule, 28px) * 13.5 - 0.38em);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  opacity: 0.45;
}
.lb-num {
  top: calc(var(--rule, 28px) * 14.5 - 0.38em);
  left: 0;
  right: 0; /* centred: the bottom cupids hold the corners */
  font-size: 0.68rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.4;
}
.lb-doodle {
  position: absolute;
  color: var(--accent);
  opacity: 0.14;
  animation: lb-float 4s ease-in-out infinite;
  pointer-events: none;
}
@keyframes lb-float {
  50% {
    transform: translateY(-6px) rotate(12deg) scale(1.1);
  }
}
.lb-body > .lb-beat {
  --lh: calc(var(--rule, 28px) * 2);
  top: 0;
  font-size: calc(var(--rule, 28px) * 1.4);
  color: var(--accent);
  animation: lb-heartbeat 1.2s ease-in-out infinite;
  filter: drop-shadow(0 0 14px color-mix(in srgb, var(--accent) 55%, transparent));
}
@keyframes lb-heartbeat {
  0%,
  100% {
    transform: scale(1);
  }
  15% {
    transform: scale(1.25);
  }
  30% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.18);
  }
}

/* ---------- controls ---------- */
.lb-controls {
  width: min(520px, 100%);
  display: grid;
  gap: 0.6rem;
  padding: 0.75rem 0.9rem;
  border-radius: 1.2rem;
  background: var(--glass-fill-strong);
  border: 1px solid var(--glass-border);
  box-shadow: inset 0 1px 0 var(--glass-highlight);
}
/* seek bar: a glass track filled to --pct, a glowing thumb, page markers */
.lb-seek {
  position: relative;
  height: 1.4rem;
  display: flex;
  align-items: center;
}
.lb-seek-input {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 1.4rem;
  margin: 0;
  background: transparent;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  touch-action: none;
}
.lb-seek-input:focus {
  outline: none;
}
.lb-seek-input::-webkit-slider-runnable-track {
  height: 5px;
  border-radius: 999px;
  background: linear-gradient(to right, var(--accent) var(--pct), var(--glass-fill) var(--pct));
  box-shadow: inset 0 0 0 1px var(--glass-border);
}
.lb-seek-input::-moz-range-track {
  height: 5px;
  border-radius: 999px;
  background: var(--glass-fill);
  box-shadow: inset 0 0 0 1px var(--glass-border);
}
.lb-seek-input::-moz-range-progress {
  height: 5px;
  border-radius: 999px;
  background: var(--accent);
}
.lb-seek-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 1.05rem;
  height: 1.05rem;
  margin-top: calc((5px - 1.05rem) / 2);
  border-radius: 999px;
  background: var(--accent);
  border: 2px solid #fff;
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--accent) 25%, transparent),
    0 2px 8px rgba(0, 0, 0, 0.35);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.lb-seek-input::-moz-range-thumb {
  width: 1.05rem;
  height: 1.05rem;
  border-radius: 999px;
  background: var(--accent);
  border: 2px solid #fff;
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--accent) 25%, transparent),
    0 2px 8px rgba(0, 0, 0, 0.35);
}
.lb-seek.seeking .lb-seek-input::-webkit-slider-thumb,
.lb-seek-input:focus-visible::-webkit-slider-thumb {
  transform: scale(1.25);
  box-shadow:
    0 0 0 7px color-mix(in srgb, var(--accent) 30%, transparent),
    0 2px 10px rgba(0, 0, 0, 0.4);
}
.lb-seek-mark {
  position: absolute;
  top: 50%;
  z-index: 2;
  transform: translate(-50%, -50%);
  pointer-events: none;
  line-height: 1;
}
.lb-seek-mark.milestone {
  width: 3px;
  height: 9px;
  border-radius: 2px;
  background: var(--ink-3);
  opacity: 0.6;
}
.lb-seek-mark.checkin {
  font-size: 0.6rem;
  color: #fff;
  text-shadow:
    0 0 4px var(--accent),
    0 0 1px var(--accent);
  top: calc(50% - 0.75rem);
}
/* the preview bubble that follows the thumb */
.lb-seek-tip {
  position: absolute;
  z-index: 3;
  bottom: calc(100% + 0.55rem);
  left: clamp(4.5rem, var(--pct), calc(100% - 4.5rem));
  transform: translateX(-50%);
  width: max-content;
  max-width: 13rem;
  display: grid;
  gap: 0.1rem;
  justify-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: 0.9rem;
  text-align: center;
  background: var(--glass-fill-strong);
  border: 1px solid var(--glass-border);
  box-shadow:
    inset 0 1px 0 var(--glass-highlight),
    0 12px 28px -10px rgba(0, 0, 0, 0.5);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  pointer-events: none;
}
.lb-seek-tip-n {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.lb-seek-tip-line {
  max-width: 12rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-style: italic;
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--accent);
}
.lb-seek-tip-meta {
  font-size: 0.66rem;
  color: var(--ink-2);
}
.lb-tip-enter-active,
.lb-tip-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.2s cubic-bezier(0.2, 1.3, 0.4, 1);
}
.lb-tip-enter-from,
.lb-tip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px) scale(0.92);
}
.lb-count {
  font-size: 0.78rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--ink-2);
}

/* ---------- phones: one page at a time ---------- */
@media (max-width: 640px) {
  .lb-book {
    --w: calc(100vw - 2rem);
    --h: min(calc(var(--w) * 1.25), 60vh);
  }
  .lb-left,
  .lb-spine {
    display: none;
  }
  .lb-right,
  .lb-leaf {
    left: 0;
    width: 100%;
  }
  .lb-leaf.turning {
    transform: rotateY(-180deg) translateX(10%);
    opacity: 0;
    transition:
      transform var(--flip) cubic-bezier(0.45, 0.05, 0.25, 1),
      opacity var(--flip) ease-in;
  }
}

/* ---------- reduced motion: calm cross-fades, no dancing ---------- */
.lb-stage.reduced .lb-leaf,
.lb-stage.reduced .lb-leaf.turning {
  transform: none;
  transition: none;
}
.lb-stage.reduced .lb-ch,
.lb-stage.reduced .lb-doodle,
.lb-stage.reduced .lb-beat {
  animation: none !important;
}
.lb-stage.reduced .lb-front {
  animation: lb-fadein 0.4s ease both;
}
@keyframes lb-fadein {
  from {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .lb-glow,
  .lb-drift,
  .lb-book.finished {
    animation: none;
  }
  .lb-drift {
    display: none;
  }
}

/* ---------- check-ins: question card + envelope letter ---------- */
.lb-book {
  transition: filter 0.5s ease;
}
.lb-book.asking {
  filter: drop-shadow(0 30px 40px rgba(0, 0, 0, 0.45)) brightness(0.55) blur(2px);
}
.lb-checkin {
  position: absolute;
  z-index: 5;
  left: 50%;
  top: 42%;
  width: min(440px, calc(100vw - 2.5rem));
  transform: translate(-50%, -50%);
}
.lb-ask {
  padding: 1.4rem 1.3rem 1.2rem;
  border-radius: 1.5rem;
  text-align: center;
  background: var(--glass-fill-strong);
  border: 1px solid var(--glass-border);
  box-shadow:
    inset 0 1px 0 var(--glass-highlight),
    0 24px 60px -20px rgba(0, 0, 0, 0.6),
    0 0 0 6px color-mix(in srgb, var(--accent) 12%, transparent);
  -webkit-backdrop-filter: blur(18px) saturate(1.3);
  backdrop-filter: blur(18px) saturate(1.3);
  color: var(--ink);
}
.lb-ask-kicker {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.lb-ask-heart {
  display: inline-block;
  color: var(--accent);
  animation: lb-heartbeat 1.2s ease-in-out infinite;
}
.lb-ask-q {
  margin: 0.6rem 0 1.1rem;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-style: italic;
  font-weight: 600;
  font-size: clamp(1.5rem, 5vw, 2.1rem);
  line-height: 1.15;
  color: var(--accent);
}
.lb-ask-w {
  display: inline-block;
  animation:
    lb-word-in 0.6s cubic-bezier(0.2, 1.4, 0.4, 1) both,
    lb-dance 2.2s cubic-bezier(0.3, 1.5, 0.5, 1) 0.8s infinite;
}
@keyframes lb-word-in {
  from {
    opacity: 0;
    transform: translateY(0.6em) rotate(-6deg) scale(0.8);
  }
}
.lb-ask-answers {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
}
.lb-answer {
  font-size: 0.95rem;
  padding: 0.6rem 1.15rem;
  animation: lb-word-in 0.5s cubic-bezier(0.2, 1.4, 0.4, 1) both;
}

/* envelope: a rounded paper envelope — flap with a wax seal swings open,
   the letter rises out of the front pocket, then the words fade in */
.lb-envelope {
  --env-h: 8.5rem;
  --env-paper: color-mix(in srgb, var(--accent) 22%, #fff6ef);
  --env-dark: color-mix(in srgb, var(--accent) 38%, #f3dccf);
  --env-deep: color-mix(in srgb, var(--accent) 55%, #e9c6b6);
  --env-line: rgba(255, 255, 255, 0.55);
}
html[data-mode="dark"] .lb-envelope {
  --env-paper: color-mix(in srgb, var(--accent) 30%, #2a1b26);
  --env-dark: color-mix(in srgb, var(--accent) 40%, #22151f);
  --env-deep: color-mix(in srgb, var(--accent) 52%, #1b1019);
  --env-line: rgba(255, 255, 255, 0.14);
}
.lb-env {
  position: relative;
  padding-top: 0.5rem;
  perspective: 900px;
}
.lb-env-ground {
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: -0.9rem;
  height: 1.4rem;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(0, 0, 0, 0.45), transparent);
  filter: blur(4px);
}
.lb-env-back {
  position: absolute;
  z-index: 1;
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--env-h);
  border-radius: 0.3rem 0.3rem 0.85rem 0.85rem;
  background:
    repeating-linear-gradient(45deg, transparent 0 9px, color-mix(in srgb, var(--accent) 10%, transparent) 9px 10px),
    linear-gradient(180deg, var(--env-deep), var(--env-dark));
  box-shadow:
    inset 0 0 0 1px var(--env-line),
    inset 0 10px 18px -10px rgba(0, 0, 0, 0.35);
}

/* top flap — hinged on the envelope's top edge */
.lb-env-flap {
  position: absolute;
  z-index: 5;
  left: 0;
  right: 0;
  bottom: calc(var(--env-h) - 5.3rem);
  height: 5.3rem;
  transform-origin: top center;
  transform: rotateX(0deg);
  animation: lb-flap 0.75s cubic-bezier(0.55, 0, 0.25, 1) 0.35s both;
  filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.18));
}
.lb-env-flap svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
/* (flap fill is its SVG gradient) */
.lb-flap-edge,
.lb-pocket-edge {
  fill: none;
  stroke: var(--env-line);
  stroke-width: 1;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}
@keyframes lb-flap {
  0% {
    transform: rotateX(0deg);
    z-index: 5;
  }
  49% {
    z-index: 5;
  }
  50% {
    z-index: 1;
  }
  100% {
    transform: rotateX(180deg);
    z-index: 1;
  }
}
/* wax seal on the flap tip — pops, then fades as the flap lifts */
.lb-seal {
  position: absolute;
  left: 50%;
  bottom: -0.55rem;
  width: 2.3rem;
  height: 2.3rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.92);
  background: radial-gradient(
    circle at 35% 30%,
    color-mix(in srgb, var(--accent) 70%, #fff) 0%,
    var(--accent) 45%,
    color-mix(in srgb, var(--accent) 70%, #000) 100%
  );
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--accent) 80%, #000) inset,
    0 3px 8px rgba(0, 0, 0, 0.35);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.35);
  transform: translateX(-50%);
  animation: lb-seal 0.6s ease 0.1s both;
}
@keyframes lb-seal {
  40% {
    transform: translateX(-50%) scale(1.18);
  }
  100% {
    transform: translateX(-50%) scale(0.6);
    opacity: 0;
  }
}

/* the letter: clipped at the envelope's bottom so it rises out of it */
.lb-letter-slot {
  position: relative;
  z-index: 2;
  /* narrower than the envelope, like real paper — the open flap shows at its sides */
  margin: 0 1.6rem;
  clip-path: inset(-100vh -2rem 0 -2rem);
}
.lb-letter {
  position: relative; /* paragraphs' offsetTop is measured from here */
  max-height: min(52vh, 27rem);
  overflow: hidden; /* no scrollbar — the arrows step it a paragraph at a time */
  padding: 1.35rem 1.35rem calc(var(--env-h) - 1.2rem);
  border-radius: 0.5rem 0.5rem 0 0;
  color: #3a2230;
  background:
    radial-gradient(120% 80% at 50% 0%, rgba(255, 255, 255, 0.7), transparent 60%),
    repeating-linear-gradient(to bottom, transparent 0 29px, color-mix(in srgb, var(--accent) 11%, transparent) 29px 30px),
    linear-gradient(135deg, #fffaf5, #fbefe7);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.05),
    0 -6px 22px -12px rgba(0, 0, 0, 0.35);
  animation: lb-letter-out 1s cubic-bezier(0.2, 1, 0.3, 1) 0.85s both;
}
html[data-mode="dark"] .lb-letter {
  color: #f7e9ef;
  background:
    radial-gradient(120% 80% at 50% 0%, rgba(255, 255, 255, 0.05), transparent 60%),
    repeating-linear-gradient(to bottom, transparent 0 29px, color-mix(in srgb, var(--accent) 15%, transparent) 29px 30px),
    linear-gradient(135deg, #2c1d28, #221520);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.06),
    0 -6px 22px -12px rgba(0, 0, 0, 0.6);
}
@keyframes lb-letter-out {
  from {
    transform: translateY(78%);
  }
}

/* front pocket over the letter's foot */
.lb-env-front {
  position: absolute;
  z-index: 3;
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--env-h);
  /* tight top corners so the letter slides in cleanly; softer at the bottom */
  border-radius: 0.3rem 0.3rem 0.85rem 0.85rem;
  overflow: hidden;
  /* the pocket's lip casts a soft shadow onto the letter tucked inside */
  filter: drop-shadow(0 -3px 5px rgba(0, 0, 0, 0.16));
  box-shadow:
    inset 0 -1px 0 var(--env-line),
    0 14px 26px -14px rgba(0, 0, 0, 0.45);
}
.lb-env-front svg {
  display: block;
  width: 100%;
  height: 100%;
}
/* pocket fills are SVG gradients; the right flap sits a touch in shadow */
.lb-pocket-r {
  filter: brightness(0.94);
}
.lb-pocket-edge.soft {
  stroke-width: 0.8;
  opacity: 0.6;
}
.lb-env-go {
  position: absolute;
  z-index: 4;
  left: 0;
  right: 0;
  bottom: 1rem;
  display: flex;
  justify-content: center;
  animation: lb-line-in 0.6s ease both;
}
.lb-env-go .gbtn {
  box-shadow: 0 8px 18px -8px color-mix(in srgb, var(--accent) 80%, #000);
}
/* paragraph arrows: ↓ just above the pocket's V, ↑ at the letter's top edge */
.lb-letter-arrow {
  position: absolute;
  z-index: 4;
  left: 50%;
  width: 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 999px;
  color: #fff;
  background: var(--accent);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--accent) 22%, transparent),
    0 6px 14px -6px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  translate: -50% 0;
}
.lb-letter-arrow.down {
  bottom: calc(var(--env-h) * 0.6);
  animation: lb-nudge 1.4s ease-in-out 2s infinite;
}
.lb-letter-arrow.up {
  top: 0.4rem;
  width: 1.7rem;
  height: 1.7rem;
  opacity: 0.85;
}
.lb-letter-arrow:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
@keyframes lb-nudge {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(4px);
  }
}
.lb-arrow-enter-active,
.lb-arrow-leave-active {
  transition:
    opacity 0.25s ease,
    scale 0.25s ease;
}
.lb-arrow-enter-from,
.lb-arrow-leave-to {
  opacity: 0;
  scale: 0.6;
}

/* letter type */
.lb-letter-reply {
  margin: 0;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-style: italic;
  font-size: 1.05rem;
  color: var(--accent);
  animation: lb-line-in 0.6s ease 1.2s both;
}
.lb-letter-title {
  margin: 0.35rem 0 0.7rem;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-weight: 600;
  font-size: 1.65rem;
  line-height: 1.1;
  animation: lb-line-in 0.6s ease 1.25s both;
}
.lb-letter-p {
  margin: 0 0 0.75rem;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-size: 1.14rem;
  line-height: 1.6;
  animation: lb-line-in 0.7s ease both;
}
.lb-letter-end {
  margin-top: 0.4rem;
  animation: lb-line-in 0.7s ease both;
}
.lb-letter-divider {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.75rem;
  color: var(--accent);
  opacity: 0.8;
}
.lb-letter-divider i {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, color-mix(in srgb, var(--accent) 50%, transparent), transparent);
}
.lb-letter-sign {
  position: relative;
  width: fit-content;
  margin: 0.55rem 0 0 auto;
  padding-bottom: 0.35rem;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-style: italic;
  font-weight: 600;
  font-size: 1.35rem;
}
.lb-sign-line {
  position: absolute;
  left: -0.4rem;
  right: -0.6rem;
  bottom: -0.25rem;
  width: calc(100% + 1rem);
  height: 0.8rem;
  overflow: visible;
}
.lb-sign-line path {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-dasharray: 140;
  stroke-dashoffset: 140;
  animation: lb-draw 1s ease 0.4s forwards;
}
.lb-letter-end .lb-sign-line path {
  animation-delay: inherit;
}
@keyframes lb-draw {
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes lb-line-in {
  from {
    opacity: 0;
    transform: translateY(8px);
    filter: blur(3px);
  }
}
.lb-card-enter-active,
.lb-card-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.45s cubic-bezier(0.2, 1.3, 0.4, 1);
}
.lb-card-enter-from,
.lb-card-leave-to {
  opacity: 0;
  transform: translate(-50%, -46%) scale(0.92);
}
@media (prefers-reduced-motion: reduce) {
  .lb-ask-w,
  .lb-answer,
  .lb-env-flap,
  .lb-seal,
  .lb-letter,
  .lb-letter-reply,
  .lb-letter-title,
  .lb-letter-p,
  .lb-letter-end,
  .lb-env-go,
  .lb-ask-heart,
  .lb-letter-arrow {
    animation: none;
  }
  .lb-sign-line path {
    animation: none;
    stroke-dashoffset: 0;
  }
  .lb-env-flap {
    display: none; /* shown already open: no flap over the letter */
  }
}

/* ---------- hover pause + drag to turn ---------- */
.lb-book {
  cursor: grab;
  touch-action: pan-y; /* horizontal drags turn pages, vertical still scrolls */
  user-select: none;
  -webkit-user-select: none;
}
.lb-book.grabbing {
  cursor: grabbing;
}
.lb-leaf-prev {
  z-index: 3;
}
.lb-paused {
  position: absolute;
  z-index: 6;
  top: -2.1rem;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  white-space: nowrap;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--ink-2);
  background: var(--glass-fill-strong);
  border: 1px solid var(--glass-border);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  pointer-events: none;
}
</style>
