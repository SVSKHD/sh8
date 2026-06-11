<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import SphIcon from "./SphIcon.vue";

defineProps({ modelValue: { type: String, default: "rose" } });
const emit = defineEmits(["update:modelValue"]);

const THEMES = [
  { id: "rose", label: "Rose Blush", a: "#e0526f", b: "#ffd2e1" },
  { id: "lavender", label: "Lavender Dream", a: "#8b5fd6", b: "#ddd0ff" },
  { id: "sunset", label: "Sunset Lovers", a: "#e8703f", b: "#ffd8b3" },
  { id: "ocean", label: "Ocean Hearts", a: "#1f8fa8", b: "#c2e6ee" },
  { id: "meadow", label: "Meadow Picnic", a: "#4f9c63", b: "#d2ecc6" },
  { id: "mocha", label: "Cozy Mocha", a: "#a4663f", b: "#e6d3bd" },
  { id: "cherry", label: "Cherry Soda", a: "#d23950", b: "#ffc7cc" },
  { id: "golden", label: "Golden Hour", a: "#c2861c", b: "#ffe2a6" },
  { id: "midnight", label: "Midnight Romance", a: "#1c2440", b: "#e3a4b2" },
  { id: "noir", label: "Velvet Noir", a: "#241a2e", b: "#c9a0dc" },
];

const open = ref(false);
const root = ref(null);

const pick = (id) => {
  emit("update:modelValue", id);
  open.value = false;
};
const onDoc = (e) => {
  if (open.value && root.value && !root.value.contains(e.target)) open.value = false;
};
const onEsc = (e) => {
  if (e.key === "Escape") open.value = false;
};
onMounted(() => {
  document.addEventListener("click", onDoc);
  window.addEventListener("keydown", onEsc);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", onDoc);
  window.removeEventListener("keydown", onEsc);
});
</script>

<template>
  <div ref="root" class="theme-wrap">
    <button class="gbtn gbtn-icon" :aria-expanded="open" aria-label="Choose theme" title="Theme" @click="open = !open">
      <sph-icon name="Palette" :size="16" />
    </button>
    <div v-if="open" class="glass glass-strong theme-pop" role="listbox" aria-label="Themes">
      <p class="glabel" style="margin-bottom: 0.5rem">Theme</p>
      <div class="theme-grid">
        <button
          v-for="t in THEMES"
          :key="t.id"
          class="theme-opt"
          :class="{ active: t.id === modelValue }"
          role="option"
          :aria-selected="t.id === modelValue"
          @click="pick(t.id)"
        >
          <span class="theme-dot" :style="{ background: 'linear-gradient(135deg, ' + t.a + ' 50%, ' + t.b + ' 50%)' }"></span>
          <span>{{ t.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
