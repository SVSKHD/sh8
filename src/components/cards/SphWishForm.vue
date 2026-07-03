<script setup>
/* Create / edit a scheduled wish. `to` is derived automatically — with two
   named users, the recipient is always "the other one," so there's no
   redundant picker. Self-contained modal; emits a clean payload so the
   parent (composable) owns persistence + calendar sync.
   New-wish mode (not edit) autosaves an in-progress draft to localStorage
   (debounced) via useDraft.js, and offers to resume it next time the form
   opens — scoped to Wishes only, per-user. Mirrors SphPlanForm.vue. */
import { onBeforeUnmount, reactive, ref, watch } from "vue";
import { useDraft } from "../../composables/useDraft";
import SphGlassInput from "../ui/SphGlassInput.vue";
import SphGlassModal from "../ui/SphGlassModal.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /* when set, the form edits this wish; otherwise it creates a new one */
  wish: { type: Object, default: null },
  toName: { type: String, required: true },
  /* whose draft to autosave/resume — required for the draft feature to work */
  userId: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue", "save"]);

const form = reactive({ message: "", scheduledDate: "" });

const draft = useDraft(`us-wish-draft-${props.userId || "anon"}`);
const resumePrompt = ref(false);
let pendingDraft = null;

const hasContent = (f) => !!(f && f.message && f.message.trim());

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    const w = props.wish;
    if (w) {
      resumePrompt.value = false;
      form.message = w.message ?? "";
      form.scheduledDate = w.scheduledDate ?? "";
      return;
    }
    form.message = "";
    form.scheduledDate = "";
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
  if (pendingDraft) Object.assign(form, { message: "", scheduledDate: "" }, pendingDraft);
  resumePrompt.value = false;
};
const discardDraft = () => {
  draft.clear();
  pendingDraft = null;
  resumePrompt.value = false;
};

/* debounced autosave — new-wish mode only, and only once the resume choice
   (if any) has been resolved */
let saveTimer = null;
watch(
  () => ({ ...form }),
  (snapshot) => {
    if (props.wish || resumePrompt.value || !props.modelValue) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (hasContent(snapshot)) draft.save(snapshot);
    }, 800);
  },
  { deep: true },
);
onBeforeUnmount(() => clearTimeout(saveTimer));

const valid = () => form.message.trim() && form.scheduledDate;

const save = () => {
  if (!valid()) return;
  emit("save", { to: props.toName, message: form.message.trim(), scheduledDate: form.scheduledDate });
  if (!props.wish) {
    clearTimeout(saveTimer);
    draft.clear();
  }
  emit("update:modelValue", false);
};
</script>

<template>
  <sph-glass-modal
    :model-value="modelValue"
    :title="wish ? 'Edit wish' : `Schedule a wish for ${toName}`"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div v-if="resumePrompt" class="grid gap-3">
      <p class="m-0 text-sm" style="color: var(--ink-2)">
        You've got an unsaved wish draft — <strong>{{ pendingDraft && pendingDraft.message }}</strong
        >. Pick up where you left off?
      </p>
      <div class="flex justify-end gap-2">
        <button type="button" class="gbtn gbtn-ghost" @click="discardDraft()">Discard</button>
        <button type="button" class="gbtn gbtn-primary" @click="resumeDraft()">Resume draft</button>
      </div>
    </div>
    <form v-else class="grid gap-3.5" @submit.prevent="save()">
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
