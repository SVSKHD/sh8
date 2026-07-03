<script setup>
/* Single plan display — shared/editable by both users (like places/tasks),
   so no ownership gating; `addedBy` is attribution only. Status moves via
   a segmented control (reuses the app's existing .seg class). */
import { computed } from "vue";
import { fmtDate } from "../../utils/dates";
import SphGlassCard from "../ui/SphGlassCard.vue";
import SphIcon from "../ui/SphIcon.vue";
import SphPhotoPlaceholder from "../ui/SphPhotoPlaceholder.vue";

const props = defineProps({
  item: { type: Object, required: true },
  linkedNames: { type: Object, default: () => ({}) },
});
defineEmits(["edit", "set-status", "remove"]);

const STATUSES = [
  { id: "idea", label: "Idea" },
  { id: "planned", label: "Planned" },
  { id: "done", label: "Done" },
];

const linkedChips = computed(() =>
  [
    props.item.linkedPlaceId && props.linkedNames.place,
    props.item.linkedReminderId && props.linkedNames.reminder,
    props.item.linkedWishId && props.linkedNames.wish,
  ].filter(Boolean),
);
</script>

<template>
  <sph-glass-card hover radius="1.4rem" pad="1.15rem 1.25rem" class="rise del-host">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="font-display m-0 text-2xl font-semibold leading-tight clamp-1">{{ item.title }}</h3>
        </div>
        <p v-if="item.date" class="m-0 mt-0.5 text-xs font-bold uppercase tracking-widest" style="color: var(--accent)">
          {{ fmtDate(item.date) }}
        </p>
        <p v-if="item.addedBy" class="m-0 mt-0.5 text-xs" style="color: var(--ink-3)">added by {{ item.addedBy }}</p>
      </div>
      <div class="flex items-center gap-1 flex-shrink-0">
        <button class="gbtn gbtn-ghost gbtn-icon" aria-label="Edit plan" title="Edit" @click.stop="$emit('edit')">
          <sph-icon name="StickyNote" :size="15" />
        </button>
        <button class="gbtn gbtn-ghost gbtn-icon del-btn" aria-label="Delete plan" title="Delete" @click.stop="$emit('remove')">
          <sph-icon name="Trash2" :size="15" />
        </button>
      </div>
    </div>

    <img
      v-if="item.image"
      :src="item.image"
      :alt="item.title"
      class="mt-2.5 block w-full"
      style="border-radius: 0.9rem; max-height: 9rem; object-fit: cover"
    />
    <sph-photo-placeholder v-else label="no photo yet" :height="60" class="mt-2.5" />

    <p v-if="item.details" class="m-0 mt-2 text-sm leading-relaxed clamp-2" style="color: var(--ink-2)">{{ item.details }}</p>

    <div v-if="linkedChips.length" class="flex items-center gap-1.5 flex-wrap mt-2">
      <span v-for="(name, i) in linkedChips" :key="i" class="chip chip-outline">linked: {{ name }}</span>
    </div>

    <div class="seg mt-3">
      <button
        v-for="s in STATUSES"
        :key="s.id"
        type="button"
        :class="{ on: item.status === s.id }"
        @click.stop="$emit('set-status', s.id)"
      >
        {{ s.label }}
      </button>
    </div>
  </sph-glass-card>
</template>
