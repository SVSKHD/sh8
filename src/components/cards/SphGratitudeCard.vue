<script setup>
import { showDetail } from "../../composables/detail";
import { fmtDate } from "../../utils/dates";
import SphGlassCard from "../ui/SphGlassCard.vue";
import SphIcon from "../ui/SphIcon.vue";

const props = defineProps({ item: { type: Object, required: true } });
defineEmits(["remove"]);

const open = () => showDetail("gratitude", props.item);
</script>

<template>
  <sph-glass-card
    hover
    radius="1.25rem"
    pad="1rem 1.15rem"
    class="rise card-click grat-card"
    role="button"
    tabindex="0"
    aria-label="Open sweet note"
    @click="open()"
    @keydown.enter="open()"
  >
    <div class="flex items-start gap-3">
      <span class="heart-btn on" style="cursor: inherit; padding: 0.2rem; margin-top: 0.1rem"
        ><sph-icon name="Heart" :size="16"
      /></span>
      <div class="flex-1 min-w-0">
        <p class="m-0 text-xs font-bold uppercase tracking-widest" style="color: var(--accent)">{{ fmtDate(item.date) }}</p>
        <p class="font-display m-0 mt-1 text-lg italic leading-snug clamp-3">{{ item.note }}</p>
      </div>
      <button class="gbtn gbtn-ghost gbtn-icon del-btn" aria-label="Delete note" @click.stop="$emit('remove')">
        <sph-icon name="Trash2" :size="15" />
      </button>
    </div>
  </sph-glass-card>
</template>
