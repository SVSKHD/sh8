<script setup>
defineProps({
  emoji: { type: String, default: "❤️" },
  message: { type: String, default: "Nothing here yet." },
  hint: { type: String, default: "Tap the + to add the first one." },
});
</script>

<template>
  <div class="text-center py-12 px-4">
    <div class="text-4xl mb-3" style="filter: saturate(0.9)">{{ emoji }}</div>
    <p class="font-display italic text-xl m-0" style="color: var(--ink-2)">{{ message }}</p>
    <p class="text-sm mt-1 mb-0" style="color: var(--ink-3)">{{ hint }}</p>
  </div>
</template>
