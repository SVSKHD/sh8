<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import SphChatBox from "../components/cards/SphChatBox.vue";
import SphDetailModal from "../components/cards/SphDetailModal.vue";
import SphGalleryCard from "../components/cards/SphGalleryCard.vue";
import SphGoalCard from "../components/cards/SphGoalCard.vue";
import SphGratitudeList from "../components/cards/SphGratitudeList.vue";
import SphMemoryCard from "../components/cards/SphMemoryCard.vue";
import SphNoteCard from "../components/cards/SphNoteCard.vue";
import SphPlaceCard from "../components/cards/SphPlaceCard.vue";
import SphPlacesPanel from "../components/cards/SphPlacesPanel.vue";
import SphPlansPanel from "../components/cards/SphPlansPanel.vue";
import SphReminderList from "../components/cards/SphReminderList.vue";
import SphTaskItem from "../components/cards/SphTaskItem.vue";
import SphTimelineItem from "../components/cards/SphTimelineItem.vue";
import SphTripStopsEditor from "../components/cards/SphTripStopsEditor.vue";
import SphWishesPanel from "../components/cards/SphWishesPanel.vue";
import SphGamesPanel from "../components/games/SphGamesPanel.vue";
import SphGreetingCard from "../components/SphGreetingCard.vue";
import SphLockScreen from "../components/SphLockScreen.vue";
import SphLoveBook from "../components/SphLoveBook.vue";
import SphEmptyState from "../components/ui/SphEmptyState.vue";
import SphGlassInput from "../components/ui/SphGlassInput.vue";
import SphGlassModal from "../components/ui/SphGlassModal.vue";
import SphGlassPhotoInput from "../components/ui/SphGlassPhotoInput.vue";
import SphGlassSelect from "../components/ui/SphGlassSelect.vue";
import SphGlassTabBar from "../components/ui/SphGlassTabBar.vue";
import SphHeartRating from "../components/ui/SphHeartRating.vue";
import SphSegmentedFilter from "../components/ui/SphSegmentedFilter.vue";
import SphSectionTitle from "../components/ui/SphSectionTitle.vue";
import SphThemeSwitcher from "../components/ui/SphThemeSwitcher.vue";
import SphSyncStatus from "../components/ui/SphSyncStatus.vue";
import SphTooltip from "../components/ui/SphTooltip.vue";
import SphIcon from "../components/ui/SphIcon.vue";
import { burstHearts } from "../composables/burstHearts";
import { detailState } from "../composables/detail";
import { nextBirthday } from "../birthdays";
import { useFilterPref } from "../composables/useFilterPref";
import { scheduleWishDelivery, useWishes } from "../composables/useWishes";
import { useUsStore } from "../stores/us";
import { USERS, userByName } from "../users";

const store = useUsStore();
const state = store;
const today = () => new Date().toISOString().slice(0, 10);

const TABS = [
  { id: "timeline", icon: "Calendar", label: "Timeline" },
  { id: "memories", icon: "Image", label: "Memories" },
  { id: "gallery", icon: "Images", label: "Gallery" },
  { id: "wishlist", icon: "MapPin", label: "Places to Visit" },
  { id: "visited", icon: "Map", label: "Places We Visited" },
  { id: "places", icon: "Compass", label: "Places" },
  { id: "plans", icon: "ClipboardList", label: "Plans" },
  { id: "goals", icon: "Target", label: "Goals" },
  { id: "tasks", icon: "ListChecks", label: "Tasks" },
  { id: "reminders", icon: "BellRing", label: "Reminders" },
  { id: "wishes", icon: "Mail", label: "Wishes" },
  { id: "notes", icon: "StickyNote", label: "Notes" },
  { id: "gratitudeForMe", icon: "Gift", label: "What You Did For Me" },
  { id: "gratitudeForYou", icon: "Sparkles", label: "What I Did For You" },
  { id: "games", icon: "Gamepad2", label: "Games" },
  { id: "chat", icon: "MessageCircle", label: "Chat" },
];

