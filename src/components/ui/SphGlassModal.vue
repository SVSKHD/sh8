<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from "vue";
import { isSpeaking, speechSupported, stopSpeaking, toggleSpeak } from "../../composables/useSpeech";
import SphIcon from "./SphIcon.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: "" },
  /* text for the header's read-aloud button — omit it and there's no button */
  speak: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);

const canSpeak = computed(() => speechSupported && !!props.speak.trim());
const speaking = computed(() => isSpeaking(props.speak));

const onKey = (e) => {
  if (e.key === "Escape" && props.modelValue) emit("update:modelValue", false);
};
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  if (speaking.value) stopSpeaking();
});

/* closing the dialog, or moving to different content in it, stops the voice */
watch(
  () => props.modelValue,
  (open) => !open && speaking.value && stopSpeaking(),
);
watch(
  () => props.speak,
  (_now, before) => isSpeaking(before) && stopSpeaking(),
);
</script>

<template>
  <teleport to="body">
    <div v-if="modelValue" class="modal-veil" @click.self="$emit('update:modelValue', false)">
      <div class="glass glass-strong modal-card" role="dialog" aria-modal="true">
        <div class="flex items-center justify-between px-6 pt-5 pb-1">
          <h3 class="font-display m-0 text-2xl font-semibold italic">{{ title }}</h3>
          <div class="flex items-center gap-1">
            <button
              v-if="canSpeak"
              class="gbtn gbtn-ghost gbtn-icon"
              :class="{ 'speak-on': speaking }"
              :aria-label="speaking ? 'Stop reading' : 'Read aloud'"
              :aria-pressed="speaking"
              :title="speaking ? 'Stop reading' : 'Read aloud'"
              @click="toggleSpeak(speak)"
            >
              <sph-icon :name="speaking ? 'VolumeX' : 'Volume2'" :size="18" />
            </button>
            <button class="gbtn gbtn-ghost gbtn-icon" aria-label="Close" @click="$emit('update:modelValue', false)">
              <sph-icon name="X" :size="18" />
            </button>
          </div>
        </div>
        <div class="px-6 pb-6 pt-2"><slot /></div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
/* reading: the speaker button takes the accent and pulses gently */
.speak-on {
  color: var(--accent);
  animation: speak-pulse 1.4s ease-in-out infinite;
}
@keyframes speak-pulse {
  50% {
    opacity: 0.55;
  }
}
@media (prefers-reduced-motion: reduce) {
  .speak-on {
    animation: none;
  }
}
</style>
