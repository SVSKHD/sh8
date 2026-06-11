<script setup>
defineProps({
  modelValue: { type: String, default: "" },
  label: { type: String, default: "" },
  options: { type: Array, default: () => [] },
});
defineEmits(["update:modelValue"]);
</script>

<template>
  <label class="block">
    <span v-if="label" class="glabel">{{ label }}</span>
    <select class="ginput" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
      <option v-for="o in options" :key="o" :value="o">{{ o }}</option>
    </select>
  </label>
</template>
