<script setup>
/* Small, elegant, rotating love-quote display fixed in a corner. Cycles on
   a timer with a soft fade/slide transition. Purely reads the existing
   theme tokens (--ink-2, --ink-3, --accent, .glass) — the app's own
   per-theme contrast contract already guarantees these are readable in
   both light and dark modes, so no extra mode logic is needed here. */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const DEFAULT_QUOTES = [
  { text: "Every love story is beautiful, but ours is my favorite." },
  { text: "Home isn't a place — it's you." },
  { text: "In all the world, there is no heart for me like yours.", author: "Maya Angelou" },
  { text: "Two little words, a whole lifetime: with you." },
  { text: "You are my today and all of my tomorrows.", author: "Leo Christopher" },
  { text: "Some days the best thing I did was love you a little harder." },
  { text: "Whatever our souls are made of, yours and mine are the same.", author: "Emily Brontë" },
  { text: "I'd choose you in a hundred lifetimes, in a hundred worlds." },
];

const props = defineProps({
  /* falls back to a built-in romantic default set when omitted/empty —
     see the `list` computed below (defineProps defaults can't reference
     module-scope constants, so the fallback lives there instead) */
  quotes: { type: Array, default: () => [] },
  /* seconds between quotes */
  interval: { type: Number, default: 8 },
  corner: { type: String, default: "bottom-left" }, // bottom-left | bottom-right | top-left | top-right
});

const list = computed(() => (props.quotes && props.quotes.length ? props.quotes : DEFAULT_QUOTES));
const index = ref(0);
const current = computed(() => list.value[index.value % list.value.length]);

let timer = null;
onMounted(() => {
  timer = setInterval(
    () => {
      index.value = (index.value + 1) % list.value.length;
    },
    Math.max(2, props.interval) * 1000,
  );
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <div class="love-quotes" :class="corner" aria-hidden="true">
    <transition name="lq-fade" mode="out-in">
      <p :key="index" class="glass love-quotes-card font-display italic">
        “{{ current.text }}”
        <span v-if="current.author" class="love-quotes-author">— {{ current.author }}</span>
      </p>
    </transition>
  </div>
</template>

<style scoped>
.love-quotes {
  position: fixed;
  z-index: 35;
  pointer-events: none;
  max-width: min(20rem, calc(100vw - 2rem));
}
.love-quotes.bottom-left {
  left: 1rem;
  bottom: 1rem;
}
.love-quotes.bottom-right {
  right: 1rem;
  bottom: 1rem;
}
.love-quotes.top-left {
  left: 1rem;
  top: 1rem;
}
.love-quotes.top-right {
  right: 1rem;
  top: 1rem;
}

.love-quotes-card {
  margin: 0;
  padding: 0.6rem 1rem;
  border-radius: 1.1rem;
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--ink-2);
}
.love-quotes-author {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.7rem;
  font-style: normal;
  color: var(--ink-3);
}

.lq-fade-enter-active,
.lq-fade-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}
.lq-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.lq-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
@media (prefers-reduced-motion: reduce) {
  .lq-fade-enter-active,
  .lq-fade-leave-active {
    transition: none;
  }
}

/* mobile: keep clear of the fixed bottom tab bar */
@media (max-width: 640px) {
  .love-quotes.bottom-left,
  .love-quotes.bottom-right {
    bottom: calc(5.6rem + env(safe-area-inset-bottom, 0px));
  }
}
</style>
