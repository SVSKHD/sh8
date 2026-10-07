<script setup>
/* four little cupids, one in each corner of the love book: the top pair
   tosses a heart in an arc over the spine, the bottom pair swings one low
   between them, half a toss out of step — each hops as it throws and catches.
   Every so often (at random) one throws a heart diagonally to the cupid in
   the opposite corner. Sized off the page ruling (--rule, set on .lb-book);
   purely decorative. */
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";

const pairs = ["top", "bottom"];
const sides = ["left", "right"];
const trail = [0, 1, 2, 3]; // the heart plus three fading copies behind it
const corner = (pair, side) => pair[0] + side[0]; // "tl", "tr", "bl", "br"

/* ---- the occasional diagonal toss ---- */
const DIAGONALS = [
  ["tl", "br"],
  ["br", "tl"],
  ["tr", "bl"],
  ["bl", "tr"],
];
const FLIGHT_MS = 1800; // keep in step with --diag in the CSS
const GAP_MS = [5000, 11000]; // random wait between diagonal tosses
const reduced =
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* each hand's spot, as CSS vars defined on .lb-cupids */
const hand = (c) => ({ x: "var(--hx-" + c[1] + ")", y: "var(--hy-" + c[0] + ")" });
const flight = ref(null); // { id, style }
const hops = reactive({ tl: false, tr: false, bl: false, br: false });
const timers = new Set();
const later = (fn, ms) => {
  const t = setTimeout(() => {
    timers.delete(t);
    fn();
  }, ms);
  timers.add(t);
};
const hop = (c) => {
  hops[c] = true;
  later(() => (hops[c] = false), 500);
};
let flights = 0;
const throwDiagonal = () => {
  const [from, to] = DIAGONALS[Math.floor(Math.random() * DIAGONALS.length)];
  const a = hand(from);
  const b = hand(to);
  flight.value = { id: ++flights, style: { "--x0": a.x, "--y0": a.y, "--x1": b.x, "--y1": b.y } };
  hop(from);
  later(() => hop(to), FLIGHT_MS - 150);
  later(() => (flight.value = null), FLIGHT_MS + 300); // let the trail land too
  queue();
};
const queue = () => later(throwDiagonal, GAP_MS[0] + Math.random() * (GAP_MS[1] - GAP_MS[0]));
onMounted(() => {
  if (!reduced) queue();
});
onBeforeUnmount(() => timers.forEach(clearTimeout));
</script>

<template>
  <div class="lb-cupids" aria-hidden="true">
    <div v-for="pair in pairs" :key="pair" class="lb-cupid-pair" :class="pair">
      <div v-for="side in sides" :key="side" class="lb-cupid" :class="side">
        <div class="lb-cupid-bob">
          <svg class="lb-cupid-svg" :class="{ hop: hops[corner(pair, side)] }" viewBox="0 0 64 64">
            <!-- bow slung on the back -->
            <path class="lb-cu-bow" d="M21 24 Q13 35.5 21 47" />
            <path class="lb-cu-string" d="M21 24 L21 47" />
            <!-- wings -->
            <g class="lb-cu-wing far">
              <path d="M30 31 C26 15 13 11 9 18 C6 23 11 26 9 30 C11 35 19 36 30 33 Z" />
            </g>
            <g class="lb-cu-wing">
              <path d="M28 32 C22 18 8 16 5 24 C3 29 9 31 7 35 C10 40 20 39 28 34 Z" />
              <path class="lb-cu-feather" d="M24 30 C18 26 12 25 8 27 M23 33 C18 32 13 33 10 34" />
            </g>
            <!-- legs, body, drape -->
            <ellipse class="lb-cu-skin" cx="27" cy="49" rx="4" ry="6" transform="rotate(25 27 49)" />
            <ellipse class="lb-cu-skin" cx="35" cy="50" rx="4" ry="6" transform="rotate(-15 35 50)" />
            <ellipse class="lb-cu-skin" cx="32" cy="39" rx="9" ry="10" />
            <path class="lb-cu-drape" d="M23 37 Q32 45 41 36 L41 41 Q32 51 24 43 Z" />
            <!-- arm reaching out to catch / throw -->
            <path class="lb-cu-arm" d="M37 34 Q43 33 48 29" />
            <circle class="lb-cu-skin" cx="49" cy="28.5" r="2.6" />
            <!-- head -->
            <circle class="lb-cu-skin" cx="35" cy="21" r="10" />
            <g class="lb-cu-hair">
              <circle cx="28" cy="16" r="4" />
              <circle cx="32" cy="12.5" r="4.5" />
              <circle cx="38" cy="11.5" r="4.5" />
              <circle cx="43" cy="15" r="3.6" />
              <circle cx="27" cy="21" r="3.2" />
            </g>
            <circle class="lb-cu-cheek" cx="41" cy="24" r="2.2" />
            <path class="lb-cu-line" d="M38.5 20 q1.5 -1.6 3 0" />
            <path class="lb-cu-line" d="M39 25.5 q2 1.8 4 0" />
          </svg>
        </div>
      </div>

      <!-- the heart's flight: x glides hand to hand, y arcs (up on top, low at the bottom) -->
      <div class="lb-pass">
        <div
          v-for="k in trail"
          :key="k"
          class="lb-pass-x"
          :class="{ trail: k > 0 }"
          :style="{ '--lag': k * 0.06 + 's', '--fade': 1 - k * 0.25 }"
        >
          <div class="lb-pass-y"><span class="lb-pass-heart">♥</span></div>
        </div>
      </div>
    </div>

    <!-- now and then: a heart thrown corner to opposite corner, across the pages -->
    <div v-if="flight" :key="flight.id" class="lb-diag" :style="flight.style">
      <div
        v-for="k in trail.slice(0, 3)"
        :key="k"
        class="lb-diag-x"
        :class="{ trail: k > 0 }"
        :style="{ '--lag': k * 0.06 + 's', '--fade': 1 - k * 0.3 }"
      >
        <div class="lb-diag-y"><span class="lb-pass-heart">♥</span></div>
      </div>
    </div>
  </div>
