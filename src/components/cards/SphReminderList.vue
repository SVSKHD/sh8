<script setup>
/* Reminders panel: shared (read-only) + this user's own, each sorted soonest
   first. Owns the create/edit form and wires CRUD through the useReminders
   composable, so it drops straight into a tab with just a userId. */
import { ref } from "vue";
import { useReminders } from "../../composables/useReminders";
import SphEmptyState from "../ui/SphEmptyState.vue";
import SphIcon from "../ui/SphIcon.vue";
import SphReminderForm from "./SphReminderForm.vue";
import SphReminderItem from "./SphReminderItem.vue";

const props = defineProps({ userId: { type: String, default: "" } });

const R = useReminders(() => props.userId);

const showForm = ref(false);
const editing = ref(null);

const openNew = () => {
  editing.value = null;
  showForm.value = true;
};
const openEdit = (r) => {
  editing.value = r;
  showForm.value = true;
};
const onSave = (payload) => {
  if (editing.value) R.update(editing.value.id, payload);
  else R.create(payload);
};
</script>

<template>
  <div>
    <!-- your reminders -->
    <div class="flex items-center justify-between gap-3 mb-3">
      <h3 class="font-display m-0 text-2xl font-semibold italic">Your reminders</h3>
      <button class="gbtn gbtn-primary" @click="openNew()"><sph-icon name="Plus" :size="16" /> New</button>
    </div>
    <div v-if="R.mine.value.length" class="grid gap-3">
      <sph-reminder-item
        v-for="(r, i) in R.mine.value"
        :key="r.id"
        :item="r"
        :can-manage="R.canManage(r)"
        :style="{ '--i': i }"
        @edit="openEdit(r)"
        @toggle="R.toggle(r.id)"
        @remove="R.remove(r.id)"
      />
    </div>
    <sph-empty-state v-else emoji="🔔" message="No personal reminders yet." hint="Repeat every N days — 10, 26, anything." />

    <!-- shared reminders (read-only) -->
    <div v-if="R.common.value.length">
      <div class="divider-heart my-5">shared with us both</div>
      <div class="grid gap-3">
        <sph-reminder-item v-for="(r, i) in R.common.value" :key="r.id" :item="r" :style="{ '--i': i }" />
      </div>
    </div>

    <sph-reminder-form v-model="showForm" :reminder="editing" @save="onSave" />
  </div>
</template>
