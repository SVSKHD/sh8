<script setup>
import { showDetail } from "../../composables/detail";
import { fmtDate } from "../../utils/dates";
import SphByline from "../ui/SphByline.vue";
import SphGlassCard from "../ui/SphGlassCard.vue";
import SphPhoto from "../ui/SphPhoto.vue";
import SphIcon from "../ui/SphIcon.vue";

const props = defineProps({ item: { type: Object, required: true } });
defineEmits(["edit", "remove"]);

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
            <div class="flex items-center" style="margin: -0.3rem -0.4rem 0 0">
              <button class="gbtn gbtn-ghost gbtn-icon del-btn" aria-label="Edit milestone" @click.stop="$emit('edit')">
                <sph-icon name="Pencil" :size="14" />
              </button>
              <button class="gbtn gbtn-ghost gbtn-icon del-btn" aria-label="Delete milestone" @click.stop="$emit('remove')">
                <sph-icon name="Trash2" :size="15" />
              </button>
            </div>
          </div>
          <h3 class="font-display m-0 mt-0.5 text-2xl font-semibold leading-tight clamp-1">{{ item.title }}</h3>
          <p v-if="item.note" class="m-0 mt-1 text-sm leading-relaxed clamp-2" style="color: var(--ink-2)">{{ item.note }}</p>
          <sph-byline :item="item" class="mt-1.5" />
        </div>
        <sph-photo v-if="item.photo" :src="item.photo" :alt="item.title" label="photo" :height="92" class="tl-thumb" />
      </div>
    </sph-glass-card>
  </li>
</template>
