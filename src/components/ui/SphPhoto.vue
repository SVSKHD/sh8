<script setup>
import SphPhotoPlaceholder from "./SphPhotoPlaceholder.vue";

/* real photo when `src` is a URL, soft placeholder otherwise (older items
   stored `photo: true` as a "photo goes here" flag) */
defineProps({
  src: { type: [String, Boolean], default: null },
  alt: { type: String, default: "" },
  label: { type: String, default: "photo" },
  height: { type: [Number, String], default: 160 },
  radius: { type: String, default: "0.9rem" },
});
</script>

<template>
  <img
    v-if="typeof src === 'string' && src"
    :src="src"
    :alt="alt"
    loading="lazy"
    decoding="async"
    class="block w-full"
    :style="{ height: height + 'px', objectFit: 'cover', borderRadius: radius }"
  />
  <sph-photo-placeholder v-else :label="label" :height="height" />
</template>
