<script setup>
import SphIcon from "./SphIcon.vue";

/* tab section heading: accent icon badge + serif title + small count line */
defineProps({
  icon: { type: String, default: "Heart" },
  sub: { type: String, default: "" },
  /* no bottom margin — for headings sharing a row with controls */
  flush: { type: Boolean, default: false },
});
</script>

<template>
  <div class="section-title" :class="{ flush }">
    <span class="section-badge"><sph-icon :name="icon" :size="20" :stroke-width="1.9" /></span>
    <div class="min-w-0">
      <h2 class="font-display m-0 text-3xl font-semibold italic leading-tight"><slot /></h2>
      <p v-if="sub" class="section-sub">{{ sub }}</p>
    </div>
  </div>
</template>
