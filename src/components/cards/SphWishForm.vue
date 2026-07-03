<script setup>
/* Create / edit a scheduled wish. `to` is derived automatically — with two
   named users, the recipient is always "the other one," so there's no
   redundant picker. Self-contained modal; emits a clean payload so the
   parent (composable) owns persistence + calendar sync. */
import { reactive, watch } from "vue";
import SphGlassInput from "../ui/SphGlassInput.vue";
import SphGlassModal from "../ui/SphGlassModal.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /* when set, the form edits this wish; otherwise it creates a new one */
  wish: { type: Object, default: null },
  toName: { type: String, required: true },
});
const emit = defineEmits(["update:modelValue", "save"]);

const form = reactive({ message: "", scheduledDate: "" });

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    const w = props.wish;
    form.message = w?.message ?? "";
    form.scheduledDate = w?.scheduledDate ?? "";
  },
  { immediate: true },
);

const valid = () => form.message.trim() && form.scheduledDate;

const save = () => {
  if (!valid()) return;
  emit("save", { to: props.toName, message: form.message.trim(), scheduledDate: form.scheduledDate });
  emit("update:modelValue", false);
};
</script>

<template>
  <sph-glass-modal
    :model-value="modelValue"
    :title="wish ? 'Edit wish' : `Schedule a wish for ${toName}`"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <form class="grid gap-3.5" @submit.prevent="save()">
      <sph-glass-input v-model="form.message" label="Your message" type="textarea" placeholder="Something just for them…" />
      <sph-glass-input v-model="form.scheduledDate" label="Deliver at" type="datetime-local" />
      <div class="flex justify-end gap-2 mt-1">
        <button type="button" class="gbtn gbtn-ghost" @click="$emit('update:modelValue', false)">Cancel</button>
        <button
          type="submit"
          class="gbtn gbtn-primary"
          :disabled="!valid()"
          :style="!valid() ? 'opacity: 0.5; cursor: not-allowed;' : ''"
        >
          Schedule ♥
        </button>
      </div>
    </form>
  </sph-glass-modal>
</template>
