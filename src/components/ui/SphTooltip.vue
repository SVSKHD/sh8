<script setup>
import { computed } from "vue";

let nextId = 0;
const props = defineProps({
  text: { type: String, required: true },
  placement: { type: String, default: "top", validator: (value) => ["top", "bottom", "left", "right"].includes(value) },
});

const placement = computed(() => props.placement);
const tooltipId = computed(() => `sph-tooltip-${++nextId}`);
</script>

<template>
  <span class="sph-tooltip" :class="`sph-tooltip-${placement}`">
    <span class="sph-tooltip-trigger" :aria-describedby="tooltipId">
      <slot />
    </span>
    <span :id="tooltipId" class="sph-tooltip-bubble" role="tooltip">{{ text }}</span>
  </span>
</template>

<style scoped>
.sph-tooltip {
  position: relative;
  display: inline-flex;
  max-width: 100%;
}
.sph-tooltip-trigger {
  display: inline-flex;
  max-width: 100%;
}
.sph-tooltip-bubble {
  position: absolute;
  z-index: 80;
  width: max-content;
  max-width: min(15rem, calc(100vw - 2rem));
  padding: 0.38rem 0.7rem;
  border: 1px solid color-mix(in srgb, var(--glass-border) 72%, var(--accent) 28%);
  border-radius: 0.7rem;
  color: var(--ink);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--glass-fill-strong) 82%, var(--accent-soft) 18%),
    var(--glass-fill)
  );
  box-shadow:
    inset 0 1px 0 var(--glass-highlight),
    inset 0 0 0 1px color-mix(in srgb, var(--accent-soft) 45%, transparent),
    0 10px 28px -10px var(--glass-shadow);
  -webkit-backdrop-filter: blur(22px) saturate(1.45);
  backdrop-filter: blur(22px) saturate(1.45);
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.25;
  text-align: center;
  pointer-events: none;
  opacity: 0;
  transform: translate(var(--tooltip-x, -50%), var(--tooltip-y, 0.35rem)) scale(0.96);
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.sph-tooltip-bubble::after {
  content: "";
  position: absolute;
  width: 0.45rem;
  height: 0.45rem;
  border-right: 1px solid color-mix(in srgb, var(--glass-border) 72%, var(--accent) 28%);
  border-bottom: 1px solid color-mix(in srgb, var(--glass-border) 72%, var(--accent) 28%);
  background: color-mix(in srgb, var(--glass-fill-strong) 82%, var(--accent-soft) 18%);
  transform: rotate(45deg);
}
.sph-tooltip-top .sph-tooltip-bubble {
  left: 50%;
  bottom: calc(100% + 0.55rem);
  --tooltip-x: -50%;
}
.sph-tooltip-top .sph-tooltip-bubble::after {
  left: 50%;
  bottom: -0.28rem;
  margin-left: -0.225rem;
}
.sph-tooltip-bottom .sph-tooltip-bubble {
  left: 50%;
  top: calc(100% + 0.55rem);
  --tooltip-x: -50%;
  --tooltip-y: -0.35rem;
}
.sph-tooltip-bottom .sph-tooltip-bubble::after {
  left: 50%;
  top: -0.28rem;
  margin-left: -0.225rem;
  transform: rotate(225deg);
}
.sph-tooltip-left .sph-tooltip-bubble {
  right: calc(100% + 0.55rem);
  top: 50%;
  --tooltip-x: 0;
  --tooltip-y: -50%;
}
.sph-tooltip-left .sph-tooltip-bubble::after {
  right: -0.28rem;
  top: 50%;
  margin-top: -0.225rem;
  transform: rotate(-45deg);
}
.sph-tooltip-right .sph-tooltip-bubble {
  left: calc(100% + 0.55rem);
  top: 50%;
  --tooltip-x: 0;
  --tooltip-y: -50%;
}
.sph-tooltip-right .sph-tooltip-bubble::after {
  left: -0.28rem;
  top: 50%;
  margin-top: -0.225rem;
  transform: rotate(135deg);
}
.sph-tooltip:hover .sph-tooltip-bubble,
.sph-tooltip:focus-within .sph-tooltip-bubble {
  opacity: 1;
  transform: translate(var(--tooltip-x, -50%), var(--tooltip-y, 0)) scale(1);
}
@media (prefers-reduced-motion: reduce) {
  .sph-tooltip-bubble {
    transition: none;
  }
}
</style>
