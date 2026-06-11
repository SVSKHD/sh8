<script setup>
import { burstHearts } from "../../composables/burstHearts";
import { fmtDate } from "../../store/useUsStore";
import GlassCard from "../ui/GlassCard.vue";
import UsIcon from "../ui/UsIcon.vue";

const props = defineProps({ item: { type: Object, required: true } });
const emit = defineEmits(["bump", "remove"]);

const bump = (d, ev) => {
  const before = props.item.progress;
  emit("bump", d);
  if (before < 100 && before + d >= 100) {
    burstHearts(ev.clientX, ev.clientY, 20);
  }
};
</script>

<template>
  <glass-card hover radius="1.4rem" pad="1.15rem 1.25rem" class="rise">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="font-display m-0 text-2xl font-semibold leading-tight">{{ item.title }}</h3>
        <p v-if="item.targetDate" class="m-0 mt-0.5 text-xs" style="color: var(--ink-3)">by {{ fmtDate(item.targetDate) }}</p>
      </div>
      <button class="gbtn gbtn-ghost gbtn-icon del-btn" aria-label="Delete goal" @click="$emit('remove')">
        <us-icon name="Trash2" :size="15" />
      </button>
    </div>
    <div class="flex items-center gap-3 mt-3.5">
      <div class="progress-track flex-1"><div class="progress-fill" :style="{ width: item.progress + '%' }"></div></div>
      <span class="text-sm font-bold tabular-nums" style="min-width: 2.6rem; text-align: right; color: var(--accent)">
        {{ item.progress }}%
      </span>
    </div>
    <div class="flex items-center gap-2 mt-3">
      <button class="gbtn gbtn-icon" aria-label="Decrease progress" @click="bump(-10, $event)"><us-icon name="Minus" :size="14" /></button>
      <button class="gbtn gbtn-icon" aria-label="Increase progress" @click="bump(10, $event)"><us-icon name="Plus" :size="14" /></button>
      <span v-if="item.progress >= 100" class="chip">Done ♥ celebrate it</span>
    </div>
  </glass-card>
</template>
