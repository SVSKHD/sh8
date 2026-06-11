<script setup>
import { fmtDate } from "../../utils/dates";
import GlassCard from "../ui/GlassCard.vue";
import PhotoPlaceholder from "../ui/PhotoPlaceholder.vue";
import UsIcon from "../ui/UsIcon.vue";

defineProps({ item: { type: Object, required: true } });
defineEmits(["view", "remove"]);
</script>

<template>
  <glass-card hover radius="1.4rem" pad="0.6rem" class="rise del-host">
    <div :style="item.src ? 'cursor: zoom-in;' : ''" @click="item.src && $emit('view')">
      <img
        v-if="item.src"
        :src="item.src"
        :alt="item.caption"
        class="block w-full"
        style="border-radius: 0.9rem; height: 10rem; object-fit: cover"
      />
      <photo-placeholder v-else label="drop in a photo (edit this card)" :height="160" />
    </div>
    <div class="px-2 pt-2 pb-1.5">
      <p class="m-0 text-sm font-medium leading-snug clamp-2 cap-2">{{ item.caption }}</p>
      <div class="flex items-center justify-between mt-1">
        <p class="m-0 text-xs" style="color: var(--ink-3)">{{ fmtDate(item.date) }}</p>
        <button class="gbtn gbtn-ghost gbtn-icon del-btn" aria-label="Delete photo" @click="$emit('remove')">
          <us-icon name="Trash2" :size="14" />
        </button>
      </div>
    </div>
  </glass-card>
</template>
