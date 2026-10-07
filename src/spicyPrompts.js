/* "After Dark" — romantic truth-or-dare prompts for the two of us, by heat
   level. Suggestive, never explicit; every prompt can be skipped. */

export const HEAT_LEVELS = [
  { id: "sweet", label: "Sweet", emoji: "🌸" },
  { id: "flirty", label: "Flirty", emoji: "😘" },
  { id: "spicy", label: "Spicy", emoji: "🌶️" },
];

export const PROMPTS = {
  sweet: {
    truth: [
      "What was the exact moment you knew you were falling for me?",
      "Which of my little habits secretly makes you smile?",
      "What's your favourite memory of us that nobody else knows about?",
      "When do you feel most loved by me?",
      "What did you think the first time you saw me?",
      "Which song makes you think of me — and why?",
      "What's one thing you've never told me you admire about me?",
      "Describe our perfect lazy Sunday together.",
      "What's the sweetest thing I've ever done for you?",
      "If we could relive one date, which one would you pick?",
    ],
    dare: [
      "Hold my face and tell me three things you love about me.",
      "Slow dance with me to the next song that plays — no skipping.",
      "Give me a forehead kiss and hold it for ten seconds.",
      "Write a two-line love poem about me, right now, out loud.",
      "Hug me from behind and don't let go for a whole minute.",
      "Recreate the way you held my hand on our first date.",
      "Whisper your favourite pet name for me into my ear.",
      "Look into my eyes for 30 seconds without laughing.",
      "Kiss the back of my hand like it's the 1800s.",
      "Serenade me with one line of any love song.",
    ],
  },
  flirty: {
    truth: [
      "What outfit of mine drives you a little crazy?",
      "Where's the most unexpected place you've wanted to kiss me?",
      "What's the most attractive thing I do without realising it?",
      "Which of our kisses do you still think about?",
      "What's a compliment about my body you've been saving up?",
      "When did you last catch yourself daydreaming about me?",
      "What's one flirty text you almost sent me but didn't?",
      "Which part of me do you love to touch the most?",
      "What look of mine tells you exactly what I'm thinking?",
      "What's your favourite way for me to wake you up?",
    ],
    dare: [
      "Kiss me somewhere other than my lips — your choice.",
      "Give me a slow, lingering kiss on the neck.",
      "Sit on my lap for the next round.",
      "Trace a word on my back with your finger — I have to guess it.",
      "Give me a two-minute shoulder massage, eyes closed.",
      "Kiss me like we've been apart for a month.",
      "Tell me what you want to do to me later — in a whisper.",
      "Run your fingers through my hair until I ask you to stop.",
      "Bite your lip and hold eye contact until I blush.",
      "Send me the most flirtatious text you can — while I'm right here.",
    ],
  },
  spicy: {
    truth: [
      "What's a fantasy of ours you'd like to make real?",
      "What's the most tempting thing I've ever whispered to you?",
      "Where do you most love being kissed?",
      "What's one thing you'd like me to take more time over?",
      "Describe the moment you found me most irresistible.",
      "What's something new you've been curious to try together?",
      "Which of our nights together do you replay in your head?",
      "What do you want me to wear — or not wear — tonight?",
      "What's the one touch of mine that melts you instantly?",
      "If tonight had no rules, how would it start?",
    ],
    dare: [
      "Blindfold me and kiss me in three different places.",
      "Take off one item of my clothing — slowly.",
      "Give me a kiss that lasts until the next song starts.",
      "Kiss your way from my wrist up to my shoulder.",
      "Whisper exactly what you'd like me to do next.",
      "Take off one item of your own clothing — your choice which.",
      "Lead my hands to wherever you want them for 30 seconds.",
      "Give me a massage — you choose where, I can't say no… unless I do.",
      "Set a 60-second timer and make me forget what we were doing.",
      "Pick tonight's next move and show me, don't tell me.",
    ],
  },
};

/* random prompt that hasn't been drawn yet this session; reshuffles once the
   pool runs out. `used` is a Set of prompt strings (mutated). */
export function drawPrompt(level, kind, used, rand = Math.random) {
  const pool = (PROMPTS[level] && PROMPTS[level][kind]) || [];
  if (!pool.length) return "";
  let fresh = pool.filter((p) => !used.has(p));
  if (!fresh.length) {
    pool.forEach((p) => used.delete(p));
    fresh = pool;
  }
  const p = fresh[Math.floor(rand() * fresh.length) % fresh.length];
  used.add(p);
  return p;
}
