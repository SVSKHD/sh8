<script setup>
import { showDetail } from "../../composables/detail";
import { fmtDate } from "../../utils/dates";
import SphGlassCard from "../ui/SphGlassCard.vue";
import SphPhotoPlaceholder from "../ui/SphPhotoPlaceholder.vue";
import SphIcon from "../ui/SphIcon.vue";

const props = defineProps({ item: { type: Object, required: true } });
defineEmits(["remove"]);

const open = () => showDetail("milestone", props.item);
</script>

<template>
  <li class="tl-item rise">
    <div class="tl-dot"></div>
    <sph-glass-card
      hover
      radius="1.25rem"
      pad="0.95rem 1.1rem"
      class="card-click tl-card"
      role="button"
      tabindex="0"
      :aria-label="'Open milestone: ' + item.title"
      @click="open()"
      @keydown.enter="open()"
    >
      <div class="flex items-start gap-3.5">
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <p class="m-0 text-xs font-bold uppercase tracking-widest" style="color: var(--accent)">{{ fmtDate(item.date) }}</p>
            <button
              class="gbtn gbtn-ghost gbtn-icon del-btn"
              style="margin: -0.3rem -0.4rem 0 0"
              aria-label="Delete milestone"
              @click.stop="$emit('remove')"
            >
              <sph-icon name="Trash2" :size="15" />
            </button>
          </div>
          <h3 class="font-display m-0 mt-0.5 text-2xl font-semibold leading-tight clamp-1">{{ item.title }}</h3>
          <p v-if="item.note" class="m-0 mt-1 text-sm leading-relaxed clamp-2" style="color: var(--ink-2)">{{ item.note }}</p>
        </div>
        <sph-photo-placeholder v-if="item.photo" label="photo" :height="92" class="tl-thumb" />
      </div>
    </sph-glass-card>
  </li>
</template>
