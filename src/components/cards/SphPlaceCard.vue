<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { burstHearts } from "../../composables/burstHearts";
import { showDetail } from "../../composables/detail";
import { getPlacePhotos, placePhotosEnabled } from "../../placePhotos";
import { fmtDateRange, tripDays } from "../../utils/dates";
import SphByline from "../ui/SphByline.vue";
import SphGlassCard from "../ui/SphGlassCard.vue";
import SphHeartRating from "../ui/SphHeartRating.vue";
import SphIcon from "../ui/SphIcon.vue";
import SphPhoto from "../ui/SphPhoto.vue";
import SphPhotoCarousel from "../ui/SphPhotoCarousel.vue";

const props = defineProps({
  item: { type: Object, required: true },
  mode: { type: String, default: "wishlist" }, // "wishlist" | "visited"
});
const emit = defineEmits(["visited", "edit", "remove"]);

const open = () => showDetail(props.mode, props.item);
const markVisited = (ev) => {
  burstHearts(ev.clientX, ev.clientY, 12);
  emit("visited");
};

/* ---- visited trips: date range, places, and a carousel ---- */
const stops = computed(() => (Array.isArray(props.item.stops) ? props.item.stops : []));
const from = computed(() => props.item.dateFrom || props.item.date);
const to = computed(() => props.item.dateTo || from.value);
const range = computed(() => fmtDateRange(from.value, to.value));
const days = computed(() => tripDays(from.value, to.value));

/* one slide per place (its first Google photo), after the trip's own photo;
   fetched only once the card scrolls into view */
const card = ref(null);
const inView = ref(false);
const stopSlides = ref([]);
const loadingPhotos = ref(false);
let io = null;
onMounted(() => {
  const el = card.value && card.value.$el;
  if (!el || typeof IntersectionObserver === "undefined") return (inView.value = true);
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        inView.value = true;
        io.disconnect();
      }
    },
    { rootMargin: "200px" },
  );
  io.observe(el);
});
onBeforeUnmount(() => io && io.disconnect());

let run = 0;
watch(
  [inView, () => JSON.stringify(stops.value)],
  async () => {
    if (props.mode !== "visited" || !inView.value || !placePhotosEnabled || !stops.value.length) {
      stopSlides.value = [];
      return;
    }
    const mine = ++run;
    loadingPhotos.value = true;
    const found = await Promise.all(
      stops.value.map((s) =>
        getPlacePhotos(s, { max: 1, width: 900 })
          .then((p) => (p[0] ? { ...p[0], caption: s.name } : null))
          .catch(() => null),
      ),
    );
    if (mine !== run) return;
    stopSlides.value = found.filter(Boolean);
    loadingPhotos.value = false;
  },
  { immediate: true },
);
const slides = computed(() => {
  const own =
    typeof props.item.photo === "string" && props.item.photo
      ? [{ src: props.item.photo, alt: props.item.name, caption: stopSlides.value.length ? props.item.name : "" }]
      : [];
  return [...own, ...stopSlides.value];
});
</script>

<template>
  <sph-glass-card
    ref="card"
    hover
    radius="1.4rem"
    pad="1.15rem 1.25rem"
    class="rise card-click place-card"
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
          <span v-if="mode === 'wishlist'" class="chip">{{ item.priority }}</span>
        </div>
        <div v-if="mode === 'visited'" class="flex items-center gap-2 flex-wrap mt-0.5">
          <p class="m-0 text-xs font-bold uppercase tracking-widest" style="color: var(--accent)">{{ range }}</p>
          <span v-if="days > 1" class="chip chip-outline">{{ days }} days</span>
          <span v-if="stops.length" class="chip chip-outline">
            <sph-icon name="MapPin" :size="11" /> {{ stops.length }} {{ stops.length === 1 ? "place" : "places" }}
          </span>
        </div>
        <sph-byline :item="item" class="mt-1" />
      </div>
      <div class="flex items-center flex-shrink-0">
        <button class="gbtn gbtn-ghost gbtn-icon del-btn" aria-label="Edit place" @click.stop="$emit('edit')">
          <sph-icon name="Pencil" :size="14" />
        </button>
        <button class="gbtn gbtn-ghost gbtn-icon del-btn" aria-label="Delete place" @click.stop="$emit('remove')">
          <sph-icon name="Trash2" :size="15" />
        </button>
      </div>
    </div>
    <sph-photo-carousel
      v-if="mode === 'visited' && (slides.length > 1 || (loadingPhotos && stops.length))"
      :slides="slides"
      :loading="loadingPhotos"
      :height="150"
      :source="stopSlides.length ? 'Google Maps' : ''"
      class="mt-2.5"
    />
    <sph-photo
      v-else-if="typeof item.photo === 'string' && item.photo"
      :src="item.photo"
      :alt="item.name"
      :height="120"
      class="mt-2.5"
    />
    <p v-if="mode === 'wishlist' && item.note" class="m-0 mt-1.5 text-sm leading-relaxed clamp-2" style="color: var(--ink-2)">
      {{ item.note }}
    </p>
    <p v-if="mode === 'visited' && item.story" class="m-0 mt-1.5 text-sm leading-relaxed clamp-2" style="color: var(--ink-2)">
      {{ item.story }}
    </p>
    <div v-if="mode === 'visited'" class="card-foot"><sph-heart-rating :model-value="item.rating" readonly /></div>
    <div v-if="mode === 'wishlist'" class="card-foot">
      <button class="gbtn" style="font-size: 0.82rem; padding: 0.4rem 0.9rem" @click.stop="markVisited($event)">
        <sph-icon name="Check" :size="15" /> Mark as visited
      </button>
    </div>
  </sph-glass-card>
</template>
