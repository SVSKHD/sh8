<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { THEMES, themeMode } from "../../themeRegistry";
import SphIcon from "./SphIcon.vue";
import SphSidebar from "./SphSidebar.vue";
import SphTooltip from "./SphTooltip.vue";

const props = defineProps({ modelValue: { type: String, default: "rose" } });
const emit = defineEmits(["update:modelValue"]);

const lightThemes = computed(() => THEMES.filter((t) => t.mode === "light"));
const darkThemes = computed(() => THEMES.filter((t) => t.mode === "dark"));

const open = ref(false);
const customOpen = ref(false);
const root = ref(null);
const customAccent = ref("#d68a63");
const customBackground = ref("#17121f");
const customGradientStart = ref("#241838");
const customGradientEnd = ref("#0e3030");
const customMode = ref("dark");
const previewSnapshot = ref(null);

const setCustomVariables = () => {
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty("--bg-base", customBackground.value);
  rootStyle.setProperty("--blob-1", customGradientStart.value);
  rootStyle.setProperty("--blob-2", customGradientEnd.value);
  rootStyle.setProperty("--blob-3", customGradientEnd.value);
  rootStyle.setProperty("--blob-4", customGradientStart.value);
  rootStyle.setProperty("--accent", customAccent.value);
  rootStyle.setProperty("--accent-soft", `color-mix(in srgb, ${customAccent.value} 16%, transparent)`);
  rootStyle.setProperty("--stripe", `color-mix(in srgb, ${customAccent.value} 8%, transparent)`);
  rootStyle.setProperty("--ink", customMode.value === "dark" ? "#f4edf7" : "#382b2f");
  rootStyle.setProperty("--ink-2", customMode.value === "dark" ? "rgba(244, 237, 247, 0.7)" : "rgba(56, 43, 47, 0.68)");
  rootStyle.setProperty("--ink-3", customMode.value === "dark" ? "rgba(244, 237, 247, 0.44)" : "rgba(56, 43, 47, 0.45)");
  rootStyle.setProperty("--on-accent", customMode.value === "dark" ? "#24152b" : "#fff9f5");
  rootStyle.setProperty("--glass-shadow", customMode.value === "dark" ? "rgba(0, 0, 0, 0.44)" : "rgba(100, 50, 50, 0.14)");
  document.documentElement.dataset.theme = "custom";
  document.documentElement.dataset.mode = customMode.value;
};
const applyCustom = () => {
  setCustomVariables();
  try {
    localStorage.setItem(
      "us-custom-theme",
      JSON.stringify({
        accent: customAccent.value,
        background: customBackground.value,
        gradientStart: customGradientStart.value,
        gradientEnd: customGradientEnd.value,
        mode: customMode.value,
      }),
    );
  } catch (e) {}
  emit("update:modelValue", "custom");
  previewSnapshot.value = null;
  customOpen.value = false;
  open.value = false;
};
const previewCustom = () => setCustomVariables();
const setModeAndPreview = (mode) => {
  customMode.value = mode;
  previewCustom();
};
const restoreCustom = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("us-custom-theme") || "null");
    if (!saved) return;
    customAccent.value = saved.accent || customAccent.value;
    customBackground.value = saved.background || customBackground.value;
    customGradientStart.value = saved.gradientStart || customGradientStart.value;
    customGradientEnd.value = saved.gradientEnd || customGradientEnd.value;
    customMode.value = saved.mode || customMode.value;
    if (props.modelValue === "custom") setCustomVariables();
  } catch (e) {}
};
const clearCustomVariables = () => {
  [
    "--bg-base",
    "--blob-1",
    "--blob-2",
    "--blob-3",
    "--blob-4",
    "--accent",
    "--accent-soft",
    "--stripe",
    "--ink",
    "--ink-2",
    "--ink-3",
    "--on-accent",
    "--glass-shadow",
  ].forEach((name) => {
    document.documentElement.style.removeProperty(name);
  });
};
const beginPreview = () => {
  previewSnapshot.value = {
    theme: props.modelValue,
    accent: customAccent.value,
    background: customBackground.value,
    gradientStart: customGradientStart.value,
    gradientEnd: customGradientEnd.value,
    mode: customMode.value,
  };
};
const restorePreview = () => {
  const snapshot = previewSnapshot.value;
  if (!snapshot) return;
  customAccent.value = snapshot.accent;
  customBackground.value = snapshot.background;
  customGradientStart.value = snapshot.gradientStart;
  customGradientEnd.value = snapshot.gradientEnd;
  customMode.value = snapshot.mode;
  if (snapshot.theme === "custom") setCustomVariables();
  else {
    clearCustomVariables();
    document.documentElement.dataset.theme = snapshot.theme;
    document.documentElement.dataset.mode = themeMode(snapshot.theme);
  }
  previewSnapshot.value = null;
};
const closePopover = () => {
  restorePreview();
  open.value = false;
};
const closeCustomDrawer = () => {
  restorePreview();
  customOpen.value = false;
};
const togglePopover = () => {
  if (open.value) closePopover();
  else {
    beginPreview();
    open.value = true;
  }
};
const toggleCustomDrawer = () => {
  if (customOpen.value) closeCustomDrawer();
  else {
    beginPreview();
    customOpen.value = true;
    open.value = false;
  }
};