const FORMS = {
  timeline: {
    title: "Add a milestone",
    list: "milestones",
    fields: [
      { k: "title", label: "Title", type: "text", placeholder: "Our first…" },
      { k: "date", label: "Date", type: "date" },
      { k: "note", label: "Note", type: "textarea", placeholder: "What made it ours?" },
      { k: "photo", label: "Photo (optional)", type: "photo" },
    ],
    blank: () => ({ title: "", date: today(), note: "", photo: null }),
    valid: (f) => f.title.trim() && f.date,
  },
  memories: {
    title: "Add a memory",
    list: "memories",
    fields: [
      { k: "photo", label: "Photo", type: "photo" },
      { k: "caption", label: "Caption", type: "text", placeholder: "That time we…" },
      { k: "date", label: "Date", type: "date" },
    ],
    blank: () => ({ photo: null, caption: "", date: today(), favorite: false, h: 140 + Math.round(Math.random() * 90) }),
    valid: (f) => f.caption.trim() || !!f.photo,
  },
  gallery: {
    title: "Add a photo",
    list: "gallery",
    fields: [
      { k: "src", label: "Photo", type: "photo" },
      { k: "caption", label: "Caption", type: "text", placeholder: "What’s happening here?" },
      { k: "date", label: "Date", type: "date" },
    ],
    blank: () => ({ src: null, caption: "", date: today(), h: 140 + Math.round(Math.random() * 80) }),
    valid: (f) => !!f.src || f.caption.trim(),
  },
  wishlist: {
    title: "Add a place to visit",
    list: "wishlist",
    fields: [
      { k: "name", label: "Place", type: "text", placeholder: "Where to, love?" },
      { k: "priority", label: "Priority", type: "select", options: ["Soon", "Someday", "Dream"] },
      { k: "note", label: "Note", type: "textarea", placeholder: "Why this one?" },
      { k: "photo", label: "Photo (optional)", type: "photo" },
    ],
    blank: () => ({ name: "", priority: "Soon", note: "", photo: null }),
    valid: (f) => f.name.trim(),
  },
  visited: {
    title: "Add a place we visited",
    list: "visited",
    fields: [
      { k: "name", label: "Trip", type: "text", placeholder: "Where were we? e.g. Goa" },
      // older trips only have `date` — edit them as a one-day range
      { k: "dateFrom", label: "From", type: "date", fallback: "date" },
      { k: "dateTo", label: "To", type: "date", fallback: "date", minFrom: "dateFrom" },
      { k: "stops", label: "Places we went", type: "stops" },
      { k: "rating", label: "Rating", type: "hearts" },
      { k: "story", label: "Short story", type: "textarea", placeholder: "The part we'll retell forever…" },
      { k: "photo", label: "Cover photo (optional)", type: "photo" },
    ],
    blank: () => ({ name: "", dateFrom: today(), dateTo: today(), stops: [], rating: 5, story: "", photo: null }),
    valid: (f) => f.name.trim() && !!f.dateFrom,
    /* `date` stays the trip's start, so sorting / "x days ago" keep working */
    finalize: (f) => {
      if (!f.dateTo || f.dateTo < f.dateFrom) f.dateTo = f.dateFrom;
      f.date = f.dateFrom;
    },
  },
  goals: {
    title: "Add a shared goal",
    list: "goals",
    fields: [
      { k: "title", label: "Goal", type: "text", placeholder: "Together we will…" },
      { k: "targetDate", label: "Target date", type: "date" },
    ],
    blank: () => ({ title: "", targetDate: "", progress: 0 }),
    valid: (f) => f.title.trim(),
  },
  tasks: {
    title: "Add a task",
    list: "tasks",
    fields: [
      { k: "title", label: "Task", type: "text", placeholder: "What needs doing?" },
      { k: "forWhom", label: "For", type: "select", options: ["Hithesh", "Spoorthy", "Both"] },
      { k: "due", label: "Due", type: "date" },
    ],
    blank: () => ({ title: "", forWhom: "Both", due: "", done: false }),
    valid: (f) => f.title.trim(),
    normalize: (f) => {
      f.addedBy = user.value && user.value.name;
    },
  },
  notes: {
    title: "Add a note",
    list: "notes",
    fields: [
      { k: "title", label: "Title (optional)", type: "text", placeholder: "What’s it about?" },
      { k: "body", label: "Note", type: "textarea", placeholder: "Anything we shouldn’t forget…" },
    ],
    blank: () => ({ title: "", body: "", date: today() }),
    valid: (f) => f.body.trim(),
  },
  gratitudeForMe: {
    title: "Add something you did",
    list: "gratitudeForMe",
    fields: [
      { k: "note", label: "Sweet note", type: "textarea", placeholder: "You…" },
      { k: "date", label: "Date", type: "date" },
    ],
    blank: () => ({ note: "", date: today() }),
    valid: (f) => f.note.trim(),
  },
  gratitudeForYou: {
    title: "Add something I did",
    list: "gratitudeForYou",
    fields: [
      { k: "note", label: "Sweet note", type: "textarea", placeholder: "I…" },
      { k: "date", label: "Date", type: "date" },
    ],
    blank: () => ({ note: "", date: today() }),
    valid: (f) => f.note.trim(),
  },
};

let restored = null;
try {
  restored = userByName(sessionStorage.getItem("us-user"));
} catch (e) {}
const user = ref(restored);
const unlocked = ref(!!restored);
if (restored && state.themes && state.themes[restored.name]) state.theme = state.themes[restored.name];
const welcome = ref(false);
/* last-active tab persists across full app restarts (iOS PWA cold start
   included) via localStorage — falls back to the home tab if the stored
   value is missing or no longer a valid tab id */
const active = useFilterPref("us-last-tab", "timeline");
if (!TABS.some((t) => t.id === active.value)) active.value = "timeline";

