<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { detailState as d, relDate } from "../../composables/detail";
import { useUsStore } from "../../stores/us";
import { fmtDate as fmt } from "../../utils/dates";
import SphGlassModal from "../ui/SphGlassModal.vue";
import SphHeartRating from "../ui/SphHeartRating.vue";
import SphPhotoPlaceholder from "../ui/SphPhotoPlaceholder.vue";
import SphIcon from "../ui/SphIcon.vue";

const state = useUsStore();
const dir = ref(1);
const touchX = ref(null);

const title = computed(
  () =>
    ({
      milestone: "Milestone",
      memory: "Memory",
      wishlist: "Place to visit",
      visited: "Place we visited",
      place: "Place",
      note: "Note",
      gratitude: "Sweet note",
    })[d.kind] || "",
);

/* sibling items of the open card, in the same order as on screen */
const list = computed(() => {
  if (!d.item) return [];
  switch (d.kind) {
    case "milestone":
      return state.milestones.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    case "memory":
      return state.memories;
    case "wishlist":
      return state.wishlist;
    case "visited":
      return state.visited;
    case "place":
      return state.places;
    case "note":
      return state.notes;
    case "gratitude":
      return state.gratitudeForMe.some((x) => x.id === d.item.id) ? state.gratitudeForMe : state.gratitudeForYou;
    default:
      return [];
  }
});
const index = computed(() => (d.item ? list.value.findIndex((x) => x.id === d.item.id) : -1));
const rel = computed(() => (d.item ? relDate(d.item.date) : ""));

const step = (delta) => {
  const n = list.value.length;
  if (n < 2 || index.value < 0) return;
  dir.value = delta;
  d.item = list.value[(index.value + delta + n) % n];
};
const onKey = (e) => {
  if (!d.open) return;
  if (e.key === "ArrowRight") {
    step(1);
    e.preventDefault();
  } else if (e.key === "ArrowLeft") {
    step(-1);
    e.preventDefault();
  }
};
const onTouchStart = (e) => {
  touchX.value = e.changedTouches[0].clientX;
};
const onTouchEnd = (e) => {
  if (touchX.value === null) return;
  const dx = e.changedTouches[0].clientX - touchX.value;
  touchX.value = null;
  if (Math.abs(dx) > 42) step(dx < 0 ? 1 : -1);
};
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<template>
  <sph-glass-modal v-model="d.open" :title="title">
    <div v-if="d.item">
      <div class="detail-scroll" @touchstart="onTouchStart($event)" @touchend="onTouchEnd($event)">
        <div :key="d.item.id" class="detail-pane" :class="dir > 0 ? 'pane-next' : 'pane-prev'">
          <template v-if="d.kind === 'milestone'">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <p class="m-0 text-xs font-bold uppercase tracking-widest" style="color: var(--accent)">{{ fmt(d.item.date) }}</p>
              <span v-if="rel" class="chip">{{ rel }}</span>
            </div>
            <h2 class="font-display m-0 mt-1 text-3xl font-semibold leading-tight">{{ d.item.title }}</h2>
            <sph-photo-placeholder v-if="d.item.photo" label="drop a photo of this day" :height="190" class="mt-3" />
            <p v-if="d.item.note" class="detail-body mt-3">{{ d.item.note }}</p>
          </template>

          <template v-else-if="d.kind === 'memory'">
            <sph-photo-placeholder label="memory photo" :height="200" />
            <p class="detail-body mt-3" style="color: var(--ink)">{{ d.item.caption }}</p>
            <div class="flex items-center justify-between gap-2 flex-wrap mt-2">
              <p class="m-0 text-xs font-bold uppercase tracking-widest" style="color: var(--accent)">{{ fmt(d.item.date) }}</p>
              <span v-if="rel" class="chip">{{ rel }}</span>
            </div>
          </template>

          <template v-else-if="d.kind === 'wishlist'">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="font-display m-0 text-3xl font-semibold leading-tight">{{ d.item.name }}</h2>
              <span class="chip">{{ d.item.priority }}</span>
            </div>
            <p v-if="d.item.note" class="detail-body mt-3">{{ d.item.note }}</p>
          </template>

          <template v-else-if="d.kind === 'visited'">
            <h2 class="font-display m-0 text-3xl font-semibold leading-tight">{{ d.item.name }}</h2>
            <div class="flex items-center justify-between gap-2 flex-wrap mt-1">
              <p class="m-0 text-xs font-bold uppercase tracking-widest" style="color: var(--accent)">{{ fmt(d.item.date) }}</p>
              <span v-if="rel" class="chip">{{ rel }}</span>
            </div>
            <div class="mt-2"><sph-heart-rating :model-value="d.item.rating" readonly :size="20" /></div>
            <p v-if="d.item.story" class="detail-body mt-3">{{ d.item.story }}</p>
          </template>

          <template v-else-if="d.kind === 'place'">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="font-display m-0 text-3xl font-semibold leading-tight">{{ d.item.name }}</h2>
              <span v-if="d.item.visited" class="chip">visited</span>
            </div>
            <p v-if="d.item.addedBy" class="m-0 mt-1 text-xs" style="color: var(--ink-3)">added by {{ d.item.addedBy }}</p>
            <p
              v-if="d.item.visited && d.item.visitedDate"
              class="m-0 mt-1 text-xs font-bold uppercase tracking-widest"
              style="color: var(--accent)"
            >
              {{ fmt(d.item.visitedDate) }}
            </p>
            <img
              v-if="d.item.image"
              :src="d.item.image"
              :alt="d.item.name"
              class="mt-3 block w-full"
              style="border-radius: 1rem; max-height: 14rem; object-fit: cover"
            />
            <sph-photo-placeholder v-else label="no photo yet" :height="150" class="mt-3" />
            <p v-if="d.item.note" class="detail-body mt-3">{{ d.item.note }}</p>
          </template>

          <template v-else-if="d.kind === 'note'">
            <h2 v-if="d.item.title" class="font-display m-0 text-2xl font-semibold leading-tight">{{ d.item.title }}</h2>
            <p class="detail-body" :class="{ 'mt-2': !!d.item.title }">{{ d.item.body }}</p>
            <p class="m-0 mt-3 text-xs" style="color: var(--ink-3)">{{ fmt(d.item.date) }}</p>
          </template>

          <template v-else-if="d.kind === 'gratitude'">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <p class="m-0 text-xs font-bold uppercase tracking-widest" style="color: var(--accent)">{{ fmt(d.item.date) }}</p>
              <span v-if="rel" class="chip">{{ rel }}</span>
            </div>
            <p class="font-display italic text-xl detail-body mt-2" style="color: var(--ink)">{{ d.item.note }}</p>
          </template>
        </div>
      </div>

      <!-- prev / next browsing between sibling cards -->
      <div v-if="list.length > 1" class="detail-nav">
        <button class="gbtn gbtn-icon" aria-label="Previous" @click="step(-1)"><sph-icon name="ChevronLeft" :size="17" /></button>
        <div class="text-center">
          <p class="detail-count m-0">{{ index + 1 }} of {{ list.length }}</p>
          <p class="detail-hint m-0">swipe or use ← →</p>
        </div>
        <button class="gbtn gbtn-icon" aria-label="Next" @click="step(1)"><sph-icon name="ChevronRight" :size="17" /></button>
      </div>
    </div>
  </sph-glass-modal>
</template>
