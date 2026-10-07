<script setup>
import { nextTick, onMounted, ref, watch } from "vue";
import SphEmptyState from "../ui/SphEmptyState.vue";
import SphIcon from "../ui/SphIcon.vue";

const props = defineProps({
  items: { type: Array, required: true },
  me: { type: String, required: true },
});
const emit = defineEmits(["send", "edit", "remove"]);

const scroller = ref(null);
const input = ref(null);
const text = ref("");
/* id of the own message being edited — the composer doubles as the editor */
const editingId = ref(null);

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

const startEdit = (m) => {
  editingId.value = m.id;
  text.value = m.text;
  nextTick(() => input.value && input.value.focus());
};
const cancelEdit = () => {
  editingId.value = null;
  text.value = "";
};

const send = () => {
  const t = text.value.trim();
  if (!t) return;
  if (editingId.value) emit("edit", editingId.value, t);
  else emit("send", t);
  editingId.value = null;
  text.value = "";
};
</script>

<template>
  <div>
    <div ref="scroller" class="chat-scroll">
      <div v-for="m in items" :key="m.id" class="bubble-row del-host" :class="{ own: m.from === me }">
        <div :style="{ maxWidth: '78%' }">
          <div class="bubble" :class="m.from === me ? 'own' : 'other'">{{ m.text }}</div>
          <p class="bubble-meta m-0" :style="m.from === me ? 'text-align: right;' : ''">
            {{ m.from }} · {{ fmtTs(m.ts) }}<template v-if="m.edited"> · edited</template>
            <template v-if="m.from === me">
              <button class="chat-act del-btn" aria-label="Edit message" @click="startEdit(m)">
                <sph-icon name="Pencil" :size="12" />
              </button>
              <button class="chat-act del-btn" aria-label="Delete message" @click="$emit('remove', m.id)">
                <sph-icon name="Trash2" :size="12" />
              </button>
            </template>
          </p>
        </div>
      </div>
      <sph-empty-state v-if="!items.length" emoji="💬" message="No messages yet." hint="Say something sweet below." />
    </div>
    <p v-if="editingId" class="m-0 mt-2 text-xs flex items-center gap-2" style="color: var(--ink-3)">
      editing your message ·
      <button type="button" class="gbtn gbtn-ghost" style="font-size: 0.75rem; padding: 0.15rem 0.5rem" @click="cancelEdit()">
        cancel
      </button>
    </p>
    <form class="flex items-center gap-2 mt-3" @submit.prevent="send()">
      <input
        ref="input"
        v-model="text"
        class="ginput flex-1"
        style="border-radius: 999px"
        :placeholder="'Say something sweet, ' + me + '…'"
        aria-label="Message"
        @keydown.esc="editingId && cancelEdit()"
      />
      <button
        type="submit"
        class="gbtn gbtn-primary gbtn-icon"
        :aria-label="editingId ? 'Save edit' : 'Send message'"
        style="padding: 0.65rem"
      >
        <sph-icon :name="editingId ? 'Check' : 'Send'" :size="17" />
      </button>
    </form>
  </div>
</template>
