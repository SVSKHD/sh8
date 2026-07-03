<script setup>
/* Create / edit a place. Self-contained modal; emits a clean payload so the
   parent (or composable) owns persistence. Reused for both add & edit. */
import { reactive, watch } from "vue";
import SphGlassInput from "../ui/SphGlassInput.vue";
import SphGlassModal from "../ui/SphGlassModal.vue";
import SphGlassPhotoInput from "../ui/SphGlassPhotoInput.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /* when set, the form edits this place; otherwise it creates a new one */
  place: { type: Object, default: null },
});
const emit = defineEmits(["update:modelValue", "save"]);

const form = reactive({ name: "", note: "", image: null });

/* refill the form each time the modal opens (blank for new, prefilled for edit) */
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    const p = props.place;
    form.name = p?.name ?? "";
    form.note = p?.note ?? "";
    form.image = p?.image ?? null;
  },
  { immediate: true },
);

const valid = () => form.name.trim();

const save = () => {
  if (!valid()) return;
  emit("save", { name: form.name.trim(), note: form.note.trim(), image: form.image });
  emit("update:modelValue", false);
};
</script>

<template>
  <sph-glass-modal
    :model-value="modelValue"
    :title="place ? 'Edit place' : 'Add a place'"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <form class="grid gap-3.5" @submit.prevent="save()">
      <sph-glass-input v-model="form.name" label="Place" type="text" placeholder="Where to, love?" />
      <sph-glass-input v-model="form.note" label="Note (optional)" type="textarea" placeholder="Why this one?" />
      <sph-glass-photo-input v-model="form.image" label="Photo (optional)" />
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
