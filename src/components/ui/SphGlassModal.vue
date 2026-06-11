<script setup>
import { onBeforeUnmount, onMounted } from "vue";
import SphIcon from "./SphIcon.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);

const onKey = (e) => {
  if (e.key === "Escape" && props.modelValue) emit("update:modelValue", false);
};
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<template>
  <teleport to="body">
    <div v-if="modelValue" class="modal-veil" @click.self="$emit('update:modelValue', false)">
      <div class="glass glass-strong modal-card" role="dialog" aria-modal="true">
        <div class="flex items-center justify-between px-6 pt-5 pb-1">
          <h3 class="font-display m-0 text-2xl font-semibold italic">{{ title }}</h3>
          <button class="gbtn gbtn-ghost gbtn-icon" aria-label="Close" @click="$emit('update:modelValue', false)">
            <sph-icon name="X" :size="18" />
          </button>
        </div>
        <div class="px-6 pb-6 pt-2"><slot /></div>
      </div>
    </div>
  </teleport>
</template>
