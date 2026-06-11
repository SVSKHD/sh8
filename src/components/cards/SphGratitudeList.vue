<script setup>
import SphEmptyState from "../ui/SphEmptyState.vue";
import SphGratitudeCard from "./SphGratitudeCard.vue";

defineProps({
  items: { type: Array, required: true },
  intro: { type: String, default: "" },
  emptyMessage: { type: String, default: "No sweet notes yet." },
});
defineEmits(["remove"]);
</script>

<template>
  <div>
    <p v-if="intro && items.length" class="m-0 mb-4 text-sm" style="color: var(--ink-3)">{{ intro }}</p>
    <div class="grid gap-3">
      <sph-gratitude-card v-for="(g, i) in items" :key="g.id" :item="g" :style="{ '--i': i }" @remove="$emit('remove', g.id)" />
    </div>
    <sph-empty-state v-if="!items.length" emoji="💌" :message="emptyMessage" />
  </div>
</template>
