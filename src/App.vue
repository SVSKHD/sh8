<script setup>
import { useUsStore } from "./stores/us";

useUsStore().init();
</script>

<template>
  <div>
    <div class="bg-mesh" aria-hidden="true">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
      <div class="blob blob-4"></div>
    </div>
    <router-view />
  </div>
</template>
