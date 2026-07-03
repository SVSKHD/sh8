<script setup>
defineProps({
  modelValue: { type: String, default: "" },
  label: { type: String, default: "" },
  /* plain strings ("Soon"/"Someday"), or { value, label } objects when the
     stored value (e.g. an id) needs to differ from the display text */
  options: { type: Array, default: () => [] },
});
defineEmits(["update:modelValue"]);

const optValue = (o) => (o && typeof o === "object" ? o.value : o);
const optLabel = (o) => (o && typeof o === "object" ? o.label : o);
</script>

<template>
  <label class="block">
    <span v-if="label" class="glabel">{{ label }}</span>
    <select class="ginput" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
      <option v-for="o in options" :key="optValue(o)" :value="optValue(o)">{{ optLabel(o) }}</option>
    </select>
  </label>
</template>
