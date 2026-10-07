<script setup>
/* "who did this" line for any card: the person's initial in a little
   avatar + "added by …", plus "edited by …" when the other one changed it
   last. Reads the store's stamps (addedBy / updatedBy), falling back to a
   reminder's ownerId. Your own items say "you". */
import { computed } from "vue";
import { actorName } from "../../stores/us";

const props = defineProps({
  item: { type: Object, required: true },
  /* "added" (default) or e.g. "written", "shared" */
  verb: { type: String, default: "added" },
});

const label = (n) => (n && n === actorName.value ? "you" : n);
const adder = computed(() => props.item.addedBy || props.item.ownerId || null);
const editor = computed(() => {
  const e = props.item.updatedBy;
  return e && e !== adder.value ? e : null;
});
const mine = computed(() => !!adder.value && adder.value === actorName.value);
</script>

<template>
  <p v-if="adder" class="byline m-0" :class="{ mine }">
    <span class="byline-avatar" aria-hidden="true">{{ adder.charAt(0) }}</span>
    <span>
      {{ verb }} by <strong>{{ label(adder) }}</strong>
      <template v-if="editor"> · edited by {{ label(editor) }}</template>
    </span>
  </p>
</template>

<style scoped>
.byline {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  line-height: 1.2;
  color: var(--ink-3);
}
.byline strong {
  font-weight: 600;
  color: var(--ink-2);
}
.byline-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 999px;
  font-size: 0.62rem;
  font-weight: 700;
  border: 1px solid var(--glass-border);
  color: var(--ink-2);
}
/* your own items pick up the theme accent, your partner's stay neutral */
.byline.mine .byline-avatar {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.byline.mine strong {
  color: var(--accent);
}
</style>
