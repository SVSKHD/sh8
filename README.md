# Us ❤

A private couples app — a love-themed personal space for two people only, built with Vue 3, Vite, Pinia, Tailwind CSS, and lucide-vue-next in an Apple-style liquid-glass design, synced to Cloud Firestore.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build
npm run preview  # preview the production build
```

## Firestore sync

State lives in a Pinia store (`src/stores/us.js`). When Firebase is configured, every tab's data is stored in its own Firestore collection, all prefixed with **`sph`**:

| Tab / data | Collection |
| ---------- | ---------- |
| Timeline | `sph_milestones` |
| Memories | `sph_memories` |
| Gallery | `sph_gallery` |
| Places to Visit | `sph_wishlist` |
| Places We Visited | `sph_visited` |
| Goals | `sph_goals` |
| Tasks | `sph_tasks` |
| Reminders | `sph_reminders` |
| Notes | `sph_notes` |
| What You Did For Me | `sph_gratitudeForMe` |
| What I Did For You | `sph_gratitudeForYou` |
| Chat | `sph_messages` |
| Per-user themes | `sph_settings` |
| One-time seed marker | `sph_meta` |

To enable it:

1. Create a Firebase project, add a **Web app**, and enable **Cloud Firestore**.
2. Copy `.env.example` to `.env.local` and fill in the config values from your Firebase project settings.
3. Restart the dev server. On first run the demo data is seeded once; after that everything you add, edit, or delete on any tab is written to Firestore and streamed back live.

The experience stays smooth either way: writes update the UI instantly (Firestore latency compensation), an offline-first persistent cache makes reloads render immediately and survives losing the connection, and changes sync in real time across both partners' devices. If the env vars are not set, the app falls back to `localStorage` exactly as before — no Firebase required to develop or demo. Note: gallery photos are stored as data URLs inside documents, so very large images can approach Firestore's 1 MB document limit (uploads are resized client-side to stay under it).

## Unlocking

The app is locked behind a glass PIN pad — each person has their own code:

| Code | Person | View |
| ---- | ------ | ---- |
| `2607` | Hithesh (*cuore mio*) | his personalized view |
| `1710` | Spoorthy (*cuore mia*) | her personalized view |

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
