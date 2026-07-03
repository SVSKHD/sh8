<script setup>
/* Wishes panel: received (delivered-only — undelivered stays hidden from
   the recipient) + sent, each their own section. Owns the create/edit
   modal and the "your Google account email" setting wishes need for the
   sender-side calendar invite (see useWishes.js / googleCalendar.js for
   why it's sender-side). */
import { onMounted, ref } from "vue";
import { useWishes } from "../../composables/useWishes";
import { useFilterPref } from "../../composables/useFilterPref";
import { useUsStore } from "../../stores/us";
import { USERS } from "../../users";
import SphEmptyState from "../ui/SphEmptyState.vue";
import SphGlassInput from "../ui/SphGlassInput.vue";
import SphGoogleCalendarButton from "../ui/SphGoogleCalendarButton.vue";
import SphIcon from "../ui/SphIcon.vue";
import SphNotificationButton from "../ui/SphNotificationButton.vue";
import SphSegmentedFilter from "../ui/SphSegmentedFilter.vue";
import SphWishForm from "./SphWishForm.vue";
import SphWishItem from "./SphWishItem.vue";

const props = defineProps({ userId: { type: String, default: "" } });

const store = useUsStore();
const W = useWishes(() => props.userId);

const partnerName = Object.values(USERS).find((u) => u.name !== props.userId)?.name || "";

const FILTER_OPTIONS = [
  { value: "received", label: "Received" },
  { value: "sent", label: "Sent" },
];
const filter = useFilterPref("us-filter-wishes", "received");

const email = ref(store.emails?.[props.userId] || "");
const saveEmail = () => store.setEmail(email.value.trim(), props.userId);

const showForm = ref(false);
const editing = ref(null);

const openNew = () => {
  editing.value = null;
  showForm.value = true;
};
const openEdit = (w) => {
  editing.value = w;
  showForm.value = true;
};
const onSave = (payload) => {
  if (editing.value) W.update(editing.value.id, payload);
  else W.create(payload);
};

onMounted(() => {
  W.checkDeliveries();
  W.deliveredUnseen.value.forEach((w) => W.markSeen(w.id));
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-3 mb-3 flex-wrap">
      <sph-segmented-filter v-model="filter" :options="FILTER_OPTIONS" />
      <div class="flex items-center gap-2 flex-wrap">
        <sph-google-calendar-button />
        <sph-notification-button />
        <button class="gbtn gbtn-primary" @click="openNew()"><sph-icon name="Plus" :size="16" /> New</button>
      </div>
    </div>

    <div class="mb-4" style="max-width: 22rem">
      <sph-glass-input
        v-model="email"
        label="Your Google account email (so you can be invited to wishes sent to you)"
        type="email"
        placeholder="you@gmail.com"
        @change="saveEmail()"
      />
    </div>

    <template v-if="filter === 'received'">
      <div v-if="W.receivedVisible.value.length" class="grid gap-3">
        <sph-wish-item v-for="(w, i) in W.receivedVisible.value" :key="w.id" :item="w" view="received" :style="{ '--i': i }" />
      </div>
      <sph-empty-state v-else emoji="💌" message="No wishes delivered yet." hint="They'll show up here the moment they arrive." />
    </template>
    <template v-else>
      <div v-if="W.sent.value.length" class="grid gap-3">
        <sph-wish-item
          v-for="(w, i) in W.sent.value"
          :key="w.id"
          :item="w"
          view="sent"
          :can-edit="W.canEdit(w)"
          :style="{ '--i': i }"
          @edit="openEdit(w)"
          @cancel="W.cancel(w.id)"
          @remove="W.remove(w.id)"
        />
      </div>
      <sph-empty-state v-else emoji="✉️" message="Nothing scheduled yet." hint="Write something for later." />
    </template>

    <sph-wish-form v-model="showForm" :wish="editing" :to-name="partnerName" @save="onSave" />
  </div>
</template>
