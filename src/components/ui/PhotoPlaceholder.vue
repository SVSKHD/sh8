<script setup>
defineProps({
  label: { type: String, default: "photo" },
  height: { type: [Number, String], default: 160 },
});
</script>

<template>
  <div class="photo-ph" :style="{ height: height + 'px' }">
    <span>{{ label }}</span>
  </div>
</template>
