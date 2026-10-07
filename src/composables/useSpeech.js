/* read-aloud via the browser's built-in speech synthesis (Web Speech API) —
   no network or API key. One voice at a time app-wide: starting a new read
   stops the previous one. Emoji are stripped so they aren't spelled out. */
import { ref } from "vue";

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
export const speechSupported = !!(synth && typeof window.SpeechSynthesisUtterance === "function");

/* the text currently being read (null when silent) */
export const speakingText = ref(null);

const clean = (text) =>
  String(text || "")
    .replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, "")
    .replace(/\s+/g, " ")
    .trim();

/* a natural-sounding English voice when the device has one */
const pickVoice = () => {
  const voices = synth.getVoices() || [];
  const en = voices.filter((v) => /^en(-|_|$)/i.test(v.lang));
  return en.find((v) => /natural|neural|samantha|google/i.test(v.name)) || en.find((v) => v.default) || en[0] || null;
};

export function stopSpeaking() {
  if (!speechSupported) return;
  synth.cancel();
  speakingText.value = null;
}

export function speak(text) {
  const t = clean(text);
  if (!speechSupported || !t) return;
  synth.cancel();
  const u = new window.SpeechSynthesisUtterance(t);
  const voice = pickVoice();
  if (voice) u.voice = voice;
  u.rate = 0.95;
  const done = () => {
    if (speakingText.value === t) speakingText.value = null;
  };
  u.onend = done;
  u.onerror = done;
  speakingText.value = t;
  synth.speak(u);
}

/* play / stop toggle for one piece of text */
export function toggleSpeak(text) {
  if (speakingText.value && speakingText.value === clean(text)) stopSpeaking();
  else speak(text);
}

export const isSpeaking = (text) => !!speakingText.value && speakingText.value === clean(text);
