<script setup>
defineProps({
  modelValue: { type: [String, Number], default: "" },
  label: { type: String, default: "" },
  type: { type: String, default: "text" },
  placeholder: { type: String, default: "" },
});
defineEmits(["update:modelValue"]);
</script>

<template>
  <label class="block">
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
