<script setup>
import { useFilterPref } from "../../composables/useFilterPref";
import SphSegmentedFilter from "../ui/SphSegmentedFilter.vue";
import SphAfterDark from "./SphAfterDark.vue";
import SphRockPaperScissors from "./SphRockPaperScissors.vue";
import SphTicTacToe from "./SphTicTacToe.vue";

defineProps({
  me: { type: String, required: true },
  partner: { type: String, default: "" },
});

const GAMES = [
  { value: "ttt", label: "Tic Tac Toe" },
  { value: "rps", label: "Rock Paper Scissors" },
  { value: "afterdark", label: "After Dark 🌶️" },
];
const game = useFilterPref("us-last-game", "ttt");
if (!GAMES.some((g) => g.value === game.value)) game.value = "ttt";
</script>

<template>
  <div>
    <div class="flex justify-center mb-5">
      <sph-segmented-filter v-model="game" :options="GAMES" />
    </div>
    <sph-tic-tac-toe v-if="game === 'ttt'" :key="'ttt-' + me" :me="me" :partner="partner" />
    <sph-rock-paper-scissors v-else-if="game === 'rps'" :key="'rps-' + me" :me="me" />
    <sph-after-dark v-else :key="'ad-' + me" :me="me" :partner="partner" />
  </div>
</template>
