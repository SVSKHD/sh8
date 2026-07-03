<script setup>
/* Slow, always-on ambient background of gently drifting hearts and stars —
   distinct from the interactive cursor trail (foreground, pointer-driven)
   and SphThemedStars (twinkle-in-place, no drift). Reuses the same
   upward-drift keyframe shape as the lock screen's .float-heart (themes.css)
   and the same seeded-pseudo-random technique as SphThemedStars.vue so the
   field is stable across re-renders — generalized here into a reusable,
   theme-agnostic component with mixed heart/star shapes. */
import { computed } from "vue";
import { shade } from "../../utils/colors";

const props = defineProps({
  count: { type: Number, default: 24 },
  themeColor: { type: String, default: "#e0526f" },
  mode: { type: String, default: "light" }, // 'light' | 'dark'
  shapes: { type: Array, default: () => ["heart", "star"] },
});

const HEART_PATH =
  "M12 21s-1-.7-3.2-2.6C5.9 15.4 3 12.9 3 9.5 3 7 5 5 7.5 5c1.6 0 3.1.8 4.5 2.6C13.4 5.8 14.9 5 16.5 5 19 5 21 7 21 9.5c0 3.4-2.9 5.9-5.8 8.9C13 20.3 12 21 12 21z";
const STAR_PATH = "M12 2l2.9 6.9L22 9.5l-5.5 4.8L18 22l-6-3.9L6 22l1.5-7.7L2 9.5l7.1-.6L12 2z";

/* stable hashed pseudo-random in [0,1) — no flicker across re-renders */
function rand(i, salt) {
  const x = Math.sin(i * 928.371 + salt * 137.13) * 43758.5453;
  return x - Math.floor(x);
}
const between = (i, salt, a, b) => a + rand(i, salt) * (b - a);

const field = computed(() => {
  const n = Math.max(0, Math.floor(props.count) || 0);
  const shapeList = props.shapes && props.shapes.length ? props.shapes : ["heart", "star"];
  const out = [];
  for (let i = 0; i < n; i++) {
    const shape = shapeList[Math.floor(rand(i, 1) * shapeList.length) % shapeList.length];
    out.push({
      id: i,
      shape,
      left: between(i, 2, 0, 100),
      size: between(i, 3, 10, 24),
      duration: between(i, 4, 20, 44),
      delay: -between(i, 5, 0, 44), // negative delay: already mid-flight on first paint
      sway: between(i, 6, -70, 70),
      rot: between(i, 7, -40, 40),
      opacity: between(i, 8, 0.08, 0.22) * (props.mode === "dark" ? 1.6 : 1),
      color: shade(props.themeColor, between(i, 9, -0.1, 0.35) * (props.mode === "dark" ? -1 : 1)),
    });
  }
  return out;
});

const blendMode = computed(() => (props.mode === "dark" ? "screen" : "multiply"));
</script>

<template>
  <div class="floating-love-field" aria-hidden="true" :style="{ mixBlendMode: blendMode }">
    <svg
      v-for="f in field"
      :key="f.id"
      class="flf-item"
      viewBox="0 0 24 24"
      :width="f.size"
      :height="f.size"
      :style="{
        left: f.left + '%',
        '--sway': f.sway + 'px',
        '--rot': f.rot + 'deg',
        '--op': f.opacity,
        animationDuration: f.duration + 's',
        animationDelay: f.delay + 's',
      }"
    >
      <path :d="f.shape === 'star' ? STAR_PATH : HEART_PATH" :fill="f.color" />
    </svg>
  </div>
</template>

<style scoped>
.floating-love-field {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}
.flf-item {
  position: absolute;
  bottom: -3rem;
  opacity: 0;
  animation-name: flf-drift;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
@keyframes flf-drift {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: var(--op);
  }
  85% {
    opacity: var(--op);
  }
  100% {
    transform: translate(var(--sway), -125vh) rotate(var(--rot));
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .flf-item {
    animation: none;
    opacity: 0;
  }
}
</style>
