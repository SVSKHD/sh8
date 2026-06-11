/* Us — reactive store (composable, persisted to localStorage) */
import { reactive, watch, watchEffect } from "vue";

const KEY = "us-app-v1";
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

const seed = {
  theme: "rose",
  themes: { Hithesh: "rose", Spoorthy: "lavender" },
  milestones: [
    { id: uid(), date: "2022-03-14", title: "The day we met", note: "Rainy afternoon, the little coffee shop on 5th. You ordered my order before I did.", photo: true },
    { id: uid(), date: "2022-04-02", title: "First date", note: "Pasta, terrible jokes, and neither of us wanted to go home.", photo: false },
    { id: uid(), date: "2022-08-21", title: "First trip together", note: "The coast. We got lost twice and it became the best part.", photo: true },
    { id: uid(), date: "2023-02-14", title: "Said “I love you”", note: "You said it first. I said it back before you finished.", photo: false },
    { id: uid(), date: "2025-06-01", title: "Moved in together", note: "Forty boxes, one tiny kitchen, all ours.", photo: true },
  ],
  memories: [
    { id: uid(), caption: "Sunset on the pier, your hand in mine", date: "2024-07-12", favorite: true, h: 200 },
    { id: uid(), caption: "Pancake Sunday gone very wrong", date: "2024-02-04", favorite: false, h: 150 },
    { id: uid(), caption: "Dancing in the kitchen at midnight", date: "2024-11-23", favorite: true, h: 230 },
    { id: uid(), caption: "Your birthday surprise (you cried)", date: "2025-03-09", favorite: false, h: 170 },
    { id: uid(), caption: "Snow day — first one in our place", date: "2025-12-18", favorite: false, h: 210 },
    { id: uid(), caption: "Matching sweaters. No regrets.", date: "2025-12-25", favorite: true, h: 150 },
  ],
  wishlist: [
    { id: uid(), name: "Kyoto in cherry blossom season", note: "Stay in a ryokan, slow mornings, tea.", priority: "Dream" },
    { id: uid(), name: "Northern lights in Tromsø", note: "Cabin with a glass roof. Hot chocolate mandatory.", priority: "Someday" },
    { id: uid(), name: "That tiny ramen bar downtown", note: "The one with six seats we keep walking past.", priority: "Soon" },
    { id: uid(), name: "Santorini at golden hour", note: "For the anniversary, maybe?", priority: "Dream" },
  ],
  visited: [
    { id: uid(), name: "Paris", date: "2023-05-19", rating: 5, story: "We climbed Montmartre at sunrise and shared one croissant because we were broke." },
    { id: uid(), name: "Lisbon", date: "2024-09-30", rating: 4, story: "Tram 28, pasteis de nata, and you singing fado very badly." },
    { id: uid(), name: "The lake cabin", date: "2025-08-15", rating: 5, story: "No wifi for three days. Best three days." },
  ],
  goals: [
    { id: uid(), title: "Save for the Japan trip", targetDate: "2027-03-01", progress: 65 },
    { id: uid(), title: "Cook 30 new recipes together", targetDate: "2026-12-31", progress: 40 },
    { id: uid(), title: "Run a 10k side by side", targetDate: "2026-10-04", progress: 80 },
  ],
  tasks: [
    { id: uid(), title: "Book anniversary dinner", assignee: "Spoorthy", due: "2026-06-20", done: false },
    { id: uid(), title: "Print photos for the hallway", assignee: "Hithesh", due: "2026-06-14", done: false },
    { id: uid(), title: "Plan the weekend hike", assignee: "Spoorthy", due: "2026-06-12", done: true },
    { id: uid(), title: "Buy a second reading lamp", assignee: "Hithesh", due: "", done: false },
  ],
  gratitudeForMe: [
    { id: uid(), date: "2026-06-08", note: "You brought me soup and stayed on the phone while I fell asleep." },
    { id: uid(), date: "2026-05-30", note: "You remembered the small thing I said three weeks ago. You always do." },
    { id: uid(), date: "2026-05-17", note: "Flowers. No reason. Just because it was Tuesday." },
  ],
  gratitudeForYou: [
    { id: uid(), date: "2026-06-05", note: "Made your coffee before your alarm went off." },
    { id: uid(), date: "2026-05-22", note: "Drove an hour to bring you the charger you forgot." },
  ],
  gallery: [
    { id: uid(), src: null, caption: "First picnic in the park", date: "2024-05-04" },
    { id: uid(), src: null, caption: "New Year’s kiss", date: "2026-01-01" },
    { id: uid(), src: null, caption: "Road trip face", date: "2025-07-19" },
    { id: uid(), src: null, caption: "Sunday morning, no plans", date: "2026-04-12" },
  ],
  messages: [
    { id: uid(), from: "Spoorthy", text: "Movie night Friday? I’m picking this time 🍿", ts: "2026-06-09T19:42:00" },
    { id: uid(), from: "Hithesh", text: "Only if I get veto power", ts: "2026-06-09T19:44:00" },
    { id: uid(), from: "Spoorthy", text: "No veto. You used it on my documentary", ts: "2026-06-09T19:45:00" },
    { id: uid(), from: "Hithesh", text: "It was three hours about fonts ❤", ts: "2026-06-09T19:47:00" },
  ],
  reminders: [
    { id: uid(), title: "Monthsary date night", startDate: "2026-06-02", intervalDays: 30 },
    { id: uid(), title: "Bring flowers home", startDate: "2026-05-28", intervalDays: 25 },
    { id: uid(), title: "Write a little love note", startDate: "2026-06-01", intervalDays: 22 },
    { id: uid(), title: "Our anniversary", startDate: "2022-04-02", intervalDays: 365 },
  ],
  notes: [
    { id: uid(), title: "Cabin wifi", body: "network: lakehouse\npass: 2hearts1roof", date: "2025-08-15" },
    { id: uid(), title: "Gift ideas", body: "that ceramic mug she pointed at twice\nfilm camera\npicnic blanket (red check)", date: "2026-05-30" },
    { id: uid(), title: "Our pizza dough", body: "500g flour, 325ml water, 10g salt, 3g yeast.\ncold rise 48h — do NOT rush it again.", date: "2026-02-21" },
  ],
};

