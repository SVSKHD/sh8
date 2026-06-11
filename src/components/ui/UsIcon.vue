<script setup>
import { Heart } from "lucide-vue-next";
import { ICONS } from "../../icons";

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 18 },
  strokeWidth: { type: [Number, String], default: 2 },
});
</script>

<template>
  <span class="inline-flex items-center justify-center" :style="{ width: size + 'px', height: size + 'px' }" aria-hidden="true">
    <component :is="ICONS[name] || Heart" :size="Number(size)" :stroke-width="Number(strokeWidth)" />
  </span>
</template>
