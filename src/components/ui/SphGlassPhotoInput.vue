<script setup>
import { ref } from "vue";
import { cloudinaryEnabled, uploadImage } from "../../cloudinary";
import SphPhotoPlaceholder from "./SphPhotoPlaceholder.vue";
import SphIcon from "./SphIcon.vue";

defineProps({
  modelValue: { type: String, default: null },
  label: { type: String, default: "Photo" },
});
const emit = defineEmits(["update:modelValue"]);

const uploading = ref(false);

/* local canvas-resize-to-base64 fallback — used when Cloudinary isn't
   configured, or if an upload attempt fails */
const resizeToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1000;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const onFile = async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  ev.target.value = "";
  if (!file) return;
  if (cloudinaryEnabled) {
    uploading.value = true;
    try {
      emit("update:modelValue", await uploadImage(file));
      return;
    } catch (e) {
      // fall through to the local fallback below
    } finally {
      uploading.value = false;
    }
  }
  try {
    emit("update:modelValue", await resizeToDataUrl(file));
  } catch (e) {}
};
</script>

<template>
  <div>
    <span class="glabel">{{ label }}</span>
    <div class="flex items-center gap-3">
      <label class="gbtn" :style="{ fontSize: '0.85rem', opacity: uploading ? 0.6 : 1, pointerEvents: uploading ? 'none' : '' }">
        <sph-icon name="Image" :size="16" />
        {{ uploading ? "Uploading…" : modelValue ? "Change photo" : "Choose photo" }}
        <input
          type="file"
          accept="image/*"
          class="sr-only"
          style="position: absolute; width: 1px; height: 1px; opacity: 0"
          :disabled="uploading"
          @change="onFile($event)"
        />
      </label>
      <button
        v-if="modelValue && !uploading"
        type="button"
        class="gbtn gbtn-ghost"
        style="font-size: 0.8rem"
        @click="$emit('update:modelValue', null)"
      >
        Remove
      </button>
    </div>
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
