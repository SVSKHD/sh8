# Us ❤

A private couples app — a love-themed personal space for two people only, built with Vue 3, Vite, Tailwind CSS, and lucide-vue-next in an Apple-style liquid-glass design.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build
npm run preview  # preview the production build
```

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
