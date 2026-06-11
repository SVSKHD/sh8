<script setup>
import { burstHearts } from "../../composables/burstHearts";
import { fmtDate } from "../../utils/dates";
import SphGlassCard from "../ui/SphGlassCard.vue";
import SphIcon from "../ui/SphIcon.vue";

const props = defineProps({
  item: { type: Object, required: true },
  me: { type: String, default: "" },
});
const emit = defineEmits(["toggle", "remove"]);

const toggle = (ev) => {
  if (!props.item.done) burstHearts(ev.clientX, ev.clientY, 10);
  emit("toggle");
};
</script>

<template>
  <sph-glass-card radius="1.1rem" pad="0.7rem 0.95rem" class="rise del-host">
    <div class="flex items-center gap-3">
      <button
        class="task-check"
        :class="{ done: item.done }"
        role="checkbox"
        :aria-checked="item.done"
        :aria-label="'Toggle ' + item.title"
        @click="toggle($event)"
      >
        <sph-icon v-if="item.done" name="Check" :size="14" stroke-width="3" />
      </button>
      <div class="flex-1 min-w-0">
        <p class="task-title m-0 text-sm font-medium" :class="{ done: item.done }">{{ item.title }}</p>
        <p v-if="item.due" class="m-0 text-xs mt-0.5" style="color: var(--ink-3)">due {{ fmtDate(item.due) }}</p>
      </div>
      <span class="chip" :class="{ 'chip-outline': item.assignee !== me }">{{
        item.assignee === me ? "Me" : item.assignee
      }}</span>
      <button class="gbtn gbtn-ghost gbtn-icon del-btn" aria-label="Delete task" @click="$emit('remove')">
        <sph-icon name="Trash2" :size="14" />
      </button>
    </div>
  </sph-glass-card>
</template>
