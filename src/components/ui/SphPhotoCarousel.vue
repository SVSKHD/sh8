<script setup>
/* swipeable glass photo carousel — native scroll-snap (so touch swipes and
   trackpads feel right), dots, prev/next arrows, lazy images, and an
   optional per-slide caption + photographer credit (required for Google
   place photos). */
import { computed, ref, watch } from "vue";
import SphIcon from "./SphIcon.vue";
import SphPhotoPlaceholder from "./SphPhotoPlaceholder.vue";

const props = defineProps({
  /* [{ src, alt, caption?, credit?, creditUrl? }] */
  slides: { type: Array, default: () => [] },
  height: { type: Number, default: 200 },
  loading: { type: Boolean, default: false },
  emptyLabel: { type: String, default: "no photos yet" },
  /* small "Google Maps" source label (Places attribution) */
  source: { type: String, default: "" },
});

const track = ref(null);
const index = ref(0);
const count = computed(() => props.slides.length);

const onScroll = () => {
  const el = track.value;
  if (!el || !el.clientWidth) return;
  index.value = Math.round(el.scrollLeft / el.clientWidth);
};
const go = (i) => {
  const el = track.value;
  if (!el) return;
  const n = (i + count.value) % count.value;
  el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
  index.value = n;
};
watch(
  () => props.slides,
  () => {
    index.value = 0;
    if (track.value) track.value.scrollLeft = 0;
  },
);
const onKey = (e) => {
  if (e.key === "ArrowRight") go(index.value + 1);
  else if (e.key === "ArrowLeft") go(index.value - 1);
  else return;
  e.preventDefault();
  e.stopPropagation(); // don't also flip the detail dialog to the next card
};
</script>

<template>
  <div class="car" :style="{ '--car-h': height + 'px' }">
    <div v-if="loading && !count" class="car-skeleton" aria-label="Loading photos"></div>
    <sph-photo-placeholder v-else-if="!count" :label="emptyLabel" :height="height" />
    <template v-else>
      <div
        ref="track"
        class="car-track"
        tabindex="0"
        role="region"
        aria-roledescription="carousel"
        :aria-label="count + ' photos'"
        @scroll.passive="onScroll"
        @keydown="onKey"
        @touchstart.stop
        @touchend.stop
      >
        <figure v-for="(s, i) in slides" :key="s.src + i" class="car-slide" :aria-label="i + 1 + ' of ' + count">
          <img :src="s.src" :alt="s.alt || ''" :loading="i === 0 ? 'eager' : 'lazy'" decoding="async" />
          <figcaption v-if="s.caption || s.credit" class="car-cap">
            <span v-if="s.caption" class="car-title">{{ s.caption }}</span>
            <a
              v-if="s.credit"
              class="car-credit"
              :href="s.creditUrl || undefined"
              target="_blank"
              rel="noopener noreferrer"
              @click.stop
              >📷 {{ s.credit }}</a
            >
          </figcaption>
        </figure>
      </div>
      <template v-if="count > 1">
        <button type="button" class="car-arrow prev" aria-label="Previous photo" @click.stop="go(index - 1)">
          <sph-icon name="ChevronLeft" :size="16" />
        </button>
        <button type="button" class="car-arrow next" aria-label="Next photo" @click.stop="go(index + 1)">
          <sph-icon name="ChevronRight" :size="16" />
        </button>
        <div class="car-dots">
          <button
            v-for="(s, i) in slides"
            :key="i"
            type="button"
            class="car-dot"
            :class="{ on: i === index }"
            :aria-label="'Photo ' + (i + 1)"
            :aria-current="i === index"
            @click.stop="go(i)"
          ></button>
        </div>
      </template>
      <span v-if="source" class="car-source">{{ source }}</span>
    </template>
  </div>
</template>

<style scoped>
.car {
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
}
.car-track {
  display: flex;
  height: var(--car-h);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  border-radius: 1rem;
  outline: none;
}
.car-track::-webkit-scrollbar {
  display: none;
}
.car-track:focus-visible {
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.car-slide {
  position: relative;
  flex: 0 0 100%;
  height: 100%;
  margin: 0;
  scroll-snap-align: center;
  scroll-snap-stop: always;
}
.car-slide img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: var(--glass-fill);
}
.car-cap {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 1.6rem 0.8rem 1.5rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.55), transparent);
  color: #fff;
  pointer-events: none;
}
.car-title {
  font-family: "Cormorant Garamond", Georgia, serif;
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.1;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.4);
}
.car-credit {
  font-size: 0.66rem;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  pointer-events: auto;
  width: fit-content;
}
.car-credit:hover {
  text-decoration: underline;
}
.car-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(20, 20, 30, 0.28);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #fff;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.car:hover .car-arrow,
.car-arrow:focus-visible {
  opacity: 1;
}
@media (hover: none) {
  .car-arrow {
    display: none; /* swipe on touch screens */
  }
}
.car-arrow.prev {
  left: 0.5rem;
}
.car-arrow.next {
  right: 0.5rem;
}
.car-dots {
  position: absolute;
  bottom: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.3rem;
  padding: 0.25rem 0.45rem;
  border-radius: 999px;
  background: rgba(20, 20, 30, 0.28);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.car-dot {
  width: 0.4rem;
  height: 0.4rem;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition:
    width 0.25s ease,
    background 0.25s ease;
}
.car-dot.on {
  width: 1rem;
  background: #fff;
}
.car-source {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.62rem;
  font-weight: 600;
  color: #fff;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  background: rgba(20, 20, 30, 0.35);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.car-skeleton {
  height: var(--car-h);
  border-radius: 1rem;
  background: linear-gradient(100deg, var(--glass-fill) 30%, var(--glass-fill-strong) 50%, var(--glass-fill) 70%);
  background-size: 300% 100%;
  animation: car-shimmer 1.4s ease-in-out infinite;
}
@keyframes car-shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: 0 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .car-skeleton {
    animation: none;
  }
  .car-dot {
    transition: none;
  }
}
</style>
