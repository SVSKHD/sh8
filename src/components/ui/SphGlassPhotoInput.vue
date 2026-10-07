<script setup>
import { ref } from "vue";
import { deleteImage, MediaError, uploadImage } from "../../media";
import SphPhotoPlaceholder from "./SphPhotoPlaceholder.vue";
import SphIcon from "./SphIcon.vue";

const props = defineProps({
  modelValue: { type: String, default: null },
  label: { type: String, default: "Photo" },
  /* Storage sub-folder, usually the tab/list name */
  folder: { type: String, default: "misc" },
});
const emit = defineEmits(["update:modelValue"]);

const uploading = ref(false);
const error = ref("");

/* photos uploaded while this input was open: if one is replaced or removed
   before the form is saved it was never referenced anywhere, so delete it
   right away. Photos that came in with the item are cleaned up by the store
   when the item is actually saved or deleted. */
const fresh = new Set();
const discard = (url) => {
  if (url && fresh.has(url)) {
    fresh.delete(url);
    deleteImage(url);
  }
};

const onFile = async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  ev.target.value = "";
  if (!file) return;
  error.value = "";
  uploading.value = true;
  try {
    const url = await uploadImage(file, props.folder);
    discard(props.modelValue);
    fresh.add(url);
    emit("update:modelValue", url);
  } catch (e) {
    error.value = e instanceof MediaError ? e.message : "Upload failed — check your connection and try again.";
  } finally {
    uploading.value = false;
  }
};

const remove = () => {
  discard(props.modelValue);
  emit("update:modelValue", null);
};
</script>

<template>
  <div>
    <span class="glabel">{{ label }}</span>
    <div class="flex items-center gap-3">
      <label class="gbtn" :style="{ fontSize: '0.85rem', opacity: uploading ? 0.6 : 1, pointerEvents: uploading ? 'none' : '' }">
        <sph-icon name="Image" :size="16" />
        {{ uploading ? "Compressing & uploading…" : modelValue ? "Change photo" : "Choose photo" }}
        <input
          type="file"
          accept="image/*"
          class="sr-only"
          style="position: absolute; width: 1px; height: 1px; opacity: 0"
          :disabled="uploading"
          @change="onFile($event)"
        />
      </label>
      <button v-if="modelValue && !uploading" type="button" class="gbtn gbtn-ghost" style="font-size: 0.8rem" @click="remove()">
        Remove
      </button>
    </div>
    <p v-if="error" class="m-0 mt-1.5 text-xs" style="color: var(--accent)" role="alert">{{ error }}</p>
    <p v-else class="m-0 mt-1.5 text-xs" style="color: var(--ink-3)">Up to 5 MB — compressed automatically.</p>
    <img
      v-if="modelValue"
      :src="modelValue"
      alt="Selected photo preview"
      class="mt-2.5 block w-full"
      style="border-radius: 0.9rem; max-height: 11rem; object-fit: cover"
    />
    <sph-photo-placeholder v-else label="your photo goes here" :height="90" class="mt-2.5" />
  </div>
</template>
