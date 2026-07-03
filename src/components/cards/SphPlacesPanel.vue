<script setup>
/* Places panel: not-visited + visited, each sorted sensibly. Owns the
   create/edit form and wires CRUD through the usePlaces composable, so it
   drops straight into a tab with just a userId. Places are shared/editable
   by both users, unlike the per-owner reminders panel. */
import { ref } from "vue";
import { usePlaces } from "../../composables/usePlaces";
import SphEmptyState from "../ui/SphEmptyState.vue";
import SphIcon from "../ui/SphIcon.vue";
import SphPlaceForm from "./SphPlaceForm.vue";
import SphPlaceItem from "./SphPlaceItem.vue";

const props = defineProps({ userId: { type: String, default: "" } });

const P = usePlaces(() => props.userId);

const showForm = ref(false);
const editing = ref(null);

const openNew = () => {
  editing.value = null;
  showForm.value = true;
};
const openEdit = (p) => {
  editing.value = p;
  showForm.value = true;
};
const onSave = (payload) => {
  if (editing.value) P.update(editing.value.id, payload);
  else P.create(payload);
};
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-3 mb-3">
      <h3 class="font-display m-0 text-2xl font-semibold italic">Not visited</h3>
      <button class="gbtn gbtn-primary" @click="openNew()"><sph-icon name="Plus" :size="16" /> New</button>
    </div>
    <div v-if="P.notVisited.value.length" class="grid gap-3 sm:grid-cols-2">
      <sph-place-item
        v-for="(p, i) in P.notVisited.value"
        :key="p.id"
        :item="p"
        :style="{ '--i': i }"
        @edit="openEdit(p)"
        @toggle-visited="P.toggleVisited(p.id)"
        @remove="P.remove(p.id)"
      />
    </div>
    <sph-empty-state v-else emoji="🧭" message="Nowhere on the list yet." hint="Add a place you both want to go." />

    <div v-if="P.visited.value.length">
      <div class="divider-heart my-5">places we've been</div>
      <div class="grid gap-3 sm:grid-cols-2">
        <sph-place-item
          v-for="(p, i) in P.visited.value"
          :key="p.id"
          :item="p"
          :style="{ '--i': i }"
          @edit="openEdit(p)"
          @toggle-visited="P.toggleVisited(p.id)"
          @remove="P.remove(p.id)"
        />
      </div>
    </div>

    <sph-place-form v-model="showForm" :place="editing" @save="onSave" />
  </div>
</template>
