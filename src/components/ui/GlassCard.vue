<script setup>
defineProps({
  hover: { type: Boolean, default: false },
  strong: { type: Boolean, default: false },
  radius: { type: String, default: "1.25rem" },
  pad: { type: String, default: "1.1rem" },
});
</script>

<template>
  <div class="glass" :class="{ 'glass-hover': hover, 'glass-strong': strong }" :style="{ borderRadius: radius, padding: pad }">
    <slot />
  </div>
</template>
