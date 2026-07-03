<script setup>
/* Reminders panel: shared (read-only) + this user's own, each sorted soonest
   first. Owns the create/edit form and wires CRUD through the useReminders
   composable, so it drops straight into a tab with just a userId. */
import { computed, ref } from "vue";
import { useReminders } from "../../composables/useReminders";
import { useFilterPref } from "../../composables/useFilterPref";
import SphEmptyState from "../ui/SphEmptyState.vue";
import SphGoogleCalendarButton from "../ui/SphGoogleCalendarButton.vue";
import SphIcon from "../ui/SphIcon.vue";
import SphReminderForm from "./SphReminderForm.vue";
import SphReminderItem from "./SphReminderItem.vue";
import SphSegmentedFilter from "../ui/SphSegmentedFilter.vue";

const props = defineProps({ userId: { type: String, default: "" } });

const R = useReminders(() => props.userId);

/* Reminders don't fit the app's usual "For Spoorthy · For me · Both"
   3-way filter: a "user"-scoped reminder is private to its owner by
   design (see useReminders.js) — your partner's personal reminders are
   never visible to you at all, so a literal "For Spoorthy" segment would
   always render empty. This 2-way Shared/Mine split is the honest
   equivalent for this one tab. */
const FILTER_OPTIONS = [
  { value: "shared", label: "Shared" },
  { value: "mine", label: "Mine" },
];
const filter = useFilterPref("us-filter-reminders", "shared");
const visible = computed(() => (filter.value === "mine" ? R.mine.value : R.common.value));

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
    <div class="flex items-center justify-between gap-3 mb-3 flex-wrap">
      <sph-segmented-filter v-model="filter" :options="FILTER_OPTIONS" />
      <div class="flex items-center gap-2 flex-wrap">
        <sph-google-calendar-button />
        <button class="gbtn gbtn-primary" @click="openNew()"><sph-icon name="Plus" :size="16" /> New</button>
      </div>
    </div>
    <div v-if="visible.length" class="grid gap-3">
      <sph-reminder-item
        v-for="(r, i) in visible"
        :key="r.id"
        :item="r"
        :can-manage="R.canManage(r)"
        :style="{ '--i': i }"
        @edit="openEdit(r)"
        @toggle="R.toggle(r.id)"
        @remove="R.remove(r.id)"
      />
    </div>
    <sph-empty-state
      v-else
      emoji="🔔"
      :message="filter === 'mine' ? 'No personal reminders yet.' : 'No shared reminders yet.'"
      hint="Repeat every N days — 10, 26, anything."
    />

    <sph-reminder-form v-model="showForm" :reminder="editing" @save="onSave" />
  </div>
</template>
