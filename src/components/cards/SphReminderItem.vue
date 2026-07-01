<script setup>
/* Single reminder display. Prop-driven & standalone: it computes its own next
   due date from the shared helper. `canManage` decides whether edit/toggle/
   delete controls appear (common reminders are read-only). */
import { computed } from "vue";
import { daysUntil, getNextDueDate } from "../../utils/dates";
import SphGlassCard from "../ui/SphGlassCard.vue";
import SphIcon from "../ui/SphIcon.vue";

const props = defineProps({
  item: { type: Object, required: true },
  canManage: { type: Boolean, default: false },
});
defineEmits(["edit", "toggle", "remove"]);

const fmtLocal = (d) => (d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

const info = computed(() => {
  const anchor = props.item.anchorDate || props.item.startDate;
  const interval = Math.max(0, Math.floor(Number(props.item.intervalDays) || 0));
  const next = getNextDueDate(anchor, interval);
  const daysLeft = next ? daysUntil(next) : null;
  let frac = 0;
  if (interval > 0 && daysLeft != null) frac = Math.max(0, Math.min(1, (interval - daysLeft) / interval));
  return { next, daysLeft, frac, interval };
});

const enabled = computed(() => props.item.enabled !== false);
const isCommon = computed(() => (props.item.scope || "common") === "common");

const countLabel = computed(() => {
  const d = info.value.daysLeft;
  if (d == null) return "";
  if (d <= 0) return "today ♥";
  if (d === 1) return "tomorrow";
  return "in " + d + " days";
});
</script>

<template>
  <sph-glass-card
    hover
    radius="1.4rem"
    pad="1.15rem 1.25rem"
    class="rise del-host"
    :class="{ 'rem-today': enabled && info.daysLeft <= 0 }"
    :style="enabled ? '' : 'opacity: 0.55'"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="font-display m-0 text-2xl font-semibold leading-tight">{{ item.title }}</h3>
          <span class="chip">{{ info.interval > 0 ? "every " + info.interval + " days" : "once" }}</span>
          <span class="chip chip-outline">{{ isCommon ? "Shared" : "Yours" }}</span>
          <span v-if="!enabled" class="chip chip-outline">Paused</span>
        </div>
        <p class="m-0 mt-1 text-xs font-bold uppercase tracking-widest" style="color: var(--accent)">
          {{ fmtLocal(info.next) }}
        </p>
        <p v-if="item.note" class="note-body mt-1.5 clamp-2" style="font-size: 0.82rem">{{ item.note }}</p>
      </div>
      <div v-if="canManage" class="flex items-center gap-1 flex-shrink-0">
        <button
          class="gbtn gbtn-ghost gbtn-icon"
          :aria-label="enabled ? 'Pause reminder' : 'Resume reminder'"
          :title="enabled ? 'Pause' : 'Resume'"
          @click="$emit('toggle')"
        >
          <sph-icon :name="enabled ? 'BellRing' : 'MoonStar'" :size="15" />
        </button>
        <button class="gbtn gbtn-ghost gbtn-icon" aria-label="Edit reminder" title="Edit" @click="$emit('edit')">
          <sph-icon name="StickyNote" :size="15" />
        </button>
        <button class="gbtn gbtn-ghost gbtn-icon del-btn" aria-label="Delete reminder" title="Delete" @click="$emit('remove')">
          <sph-icon name="Trash2" :size="15" />
        </button>
      </div>
    </div>
    <div class="flex items-end justify-between gap-3 mt-3">
      <div class="flex-1">
        <div v-if="info.interval > 0" class="progress-track">
          <div class="progress-fill" :style="{ width: info.frac * 100 + '%' }"></div>
        </div>
        <p v-else class="m-0 text-xs" style="color: var(--ink-3)">one-time reminder</p>
      </div>
      <span class="rem-count font-display italic">{{ countLabel }}</span>
    </div>
  </sph-glass-card>
</template>
