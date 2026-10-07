<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import SphIcon from "./SphIcon.vue";

const props = defineProps({
  tabs: { type: Array, required: true },
  modelValue: { type: String, required: true },
});
defineEmits(["update:modelValue"]);

const bar = ref(null);
const btns = {};
const indStyle = ref({ opacity: 0 });
const setBtn = (id, el) => {
  if (el) btns[id] = el;
};
const place = () => {
  const b = btns[props.modelValue];
  if (!b) return;
  indStyle.value = { left: b.offsetLeft + "px", width: b.offsetWidth + "px", opacity: 1 };
  if (bar.value) {
    const pad = 24;
    const left = b.offsetLeft - pad;
    const right = b.offsetLeft + b.offsetWidth + pad;
    if (left < bar.value.scrollLeft) bar.value.scrollTo({ left, behavior: "smooth" });
    else if (right > bar.value.scrollLeft + bar.value.clientWidth)
      bar.value.scrollTo({ left: right - bar.value.clientWidth, behavior: "smooth" });
  }
};
watch(
  () => props.modelValue,
  () => nextTick(place),
);
/* hover/focus tooltip — teleported to <body> and positioned from the
   button's rect, because the bar scrolls horizontally (overflow-x: auto),
   which would clip anything hanging outside it. Shows below the button, or
   above it when the bar is docked at the bottom (mobile). */
const tip = ref(null); // { label, x, y, above }
const showTip = (t, ev) => {
  // touch taps fire pointerenter too — the label is only useful on hover/keyboard
  if (ev && ev.pointerType && ev.pointerType !== "mouse") return;
  const b = btns[t.id];
  if (!b) return;
  const r = b.getBoundingClientRect();
  const above = r.top > window.innerHeight / 2;
  const x = Math.min(Math.max(r.left + r.width / 2, 60), window.innerWidth - 60);
  tip.value = { id: t.id, label: t.label, x, y: above ? r.top - 10 : r.bottom + 10, above };
};
/* keyboard focus only — a tap also focuses the button, and shouldn't leave a tip behind */
const focusTip = (t, ev) => {
  let keyboard = true;
  try {
    keyboard = ev.target.matches(":focus-visible");
  } catch (e) {}
  if (keyboard) showTip(t);
};
const hideTip = () => {
  tip.value = null;
};
onMounted(() => {
  nextTick(place);
  setTimeout(place, 350); // after fonts settle
  window.addEventListener("resize", place);
  window.addEventListener("scroll", hideTip, true);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", place);
  window.removeEventListener("scroll", hideTip, true);
});
</script>

<template>
  <nav ref="bar" class="glass tabbar" role="tablist" aria-label="Sections">
    <div class="tab-indicator" :style="indStyle"></div>
    <button
      v-for="t in tabs"
      :key="t.id"
      :ref="(el) => setBtn(t.id, el)"
      type="button"
      class="tab-btn"
      :class="{ active: t.id === modelValue }"
      role="tab"
      :aria-selected="t.id === modelValue"
      :aria-label="t.label"
      @click="$emit('update:modelValue', t.id)"
      @pointerenter="showTip(t, $event)"
      @pointerleave="hideTip()"
      @focus="focusTip(t, $event)"
      @blur="hideTip()"
    >
      <sph-icon :name="t.icon" :size="20" />
    </button>
  </nav>
  <teleport to="body">
    <div
      v-if="tip"
      :key="tip.id"
      class="tab-tip"
      :class="{ above: tip.above, active: tip.id === modelValue }"
      :style="{ left: tip.x + 'px', top: tip.y + 'px' }"
      role="tooltip"
    >
      {{ tip.label }}
    </div>
  </teleport>
</template>