/* section heading: the active tab's icon + a live count line */
const activeTab = computed(() => TABS.find((t) => t.id === active.value) || TABS[0]);
const plural = (n, one, many) => n + " " + (n === 1 ? one : many || one + "s");
const sectionSub = computed(() => {
  const s = store;
  switch (active.value) {
    case "timeline":
      return plural(s.milestones.length, "milestone");
    case "memories": {
      const fav = s.memories.filter((m) => m.favorite).length;
      return plural(s.memories.length, "memory", "memories") + (fav ? " · " + fav + " ♥" : "");
    }
    case "gallery":
      return plural(s.gallery.length, "photo");
    case "wishlist":
      return plural(s.wishlist.length, "place") + " on the list";
    case "visited":
      return plural(s.visited.length, "trip") + " together";
    case "places":
      return plural(s.places.length, "place");
    case "plans":
      return plural(s.plans.filter((p) => p.status !== "done").length, "plan") + " ahead";
    case "goals":
      return plural(s.goals.filter((g) => g.progress >= 100).length, "goal") + " reached of " + s.goals.length;
    case "tasks":
      return plural(s.tasks.filter((t) => !t.done).length, "thing") + " left to do";
    case "reminders":
      return plural(s.reminders.length, "reminder");
    case "wishes":
      return plural(s.wishes.length, "wish", "wishes");
    case "notes":
      return plural(s.notes.length, "note");
    case "gratitudeForMe":
      return plural(s.gratitudeForMe.length, "sweet thing");
    case "gratitudeForYou":
      return plural(s.gratitudeForYou.length, "sweet thing");
    case "games":
      return "3 games for two";
    case "chat":
      return plural(s.messages.length, "message");
    default:
      return "";
  }
});

/* phone layout: the tab bar leaves the greeting card and docks to the bottom
   (same 640px breakpoint as the CSS) */
const mobileQuery = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(max-width: 640px)") : null;
const isMobile = ref(!!(mobileQuery && mobileQuery.matches));
const onMobileChange = (e) => (isMobile.value = e.matches);
if (mobileQuery && mobileQuery.addEventListener) mobileQuery.addEventListener("change", onMobileChange);
onBeforeUnmount(
  () => mobileQuery && mobileQuery.removeEventListener && mobileQuery.removeEventListener("change", onMobileChange),
);
const showAdd = ref(false);
const form = reactive({});

const gratLabels = computed(() => {
  if (!user.value) return {};
  return user.value.name === "Hithesh"
    ? { gratitudeForMe: "What Spoorthy Did For Me", gratitudeForYou: "What I Did For Spoorthy" }
    : { gratitudeForMe: "What I Did For Hithesh", gratitudeForYou: "What Hithesh Did For Me" };
});
const tabsView = computed(() =>
  TABS.map((t) => (gratLabels.value[t.id] ? Object.assign({}, t, { label: gratLabels.value[t.id] }) : t)),
);

const onUnlock = (u) => {
  user.value = u;
  unlocked.value = true;
  welcome.value = true;
  if (state.themes && state.themes[u.name]) state.theme = state.themes[u.name];
  setTimeout(() => {
    welcome.value = false;
  }, 2400);
};

/* per-user theme: switching saves to the logged-in user's slot */
const themeModel = computed({
  get: () => state.theme,
  set: (v) => store.setTheme(v, user.value && user.value.name),
});

/* apply the logged-in user's saved theme whenever it loads or changes
   (e.g. arriving from Firestore, or switched on another device) */
watch(
  () => (user.value && state.themes ? state.themes[user.value.name] : null),
  (t) => {
    if (t) state.theme = t;
  },
);

/* whoever unlocked is stamped on everything they add or change */
watch(user, (u) => store.setActor(u), { immediate: true });

/* scheduled wishes: show a delivered-but-unseen one the moment it's found,
   and (re)start the precisely-timed notification scheduler for this user
   whenever they're known (fresh unlock or restored session) */
const wishes = useWishes(() => user.value && user.value.name);
const popupWish = ref(null);
const checkForWishPopup = () => {
  if (!user.value) return;
  wishes.checkDeliveries();
  if (!popupWish.value) popupWish.value = wishes.deliveredUnseen.value[0] || null;
};
watch(
  user,
  (u) => {
    if (u) {
      scheduleWishDelivery(u.name);
      checkForWishPopup();
    }
  },
  { immediate: true },
);
const dismissWishPopup = () => {
  if (popupWish.value) wishes.markSeen(popupWish.value.id);
  popupWish.value = null;
};

/* birthday dialogs, each shown once per day per viewer (after the welcome
   veil clears), the viewer's own first:
   - "today": wishes whoever's birthday it is
   - "soon": reminds the viewer of their partner's upcoming birthday on the
     days in BDAY_REMIND_DAYS
   Seen-state is per device, keyed by viewer + birthday person + date. */
