<script setup>
/* "Connect Google Calendar" action + connected-state indicator. Hidden
   entirely when no client ID is configured — no dead UI. Theme-consistent,
   uses only existing .gbtn/.chip classes. */
import { ref } from "vue";
import { useGoogleCalendar } from "../../composables/useGoogleCalendar";
import SphIcon from "./SphIcon.vue";

const G = useGoogleCalendar();
const busy = ref(false);

const onClick = async () => {
  if (busy.value) return;
  busy.value = true;
  try {
    if (G.isConnected.value) await G.disconnect();
    else await G.connect();
  } catch (e) {
  } finally {
    busy.value = false;
  }
};
</script>

<template>
  <button
    v-if="G.configured"
    type="button"
    class="gbtn"
    :class="{ 'gbtn-ghost': !G.isConnected.value }"
    :disabled="busy"
    :style="busy ? 'opacity: 0.6; cursor: wait;' : ''"
    :aria-label="G.isConnected.value ? 'Disconnect Google Calendar' : 'Connect Google Calendar'"
    @click="onClick()"
  >
    <sph-icon name="Calendar" :size="15" />
    {{ busy ? "Working…" : G.isConnected.value ? "Calendar connected" : "Connect Google Calendar" }}
  </button>
</template>
