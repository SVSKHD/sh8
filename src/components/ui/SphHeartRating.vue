<script setup>
import SphIcon from "./SphIcon.vue";

defineProps({
  modelValue: { type: Number, default: 0 },
  readonly: { type: Boolean, default: false },
  size: { type: [Number, String], default: 16 },
});
defineEmits(["update:modelValue"]);
</script>

<template>
  <span class="hearts-row" role="img" :aria-label="modelValue + ' of 5 hearts'">
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      :class="n <= modelValue ? 'lit' : 'dim'"
      :disabled="readonly"
      :style="readonly ? 'cursor:default' : ''"
      @click="!readonly && $emit('update:modelValue', n)"
    >
      <sph-icon name="Heart" :size="size" :stroke-width="1.8" />
    </button>
  </span>
</template>
