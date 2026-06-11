<script setup>
import SphPhotoPlaceholder from "./SphPhotoPlaceholder.vue";
import SphIcon from "./SphIcon.vue";

defineProps({
  modelValue: { type: String, default: null },
  label: { type: String, default: "Photo" },
});
const emit = defineEmits(["update:modelValue"]);

const onFile = (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
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
      emit("update:modelValue", c.toDataURL("image/jpeg", 0.82));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
  ev.target.value = "";
};
</script>

<template>
  <div>
    <span class="glabel">{{ label }}</span>
    <div class="flex items-center gap-3">
      <label class="gbtn" style="font-size: 0.85rem">
        <sph-icon name="Image" :size="16" /> {{ modelValue ? "Change photo" : "Choose photo" }}
        <input
          type="file"
          accept="image/*"
          class="sr-only"
          style="position: absolute; width: 1px; height: 1px; opacity: 0"
          @change="onFile($event)"
        />
      </label>
      <button
        v-if="modelValue"
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
