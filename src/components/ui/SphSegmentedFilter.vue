<script setup>
/* Generic segmented filter control — reuses the app's existing `.seg`
   pill-group styling (already themed via CSS custom properties, see
   themes.css) so every per-person filter (Tasks/Reminders/Wishes/Plans)
   looks and behaves identically instead of each screen rolling its own. */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

defineEmits(["update:modelValue"]);

const props = defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array, required: true },
});
const bar = ref(null);
const buttons = {};
const indicatorStyle = ref({ opacity: 0 });
const setButton = (value, element) => {
  if (element) buttons[value] = element;
};
const placeIndicator = () => {
  const button = buttons[props.modelValue];
  if (!button) return;
  indicatorStyle.value = { left: `${button.offsetLeft}px`, width: `${button.offsetWidth}px`, opacity: 1 };
};
watch(
  () => props.modelValue,
  () => nextTick(placeIndicator),
);
onMounted(() => {
  nextTick(placeIndicator);
  window.addEventListener("resize", placeIndicator);
});
onBeforeUnmount(() => window.removeEventListener("resize", placeIndicator));
</script>

<template>
  <div ref="bar" class="seg seg-filter" role="tablist">
    <span class="seg-indicator" :style="indicatorStyle" aria-hidden="true"></span>
    <button
      v-for="o in options"
      :key="o.value"
      :ref="(element) => setButton(o.value, element)"
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
