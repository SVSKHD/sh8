<script setup>
import SphCursorShadow from "./components/ui/SphCursorShadow.vue";
import SphThemedStars from "./components/ui/SphThemedStars.vue";
import FloatingLoveField from "./components/ui/FloatingLoveField.vue";
import LoveQuotes from "./components/ui/LoveQuotes.vue";
import { useThemeColors } from "./composables/themeColors";
import { useUsStore } from "./stores/us";

useUsStore().init();
/* live theme colors pulled from the active theme's CSS variables */
const { bg, accent, mode } = useThemeColors();
</script>

<template>
  <div>
    <div class="bg-mesh" aria-hidden="true">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
      <div class="blob blob-4"></div>
    </div>
    <!-- ambient layers sit behind all content (z-index: -1) -->
    <sph-themed-stars :theme-color="bg" :count="70" />
    <floating-love-field :theme-color="accent" :mode="mode" />
    <router-view />
    <!-- rotating love quotes float above content but stay non-blocking and
         below the cursor layer -->
    <love-quotes />
    <!-- glowing cursor with a love tail + touch ripple; colors + blend mode
         come from the active theme (screen brightens on dark themes instead
         of multiply darkening them toward black) -->
    <sph-cursor-shadow
      :heart-color="accent"
      :glow-color="accent"
      :ripple-color="accent"
      :blend-mode="mode === 'dark' ? 'screen' : 'multiply'"
    />
  </div>
</template>
