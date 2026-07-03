<script setup>
/* Single place display — shared/editable by both users (like tasks/goals),
   so no ownership gating; `addedBy` is attribution only. Opens the shared
   browsable detail dialog like the other card types already do. */
import { computed } from "vue";
import { burstHearts } from "../../composables/burstHearts";
import { showDetail } from "../../composables/detail";
import { fmtDate } from "../../utils/dates";
import SphGlassCard from "../ui/SphGlassCard.vue";
import SphIcon from "../ui/SphIcon.vue";
import SphPhotoPlaceholder from "../ui/SphPhotoPlaceholder.vue";

const props = defineProps({ item: { type: Object, required: true } });
const emit = defineEmits(["edit", "toggle-visited", "remove"]);

const open = () => showDetail("place", props.item);
const markVisited = (ev) => {
  if (!props.item.visited) burstHearts(ev.clientX, ev.clientY, 12);
  emit("toggle-visited");
};

const visited = computed(() => !!props.item.visited);
</script>

<template>
  <sph-glass-card
    hover
    radius="1.4rem"
    pad="1.15rem 1.25rem"
    class="rise card-click del-host place-card"
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
          <span v-if="visited" class="chip">visited</span>
        </div>
        <p
          v-if="visited && item.visitedDate"
          class="m-0 mt-0.5 text-xs font-bold uppercase tracking-widest"
          style="color: var(--accent)"
        >
          {{ fmtDate(item.visitedDate) }}
        </p>
        <p v-if="item.addedBy" class="m-0 mt-0.5 text-xs" style="color: var(--ink-3)">added by {{ item.addedBy }}</p>
      </div>
      <div class="flex items-center gap-1 flex-shrink-0">
        <button class="gbtn gbtn-ghost gbtn-icon" aria-label="Edit place" title="Edit" @click.stop="$emit('edit')">
          <sph-icon name="StickyNote" :size="15" />
        </button>
        <button class="gbtn gbtn-ghost gbtn-icon del-btn" aria-label="Delete place" title="Delete" @click.stop="$emit('remove')">
          <sph-icon name="Trash2" :size="15" />
        </button>
      </div>
    </div>

    <img
      v-if="item.image"
      :src="item.image"
      :alt="item.name"
      class="mt-2.5 block w-full"
      style="border-radius: 0.9rem; max-height: 9rem; object-fit: cover"
    />
    <sph-photo-placeholder v-else-if="visited" label="no photo yet" :height="70" class="mt-2.5" />

    <p v-if="item.note" class="m-0 mt-2 text-sm leading-relaxed clamp-2" style="color: var(--ink-2)">{{ item.note }}</p>

    <div class="card-foot">
      <button v-if="!visited" class="gbtn" style="font-size: 0.82rem; padding: 0.4rem 0.9rem" @click.stop="markVisited($event)">
        <sph-icon name="Check" :size="15" /> Mark as visited
      </button>
      <button v-else class="gbtn gbtn-ghost" style="font-size: 0.82rem; padding: 0.4rem 0.9rem" @click.stop="markVisited($event)">
        Mark as not visited
      </button>
    </div>
  </sph-glass-card>
</template>
