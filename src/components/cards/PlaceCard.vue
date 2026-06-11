<script setup>
import { burstHearts } from "../../composables/burstHearts";
import { showDetail } from "../../composables/detail";
import { fmtDate } from "../../store/useUsStore";
import GlassCard from "../ui/GlassCard.vue";
import HeartRating from "../ui/HeartRating.vue";
import UsIcon from "../ui/UsIcon.vue";

const props = defineProps({
  item: { type: Object, required: true },
  mode: { type: String, default: "wishlist" }, // "wishlist" | "visited"
});
const emit = defineEmits(["visited", "remove"]);

const open = () => showDetail(props.mode, props.item);
const markVisited = (ev) => {
  burstHearts(ev.clientX, ev.clientY, 12);
  emit("visited");
};
</script>

<template>
  <glass-card
    hover
    radius="1.4rem"
    pad="1.15rem 1.25rem"
    class="rise card-click place-card"
    role="button"
    tabindex="0"
    :aria-label="'Open place: ' + item.name"
    @click="open()"
    @keydown.enter="open()"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="font-display m-0 text-2xl font-semibold leading-tight clamp-1">{{ item.name }}</h3>
          <span v-if="mode === 'wishlist'" class="chip">{{ item.priority }}</span>
        </div>
        <p v-if="mode === 'visited'" class="m-0 mt-0.5 text-xs font-bold uppercase tracking-widest" style="color: var(--accent)">
          {{ fmtDate(item.date) }}
        </p>
      </div>
      <button class="gbtn gbtn-ghost gbtn-icon del-btn" aria-label="Delete place" @click.stop="$emit('remove')">
        <us-icon name="Trash2" :size="15" />
      </button>
    </div>
    <p v-if="mode === 'wishlist' && item.note" class="m-0 mt-1.5 text-sm leading-relaxed clamp-2" style="color: var(--ink-2)">
      {{ item.note }}
    </p>
    <p v-if="mode === 'visited' && item.story" class="m-0 mt-1.5 text-sm leading-relaxed clamp-2" style="color: var(--ink-2)">
      {{ item.story }}
    </p>
    <div v-if="mode === 'visited'" class="card-foot"><heart-rating :model-value="item.rating" readonly /></div>
    <div v-if="mode === 'wishlist'" class="card-foot">
      <button class="gbtn" style="font-size: 0.82rem; padding: 0.4rem 0.9rem" @click.stop="markVisited($event)">
        <us-icon name="Check" :size="15" /> Mark as visited
      </button>
    </div>
  </glass-card>
</template>
