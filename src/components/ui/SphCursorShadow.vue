<script setup>
/* A soft glowing dot that trails the cursor. Theme-agnostic: the glow color
   is passed in so the parent can feed it the active theme's accent. Uses a
   multiply blend so it tints (never blackens) bright backgrounds. */
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({
  color: { type: String, default: "#e0526f" },
  size: { type: Number, default: 34 },
  /* 0–1 easing factor per frame; lower = longer, lazier trail */
  ease: { type: Number, default: 0.15 },
});

const dot = ref(null);
let raf = 0;
const target = { x: -100, y: -100 };
const pos = { x: -100, y: -100 };

const onMove = (e) => {
  target.x = e.clientX;
  target.y = e.clientY;
};

const tick = () => {
  pos.x += (target.x - pos.x) * props.ease;
  pos.y += (target.y - pos.y) * props.ease;
  if (dot.value) dot.value.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
  raf = requestAnimationFrame(tick);
};

onMounted(() => {
  window.addEventListener("pointermove", onMove, { passive: true });
  raf = requestAnimationFrame(tick);
});
onBeforeUnmount(() => {
  window.removeEventListener("pointermove", onMove);
  cancelAnimationFrame(raf);
});
</script>

<template>
  <div
    ref="dot"
    class="cursor-shadow"
    aria-hidden="true"
    :style="{
      width: size + 'px',
      height: size + 'px',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    }"
  ></div>
</template>

<style scoped>
.cursor-shadow {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9998;
  border-radius: 50%;
  pointer-events: none;
  mix-blend-mode: multiply;
  opacity: 0.55;
  filter: blur(6px);
  will-change: transform;
}
/* pointer trails make no sense on touch, and multiply can darken OLED darks */
@media (hover: none) {
  .cursor-shadow {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cursor-shadow {
    display: none;
  }
}
</style>