const pick = (id) => {
  if (id !== "custom") clearCustomVariables();
  previewSnapshot.value = null;
  emit("update:modelValue", id);
  open.value = false;
};
const onDoc = (e) => {
  if (open.value && root.value && !root.value.contains(e.target)) closePopover();
};
const onEsc = (e) => {
  if (e.key !== "Escape") return;
  if (customOpen.value) closeCustomDrawer();
  else closePopover();
};
onMounted(() => {
  document.addEventListener("click", onDoc);
  window.addEventListener("keydown", onEsc);
  restoreCustom();
});
onBeforeUnmount(() => {
  document.removeEventListener("click", onDoc);
  window.removeEventListener("keydown", onEsc);
});
</script>

<template>
  <div ref="root" class="theme-wrap">
    <sph-tooltip text="Choose theme">
      <button class="gbtn gbtn-icon" :aria-expanded="open" aria-label="Choose theme" @click="togglePopover">
        <sph-icon name="Palette" :size="16" />
      </button>
    </sph-tooltip>
    <sph-tooltip text="Customize theme" placement="bottom">
      <button class="gbtn gbtn-icon" :aria-expanded="customOpen" aria-label="Customize theme" @click="toggleCustomDrawer">
        <sph-icon name="Sparkles" :size="16" />
      </button>
    </sph-tooltip>
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
    <sph-sidebar v-model="customOpen" placement="right" title="Customize theme" @update:model-value="closeCustomDrawer">
      <div class="custom-theme-editor">
        <p class="m-0 text-sm" style="color: var(--ink-2)">
          Design a palette, preview it live, and apply it when it feels right.
        </p>
        <label class="custom-color-field">
          <span>Accent</span>
          <input v-model="customAccent" type="color" aria-label="Custom accent color" @input="previewCustom" />
        </label>
        <label class="custom-color-field">
          <span>Surface</span>
          <input v-model="customBackground" type="color" aria-label="Custom surface color" @input="previewCustom" />
        </label>
        <label class="custom-color-field">
          <span>Gradient A</span>
          <input v-model="customGradientStart" type="color" aria-label="Custom gradient start color" @input="previewCustom" />
        </label>
        <label class="custom-color-field">
          <span>Gradient B</span>
          <input v-model="customGradientEnd" type="color" aria-label="Custom gradient end color" @input="previewCustom" />
        </label>
        <div
          class="custom-gradient-preview"
          :style="{ background: `linear-gradient(135deg, ${customGradientStart}, ${customGradientEnd})` }"
          aria-hidden="true"
        ></div>
        <div class="custom-mode-row">
          <button
            type="button"
            class="custom-mode"
            :class="{ active: customMode === 'light' }"
            @click="setModeAndPreview('light')"
          >
            Light
          </button>
          <button type="button" class="custom-mode" :class="{ active: customMode === 'dark' }" @click="setModeAndPreview('dark')">
            Dark
          </button>
          <button type="button" class="gbtn gbtn-primary custom-apply" @click="applyCustom">Apply palette</button>
        </div>
      </div>
    </sph-sidebar>
  </div>
</template>

<style scoped>
.custom-theme-editor {
  display: grid;
  gap: 0.55rem;
}
.custom-color-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  padding: 0.38rem 0.5rem 0.38rem 0.7rem;
  border: 1px solid var(--glass-border);
  border-radius: 0.7rem;
  color: var(--ink-2);
  background: var(--glass-fill);
  font-size: 0.72rem;
  font-weight: 600;
}
.custom-color-field input {
  width: 2rem;
  height: 1.5rem;
  padding: 0;
  border: 0;
  border-radius: 0.4rem;
  background: transparent;
  cursor: pointer;
}
.custom-gradient-preview {
  min-height: 2.1rem;
  border: 1px solid var(--glass-border);
  border-radius: 0.7rem;
  box-shadow: inset 0 1px 0 var(--glass-highlight);
}
.custom-mode-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.custom-mode {
  padding: 0.38rem 0.62rem;
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  color: var(--ink-2);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 0.7rem;
}
.custom-mode.active {
  color: var(--on-accent);
  background: var(--accent);
}
.custom-apply {
  margin-left: auto;
  padding: 0.4rem 0.75rem;
  font-size: 0.7rem;
}
</style>
