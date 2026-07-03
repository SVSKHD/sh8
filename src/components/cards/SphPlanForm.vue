<script setup>
/* Create / edit a plan. Self-contained modal; emits a clean payload so the
   parent (or composable) owns persistence. Reused for both add & edit.
   New-plan mode (not edit) autosaves an in-progress draft to localStorage
   (debounced) via useDraft.js, and offers to resume it next time the form
   opens — scoped to Plans only, per-user. */
import { onBeforeUnmount, reactive, ref, watch } from "vue";
import { useDraft } from "../../composables/useDraft";
import SphGlassInput from "../ui/SphGlassInput.vue";
import SphGlassModal from "../ui/SphGlassModal.vue";
import SphGlassPhotoInput from "../ui/SphGlassPhotoInput.vue";
import SphGlassSelect from "../ui/SphGlassSelect.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /* when set, the form edits this plan; otherwise it creates a new one */
  plan: { type: Object, default: null },
  /* whose draft to autosave/resume — required for the draft feature to work */
  userId: { type: String, default: "" },
  placeOptions: { type: Array, default: () => [] },
  reminderOptions: { type: Array, default: () => [] },
  wishOptions: { type: Array, default: () => [] },
});
const emit = defineEmits(["update:modelValue", "save"]);

const STATUS_OPTIONS = [
  { value: "idea", label: "Idea" },
  { value: "planned", label: "Planned" },
  { value: "done", label: "Done" },
];

const blankForm = () => ({
  title: "",
  details: "",
  date: "",
  status: "idea",
  image: null,
  linkedPlaceId: "",
  linkedReminderId: "",
  linkedWishId: "",
});
const form = reactive(blankForm());

const draft = useDraft(`us-plan-draft-${props.userId || "anon"}`);
const resumePrompt = ref(false);
let pendingDraft = null;

const hasContent = (f) => !!(f && f.title && f.title.trim());

/* refill the form each time the modal opens (blank for new, prefilled for
   edit) — new-plan mode checks for a resumable draft first */
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    Object.assign(form, blankForm());
    const p = props.plan;
    if (p) {
      resumePrompt.value = false;
      form.title = p.title ?? "";
      form.details = p.details ?? "";
      form.date = p.date ?? "";
      form.status = p.status ?? "idea";
      form.image = p.image ?? null;
      form.linkedPlaceId = p.linkedPlaceId ?? "";
      form.linkedReminderId = p.linkedReminderId ?? "";
      form.linkedWishId = p.linkedWishId ?? "";
      return;
    }
    const existing = draft.load();
    if (hasContent(existing)) {
      pendingDraft = existing;
      resumePrompt.value = true;
    } else {
      resumePrompt.value = false;
    }
  },
  { immediate: true },
);

const resumeDraft = () => {
  if (pendingDraft) Object.assign(form, blankForm(), pendingDraft);
  resumePrompt.value = false;
};
const discardDraft = () => {
  draft.clear();
  pendingDraft = null;
  resumePrompt.value = false;
};

/* debounced autosave — new-plan mode only, and only once the resume choice
   (if any) has been resolved */
let saveTimer = null;
watch(
  () => ({ ...form }),
  (snapshot) => {
    if (props.plan || resumePrompt.value || !props.modelValue) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (hasContent(snapshot)) draft.save(snapshot);
    }, 800);
  },
  { deep: true },
);
onBeforeUnmount(() => clearTimeout(saveTimer));

const valid = () => form.title.trim();

const save = () => {
  if (!valid()) return;
  emit("save", {
    title: form.title.trim(),
    details: form.details.trim(),
    date: form.date,
    status: form.status,
    image: form.image,
    linkedPlaceId: form.linkedPlaceId || null,
    linkedReminderId: form.linkedReminderId || null,
    linkedWishId: form.linkedWishId || null,
  });
  if (!props.plan) {
    clearTimeout(saveTimer);
    draft.clear();
  }
  emit("update:modelValue", false);
};
</script>

<template>
  <sph-glass-modal
    :model-value="modelValue"
    :title="plan ? 'Edit plan' : 'Add a plan'"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div v-if="resumePrompt" class="grid gap-3">
      <p class="m-0 text-sm" style="color: var(--ink-2)">
        You've got an unsaved plan draft — <strong>{{ pendingDraft && pendingDraft.title }}</strong
        >. Pick up where you left off?
      </p>
      <div class="flex justify-end gap-2">
        <button type="button" class="gbtn gbtn-ghost" @click="discardDraft()">Discard</button>
        <button type="button" class="gbtn gbtn-primary" @click="resumeDraft()">Resume draft</button>
      </div>
    </div>
    <form v-else class="grid gap-3.5" @submit.prevent="save()">
      <sph-glass-input v-model="form.title" label="Plan" type="text" placeholder="What are we plotting?" />
      <sph-glass-input v-model="form.details" label="Details (optional)" type="textarea" placeholder="The when, where, how…" />
      <sph-glass-input v-model="form.date" label="Date (optional)" type="date" />
      <sph-glass-select v-model="form.status" label="Status" :options="STATUS_OPTIONS" />
      <sph-glass-photo-input v-model="form.image" label="Photo (optional)" />
      <sph-glass-select
        v-if="placeOptions.length"
        v-model="form.linkedPlaceId"
        label="Linked place (optional)"
        :options="[{ value: '', label: 'None' }, ...placeOptions]"
      />
      <sph-glass-select
        v-if="reminderOptions.length"
        v-model="form.linkedReminderId"
        label="Linked reminder (optional)"
        :options="[{ value: '', label: 'None' }, ...reminderOptions]"
      />
      <sph-glass-select
        v-if="wishOptions.length"
        v-model="form.linkedWishId"
        label="Linked wish (optional)"
        :options="[{ value: '', label: 'None' }, ...wishOptions]"
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
