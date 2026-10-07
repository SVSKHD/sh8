<script setup>
import SphIcon from "./SphIcon.vue";

defineProps({
  label: { type: String, default: "photo" },
  height: { type: [Number, String], default: 160 },
});
</script>

<template>
  <div class="photo-ph" :style="{ height: height + 'px' }">
    <sph-icon v-if="Number(height) >= 70" name="Image" :size="Number(height) >= 140 ? 26 : 20" :stroke-width="1.6" />
    <span class="photo-ph-label">{{ label }}</span>
  </div>
</template>