let saved = null;
try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { saved = null; }

export const state = reactive(Object.assign(JSON.parse(JSON.stringify(seed)), saved || {}));

// migrate old Me/You data to the two named users
const NAME_MAP = { Me: "Hithesh", You: "Spoorthy" };
state.tasks.forEach((t) => { if (NAME_MAP[t.assignee]) t.assignee = NAME_MAP[t.assignee]; });
state.messages.forEach((m) => { if (NAME_MAP[m.from]) m.from = NAME_MAP[m.from]; });

// migrate single shared theme -> per-user themes
if (saved && saved.theme && !saved.themes) {
  state.themes = { Hithesh: saved.theme, Spoorthy: saved.theme };
}

watch(
  state,
  () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} },
  { deep: true }
);

// theme -> <html data-theme>
watchEffect(() => {
  document.documentElement.dataset.theme = state.theme;
});

const actions = {
  addItem(list, item) {
    state[list].unshift(Object.assign({ id: uid() }, item));
  },
  addMessage(from, text) {
    state.messages.push({ id: uid(), from, text, ts: new Date().toISOString() });
  },
  removeItem(list, id) {
    const i = state[list].findIndex((x) => x.id === id);
    if (i > -1) state[list].splice(i, 1);
  },
  toggleFavorite(id) {
    const m = state.memories.find((x) => x.id === id);
    if (m) m.favorite = !m.favorite;
  },
  toggleTask(id) {
    const t = state.tasks.find((x) => x.id === id);
    if (t) t.done = !t.done;
    return t ? t.done : false;
  },
  bumpGoal(id, delta) {
    const g = state.goals.find((x) => x.id === id);
    if (!g) return 0;
    g.progress = Math.max(0, Math.min(100, g.progress + delta));
    return g.progress;
  },
  markVisited(id) {
    const i = state.wishlist.findIndex((x) => x.id === id);
    if (i === -1) return;
    const p = state.wishlist[i];
    state.wishlist.splice(i, 1);
    state.visited.unshift({
      id: p.id,
      name: p.name,
      date: new Date().toISOString().slice(0, 10),
      rating: 5,
      story: p.note || "",
    });
  },
};

export function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d + "T12:00:00");
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const useUsStore = () => Object.assign({ state }, actions);