</template>

<style>
.lb-cupids {
  --cw: calc(var(--rule, 28px) * 2.3); /* cupid size */
  --cy: calc(var(--rule, 28px) * 0.3); /* from the top / bottom edge */
  --cx: 8%; /* from the outer edge */
  --pass: 2.4s; /* one toss */
  --diag: 1.8s; /* one diagonal toss (FLIGHT_MS) */
  /* where each cupid's hand is: left/right x, top/bottom y */
  --hx-l: calc(var(--cx) + var(--cw) * 0.77);
  --hx-r: calc(100% - var(--cx) - var(--cw) * 0.77);
  --hy-t: calc(var(--cy) + var(--cw) * 0.44);
  --hy-b: calc(100% - var(--cy) - var(--cw) * 0.56);
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
}
/* each pair is a band across the book; --shift offsets its timing, --arc
   is how far the heart rises (negative) or dips (positive) mid-flight */
.lb-cupid-pair {
  --shift: 0s;
  --arc: calc(var(--rule, 28px) * -1.4);
  position: absolute;
  left: 0;
  right: 0;
  height: var(--cw);
}
.lb-cupid-pair.top {
  top: var(--cy);
}
.lb-cupid-pair.bottom {
  --shift: calc(var(--pass) * -0.5);
  --arc: calc(var(--rule, 28px) * 0.7);
  bottom: var(--cy);
}
.lb-cupid {
  position: absolute;
  top: 0;
  width: var(--cw);
  height: var(--cw);
}
.lb-cupid.left {
  left: var(--cx);
}
.lb-cupid.right {
  right: var(--cx);
  transform: scaleX(-1); /* face the other one */
}
.lb-cupid-svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.18));
}
/* a slow hover, a lean-back as it throws, a little dip as it catches;
   the right cupid runs half a cycle behind, so it throws as the left catches */