const BDAY_REMIND_DAYS = [30, 14, 7, 6, 5, 4, 3, 2, 1];
const bdayPopup = ref(null);
/* the birthday book is from the partner to whoever's birthday it is */
const book = reactive({ open: false, name: "", pet: "", from: "" });
const openBook = (name) => {
  const who = userByName(name);
  const partner = Object.values(USERS).find((u) => u.name !== name);
  Object.assign(book, { open: true, name, pet: (who && who.pet) || "", from: (partner && partner.name) || "" });
};
let bdayTimer = null;
const bdaySeenKey = (viewer, who) => "us-bday-seen-" + viewer + "-" + who + "-" + new Date().toDateString();
const checkForBirthday = () => {
  if (!user.value || bdayPopup.value) return;
  const viewer = user.value.name;
  const next = Object.values(USERS)
    .slice()
    .sort((a, b) => (b.name === viewer) - (a.name === viewer))
    .map((u) => {
      const nb = nextBirthday(u);
      const mine = u.name === viewer;
      const kind = nb.days === 0 ? "today" : !mine && BDAY_REMIND_DAYS.includes(nb.days) ? "soon" : null;
      return kind && { name: u.name, mine, kind, days: nb.days, turning: nb.turning, date: nb.date };
    })
    .find((p) => {
      if (!p) return false;
      try {
        return !localStorage.getItem(bdaySeenKey(viewer, p.name));
      } catch (e) {
        return true;
      }
    });
  if (!next) return;
  clearTimeout(bdayTimer);
  bdayTimer = setTimeout(
    () => {
      bdayPopup.value = next;
      if (next.kind === "today") setTimeout(() => burstHearts(window.innerWidth / 2, window.innerHeight / 2, 30), 150);
    },
    welcome.value ? 2600 : 400,
  );
};
const bdayTitle = computed(() => {
  const p = bdayPopup.value;
  if (!p) return "";
  if (p.kind === "soon") return "Birthday coming up 🎁";
  return p.mine ? "Happy birthday 🎂" : "Birthday today 🎂";
});
const bdayDateStr = (d) => d.toLocaleDateString("en-US", { month: "long", day: "numeric" });

/* read-aloud text for the birthday dialog — mirrors what it shows */
const bdaySpeak = computed(() => {
  const p = bdayPopup.value;
  if (!p) return "";
  if (p.kind === "soon")
    return `${p.name}'s birthday is ${p.days === 1 ? "tomorrow" : "in " + p.days + " days"}, on ${bdayDateStr(p.date)}. Turning ${p.turning}. Time to plan something special.`;
  if (p.mine)
    return `Happy birthday, ${p.name}! ${p.turning} today, ${user.value.pet}. ${partnerName.value} loves you more than ever.`;
  return `It's ${p.name}'s birthday! Turning ${p.turning} today. Go make it the best one yet.`;
});
/* partner's next birthday, for the "psst" line in the viewer's own wish */
const partnerBday = computed(() => {
  const p = user.value && Object.values(USERS).find((u) => u.name !== user.value.name);
  if (!p) return null;
  const nb = nextBirthday(p);
  return nb.days > 0 ? nb : null;
});
const dismissBirthday = () => {
  if (bdayPopup.value && user.value) {
    try {
      localStorage.setItem(bdaySeenKey(user.value.name, bdayPopup.value.name), "1");
    } catch (e) {}
  }
  bdayPopup.value = null;
  checkForBirthday();
};
watch(user, (u) => u && checkForBirthday(), { immediate: true });

/* gallery carousel */
const photos = computed(() => state.gallery.filter((g) => g.src));
const lbIndex = ref(-1);
const lbPhoto = computed(() => (lbIndex.value >= 0 ? photos.value[lbIndex.value] : null));
const openLightbox = (g) => {
  lbIndex.value = photos.value.indexOf(g);
};
const lbStep = (d) => {
  const n = photos.value.length;
  if (!n) {
    lbIndex.value = -1;
    return;
  }
  lbIndex.value = (lbIndex.value + d + n) % n;
};
let touchX = null;
const lbTouchStart = (e) => {
  touchX = e.changedTouches[0].clientX;
};
const lbTouchEnd = (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  touchX = null;
  if (Math.abs(dx) > 40) lbStep(dx < 0 ? 1 : -1);
};
const onLbKey = (e) => {
  if (lbIndex.value < 0) return;
  if (e.key === "ArrowRight") lbStep(1);
  else if (e.key === "ArrowLeft") lbStep(-1);
  else if (e.key === "Escape") lbIndex.value = -1;
};

/* arrow keys move between menu tabs */
const onTabKey = (e) => {
  if (!unlocked.value || showAdd.value || lbIndex.value >= 0) return;
  if (detailState.open) return;
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  const t = e.target;
  if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
  const ids = TABS.map((x) => x.id);
  const i = ids.indexOf(active.value);
  active.value = ids[(i + (e.key === "ArrowRight" ? 1 : -1) + ids.length) % ids.length];
  e.preventDefault();
};
/* catches a wish that comes due while the app is open and actively being
   used, beyond the one precisely-timed scheduler wakeup */
let wishPollTimer = null;
onMounted(() => {
  window.addEventListener("keydown", onLbKey);
  window.addEventListener("keydown", onTabKey);
  wishPollTimer = setInterval(checkForWishPopup, 30000);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onLbKey);
  window.removeEventListener("keydown", onTabKey);
  clearInterval(wishPollTimer);
  clearTimeout(bdayTimer);
});

/* fixed-height panel: start each tab at the top */
watch(active, () => {
  const el = document.querySelector(".content-panel");
  if (el) el.scrollTop = 0;
});

const formCfg = computed(() => FORMS[active.value]);
const sortedMilestones = computed(() => state.milestones.slice().sort((a, b) => (a.date < b.date ? -1 : 1)));
const sortedTasks = computed(() => state.tasks.slice().sort((a, b) => Number(a.done) - Number(b.done)));

