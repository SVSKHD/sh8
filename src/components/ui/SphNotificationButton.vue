<script setup>
/* "Enable notifications" action + granted-state indicator. Hidden entirely
   when the browser has no Notification API at all — no dead UI. Mirrors
   SphGoogleCalendarButton.vue's pattern. */
import { useNotifications } from "../../composables/useNotifications";
import SphIcon from "./SphIcon.vue";

const N = useNotifications();
</script>

<template>
  <button
    v-if="N.supported && !N.granted.value"
    type="button"
    class="gbtn gbtn-ghost"
    aria-label="Enable notifications"
    @click="N.requestPermission()"
  >
    <sph-icon name="BellRing" :size="15" />
    Enable notifications
  </button>
  <span v-else-if="N.supported" class="chip chip-outline"><sph-icon name="BellRing" :size="11" /> Notifications on</span>
</template>
