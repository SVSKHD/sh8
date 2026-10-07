<script setup>
import { computed } from "vue";
import { nextBirthday } from "../birthdays";
import { USERS } from "../users";
import SphIcon from "./ui/SphIcon.vue";

/* birthday countdown for both of us — rendered inside the greeting card */
const props = defineProps({ user: { type: Object, required: true } });

/* the logged-in person first, then their partner */
const rows = computed(() =>
  Object.values(USERS)
    .slice()
    .sort((a, b) => (b.name === props.user.name) - (a.name === props.user.name))
    .map((u) => {
      const nb = nextBirthday(u);
      const me = u.name === props.user.name;
      return {
        name: u.name,
        who: me ? "your birthday" : u.name.toLowerCase() + "'s birthday",
        when: nb.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        days: nb.days,
        turning: nb.turning,
      };
    }),
);
</script>

<template>
  <div class="bday-rows">
    <div v-for="r in rows" :key="r.name" class="bday-row" :class="{ 'is-today': r.days === 0 }">
      <span class="bday-icon"><sph-icon name="Cake" :size="18" :stroke-width="1.8" /></span>
      <div class="min-w-0">
        <p class="bday-who">{{ r.who }} · {{ r.when }}</p>
        <p class="bday-count font-display italic">
          <template v-if="r.days === 0">it's today! turning {{ r.turning }} 🎉</template>
          <template v-else>
            <span class="bday-num">{{ r.days }}</span> {{ r.days === 1 ? "day" : "days" }} to go
            <span class="bday-turning">· turning {{ r.turning }}</span>
          </template>
        </p>
      </div>
    </div>
  </div>
</template>