.lb-cupid-bob {
  width: 100%;
  height: 100%;
  transform-origin: 50% 70%;
  animation: lb-cu-toss calc(var(--pass) * 2) ease-in-out var(--shift) infinite;
}
.lb-cupid.right .lb-cupid-bob {
  animation-delay: calc(var(--shift) - var(--pass));
}
@keyframes lb-cu-toss {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  6% {
    transform: translateY(-6px) rotate(-9deg);
  }
  16% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(4px) rotate(2deg);
  }
  86% {
    transform: translateY(0) rotate(0deg);
  }
  95% {
    transform: translateY(3px) rotate(6deg);
  }
}
.lb-cu-wing {
  transform-origin: 29px 32px;
  animation: lb-cu-flap 0.32s ease-in-out infinite alternate;
}
.lb-cu-wing path {
  fill: #fffdfb;
  stroke: color-mix(in srgb, var(--accent) 45%, #fff);
  stroke-width: 0.9;
  stroke-linejoin: round;
}
.lb-cu-wing.far {
  opacity: 0.7;
  animation-delay: -0.08s;
}
.lb-cu-wing .lb-cu-feather {
  fill: none;
  stroke-width: 0.7;
  stroke-linecap: round;
}
@keyframes lb-cu-flap {
  from {
    transform: rotate(14deg);
  }
  to {
    transform: rotate(-20deg);
  }
}
.lb-cu-skin {
  fill: #f8d3b9;
  stroke: #e3a98a;
  stroke-width: 0.6;
}
.lb-cu-arm {
  fill: none;
  stroke: #f8d3b9;
  stroke-width: 3.8;
  stroke-linecap: round;
}
.lb-cu-hair circle {
  fill: #e9b24f;
  stroke: #cf9536;
  stroke-width: 0.5;
}
.lb-cu-drape {
  fill: var(--accent);
  opacity: 0.9;
}
.lb-cu-cheek {
  fill: color-mix(in srgb, var(--accent) 55%, #ffb3b3);
  opacity: 0.55;
}
.lb-cu-line {
  fill: none;
  stroke: #5a3424;
  stroke-width: 1.1;
  stroke-linecap: round;
}
.lb-cu-bow {
  fill: none;
  stroke: #b07a3c;
  stroke-width: 1.8;
  stroke-linecap: round;
}
.lb-cu-string {
  stroke: color-mix(in srgb, #b07a3c 50%, #fff);
  stroke-width: 0.5;
}

/* the track runs from the left cupid's hand to the right one's */
.lb-pass {
  position: absolute;
  left: calc(var(--cx) + var(--cw) * 0.77);
  right: calc(var(--cx) + var(--cw) * 0.77);
  top: calc(var(--cw) * 0.44);
  height: 0;
}
.lb-pass-x {
  position: absolute;
  inset: 0;
  animation: lb-pass-x var(--pass) cubic-bezier(0.45, 0, 0.55, 1) calc(var(--shift) + var(--lag, 0s)) infinite alternate;
}
@keyframes lb-pass-x {
  to {
    transform: translateX(100%);
  }
}
.lb-pass-y {
  position: absolute;
  left: 0;
  top: 0;
  animation: lb-pass-y var(--pass) calc(var(--shift) + var(--lag, 0s)) infinite;
}
@keyframes lb-pass-y {
  0%,
  100% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0.3, 0.6, 0.5, 1);
  }
  50% {
    transform: translateY(var(--arc));
    animation-timing-function: cubic-bezier(0.5, 0, 0.7, 0.4);
  }
}
.lb-pass-heart {
  position: absolute;
  translate: -50% -50%;
  display: block;
  font-size: calc(var(--rule, 28px) * 0.85);
  line-height: 1;
  color: var(--accent);
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 70%, transparent));
  animation: lb-heartbeat 1.2s ease-in-out infinite;
}
.lb-pass-x.trail .lb-pass-heart {
  font-size: calc(var(--rule, 28px) * 0.5);
  opacity: calc(var(--fade) * 0.6);
  animation: none;
}

/* thrower / catcher hop for the diagonal toss */
.lb-cupid-svg.hop {
  transform-origin: 50% 90%;
  animation: lb-cu-hop 0.5s cubic-bezier(0.3, 1.4, 0.5, 1);
}
@keyframes lb-cu-hop {
  40% {
    transform: translateY(-8px) scale(1.08) rotate(-6deg);
  }
}

/* diagonal flight: x and y run on different easings, so the path curves */
.lb-diag {
  position: absolute;
  inset: 0;
}
.lb-diag-x {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0;
  left: var(--x0);
  animation: lb-diag-x var(--diag) cubic-bezier(0.45, 0, 0.55, 1) var(--lag, 0s) both;
}
@keyframes lb-diag-x {
  from {
    left: var(--x0);
  }
  to {
    left: var(--x1);
  }
}
.lb-diag-y {
  position: absolute;
  left: 0;
  top: var(--y0);
  animation: lb-diag-y var(--diag) cubic-bezier(0.6, 0, 0.8, 0.5) var(--lag, 0s) both;
}
@keyframes lb-diag-y {
  from {
    top: var(--y0);
  }
  to {
    top: var(--y1);
  }
}
.lb-diag .lb-pass-heart {
  animation: lb-diag-pop var(--diag) ease-in-out both;
}
@keyframes lb-diag-pop {
  0%,
  100% {
    transform: scale(0.8) rotate(0deg);
  }
  50% {
    transform: scale(1.5) rotate(-12deg);
  }
}
.lb-diag-x.trail .lb-pass-heart {
  font-size: calc(var(--rule, 28px) * 0.5);
  opacity: calc(var(--fade) * 0.6);
  animation: none;
}

@media (max-width: 640px) {
  .lb-cupids {
    --cx: 4%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .lb-cupid-bob,
  .lb-cu-wing,
  .lb-pass-x,
  .lb-pass-y,
  .lb-pass-heart {
    animation: none;
  }
  .lb-pass-x {
    transform: translateX(50%); /* the heart rests between them */
  }
  .lb-pass-y {
    transform: translateY(calc(var(--arc) * 0.7));
  }
  .lb-pass-x.trail {
    display: none;
  }
}
</style>
