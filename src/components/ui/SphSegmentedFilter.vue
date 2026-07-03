<script setup>
/* Generic segmented filter control — reuses the app's existing `.seg`
   pill-group styling (already themed via CSS custom properties, see
   themes.css) so every per-person filter (Tasks/Reminders/Wishes/Plans)
   looks and behaves identically instead of each screen rolling its own. */
defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array, required: true }, // [{ value, label }]
});
defineEmits(["update:modelValue"]);
</script>

<template>
  <div class="seg" role="tablist">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === o.value"
      :class="{ on: modelValue === o.value }"
      @click="$emit('update:modelValue', o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>
