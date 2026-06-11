<script setup>
import { computed } from "vue";
import GlassCard from "../ui/GlassCard.vue";
import UsIcon from "../ui/UsIcon.vue";

const props = defineProps({ item: { type: Object, required: true } });
defineEmits(["remove"]);

const DAY = 86400000;
function reminderInfo(r) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(r.startDate + "T00:00:00");
  const interval = Number(r.intervalDays) || 0;
  let next = start;
  if (interval > 0 && start < today) {
    const diff = Math.floor((today - start) / DAY);
    next = new Date(start.getTime() + Math.ceil(diff / interval) * interval * DAY);
  }
  const daysLeft = Math.round((next - today) / DAY);
  let frac = 0;
  if (interval > 0) frac = Math.max(0, Math.min(1, (interval - daysLeft) / interval));
  return { next, daysLeft, frac, interval };
}

/* format from the local date directly — never via UTC, which can roll back a day */
const fmtLocal = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const info = computed(() => reminderInfo(props.item));
const countLabel = computed(() => {
  const d = info.value.daysLeft;
  if (d <= 0) return "today ♥";
  if (d === 1) return "tomorrow";
  return "in " + d + " days";
});
</script>

<template>
  <glass-card hover radius="1.4rem" pad="1.15rem 1.25rem" class="rise" :class="{ 'rem-today': info.daysLeft <= 0 }">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="font-display m-0 text-2xl font-semibold leading-tight">{{ item.title }}</h3>
          <span class="chip">{{ info.interval > 0 ? "every " + info.interval + " days" : "once" }}</span>
        </div>
        <p class="m-0 mt-1 text-xs font-bold uppercase tracking-widest" style="color: var(--accent)">{{ fmtLocal(info.next) }}</p>
      </div>
      <button class="gbtn gbtn-ghost gbtn-icon del-btn" aria-label="Delete reminder" @click="$emit('remove')">
        <us-icon name="Trash2" :size="15" />
      </button>
    </div>
    <div class="flex items-end justify-between gap-3 mt-3">
      <div class="flex-1">
        <div v-if="info.interval > 0" class="progress-track"><div class="progress-fill" :style="{ width: info.frac * 100 + '%' }"></div></div>
        <p v-else class="m-0 text-xs" style="color: var(--ink-3)">one-time reminder</p>
      </div>
      <span class="rem-count font-display italic">{{ countLabel }}</span>
    </div>
  </glass-card>
</template>