/* per-person filter over the shared Tasks list — trust-based like every
   other identity check in this app (see SphLockScreen): it hides items in
   the UI, it doesn't enforce access. `partnerName` is derived rather than
   hardcoded so the same filter works no matter who's logged in. */
const partnerName = computed(() => (user.value && Object.values(USERS).find((u) => u.name !== user.value.name)?.name) || "");
const taskFilter = useFilterPref("us-filter-tasks", "both");
const taskFilterOptions = computed(() => [
  { value: "partner", label: "For " + partnerName.value },
  { value: "me", label: "For me" },
  { value: "both", label: "Both" },
]);
const filteredTasks = computed(() =>
  sortedTasks.value.filter((t) => {
    if (taskFilter.value === "me") return t.forWhom === (user.value && user.value.name);
    if (taskFilter.value === "partner") return t.forWhom === partnerName.value;
    return t.forWhom === "Both";
  }),
);

const openAdd = () => {
  const blank = formCfg.value.blank();
  Object.keys(form).forEach((k) => delete form[k]);
  Object.assign(form, blank);
  if ("forWhom" in form && user.value) form.forWhom = user.value.name;
  editingId.value = null;
  showAdd.value = true;
};
/* edit reuses the add form: prefill just the form's own fields from the item
   (missing ones fall back to the blank defaults, e.g. `photo` on old items) */
const editingId = ref(null);
const openEdit = (item) => {
  const blank = formCfg.value.blank();
  Object.keys(form).forEach((k) => delete form[k]);
  formCfg.value.fields.forEach((f) => {
    const v = item[f.k] !== undefined ? item[f.k] : f.fallback ? item[f.fallback] : undefined;
    // legacy `photo: true` meant "placeholder" — edit it as "no photo yet"
    form[f.k] = v === undefined || (f.type === "photo" && typeof v !== "string") ? blank[f.k] : v;
  });
  editingId.value = item.id;
  showAdd.value = true;
};
/* date ranges (visited trips): moving "From" past "To" drags "To" along */
watch(
  () => form.dateFrom,
  (from) => {
    if (from && form.dateTo && form.dateTo < from) form.dateTo = from;
  },
);
const formTitle = computed(() => {
  if (!formCfg.value) return "";
  return editingId.value ? formCfg.value.title.replace(/^Add (a |an )?/, "Edit ") : formCfg.value.title;
});
/* trip places editor (visited form) — a place left in its inputs is added on Save */
let stopsEditor = null;
const saveAdd = () => {
  if (stopsEditor && formCfg.value.fields.some((f) => f.type === "stops") && !stopsEditor.commit()) return;
  if (!formCfg.value.valid(form)) return;
  const data = JSON.parse(JSON.stringify(form));
  if (formCfg.value.finalize) formCfg.value.finalize(data);
  if (editingId.value) {
    store.updateItem(formCfg.value.list, editingId.value, data);
  } else {
    if (formCfg.value.normalize) formCfg.value.normalize(data);
    store.addItem(formCfg.value.list, data);
  }
  editingId.value = null;
  showAdd.value = false;
};
const lock = () => {
  try {
    sessionStorage.removeItem("us-user");
  } catch (e) {}
  unlocked.value = false;
  user.value = null;
  welcome.value = false;
  clearTimeout(bdayTimer);
  bdayPopup.value = null;
};
</script>

