<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import UsIcon from "./UsIcon.vue";

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
watch(() => props.modelValue, () => nextTick(place));
onMounted(() => {
  nextTick(place);
  setTimeout(place, 350); // after fonts settle
  window.addEventListener("resize", place);
});
onBeforeUnmount(() => window.removeEventListener("resize", place));
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
    >
      <us-icon :name="t.icon" :size="20" />
      <span class="tab-tip">{{ t.label }}</span>
    </button>
  </nav>
</template>
