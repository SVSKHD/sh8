/* store basics — the app ships with no demo content: every story, photo and
   list item comes from Firestore (or, without Firebase, what you add locally).
   Example documents showing how to fill each collection live in
   firebase/sample-data.json (`pnpm sample:import` / `pnpm sample:clear`). */
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

export const SEED_THEMES = { Hithesh: "rose", Spoorthy: "lavender" };

/* every tab's list — each maps to the Firestore collection `spl_<name>` */
export const LIST_NAMES = [
  "milestones",
  "memories",
  "gallery",
  "wishlist",
  "visited",
  "places",
  "plans",
  "wishes",
  "goals",
  "tasks",
  "reminders",
  "notes",
  "gratitudeForMe",
  "gratitudeForYou",
  "messages",
];
