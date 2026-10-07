<script setup>
import SphGlassDatePicker from "./SphGlassDatePicker.vue";

defineProps({
  modelValue: { type: [String, Number], default: "" },
  label: { type: String, default: "" },
  type: { type: String, default: "text" },
  placeholder: { type: String, default: "" },
  /* date fields only: earliest selectable day, "YYYY-MM-DD" */
  min: { type: String, default: "" },
});
defineEmits(["update:modelValue"]);
</script>

<template>
  <!-- date / datetime fields get the glass picker instead of the native control -->
  <sph-glass-date-picker
    v-if="type === 'date' || type === 'datetime-local'"
    :model-value="modelValue == null ? '' : String(modelValue)"
    :label="label"
    :placeholder="placeholder"
    :min="min"
    :with-time="type === 'datetime-local'"
    @update:model-value="$emit('update:modelValue', $event)"
  />
  <label v-else class="block">
    <span v-if="label" class="glabel">{{ label }}</span>
    <textarea
      v-if="type === 'textarea'"
      class="ginput"
      :value="modelValue"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
    ></textarea>
    <input
      v-else
      class="ginput"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </label>
</template>
