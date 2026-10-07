# Us ❤

A private couples app — a love-themed personal space for two people only, built with Vue 3, Vite, Pinia, Tailwind CSS, and lucide-vue-next in an Apple-style liquid-glass design, synced to Cloud Firestore.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build
npm run preview  # preview the production build
npm test         # vitest in watch mode
npm run test:run # run the test suite once
npm run format   # prettier --write across the repo
```

## Component library — `/ui`

Every building block is a reusable, prop-driven component named with the **`Sph`** prefix (`SphGlassCard`, `SphGlassModal`, `SphGlassTabBar`, `SphHeartRating`, `SphTaskItem`, `SphReminderCard`, `SphChatBox`, `SphLockScreen`, …). Visit **`/ui`** for a live component gallery: foundations (buttons, chips, inputs, tab bar), every content card with sample data, the chat box, modal, greeting card, sidebar drawers, tooltips, and the complete registered Lucide icon library — all reskinnable from the theme switcher in the gallery header.

**UI gallery convention:** whenever a reusable UI component, control, or icon is added, add an interactive example for it to `src/pages/SphUiGalleryPage.vue` in the same change. Keep examples isolated with local mock state so the gallery never mutates real user data.

## Quality tooling

- **Tests** — Vitest + Vue Test Utils (jsdom) in `tests/`: store actions and persistence, `spl` collection naming, date/relative-time utilities, and component behavior (lock-screen codes, chat alignment, reminder math, modal, tab bar, hearts, task chips). Run with `npm run test:run`.
- **Prettier** — repo-wide formatting (`.prettierrc.json`), checked with `npm run format:check`.
- **Husky + lint-staged** — installed via the `prepare` script: the pre-commit hook formats staged files with Prettier, and the pre-push hook runs the full test suite.

## Firestore sync

State lives in a Pinia store (`src/stores/us.js`). When Firebase is configured, every tab's data is stored in its own Firestore collection, all prefixed with **`spl`**:

| Tab / data               | Collection                               | Photo field → Storage folder     |
| ------------------------ | ---------------------------------------- | -------------------------------- |
| Timeline                 | `spl_milestones`                         | `photo` → `spl_media/milestones` |
| Memories                 | `spl_memories`                           | `photo` → `spl_media/memories`   |
| Gallery                  | `spl_gallery`                            | `src` → `spl_media/gallery`      |
| Places to Visit          | `spl_wishlist`                           | `photo` → `spl_media/wishlist`   |
| Places We Visited        | `spl_visited`                            | `photo` → `spl_media/visited`    |
| Places (shared map)      | `spl_places`                             | `image` → `spl_media/places`     |
| Plans                    | `spl_plans`                              | `image` → `spl_media/plans`      |
| Goals                    | `spl_goals`                              | —                                |
| Tasks                    | `spl_tasks`                              | —                                |
| Reminders                | `spl_reminders`                          | —                                |
| Wishes                   | `spl_wishes`                             | —                                |
| Notes                    | `spl_notes`                              | —                                |
| What You Did For Me      | `spl_gratitudeForMe`                     | —                                |
| What I Did For You       | `spl_gratitudeForYou`                    | —                                |
| Chat                     | `spl_messages`                           | —                                |
| Per-user themes / emails | `spl_settings` (`themes`, `emails` docs) | —                                |

Games scores and UI preferences (last tab, filters, drafts) are per device and stay in `localStorage`.

To enable it:

1. Create a Firebase project, add a **Web app**, and enable **Cloud Firestore** and **Cloud Storage** (Storage needs the Blaze plan for new buckets).
2. Copy `.env.example` to `.env.local` and fill in the config values from your Firebase project settings.
3. Deploy the rules in this repo — `firebase deploy --only firestore:rules,storage` (see `firebase.json`), or paste `firestore.rules` / `storage.rules` into the console.
4. Restart the dev server. Everything — stories, photos, lists, chat — comes from Firebase; the app ships with no built-in content, so tabs start empty. Everything you add, edit, or delete is written to Firestore and streamed live to both devices.

**Who did what.** There's no Firebase login — the PIN lock decides who you are. Each person's user id is their date of birth (`ddmmyyyy`, `src/users.js → userId`), and every record is stamped with it: `addedBy` / `addedById` when created, `updatedBy` / `updatedById` on every change (`fromId` on chat messages). The detail view shows "added by … · last edited by …". The rules only accept those two ids in the stamp fields, but they can't verify identity — anyone with the project's web config can still read and write the `spl_` collections.

### Places We Visited — trips, places & Google photos

A visited trip has a **From / To** date range and a list of **places** (`stops`). Paste a Google Maps link for each place: full links fill in the name and location automatically; short share links (`maps.app.goo.gl/…`) can't be read by a browser, so type the place name for those. Each place gets a swipeable photo carousel of its Google photos (in the trip's detail view; the trip card shows one slide per place).

Photos come from the Google **Places API** and need `VITE_GOOGLE_MAPS_API_KEY` (see `.env.example`: enable _Maps JavaScript API_ + _Places API (New)_ and restrict the key to your site). Without it, trips still work: the carousels are hidden and each place keeps its "Open in Maps" button. Google's terms don't allow storing its photos, so they're fetched live and cached only for the session, with each photographer credited.

### Example data (how to fill each collection)

[`firebase/sample-data.json`](firebase/sample-data.json) has example documents for every collection above, plus a `_fields` description of each field (types, allowed values, which ones hold Storage photo URLs). Use it as a reference when adding data by hand in the Firebase console, or load it to see every tab populated:

```sh
pnpm sample:import             # add the examples (skips ones already there)
pnpm sample:import --force     # overwrite the examples with the file's version
pnpm sample:import --dry-run   # preview, write nothing
pnpm sample:clear              # remove them again
```

Every example's id starts with `sample-`, and the script only ever writes or deletes those ids — your real data is never touched. You can also edit or delete any example from inside the app. Sample photo fields are `null`: add photos from the app (✎ → Choose photo), which compresses and uploads them to Storage. The script uses the same `.env.local` config as the app (deploy `firestore.rules` first).

### Offline & refresh-proof

Every change updates the UI instantly and is never lost, even offline or across a refresh:

- **Outbox** (`src/sync/outbox.js`) — each write is saved on the device (IndexedDB, falling back to `localStorage`) _before_ it's sent, and only removed once Firestore confirms it. Anything unconfirmed is replayed on reconnect, when the app comes back to the foreground, and on the next launch.
- **Mirror** — a copy of every tab is kept on the device, so opening or refreshing the app with no network shows your last-known data immediately.
- **Firestore's own offline cache** sits underneath as well.
- **Offline photos** are compressed and held on the device, then uploaded to Storage when the connection returns (the item's photo URL is swapped automatically).
- The header badge shows the state: _Synced_, _Syncing N_, or _Offline · N saved_.

Conflicts are last-write-wins per item: if both of you edit the same item while one is offline, the later sync wins.

## Unlocking

The app is locked behind a glass PIN pad — each person has their own code:

| Code   | Person                 | View                  |
| ------ | ---------------------- | --------------------- |
| `2607` | Hithesh (_cuore mio_)  | his personalized view |
| `1710` | Spoorthy (_cuore mia_) | her personalized view |

You can type the code on the keyboard (Backspace deletes). Wrong codes shake the card. The session stays unlocked until you press the lock icon in the header.

## Features

- **12 tabs** — Timeline, Memories, Gallery, Places to Visit, Places We Visited, Goals, Tasks, Reminders, Notes, two gratitude logs, and Chat — in a glass pill tab bar with a sliding indicator. Navigate with ← → arrow keys; on mobile (≤640px) the bar docks to the bottom of the screen.
- **Personalized views** — chat sends as the logged-in user with their messages on the right, task chips highlight "Me", and the gratitude tab labels flip by perspective. Both views share the same data.
- **Greeting card** — time-of-day greeting plus live temperature, conditions, and location (via Open-Meteo with geolocation or IP fallback) and a weather-matched love quote.
- **10 love themes** — from Rose Blush to Velvet Noir (dark), implemented with CSS variables on `data-theme`. Each person's theme choice is saved to their own login.
- **Gallery** — upload real photos (resized client-side and persisted), then browse them in a fullscreen carousel with arrows, ← → keys, swipe, and a caption/counter bar.
- **Reminders** — a first date plus a repeat interval in days (every 25, 22, 30… or 0 for one-time), with the next date, a countdown, and a progress bar through the interval.
- **Detail dialog** — cards keep a standard height and clamp long text; clicking one opens a scrollable glass dialog you can slide through with arrows, swipe, or ← → keys.
- **Glass everything** — frosted translucent panels, animated gradient-mesh background, floating heart particles on the lock screen, and heart confetti when completing goals and tasks.
- **Local persistence** — all data lives in `localStorage`, seeded with demo data you can delete (hover a card for the trash icon). Add new items on every tab with the floating **+** button.
