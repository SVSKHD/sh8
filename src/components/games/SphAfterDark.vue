<script setup>
import { computed, ref } from "vue";
import { burstHearts } from "../../composables/burstHearts";
import { useFilterPref } from "../../composables/useFilterPref";
import { drawPrompt, HEAT_LEVELS } from "../../spicyPrompts";
import SphSegmentedFilter from "../ui/SphSegmentedFilter.vue";

const props = defineProps({
  me: { type: String, required: true },
  partner: { type: String, default: "" },
});

/* one-time 18+ confirmation per device */
const confirmed = useFilterPref("us-afterdark-ok", "no");
const heat = useFilterPref("us-afterdark-heat", "flirty");
if (!HEAT_LEVELS.some((h) => h.id === heat.value)) heat.value = "flirty";
const heatOptions = HEAT_LEVELS.map((h) => ({ value: h.id, label: h.emoji + " " + h.label }));

const players = computed(() => [props.me, props.partner || "partner"]);
const turn = ref(0);
const card = ref(null); // { kind, text, level }
const used = new Set();
const done = ref(0);

const draw = (kind, ev) => {
  card.value = { kind, text: drawPrompt(heat.value, kind, used), level: heat.value };
  if (ev && heat.value === "spicy") burstHearts(ev.clientX, ev.clientY, 10);
};
const next = (completed) => {
  if (completed) done.value++;
  card.value = null;
  turn.value = (turn.value + 1) % 2;
};
const drawAnother = () => draw(card.value.kind);
</script>

<template>
  <div class="game-card">
    <!-- 18+ gate -->
    <div v-if="confirmed !== 'yes'" class="ad-gate">
      <div class="ad-gate-emoji">🔥</div>
      <h3 class="font-display m-0 mt-2 text-2xl font-semibold italic">After Dark</h3>
      <p class="m-0 mt-2 text-sm" style="color: var(--ink-2)">
        A romantic truth-or-dare just for the two of you — from sweet to spicy. For adults only. Every card can be skipped, no
        questions asked.
      </p>
      <button type="button" class="gbtn gbtn-primary mt-4" @click="confirmed = 'yes'">We're both 18+ — let's play 😏</button>
    </div>

    <template v-else>
      <div class="flex justify-center mb-4">
        <sph-segmented-filter v-model="heat" :options="heatOptions" />
      </div>

      <p class="game-status font-display italic" style="margin-top: 0">
        <span style="color: var(--accent)">{{ players[turn].toLowerCase() }}</span
        >, it's your turn
        <span v-if="done" class="ad-done">· {{ done }} completed ♥</span>
      </p>

      <div class="ad-card" :class="[card ? 'open' : '', card ? 'heat-' + card.level : 'heat-' + heat]" aria-live="polite">
        <template v-if="card">
          <span class="ad-kind">{{ card.kind }}</span>
          <p class="ad-text font-display italic">{{ card.text }}</p>
          <p class="ad-for">{{ players[(turn + 1) % 2].toLowerCase() }} reads this to {{ players[turn].toLowerCase() }}</p>
        </template>
        <template v-else>
          <span class="ad-kind">truth or dare?</span>
          <p class="ad-text font-display italic">choose wisely…</p>
        </template>
      </div>

      <div v-if="!card" class="rps-choices" style="grid-template-columns: 1fr 1fr">
        <button type="button" class="rps-choice" @click="draw('truth', $event)">
          <span class="rps-choice-emoji">💬</span><span class="rps-choice-label">Truth</span>
        </button>
        <button type="button" class="rps-choice" @click="draw('dare', $event)">
          <span class="rps-choice-emoji">💋</span><span class="rps-choice-label">Dare</span>
        </button>
      </div>
      <div v-else class="flex justify-center flex-wrap gap-2 mt-4">
        <button type="button" class="gbtn gbtn-primary" style="font-size: 0.85rem" @click="next(true)">Done ♥ next turn</button>
        <button type="button" class="gbtn" style="font-size: 0.85rem" @click="drawAnother()">Another card</button>
        <button type="button" class="gbtn gbtn-ghost" style="font-size: 0.8rem" @click="next(false)">Skip</button>
      </div>

      <p class="m-0 mt-5 text-center text-xs" style="color: var(--ink-3)">
        either of you can skip any card, any time — the only rule is you both enjoy it
      </p>
    </template>
  </div>
</template>
