<script setup>
/* one page of the love book (see SphLoveBook) — `live` makes the letters
   dance (only the page facing you; the one underneath waits still).

   Writing sits on the paper's ruling: the page is ROWS ruled lines tall, each
   text block is a whole number of lines high, and fit() shrinks the big line
   until every word fits the page (in at most MAX_LINES lines), then snaps the
   block onto a ruled row. */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { dancesByLetter } from "../loveBook";

const props = defineProps({
  page: { type: Object, required: true },
  index: { type: Number, required: true },
  live: { type: Boolean, default: false },
});

const ROWS = 16; // keep in step with --rows on .lb-book
const MAX_LINES = 2; // the big line wraps onto at most this many ruled lines (each two rules tall)

/* words (kept whole when wrapping), each split into letters for Latin script
   or left whole otherwise (keeps joined scripts intact) */
const words = computed(() => {
  const text = (props.page.line || "").trim();
  if (!text) return [];
  const byLetter = dancesByLetter(text);
  let i = 0;
  return text.split(/\s+/).map((w) => (byLetter ? Array.from(w) : [w]).map((ch) => ({ ch, i: i++ })));
});

const pageEl = ref(null);
const bodyEl = ref(null);
const lineEl = ref(null);
const fit = () => {
  const page = pageEl.value;
  const body = bodyEl.value;
  const line = lineEl.value;
  if (!page || !body || !line) return;
  const rule = page.clientHeight / ROWS;
  if (!rule) return; // not laid out
  // offset* ignore transforms, so dancing letters and the turning leaf don't skew this
  const wordEls = line.querySelectorAll(".lb-word");
  let scale = 1;
  line.style.setProperty("--fit", "1");
  for (let k = 0; k < 14; k++) {
    let widest = 0;
    wordEls.forEach((el) => (widest = Math.max(widest, el.offsetWidth)));
    if (widest <= line.clientWidth + 1 && line.offsetHeight <= rule * 2 * MAX_LINES + 1) break;
    scale *= 0.9;
    line.style.setProperty("--fit", scale.toFixed(3));
  }
  // centre the block between the cupids (top three rows) and the language label
  const rows = Math.round(body.offsetHeight / rule);
  body.style.setProperty("--top", String(Math.max(2, 3 + Math.floor((10 - rows) / 2))));
};

let ro = null;
onMounted(() => {
  fit();
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(() => fit());
    ro.observe(pageEl.value);
  }
  if (typeof document !== "undefined" && document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
});
watch(
  () => props.page,
  () => nextTick(fit),
);
onBeforeUnmount(() => ro && ro.disconnect());

/* a few doodle hearts, placed by page number so they don't jump around */
const doodles = Array.from({ length: 5 }, (_, k) => {
  const x = Math.sin((props.index + 1) * 12.9898 + k * 78.233) * 43758.5453;
  const r = x - Math.floor(x);
  return {
    left: 8 + ((r * 997 + k * 19) % 84) + "%",
    top: 6 + ((r * 571 + k * 23) % 86) + "%",
    fontSize: 0.7 + ((r * 13) % 1) * 0.9 + "rem",
    animationDelay: -((r * 7) % 4) + "s",
  };
});
</script>

<template>
  <div ref="pageEl" class="lb-page" :class="['k-' + page.kind, { live }]">
    <span v-for="(d, k) in doodles" :key="k" class="lb-doodle" :style="d" aria-hidden="true">♥</span>
    <div ref="bodyEl" class="lb-body">
      <p v-if="page.kind === 'cover'" class="lb-kicker">a book of love for</p>
      <p ref="lineEl" class="lb-line" dir="auto">
        <template v-for="(word, w) in words" :key="w"
          ><span class="lb-word"
            ><span v-for="c in word" :key="c.i" class="lb-ch" :style="{ animationDelay: c.i * 0.07 + 's' }">{{
              c.ch
            }}</span></span
          >{{ w < words.length - 1 ? " " : "" }}</template
        >
      </p>
      <p v-if="page.sub" class="lb-sub">{{ page.sub }}</p>
      <p v-if="page.foot" class="lb-foot">{{ page.foot }}</p>
      <div v-if="page.kind === 'finale'" class="lb-beat" aria-hidden="true">♥</div>
    </div>
    <p v-if="page.kind === 'love' && page.lang" class="lb-lang">{{ page.lang }}</p>
    <span v-if="page.kind !== 'cover'" class="lb-num">{{ index + 1 }}</span>
  </div>
</template>
