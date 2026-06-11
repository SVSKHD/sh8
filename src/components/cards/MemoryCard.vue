<script setup>
import { showDetail } from "../../composables/detail";
import { fmtDate } from "../../utils/dates";
import GlassCard from "../ui/GlassCard.vue";
import PhotoPlaceholder from "../ui/PhotoPlaceholder.vue";
import UsIcon from "../ui/UsIcon.vue";

const props = defineProps({ item: { type: Object, required: true } });
defineEmits(["fav", "remove"]);

const open = () => showDetail("memory", props.item);
</script>

<template>
  <glass-card
    hover
    radius="1.4rem"
    pad="0.6rem"
    class="rise del-host card-click"
    role="button"
    tabindex="0"
    :aria-label="'Open memory: ' + item.caption"
    @click="open()"
    @keydown.enter="open()"
  >
    <div class="relative">
      <photo-placeholder label="memory photo" :height="160" />
      <button
        class="heart-btn absolute top-1.5 right-1.5 glass"
        style="border-radius: 999px"
        :class="{ on: item.favorite }"
        :aria-label="item.favorite ? 'Unfavorite' : 'Favorite'"
        @click.stop="$emit('fav')"
      >
        <us-icon name="Heart" :size="16" />
      </button>
    </div>
    <div class="px-2 pt-2 pb-1.5">
      <p class="m-0 text-sm font-medium leading-snug clamp-2 cap-2">{{ item.caption }}</p>
      <div class="flex items-center justify-between mt-1">
        <p class="m-0 text-xs" style="color: var(--ink-3)">{{ fmtDate(item.date) }}</p>
        <button class="gbtn gbtn-ghost gbtn-icon del-btn" aria-label="Delete memory" @click.stop="$emit('remove')">
          <us-icon name="Trash2" :size="14" />
        </button>
      </div>
    </div>
  </glass-card>
</template>
