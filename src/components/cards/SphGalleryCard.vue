<script setup>
import { fmtDate } from "../../utils/dates";
import SphByline from "../ui/SphByline.vue";
import SphGlassCard from "../ui/SphGlassCard.vue";
import SphPhotoPlaceholder from "../ui/SphPhotoPlaceholder.vue";
import SphIcon from "../ui/SphIcon.vue";

defineProps({ item: { type: Object, required: true } });
defineEmits(["view", "edit", "remove"]);
</script>

<template>
  <sph-glass-card hover radius="1.4rem" pad="0.6rem" class="rise del-host">
    <div :style="item.src ? 'cursor: zoom-in;' : ''" @click="item.src && $emit('view')">
      <img
        v-if="item.src"
        :src="item.src"
        :alt="item.caption"
        loading="lazy"
        decoding="async"
        class="block w-full"
        style="border-radius: 0.9rem; height: 10rem; object-fit: cover"
      />
      <sph-photo-placeholder v-else label="add a photo with ✎" :height="160" />
    </div>
    <div class="px-2 pt-2 pb-1.5">
      <p class="m-0 text-sm font-medium leading-snug clamp-2 cap-2">{{ item.caption }}</p>
      <sph-byline :item="item" class="mt-1" />
      <div class="flex items-center justify-between mt-1">
        <p class="m-0 text-xs" style="color: var(--ink-3)">{{ fmtDate(item.date) }}</p>
        <div class="flex items-center">
          <button class="gbtn gbtn-ghost gbtn-icon del-btn" aria-label="Edit photo" @click="$emit('edit')">
            <sph-icon name="Pencil" :size="13" />
          </button>
          <button class="gbtn gbtn-ghost gbtn-icon del-btn" aria-label="Delete photo" @click="$emit('remove')">
            <sph-icon name="Trash2" :size="14" />
          </button>
        </div>
      </div>
    </div>
  </sph-glass-card>
</template>
