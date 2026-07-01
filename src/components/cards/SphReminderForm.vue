<script setup>
/* Create / edit a user reminder. Self-contained modal; emits a clean payload
   so the parent (or composable) owns persistence. Reused for both add & edit. */
import { reactive, watch } from "vue";
import SphGlassInput from "../ui/SphGlassInput.vue";
import SphGlassModal from "../ui/SphGlassModal.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /* when set, the form edits this reminder; otherwise it creates a new one */
  reminder: { type: Object, default: null },
});
const emit = defineEmits(["update:modelValue", "save"]);

const today = () => new Date().toISOString().slice(0, 10);
const form = reactive({ title: "", note: "", intervalDays: 30, anchorDate: today() });

/* refill the form each time the modal opens (blank for new, prefilled for edit) */
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    const r = props.reminder;
    form.title = r?.title ?? "";
    form.note = r?.note ?? "";
    form.intervalDays = r?.intervalDays ?? 30;
    form.anchorDate = r?.anchorDate || r?.startDate || today();
  },
  { immediate: true },
);

const valid = () => form.title.trim() && form.anchorDate;

const save = () => {
  if (!valid()) return;
  emit("save", {
    title: form.title.trim(),
    note: form.note.trim(),
    intervalDays: Math.max(0, parseInt(form.intervalDays, 10) || 0),
    anchorDate: form.anchorDate,
  });
  emit("update:modelValue", false);
};
</script>

<template>
  <sph-glass-modal
    :model-value="modelValue"
    :title="reminder ? 'Edit reminder' : 'Add a reminder'"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <form class="grid gap-3.5" @submit.prevent="save()">
      <sph-glass-input v-model="form.title" label="Reminder" type="text" placeholder="Don’t let us forget…" />
      <sph-glass-input v-model="form.note" label="Note (optional)" type="textarea" placeholder="Any little detail…" />
      <sph-glass-input v-model="form.anchorDate" label="Start / anchor date" type="date" />
      <sph-glass-input
        v-model="form.intervalDays"
        label="Repeat every (days)"
        type="number"
        placeholder="e.g. 26 — leave 0 for once"
      />
      <div class="flex justify-end gap-2 mt-1">
        <button type="button" class="gbtn gbtn-ghost" @click="$emit('update:modelValue', false)">Cancel</button>
        <button
          type="submit"
          class="gbtn gbtn-primary"
          :disabled="!valid()"
          :style="!valid() ? 'opacity: 0.5; cursor: not-allowed;' : ''"
        >
          Save ♥
        </button>
      </div>
    </form>
  </sph-glass-modal>
</template>