<template>
  <div>
    <sph-lock-screen v-if="!unlocked" @unlock="onUnlock" />

    <div v-else class="app-pad mx-auto px-4 pt-6 pb-24" style="max-width: 52rem">
      <!-- header -->
      <header class="flex items-center justify-between mb-5 px-1">
        <div class="flex items-baseline gap-2.5">
          <h1 class="font-display m-0 text-4xl font-semibold italic">Us <span style="color: var(--accent)">❤</span></h1>
          <p class="m-0 text-xs hidden sm:block" style="color: var(--ink-3)">
            welcome, {{ user.name.toLowerCase() }} · {{ user.pet }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <sph-sync-status />
          <sph-theme-switcher v-model="themeModel" />
          <sph-tooltip text="Lock the app">
            <button class="gbtn gbtn-icon" aria-label="Lock the app" @click="lock()">
              <sph-icon name="Lock" :size="16" />
            </button>
          </sph-tooltip>
        </div>
      </header>

      <!-- greeting card: time, weather, location, birthdays — and the tab bar.
           On phones the tab bar is teleported out to <body> so it can dock to
           the bottom of the screen (the card's backdrop-filter would otherwise
           trap its position: fixed inside the card). -->
      <sph-greeting-card :key="user.name" :user="user">
        <template #tabs>
          <teleport to="body" :disabled="!isMobile">
            <div class="tabbar-wrap flex justify-center">
              <sph-glass-tab-bar v-model="active" :tabs="tabsView" />
            </div>
          </teleport>
        </template>
      </sph-greeting-card>

      <!-- content panel -->
      <main class="glass content-panel">
        <section v-if="active === 'timeline'" key="timeline" class="tab-section">
          <sph-section-title :icon="activeTab.icon" :sub="sectionSub">Our story so far</sph-section-title>
          <ul v-if="sortedMilestones.length" class="tl">
            <sph-timeline-item
              v-for="(m, i) in sortedMilestones"
              :key="m.id"
              :item="m"
              :style="{ '--i': i }"
              @edit="openEdit(m)"
              @remove="store.removeItem('milestones', m.id)"
            />
          </ul>
          <sph-empty-state v-else emoji="💞" message="No milestones yet." />
        </section>

        <section v-else-if="active === 'memories'" key="memories" class="tab-section">
          <sph-section-title :icon="activeTab.icon" :sub="sectionSub">Little moments, kept</sph-section-title>
          <div v-if="state.memories.length" class="masonry">
            <sph-memory-card
              v-for="(m, i) in state.memories"
              :key="m.id"
              :item="m"
              :style="{ '--i': i }"
              @fav="store.toggleFavorite(m.id)"
              @edit="openEdit(m)"
              @remove="store.removeItem('memories', m.id)"
            />
          </div>
          <sph-empty-state v-else emoji="📸" message="No memories saved yet." />
        </section>

        <section v-else-if="active === 'gallery'" key="gallery" class="tab-section">
          <sph-section-title :icon="activeTab.icon" :sub="sectionSub">Us, in pictures</sph-section-title>
          <div v-if="state.gallery.length" class="masonry">
            <sph-gallery-card
              v-for="(g, i) in state.gallery"
              :key="g.id"
              :item="g"
              :style="{ '--i': i }"
              @view="openLightbox(g)"
              @edit="openEdit(g)"
              @remove="store.removeItem('gallery', g.id)"
            />
          </div>
          <sph-empty-state v-else emoji="🖼️" message="No photos yet." hint="Tap + to add your first one." />
        </section>

        <section v-else-if="active === 'wishlist'" key="wishlist" class="tab-section">
          <sph-section-title :icon="activeTab.icon" :sub="sectionSub">Someday, together</sph-section-title>
          <div v-if="state.wishlist.length" class="grid gap-3 sm:grid-cols-2">
            <sph-place-card
              v-for="(p, i) in state.wishlist"
              :key="p.id"
              :item="p"
              mode="wishlist"
              :style="{ '--i': i }"
              @visited="store.markVisited(p.id)"
              @edit="openEdit(p)"
              @remove="store.removeItem('wishlist', p.id)"
            />
          </div>
          <sph-empty-state v-else emoji="🧭" message="The list is empty — where to first?" />
        </section>

        <section v-else-if="active === 'visited'" key="visited" class="tab-section">
          <sph-section-title :icon="activeTab.icon" :sub="sectionSub">Where we’ve been</sph-section-title>
          <div v-if="state.visited.length" class="grid gap-3 sm:grid-cols-2">
            <sph-place-card
              v-for="(p, i) in state.visited"
              :key="p.id"
              :item="p"
              mode="visited"
              :style="{ '--i': i }"
              @edit="openEdit(p)"
              @remove="store.removeItem('visited', p.id)"
            />
          </div>
          <sph-empty-state v-else emoji="✈️" message="No trips logged yet." />
        </section>

        <section v-else-if="active === 'places'" key="places" class="tab-section">
          <sph-section-title :icon="activeTab.icon" :sub="sectionSub">Our shared map</sph-section-title>
          <sph-places-panel :user-id="user.name" />
        </section>

        <section v-else-if="active === 'plans'" key="plans" class="tab-section">
          <sph-section-title :icon="activeTab.icon" :sub="sectionSub">What's next for us</sph-section-title>
          <sph-plans-panel :user-id="user.name" />
        </section>

        <section v-else-if="active === 'goals'" key="goals" class="tab-section">
          <sph-section-title :icon="activeTab.icon" :sub="sectionSub">Things we’re building</sph-section-title>
          <div v-if="state.goals.length" class="grid gap-3">
            <sph-goal-card
              v-for="(g, i) in state.goals"
              :key="g.id"
              :item="g"
              :style="{ '--i': i }"
              @bump="(d) => store.bumpGoal(g.id, d)"
              @edit="openEdit(g)"
              @remove="store.removeItem('goals', g.id)"
            />
          </div>
          <sph-empty-state v-else emoji="🎯" message="No shared goals yet." />
        </section>

        <section v-else-if="active === 'tasks'" key="tasks" class="tab-section">
          <div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <sph-section-title :icon="activeTab.icon" :sub="sectionSub" flush>Our little to-dos</sph-section-title>
            <sph-segmented-filter v-model="taskFilter" :options="taskFilterOptions" />
          </div>
          <div v-if="filteredTasks.length" class="grid gap-2">
            <sph-task-item
              v-for="(t, i) in filteredTasks"
              :key="t.id"
              :item="t"
              :me="user.name"
              :style="{ '--i': i }"
              @toggle="store.toggleTask(t.id)"
              @edit="openEdit(t)"
              @remove="store.removeItem('tasks', t.id)"
            />
          </div>
          <sph-empty-state v-else emoji="✅" message="Nothing here — try a different filter." />
        </section>

        <section v-else-if="active === 'reminders'" key="reminders" class="tab-section">
          <sph-section-title :icon="activeTab.icon" :sub="sectionSub">So we never forget</sph-section-title>
          <sph-reminder-list :user-id="user.name" />
        </section>

        <section v-else-if="active === 'wishes'" key="wishes" class="tab-section">
          <sph-section-title :icon="activeTab.icon" :sub="sectionSub">Little scheduled surprises</sph-section-title>
          <sph-wishes-panel :user-id="user.name" />
        </section>

        <section v-else-if="active === 'notes'" key="notes" class="tab-section">
          <sph-section-title :icon="activeTab.icon" :sub="sectionSub">Things worth keeping</sph-section-title>
          <div v-if="state.notes.length" class="masonry">
            <sph-note-card
              v-for="(n, i) in state.notes"
              :key="n.id"
              :item="n"
              :style="{ '--i': i }"
              @edit="openEdit(n)"
              @remove="store.removeItem('notes', n.id)"
            />
          </div>
          <sph-empty-state v-else emoji="📝" message="No notes yet." hint="Recipes, passwords, lists — anything for us both." />
        </section>

        <section v-else-if="active === 'gratitudeForMe'" key="gfm" class="tab-section">
          <sph-section-title :icon="activeTab.icon" :sub="sectionSub">{{
            gratLabels.gratitudeForMe.toLowerCase()
          }}</sph-section-title>
          <sph-gratitude-list
            :items="state.gratitudeForMe"
            intro="Logged with love, so it is never forgotten."
            empty-message="No notes yet — but the sweetness is real."
            @edit="openEdit"
            @remove="(id) => store.removeItem('gratitudeForMe', id)"
          />
        </section>

        <section v-else-if="active === 'gratitudeForYou'" key="gfy" class="tab-section">
          <sph-section-title :icon="activeTab.icon" :sub="sectionSub">{{
            gratLabels.gratitudeForYou.toLowerCase()
          }}</sph-section-title>
          <sph-gratitude-list
            :items="state.gratitudeForYou"
            intro="Keeping score of kindness only — the good kind."
            empty-message="Time to do something sweet."
            @edit="openEdit"
            @remove="(id) => store.removeItem('gratitudeForYou', id)"
          />
        </section>

        <section v-else-if="active === 'games'" key="games" class="tab-section">
          <sph-section-title :icon="activeTab.icon" :sub="sectionSub">Play a little</sph-section-title>
          <sph-games-panel :me="user.name" :partner="partnerName" />
        </section>

        <section v-else key="chat" class="tab-section">
          <sph-section-title :icon="activeTab.icon" :sub="sectionSub">Just us, talking</sph-section-title>
          <sph-chat-box
            :items="state.messages"
            :me="user.name"
            @send="(text) => store.addMessage(user.name, text)"
            @edit="(id, text) => store.editMessage(id, user.name, text)"
            @remove="(id) => store.removeMessage(id, user.name)"
          />
        </section>
      </main>

      <!-- welcome splash -->
      <div v-if="welcome && user" class="welcome-veil">
        <div class="glass glass-strong welcome-card">
          <p class="m-0 text-xs font-bold uppercase tracking-widest" style="color: var(--ink-3)">welcome back</p>
          <h2 class="font-display m-0 mt-1 text-5xl font-semibold italic">{{ user.name }}</h2>
          <p class="font-display m-0 mt-2 text-xl italic" style="color: var(--accent)">{{ user.pet }} ❤</p>
        </div>
      </div>

      <!-- a scheduled wish has arrived -->
      <sph-glass-modal
        :model-value="!!popupWish"
        title="A wish arrived 💌"
        :speak="popupWish ? 'A wish from ' + popupWish.from + '. ' + popupWish.message : ''"
        @update:model-value="dismissWishPopup()"
      >
        <div v-if="popupWish">
          <p class="m-0 text-xs font-bold uppercase tracking-widest" style="color: var(--ink-3)">from {{ popupWish.from }}</p>
          <p class="note-body mt-2">{{ popupWish.message }}</p>
          <div class="flex justify-end mt-3">
            <button type="button" class="gbtn gbtn-primary" @click="dismissWishPopup()">Close ♥</button>
          </div>
        </div>
      </sph-glass-modal>

      <!-- birthday wish / partner-birthday reminder (waits for any wish popup to close) -->
      <sph-glass-modal
        :model-value="!!bdayPopup && !popupWish"
        :title="bdayTitle"
        :speak="bdaySpeak"
        @update:model-value="dismissBirthday()"
      >
        <div v-if="bdayPopup" class="bday-dialog">
          <div class="bday-dialog-cake">{{ bdayPopup.kind === "soon" ? "🎁" : "🎂" }}</div>
          <template v-if="bdayPopup.kind === 'soon'">
            <h2 class="font-display m-0 mt-3 text-4xl font-semibold italic">
              {{ bdayPopup.name.toLowerCase() }}'s birthday is
              {{ bdayPopup.days === 1 ? "tomorrow" : "in " + bdayPopup.days + " days" }}
              <span style="color: var(--accent)">❤</span>
            </h2>
            <p class="m-0 mt-2 text-sm" style="color: var(--ink-2)">
              {{ bdayDateStr(bdayPopup.date) }} · turning {{ bdayPopup.turning }} — time to plan something special.
            </p>
          </template>
          <template v-else-if="bdayPopup.mine">
            <h2 class="font-display m-0 mt-3 text-4xl font-semibold italic">
              happy birthday, {{ bdayPopup.name.toLowerCase() }} <span style="color: var(--accent)">❤</span>
            </h2>
            <p class="m-0 mt-2 text-sm" style="color: var(--ink-2)">
              {{ bdayPopup.turning }} today, {{ user.pet }} — {{ partnerName.toLowerCase() }} loves you more than ever.
            </p>
            <p v-if="partnerBday" class="m-0 mt-3 text-xs" style="color: var(--ink-3)">
              psst — {{ partnerName.toLowerCase() }}'s birthday is in {{ partnerBday.days }}
              {{ partnerBday.days === 1 ? "day" : "days" }} ({{ bdayDateStr(partnerBday.date) }}) 🎁
            </p>
          </template>
          <template v-else>
            <h2 class="font-display m-0 mt-3 text-4xl font-semibold italic">
              it's {{ bdayPopup.name.toLowerCase() }}'s birthday <span style="color: var(--accent)">❤</span>
            </h2>
            <p class="m-0 mt-2 text-sm" style="color: var(--ink-2)">
              turning {{ bdayPopup.turning }} today — go make it the best one yet.
            </p>
          </template>
          <div class="flex justify-center flex-wrap gap-2 mt-5">
            <button v-if="bdayPopup.kind === 'today'" type="button" class="gbtn" @click="openBook(bdayPopup.name)">
              <sph-icon name="BookHeart" :size="16" /> {{ bdayPopup.mine ? "Open your birthday book" : "Peek at the book" }}
            </button>
            <button type="button" class="gbtn gbtn-primary" @click="dismissBirthday()">
              {{ bdayPopup.kind === "today" && bdayPopup.mine ? "Thank you ♥" : "On it ♥" }}
            </button>
          </div>
        </div>
      </sph-glass-modal>

      <!-- birthday love book: 100 pages of "I love you" -->
      <sph-love-book v-model="book.open" :name="book.name" :pet="book.pet" :from="book.from" />

      <!-- floating add (hidden on chat — it has its own composer) -->
      <sph-tooltip v-if="formCfg" text="Add something new" placement="left">
        <button class="fab" :aria-label="formCfg.title" @click="openAdd()">
          <sph-icon name="Plus" :size="24" />
        </button>
      </sph-tooltip>

      <!-- gallery lightbox carousel -->
      <div
        v-if="lbPhoto"
        class="lightbox"
        @click.self="lbIndex = -1"
        @touchstart="lbTouchStart($event)"
        @touchend="lbTouchEnd($event)"
      >
        <img :key="lbPhoto.id" :src="lbPhoto.src" :alt="lbPhoto.caption" />
        <button v-if="photos.length > 1" class="lb-arrow lb-prev" aria-label="Previous photo" @click.stop="lbStep(-1)">
          <sph-icon name="ChevronLeft" :size="26" />
        </button>
        <button v-if="photos.length > 1" class="lb-arrow lb-next" aria-label="Next photo" @click.stop="lbStep(1)">
          <sph-icon name="ChevronRight" :size="26" />
        </button>
        <button class="lb-close" aria-label="Close" @click.stop="lbIndex = -1"><sph-icon name="X" :size="19" /></button>
        <div class="lb-bar" @click.stop>
          <p>{{ lbPhoto.caption }}</p>
          <span v-if="photos.length > 1">{{ lbIndex + 1 }} / {{ photos.length }}</span>
        </div>
      </div>

      <!-- add modal -->
      <sph-glass-modal v-if="formCfg" v-model="showAdd" :title="formTitle">
        <form class="grid gap-3.5" @submit.prevent="saveAdd()">
          <template v-for="f in formCfg.fields" :key="f.k">
            <sph-glass-select v-if="f.type === 'select'" v-model="form[f.k]" :label="f.label" :options="f.options" />
            <sph-glass-photo-input v-else-if="f.type === 'photo'" v-model="form[f.k]" :label="f.label" :folder="formCfg.list" />
            <sph-trip-stops-editor
              v-else-if="f.type === 'stops'"
              :ref="(el) => (stopsEditor = el)"
              v-model="form[f.k]"
              :label="f.label"
            />
            <div v-else-if="f.type === 'hearts'">
              <span class="glabel">{{ f.label }}</span>
              <sph-heart-rating v-model="form[f.k]" :size="22" />
            </div>
            <sph-glass-input
              v-else
              v-model="form[f.k]"
              :label="f.label"
              :type="f.type"
              :placeholder="f.placeholder || ''"
              :min="f.minFrom ? form[f.minFrom] : ''"
            />
          </template>
          <div class="flex justify-end gap-2 mt-1">
            <button type="button" class="gbtn gbtn-ghost" @click="showAdd = false">Cancel</button>
            <button
              type="submit"
              class="gbtn gbtn-primary"
              :disabled="!formCfg.valid(form)"
              :style="!formCfg.valid(form) ? 'opacity: 0.5; cursor: not-allowed;' : ''"
            >
              Save ♥
            </button>
          </div>
        </form>
      </sph-glass-modal>

      <!-- card detail dialog (full content, scrollable, browsable) -->
      <sph-detail-modal />
    </div>
  </div>
</template>
