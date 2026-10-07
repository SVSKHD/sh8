<script setup>
/* the places inside a visited trip: paste a Google Maps link (its name and
   location are read from full links), or just type a name. Each place later
   gets its own photo carousel. v-model is the `stops` array:
   [{ id, name, url, placeId, lat, lng }] */
import { computed, ref } from "vue";
import { parseMapsLink } from "../../mapsLink";
import { uid } from "../../stores/seed";
import SphIcon from "../ui/SphIcon.vue";

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  label: { type: String, default: "Places" },
});
const emit = defineEmits(["update:modelValue"]);

const link = ref("");
const name = ref("");
const nameEdited = ref(false);

const parsed = computed(() => (link.value.trim() ? parseMapsLink(link.value) : null));
const linkError = computed(() => !!link.value.trim() && !parsed.value);
const canAdd = computed(() => !linkError.value && !!name.value.trim());

const onLink = (v) => {
  link.value = v;
  // fill the name from a full Maps link, unless it's been typed by hand
  const p = parseMapsLink(v);
  if (p && p.name && !nameEdited.value) name.value = p.name;
};
const onName = (v) => {
  name.value = v;
  nameEdited.value = !!v.trim();
};

const add = () => {
  if (!canAdd.value) return false;
  const p = parsed.value;
  const stop = {
    id: uid(),
    name: name.value.trim(),
    url: p ? p.url : "",
    placeId: p ? p.placeId : null,
    lat: p ? p.lat : null,
    lng: p ? p.lng : null,
  };
  emit("update:modelValue", [...props.modelValue, stop]);
  link.value = "";
  name.value = "";
  nameEdited.value = false;
  return true;
};

/* called by the form on Save: a place still sitting in the inputs is added
   instead of silently dropped. false → it can't be added yet (bad link or
   no name), so the form should stay open — the hint says why. */
const attention = ref(false);
const commit = () => {
  attention.value = false;
  if (!link.value.trim() && !name.value.trim()) return true;
  if (add()) return true;
  attention.value = true;
  return false;
};
defineExpose({ commit });
const remove = (id) =>
  emit(
    "update:modelValue",
    props.modelValue.filter((s) => s.id !== id),
  );
const move = (i, d) => {
  const next = props.modelValue.slice();
  const j = i + d;
  if (j < 0 || j >= next.length) return;
  [next[i], next[j]] = [next[j], next[i]];
  emit("update:modelValue", next);
};
const onEnter = (e) => {
  e.preventDefault(); // Enter adds the place instead of submitting the whole form
  add();
};
</script>

<template>
  <div class="stops">
    <span class="glabel">{{ label }}</span>

    <ol v-if="modelValue.length" class="stops-list">
      <li v-for="(s, i) in modelValue" :key="s.id" class="stop">
        <span class="stop-n">{{ i + 1 }}</span>
        <span class="stop-name">{{ s.name }}</span>
        <sph-icon v-if="s.url" name="MapPin" :size="13" class="stop-pin" aria-label="has a Maps link" />
        <span class="flex items-center">
          <button
            type="button"
            class="gbtn gbtn-ghost gbtn-icon stop-btn"
            :aria-label="'Move ' + s.name + ' up'"
            :disabled="i === 0"
            @click="move(i, -1)"
          >
            <sph-icon name="ChevronUp" :size="14" />
          </button>
          <button type="button" class="gbtn gbtn-ghost gbtn-icon stop-btn" :aria-label="'Remove ' + s.name" @click="remove(s.id)">
            <sph-icon name="X" :size="14" />
          </button>
        </span>
      </li>
    </ol>

    <div class="stops-add" :class="{ attention }">
      <input
        class="ginput"
        type="text"
        inputmode="url"
        autocomplete="off"
        placeholder="Paste a Google Maps link"
        aria-label="Google Maps link"
        :value="link"
        @input="onLink($event.target.value)"
        @keydown.enter="onEnter"
      />
      <div class="flex gap-2">
        <input
          class="ginput"
          type="text"
          placeholder="Place name"
          aria-label="Place name"
          :value="name"
          @input="onName($event.target.value)"
          @keydown.enter="onEnter"
        />
        <button type="button" class="gbtn gbtn-primary flex-shrink-0" :disabled="!canAdd" @click="add()">
          <sph-icon name="Plus" :size="15" /> Add
        </button>
      </div>
      <p v-if="linkError" class="stops-hint err">That doesn't look like a Google Maps link.</p>
      <p v-else-if="parsed && !name.trim()" class="stops-hint" :class="{ err: attention }">
        Type the place's name{{ parsed.short ? " — short share links don't include it" : "" }}, then tap Add.
      </p>
      <p v-else-if="canAdd" class="stops-hint">Tap Add (or Save) to keep this place.</p>
      <p v-else-if="!modelValue.length" class="stops-hint">
        Add each spot you went — beach, café, fort… each gets its own photo carousel.
      </p>
    </div>
  </div>
</template>

<style scoped>
.stops-list {
  list-style: none;
  margin: 0 0 0.5rem;
  padding: 0;
  display: grid;
  gap: 0.35rem;
}
.stop {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.3rem 0.3rem 0.3rem 0.45rem;
  border-radius: 0.8rem;
  background: var(--glass-fill);
  border: 1px solid var(--glass-border);
}
.stop-n {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  background: var(--accent-soft);
  color: var(--accent);
}
.stop-name {
  flex: 1;
  min-width: 0;
  font-size: 0.88rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stop-pin {
  flex-shrink: 0;
  color: var(--ink-3);
}
.stop-btn {
  padding: 0.3rem;
}
.stop-btn:disabled {
  opacity: 0.3;
}
.stops-add {
  display: grid;
  gap: 0.45rem;
}
.stops-hint {
  margin: 0;
  font-size: 0.72rem;
  color: var(--ink-3);
}
.stops-add.attention .ginput {
  border-color: var(--accent);
}
.stops-hint.err {
  color: var(--accent);
}
</style>
