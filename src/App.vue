<script setup>
import SphCursorShadow from "./components/ui/SphCursorShadow.vue";
import SphThemedStars from "./components/ui/SphThemedStars.vue";
import { useThemeColors } from "./composables/themeColors";
import { useUsStore } from "./stores/us";

useUsStore().init();
/* live theme colors pulled from the active theme's CSS variables */
const { bg, accent } = useThemeColors();
</script>

<template>
  <div>
    <div class="bg-mesh" aria-hidden="true">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
      <div class="blob blob-4"></div>
    </div>
    <!-- themed twinkling stars sit behind all content (z-index: -1) -->
    <sph-themed-stars :theme-color="bg" :count="70" />
    <router-view />
    <!-- glowing cursor trail floats above content, ignores pointer events -->
    <sph-cursor-shadow :color="accent" />
  </div>
</template>
