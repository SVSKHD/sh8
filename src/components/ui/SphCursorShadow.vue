<script setup>
/* Glowing cursor with a moving love tail: a soft glow rides the pointer while
   moving it spawns little clusters of hearts that drift up, shrink, rotate and
   fade. Fully theme-driven — every heart is colored from the `heartColor` prop
   (shaded slightly per particle for depth), never a hardcoded pink. A multiply
   blend keeps hearts/glow visible on bright backgrounds and never black. */
import { onBeforeUnmount, onMounted, ref } from "vue";
import { shade } from "../../utils/colors";

const props = defineProps({
  heartColor: { type: String, default: "#e0526f" },
  glowColor: { type: String, default: "#e0526f" },
  /* base heart size in px */
  size: { type: Number, default: 18 },
  /* hearts spawned per cluster */
  clusterSize: { type: Number, default: 3 },
  /* hard cap on live particles — oldest are dropped past this */
  maxParticles: { type: Number, default: 45 },
  /* px the pointer must travel before a new cluster spawns (0 = idle, none) */
  spawnDistance: { type: Number, default: 22 },
});

const HEART_PATH =
  "M12 21s-1-.7-3.2-2.6C5.9 15.4 3 12.9 3 9.5 3 7 5 5 7.5 5c1.6 0 3.1.8 4.5 2.6C13.4 5.8 14.9 5 16.5 5 19 5 21 7 21 9.5c0 3.4-2.9 5.9-5.8 8.9C13 20.3 12 21 12 21z";

const reduceMotion =
  typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

const glow = ref(null);
const particles = ref([]);
let raf = 0;
let seq = 0;
let last = 0;

const gTarget = { x: -100, y: -100 };
const gPos = { x: -100, y: -100 };
const lastSpawn = { x: null, y: null };

const rand = (a, b) => a + Math.random() * (b - a);

/* one little bunch of hearts scattered around (x, y) */
function spawnCluster(x, y) {
  for (let i = 0; i < props.clusterSize; i++) {
    particles.value.push({
      id: seq++,
      x: x + rand(-10, 10),
      y: y + rand(-10, 10),
      vx: rand(-0.03, 0.03), // px/ms, gentle horizontal drift
      vy: rand(-0.09, -0.04), // px/ms, upward
      life: 0,
      maxLife: rand(900, 1600),
      rot: rand(-25, 25),
      rotSpeed: rand(-0.06, 0.06),
      scale0: rand(0.65, 1.2),
      color: shade(props.heartColor, rand(-0.18, 0.22)),
      opacity: 1,
      scale: 1,
    });
  }
  /* drop the oldest once we're over the cap */
  const over = particles.value.length - props.maxParticles;
  if (over > 0) particles.value.splice(0, over);
}

function onMove(x, y) {
  gTarget.x = x;
  gTarget.y = y;
  if (reduceMotion) return; // keep the glow, skip the motion of hearts
  if (lastSpawn.x == null) {
    lastSpawn.x = x;
    lastSpawn.y = y;
    return;
  }
  const dist = Math.hypot(x - lastSpawn.x, y - lastSpawn.y);
  if (dist < props.spawnDistance) return;
  /* farther / faster travel between events → more clusters */
  const clusters = Math.min(4, Math.floor(dist / props.spawnDistance));
  for (let c = 0; c < clusters; c++) spawnCluster(x, y);
  lastSpawn.x = x;
  lastSpawn.y = y;
}

const onPointer = (e) => onMove(e.clientX, e.clientY);
const onTouch = (e) => {
  const t = e.touches && e.touches[0];
  if (t) onMove(t.clientX, t.clientY);
};

function tick(now) {
  const dt = last ? Math.min(48, now - last) : 16;
  last = now;

  /* glow eases toward the cursor */
  gPos.x += (gTarget.x - gPos.x) * 0.18;
  gPos.y += (gTarget.y - gPos.y) * 0.18;
  if (glow.value) glow.value.style.transform = `translate3d(${gPos.x}px, ${gPos.y}px, 0) translate(-50%, -50%)`;

  if (particles.value.length) {
    const next = [];
    for (const p of particles.value) {
      const life = p.life + dt;
      if (life >= p.maxLife) continue;
      const t = life / p.maxLife;
      next.push({
        ...p,
        life,
        x: p.x + p.vx * dt,
        y: p.y + p.vy * dt,
        rot: p.rot + p.rotSpeed * dt,
        opacity: 1 - t,
        scale: p.scale0 * (1 - 0.55 * t),
      });
    }
    particles.value = next;
  }
  raf = requestAnimationFrame(tick);
}

onMounted(() => {
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("touchmove", onTouch, { passive: true });
  raf = requestAnimationFrame(tick);
});
onBeforeUnmount(() => {
  window.removeEventListener("pointermove", onPointer);
  window.removeEventListener("touchmove", onTouch);
  cancelAnimationFrame(raf);
});
</script>

<template>
  <div class="cursor-love" aria-hidden="true">
    <!-- soft glow that rides the cursor -->
    <div
      ref="glow"
      class="cl-glow"
      :style="{
        width: size * 2 + 'px',
        height: size * 2 + 'px',
        background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
      }"
    ></div>
    <!-- drifting hearts -->
    <svg
      v-for="p in particles"
      :key="p.id"
      class="cl-heart"
      viewBox="0 0 24 24"
      :width="size"
      :height="size"
      :style="{
        transform: `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%) rotate(${p.rot}deg) scale(${p.scale})`,
        opacity: p.opacity,
      }"
    >
      <path :d="HEART_PATH" :fill="p.color" />
    </svg>
  </div>
</template>

<style scoped>
.cursor-love {
  position: fixed;
  inset: 0;
  z-index: 9998;
  pointer-events: none;
  overflow: hidden;
  mix-blend-mode: multiply;
}
.cl-glow {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  opacity: 0.5;
  filter: blur(7px);
  will-change: transform;
}
.cl-heart {
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform, opacity;
}
</style>
