<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { burstHearts } from "../composables/burstHearts";
import { USERS } from "../users";
import UsIcon from "./ui/UsIcon.vue";

const emit = defineEmits(["unlock"]);

const entry = ref("");
const shaking = ref(false);

const keys = [];
for (let i = 1; i <= 9; i++) keys.push({ id: "k" + i, t: "num", v: String(i) });
keys.push({ id: "blank", t: "blank", v: "" });
keys.push({ id: "k0", t: "num", v: "0" });
keys.push({ id: "back", t: "back", v: "" });

const hearts = [];
for (let i = 0; i < 14; i++) {
  hearts.push({
    id: i,
    style: {
      left: Math.random() * 96 + "%",
      fontSize: 12 + Math.random() * 22 + "px",
      animationDuration: 9 + Math.random() * 14 + "s",
      animationDelay: -Math.random() * 20 + "s",
    },
  });
}

const press = (k) => {
  if (k.t === "back") {
    entry.value = entry.value.slice(0, -1);
    return;
  }
  if (k.t !== "num" || entry.value.length >= 4) return;
  entry.value += k.v;
  if (entry.value.length === 4) {
    const u = USERS[entry.value];
    if (u) {
      try {
        sessionStorage.setItem("us-user", u.name);
      } catch (e) {}
      const c = document.querySelector(".lock-card").getBoundingClientRect();
      burstHearts(c.left + c.width / 2, c.top + c.height / 2, 22);
      setTimeout(() => emit("unlock", u), 250);
    } else {
      shaking.value = true;
      setTimeout(() => {
        shaking.value = false;
        entry.value = "";
      }, 480);
    }
  }
};

const onKey = (e) => {
  if (e.key >= "0" && e.key <= "9") press({ t: "num", v: e.key });
  else if (e.key === "Backspace") press({ t: "back" });
};
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<template>
  <div class="lock-wrap">
    <span v-for="h in hearts" :key="h.id" class="float-heart" :style="h.style">♥</span>
    <div class="glass glass-strong lock-card" :class="{ shake: shaking }">
      <div class="inline-flex items-center justify-center mb-2" style="color: var(--accent)"><us-icon name="Lock" :size="22" /></div>
      <h1 class="font-display m-0 text-5xl font-semibold italic">Us <span style="color: var(--accent)">❤</span></h1>
      <p class="m-0 mt-1.5 text-sm" style="color: var(--ink-2)">Enter our code</p>
      <div class="pin-dots">
        <span v-for="n in 4" :key="n" class="pin-dot" :class="{ filled: entry.length >= n }"></span>
      </div>
      <div class="pad">
        <button
          v-for="k in keys"
          :key="k.id"
          type="button"
          class="pad-key"
          :class="{ blank: k.t === 'blank' }"
          :aria-label="k.t === 'back' ? 'Delete digit' : k.v"
          @click="press(k)"
        >
          <us-icon v-if="k.t === 'back'" name="Delete" :size="20" />
          <template v-else>{{ k.v }}</template>
        </button>
      </div>
      <p class="m-0 mt-5 text-xs" style="color: var(--ink-3)">two hearts, two codes ♥</p>
    </div>
  </div>
</template>
