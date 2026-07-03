<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { THEMES } from "../../themeRegistry";
import SphIcon from "./SphIcon.vue";

defineProps({ modelValue: { type: String, default: "rose" } });
const emit = defineEmits(["update:modelValue"]);

const lightThemes = computed(() => THEMES.filter((t) => t.mode === "light"));
const darkThemes = computed(() => THEMES.filter((t) => t.mode === "dark"));

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
      <p class="glabel" style="margin-bottom: 0.5rem">Light</p>
      <div class="theme-grid">
        <button
          v-for="t in lightThemes"
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
      <p class="glabel" style="margin: 0.7rem 0 0.5rem">Dark</p>
      <div class="theme-grid">
        <button
          v-for="t in darkThemes"
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
