<script setup>
import { onBeforeUnmount, ref } from "vue";
import { burstHearts } from "../../composables/burstHearts";
import { useScore } from "../../composables/useScore";
import { rpsRandom, rpsResult } from "../../games";

const props = defineProps({ me: { type: String, required: true } });

const EMOJI = { rock: "✊", paper: "✋", scissors: "✌️" };
const CHOICES = ["rock", "paper", "scissors"];
const LINES = {
  win: ["you win this one ♥", "nicely done, love", "a clean victory"],
  lose: ["the computer got you", "so close — again?", "rematch?"],
  draw: ["great minds think alike", "a tie — go again", "same wavelength"],
};

const { score, bump, reset } = useScore("us-game-rps-" + props.me, ["you", "cpu", "draw"]);
const mine = ref(null);
const theirs = ref(null);
const result = ref(null);
const line = ref("");
const thinking = ref(false);
let timer = null;

const play = (choice, ev) => {
  if (thinking.value) return;
  mine.value = choice;
  theirs.value = null;
  result.value = null;
  thinking.value = true;
  const x = ev && ev.clientX;
  const y = ev && ev.clientY;
  // short "shake" before the reveal, like counting 1-2-3
  timer = setTimeout(() => {
    theirs.value = rpsRandom();
    result.value = rpsResult(choice, theirs.value);
    const pool = LINES[result.value];
    line.value = pool[Math.floor(Math.random() * pool.length)];
    bump(result.value === "win" ? "you" : result.value === "lose" ? "cpu" : "draw");
    thinking.value = false;
    if (result.value === "win" && x != null) burstHearts(x, y, 14);
  }, 650);
};
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div class="game-card">
    <div class="game-score">
      <div>
        <span class="game-score-num">{{ score.you }}</span
        ><span class="game-score-label">{{ me.toLowerCase() }}</span>
      </div>
      <div>
        <span class="game-score-num">{{ score.draw }}</span
        ><span class="game-score-label">draws</span>
      </div>
      <div>
        <span class="game-score-num">{{ score.cpu }}</span
        ><span class="game-score-label">computer</span>
      </div>
    </div>

    <div class="rps-arena" aria-live="polite">
      <div class="rps-hand" :class="{ shaking: thinking }">{{ mine ? (thinking ? "✊" : EMOJI[mine]) : "❔" }}</div>
      <span class="rps-vs font-display italic">vs</span>
      <div class="rps-hand flip" :class="{ shaking: thinking }">{{ theirs ? EMOJI[theirs] : thinking ? "✊" : "❔" }}</div>
    </div>
    <p class="game-status font-display italic" :class="result">
      <template v-if="result"
        >{{ result === "win" ? "you win!" : result === "lose" ? "you lose" : "draw" }} · {{ line }}</template
      >
      <template v-else-if="thinking">rock… paper… scissors…</template>
      <template v-else>pick your move</template>
    </p>

    <div class="rps-choices">
      <button
        v-for="c in CHOICES"
        :key="c"
        type="button"
        class="rps-choice"
        :class="{ picked: mine === c && !thinking }"
        :disabled="thinking"
        :aria-label="c"
        @click="play(c, $event)"
      >
        <span class="rps-choice-emoji">{{ EMOJI[c] }}</span>
        <span class="rps-choice-label">{{ c }}</span>
      </button>
    </div>
    <div class="flex justify-center mt-4">
      <button type="button" class="gbtn gbtn-ghost" style="font-size: 0.8rem" @click="reset()">Reset score</button>
    </div>
  </div>
</template>
