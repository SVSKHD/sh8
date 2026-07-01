<script setup>
/* Full-screen twinkling star layer that sits behind all content. Star color is
   derived from the theme background's luminance so it always contrasts — and is
   never black: bright themes get warm gold, deeper themes get soft white-gold,
   keeping the app bright. Fully prop-driven and theme-agnostic. */
import { computed } from "vue";
import { luminance, parseColor } from "../../utils/colors";

const props = defineProps({
  themeColor: { type: String, default: "#fdf2f5" },
  count: { type: Number, default: 60 },
});

/* stable hashed pseudo-random in [0,1) — no flicker across re-renders */
function rand(i, salt) {
  const x = Math.sin(i * 928.371 + salt * 137.13) * 43758.5453;
  return x - Math.floor(x);
}

const stars = computed(() => {
  const n = Math.max(0, Math.floor(props.count) || 0);
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      id: i,
      left: rand(i, 1) * 100,
      top: rand(i, 2) * 100,
      size: 1 + rand(i, 3) * 2.2,
      delay: rand(i, 4) * 6,
      dur: 2.5 + rand(i, 5) * 4,
      op: 0.3 + rand(i, 6) * 0.6,
    });
  }
  return out;
});

const starColor = computed(() => {
  const c = parseColor(props.themeColor);
  if (!c) return "#fff4d6";
  /* bright background → warm gold; deep background → soft white-gold. never black. */
  return luminance(c) > 0.5 ? "#e9b44a" : "#fff4d6";
});
</script>

<template>
  <div class="themed-stars" aria-hidden="true">
    <span
      v-for="s in stars"
      :key="s.id"
      class="star"
      :style="{
        left: s.left + '%',
        top: s.top + '%',
        width: s.size + 'px',
        height: s.size + 'px',
        color: starColor,
        background: starColor,
        '--op': s.op,
        animationDelay: s.delay + 's',
        animationDuration: s.dur + 's',
      }"
    ></span>
  </div>
</template>

<style scoped>
.themed-stars {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}
.star {
  position: absolute;
  border-radius: 50%;
  opacity: var(--op, 0.6);
  box-shadow: 0 0 4px currentColor;
  animation: twinkle ease-in-out infinite alternate;
}
@keyframes twinkle {
  from {
    transform: scale(0.6);
    opacity: 0.15;
  }
  to {
    transform: scale(1);
    opacity: var(--op, 0.7);
  }
}
@media (prefers-reduced-motion: reduce) {
  .star {
    animation: none;
  }
}
</style>
