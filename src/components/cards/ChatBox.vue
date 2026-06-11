<script setup>
import { nextTick, onMounted, ref, watch } from "vue";
import EmptyState from "../ui/EmptyState.vue";
import UsIcon from "../ui/UsIcon.vue";

const props = defineProps({
  items: { type: Array, required: true },
  me: { type: String, required: true },
});
const emit = defineEmits(["send"]);

const scroller = ref(null);
const text = ref("");

function fmtTs(ts) {
  const d = new Date(ts);
  if (isNaN(d)) return "";
  const now = new Date();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return time;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " + time;
}

const toBottom = () =>
  nextTick(() => {
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight;
  });
onMounted(toBottom);
watch(() => props.items.length, toBottom);

const send = () => {
  const t = text.value.trim();
  if (!t) return;
  emit("send", t);
  text.value = "";
};
</script>

<template>
  <div>
    <div ref="scroller" class="chat-scroll">
      <div v-for="m in items" :key="m.id" class="bubble-row" :class="{ own: m.from === me }">
        <div :style="{ maxWidth: '78%' }">
          <div class="bubble" :class="m.from === me ? 'own' : 'other'">{{ m.text }}</div>
          <p class="bubble-meta m-0" :style="m.from === me ? 'text-align: right;' : ''">{{ m.from }} · {{ fmtTs(m.ts) }}</p>
        </div>
      </div>
      <empty-state v-if="!items.length" emoji="💬" message="No messages yet." hint="Say something sweet below." />
    </div>
    <form class="flex items-center gap-2 mt-3" @submit.prevent="send()">
      <input
        v-model="text"
        class="ginput flex-1"
        style="border-radius: 999px"
        :placeholder="'Say something sweet, ' + me + '…'"
        aria-label="Message"
      />
      <button type="submit" class="gbtn gbtn-primary gbtn-icon" aria-label="Send message" style="padding: 0.65rem">
        <us-icon name="Send" :size="17" />
      </button>
    </form>
  </div>
</template>
