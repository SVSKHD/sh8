<script setup>
/* Plans panel: one flowing list sorted upcoming/planned first (via
   usePlans' status-ranked sort). Owns the add/edit modal and sources the
   optional place/reminder/wish link pickers from their own composables —
   no parallel lookup system. Plans are shared/editable by both users. */
import { computed, ref } from "vue";
import { fmtDate } from "../../utils/dates";
import { usePlaces } from "../../composables/usePlaces";
import { usePlans } from "../../composables/usePlans";
import { useReminders } from "../../composables/useReminders";
import { useWishes } from "../../composables/useWishes";
import SphEmptyState from "../ui/SphEmptyState.vue";
import SphIcon from "../ui/SphIcon.vue";
import SphPlanForm from "./SphPlanForm.vue";
import SphPlanItem from "./SphPlanItem.vue";

const props = defineProps({ userId: { type: String, default: "" } });

const Pl = usePlans(() => props.userId);
const Pc = usePlaces(() => props.userId);
const R = useReminders(() => props.userId);
const W = useWishes(() => props.userId);

const placeOptions = computed(() => Pc.all.value.map((p) => ({ value: p.id, label: p.name })));
const reminderOptions = computed(() => R.visible.value.map((r) => ({ value: r.id, label: r.title })));
/* only already-delivered wishes are linkable — an undelivered one is a
   surprise, and Plans is a shared/visible-to-both tab, so surfacing it
   here (even just its existence) would spoil it before delivery */
const deliveredWishes = computed(() => [...W.sent.value, ...W.receivedVisible.value].filter((w) => w.delivered));
const wishOptions = computed(() =>
  deliveredWishes.value.map((w) => ({ value: w.id, label: `Wish (${fmtDate(w.scheduledDate.slice(0, 10))})` })),
);

const placeById = computed(() => Object.fromEntries(Pc.all.value.map((p) => [p.id, p.name])));
const reminderById = computed(() => Object.fromEntries(R.visible.value.map((r) => [r.id, r.title])));
const wishById = computed(() =>
  Object.fromEntries(deliveredWishes.value.map((w) => [w.id, `Wish (${fmtDate(w.scheduledDate.slice(0, 10))})`])),
);
const linkedNamesFor = (plan) => ({
  place: plan.linkedPlaceId ? placeById.value[plan.linkedPlaceId] : null,
  reminder: plan.linkedReminderId ? reminderById.value[plan.linkedReminderId] : null,
  wish: plan.linkedWishId ? wishById.value[plan.linkedWishId] : null,
});

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
  if (editing.value) Pl.update(editing.value.id, payload);
  else Pl.create(payload);
};
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-3 mb-3">
      <h3 class="font-display m-0 text-2xl font-semibold italic">Our plans</h3>
      <button class="gbtn gbtn-primary" @click="openNew()"><sph-icon name="Plus" :size="16" /> New</button>
    </div>
    <div v-if="Pl.sorted.value.length" class="grid gap-3">
      <sph-plan-item
        v-for="(p, i) in Pl.sorted.value"
        :key="p.id"
        :item="p"
        :linked-names="linkedNamesFor(p)"
        :style="{ '--i': i }"
        @edit="openEdit(p)"
        @set-status="(s) => Pl.setStatus(p.id, s)"
        @remove="Pl.remove(p.id)"
      />
    </div>
    <sph-empty-state v-else emoji="📝" message="No plans yet." hint="Ideas, dates, someday-maybes — start the list." />

    <sph-plan-form
      v-model="showForm"
      :plan="editing"
      :user-id="userId"
      :place-options="placeOptions"
      :reminder-options="reminderOptions"
      :wish-options="wishOptions"
      @save="onSave"
    />
  </div>
</template>
