<script setup>
import { showDetail } from "../../composables/detail";
import { fmtDate } from "../../utils/dates";
import SphGlassCard from "../ui/SphGlassCard.vue";
import SphIcon from "../ui/SphIcon.vue";

const props = defineProps({ item: { type: Object, required: true } });
defineEmits(["remove"]);

const open = () => showDetail("note", props.item);
</script>

<template>
  <sph-glass-card
    hover
    radius="1.25rem"
    pad="1.05rem 1.15rem"
    class="rise del-host card-click note-fixed"
    role="button"
    tabindex="0"
    aria-label="Open note"
    @click="open()"
    @keydown.enter="open()"
  >
    <div class="flex items-start justify-between gap-2">
      <h3 v-if="item.title" class="font-display m-0 text-xl font-semibold leading-tight clamp-1">{{ item.title }}</h3>
      <span v-else class="heart-btn on" style="cursor: inherit; padding: 0.1rem"><sph-icon name="StickyNote" :size="15" /></span>
      <button class="gbtn gbtn-ghost gbtn-icon del-btn" aria-label="Delete note" @click.stop="$emit('remove')">
        <sph-icon name="Trash2" :size="14" />
      </button>
    </div>
    <p class="note-body clamp-5 mt-1.5">{{ item.body }}</p>
    <p class="note-date m-0 mt-2 text-xs" style="color: var(--ink-3)">{{ fmtDate(item.date) }}</p>
  </sph-glass-card>
</template>
