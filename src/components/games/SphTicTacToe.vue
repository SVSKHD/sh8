<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { burstHearts } from "../../composables/burstHearts";
import { useScore } from "../../composables/useScore";
import { tttBestMove, tttStatus } from "../../games";
import SphSegmentedFilter from "../ui/SphSegmentedFilter.vue";

const props = defineProps({
  me: { type: String, required: true },
  partner: { type: String, default: "" },
});

/* "cpu": you (X) vs the computer (O) · "duo": pass-and-play on one device,
   you're X and your partner is O */
const mode = ref("cpu");
const modeOptions = computed(() => [
  { value: "cpu", label: "vs computer" },
  { value: "duo", label: "vs " + (props.partner || "partner") },
]);
/* computer plays near-perfectly but slips now and then, so it's winnable */
const CPU_MISTAKE_RATE = 0.2;

const names = computed(() => ({ X: props.me, O: mode.value === "cpu" ? "computer" : props.partner || "partner" }));
const scores = {
  cpu: useScore("us-game-ttt-cpu-" + props.me, ["X", "O", "draw"]),
  duo: useScore("us-game-ttt-duo-" + props.me, ["X", "O", "draw"]),
};
const score = computed(() => scores[mode.value].score.value);

const board = ref(Array(9).fill(null));
const turn = ref("X");
/* who opens alternates each round */
const opener = ref("X");
const status = computed(() => tttStatus(board.value));
const winLine = computed(() => (status.value && status.value.line) || []);
const cpuThinking = computed(() => mode.value === "cpu" && turn.value === "O" && !status.value);

let cpuTimer = null;
const cpuMove = () => {
  clearTimeout(cpuTimer);
  cpuTimer = setTimeout(() => {
    if (!cpuThinking.value) return;
    const i = tttBestMove(board.value, "O", { mistakeRate: CPU_MISTAKE_RATE });
    if (i > -1) place(i);
  }, 450);
};

const place = (i) => {
  if (board.value[i] || status.value) return;
  const next = board.value.slice();
  next[i] = turn.value;
  board.value = next;
  const s = tttStatus(next);
  if (s) {
    scores[mode.value].bump(s.winner);
    if (s.winner === "X" || (mode.value === "duo" && s.winner === "O")) {
      const el = document.querySelector(".ttt-board");
      if (el) {
        const r = el.getBoundingClientRect();
        burstHearts(r.left + r.width / 2, r.top + r.height / 2, 22);
      }
    }
    return;
  }
  turn.value = turn.value === "X" ? "O" : "X";
  if (cpuThinking.value) cpuMove();
};

const tap = (i) => {
  if (cpuThinking.value) return;
  place(i);
};

const newRound = () => {
  clearTimeout(cpuTimer);
  opener.value = opener.value === "X" ? "O" : "X";
  board.value = Array(9).fill(null);
  turn.value = opener.value;
  if (cpuThinking.value) cpuMove();
};
const resetScore = () => scores[mode.value].reset();

watch(mode, () => {
  clearTimeout(cpuTimer);
  opener.value = "X";
  board.value = Array(9).fill(null);
  turn.value = "X";
});
onBeforeUnmount(() => clearTimeout(cpuTimer));

const statusText = computed(() => {
  const s = status.value;
  if (!s)
    return cpuThinking.value ? "computer is thinking…" : names.value[turn.value].toLowerCase() + "'s turn (" + turn.value + ")";
  if (s.winner === "draw") return "it's a draw — a perfect match";
  return names.value[s.winner].toLowerCase() + " wins! ♥";
});
</script>

<template>
  <div class="game-card">
    <div class="flex justify-center mb-4">
      <sph-segmented-filter v-model="mode" :options="modeOptions" />
    </div>

    <div class="game-score">
      <div>
        <span class="game-score-num">{{ score.X }}</span
        ><span class="game-score-label">{{ names.X.toLowerCase() }} · X</span>
      </div>
      <div>
        <span class="game-score-num">{{ score.draw }}</span
        ><span class="game-score-label">draws</span>
      </div>
      <div>
        <span class="game-score-num">{{ score.O }}</span
        ><span class="game-score-label">{{ names.O.toLowerCase() }} · O</span>
      </div>
    </div>

    <div class="ttt-board" role="grid" aria-label="Tic tac toe board">
      <button
        v-for="(cell, i) in board"
        :key="i"
        type="button"
        class="ttt-cell"
        :class="{ win: winLine.includes(i), x: cell === 'X', o: cell === 'O' }"
        :disabled="!!cell || !!status || cpuThinking"
        :aria-label="cell ? 'Cell ' + (i + 1) + ': ' + cell : 'Cell ' + (i + 1) + ', empty'"
        @click="tap(i)"
      >
        <span v-if="cell" class="ttt-mark">{{ cell === "X" ? "✕" : "◯" }}</span>
      </button>
    </div>
    <p class="game-status font-display italic" aria-live="polite">{{ statusText }}</p>

    <div class="flex justify-center gap-2 mt-3">
      <button type="button" class="gbtn gbtn-primary" style="font-size: 0.85rem" @click="newRound()">
        {{ status ? "Play again" : "New round" }}
      </button>
      <button type="button" class="gbtn gbtn-ghost" style="font-size: 0.8rem" @click="resetScore()">Reset score</button>
    </div>
  </div>
</template>
