<script setup>
/* Single wish display — two views from the same shared shape: 'sent' (the
   sender's own view, with status + edit/cancel/delete) and 'received' (the
   recipient's view, always already-delivered — undelivered wishes never
   reach this component, see useWishes.js's receivedVisible). */
import { computed } from "vue";
import SphGlassCard from "../ui/SphGlassCard.vue";
import SphIcon from "../ui/SphIcon.vue";

const props = defineProps({
  item: { type: Object, required: true },
  view: { type: String, default: "sent" }, // 'sent' | 'received'
  canEdit: { type: Boolean, default: false },
});
defineEmits(["edit", "cancel", "remove"]);

const fmtDateTime = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
};

const statusLabel = computed(() => {
  if (props.item.cancelled) return "Cancelled";
  if (props.item.delivered) return "Delivered";
  return "Scheduled";
});
</script>

<template>
  <sph-glass-card hover radius="1.4rem" pad="1.15rem 1.25rem" class="rise del-host">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="font-display m-0 text-xl font-semibold leading-tight">
            {{ view === "sent" ? "To " + item.to : "From " + item.from }}
          </h3>
          <span class="chip" :class="{ 'chip-outline': item.cancelled }">{{ statusLabel }}</span>
          <span v-if="item.googleEventId" class="chip chip-outline"><sph-icon name="Calendar" :size="11" /> Synced</span>
        </div>
        <p class="m-0 mt-0.5 text-xs font-bold uppercase tracking-widest" style="color: var(--accent)">
          {{ fmtDateTime(item.scheduledDate) }}
        </p>
      </div>
      <div v-if="view === 'sent' && canEdit" class="flex items-center gap-1 flex-shrink-0">
        <button class="gbtn gbtn-ghost gbtn-icon" aria-label="Edit wish" title="Edit" @click.stop="$emit('edit')">
          <sph-icon name="StickyNote" :size="15" />
        </button>
        <button class="gbtn gbtn-ghost gbtn-icon" aria-label="Cancel wish" title="Cancel" @click.stop="$emit('cancel')">
          <sph-icon name="X" :size="15" />
        </button>
      </div>
      <button
        v-if="view === 'sent' && !canEdit"
        class="gbtn gbtn-ghost gbtn-icon del-btn"
        aria-label="Delete wish"
        title="Delete"
        @click.stop="$emit('remove')"
      >
        <sph-icon name="Trash2" :size="15" />
      </button>
    </div>
    <p class="note-body mt-2">{{ item.message }}</p>
  </sph-glass-card>
</template>
