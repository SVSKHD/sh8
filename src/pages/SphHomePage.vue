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
import SphWishesPanel from "../components/cards/SphWishesPanel.vue";
import SphGreetingCard from "../components/SphGreetingCard.vue";
import SphLockScreen from "../components/SphLockScreen.vue";
import SphEmptyState from "../components/ui/SphEmptyState.vue";
import SphGlassInput from "../components/ui/SphGlassInput.vue";
import SphGlassModal from "../components/ui/SphGlassModal.vue";
import SphGlassPhotoInput from "../components/ui/SphGlassPhotoInput.vue";
import SphGlassSelect from "../components/ui/SphGlassSelect.vue";
import SphGlassTabBar from "../components/ui/SphGlassTabBar.vue";
import SphHeartRating from "../components/ui/SphHeartRating.vue";
import SphThemeSwitcher from "../components/ui/SphThemeSwitcher.vue";
import SphIcon from "../components/ui/SphIcon.vue";
import { detailState } from "../composables/detail";
import { scheduleWishDelivery, useWishes } from "../composables/useWishes";
import { useUsStore } from "../stores/us";
import { userByName } from "../users";

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
    ],
    blank: () => ({ title: "", date: today(), note: "", photo: true }),
    valid: (f) => f.title.trim() && f.date,
  },
  memories: {
    title: "Add a memory",
    list: "memories",
    fields: [
      { k: "caption", label: "Caption", type: "text", placeholder: "That time we…" },
      { k: "date", label: "Date", type: "date" },
    ],
    blank: () => ({ caption: "", date: today(), favorite: false, h: 140 + Math.round(Math.random() * 90) }),
    valid: (f) => f.caption.trim(),
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
    ],
    blank: () => ({ name: "", priority: "Soon", note: "" }),
    valid: (f) => f.name.trim(),
  },
  visited: {
    title: "Add a place we visited",
    list: "visited",
    fields: [
      { k: "name", label: "Place", type: "text", placeholder: "Where were we?" },
      { k: "date", label: "When", type: "date" },
      { k: "rating", label: "Rating", type: "hearts" },
      { k: "story", label: "Short story", type: "textarea", placeholder: "The part we'll retell forever…" },
    ],
    blank: () => ({ name: "", date: today(), rating: 5, story: "" }),
    valid: (f) => f.name.trim(),
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
      { k: "assignee", label: "Who's on it", type: "select", options: ["Hithesh", "Spoorthy"] },
      { k: "due", label: "Due", type: "date" },
    ],
    blank: () => ({ title: "", assignee: "Me", due: "", done: false }),
    valid: (f) => f.title.trim(),
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
const active = ref("timeline");
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
});

/* fixed-height panel: start each tab at the top */
watch(active, () => {
  const el = document.querySelector(".content-panel");
  if (el) el.scrollTop = 0;
});

const formCfg = computed(() => FORMS[active.value]);
const sortedMilestones = computed(() => state.milestones.slice().sort((a, b) => (a.date < b.date ? -1 : 1)));
const sortedTasks = computed(() => state.tasks.slice().sort((a, b) => Number(a.done) - Number(b.done)));

const openAdd = () => {
  const blank = formCfg.value.blank();
  Object.keys(form).forEach((k) => delete form[k]);
  Object.assign(form, blank);
  if ("assignee" in form && user.value) form.assignee = user.value.name;
  showAdd.value = true;
};
const saveAdd = () => {
  if (!formCfg.value.valid(form)) return;
  if (formCfg.value.normalize) formCfg.value.normalize(form);
  store.addItem(formCfg.value.list, JSON.parse(JSON.stringify(form)));
  showAdd.value = false;
};
const lock = () => {
  try {
    sessionStorage.removeItem("us-user");
  } catch (e) {}
  unlocked.value = false;
  user.value = null;
  welcome.value = false;
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
          <sph-theme-switcher v-model="themeModel" />
          <button class="gbtn gbtn-icon" aria-label="Lock the app" title="Lock" @click="lock()">
            <sph-icon name="Lock" :size="16" />
          </button>
        </div>
      </header>

      <!-- tab bar (docks to bottom on mobile) -->
      <div class="tabbar-wrap flex justify-center mb-5">
        <sph-glass-tab-bar v-model="active" :tabs="tabsView" />
      </div>

      <!-- greeting card: time, weather, location -->
      <sph-greeting-card :key="user.name" :user="user" />

      <!-- content panel -->
      <main class="glass content-panel">
        <section v-if="active === 'timeline'" key="timeline" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Our story so far</h2>
          <ul v-if="sortedMilestones.length" class="tl">
            <sph-timeline-item
              v-for="(m, i) in sortedMilestones"
              :key="m.id"
              :item="m"
              :style="{ '--i': i }"
              @remove="store.removeItem('milestones', m.id)"
            />
          </ul>
          <sph-empty-state v-else emoji="💞" message="No milestones yet." />
        </section>

        <section v-else-if="active === 'memories'" key="memories" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Little moments, kept</h2>
          <div v-if="state.memories.length" class="masonry">
            <sph-memory-card
              v-for="(m, i) in state.memories"
              :key="m.id"
              :item="m"
              :style="{ '--i': i }"
              @fav="store.toggleFavorite(m.id)"
              @remove="store.removeItem('memories', m.id)"
            />
          </div>
          <sph-empty-state v-else emoji="📸" message="No memories saved yet." />
        </section>

        <section v-else-if="active === 'gallery'" key="gallery" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Us, in pictures</h2>
          <div v-if="state.gallery.length" class="masonry">
            <sph-gallery-card
              v-for="(g, i) in state.gallery"
              :key="g.id"
              :item="g"
              :style="{ '--i': i }"
              @view="openLightbox(g)"
              @remove="store.removeItem('gallery', g.id)"
            />
          </div>
          <sph-empty-state v-else emoji="🖼️" message="No photos yet." hint="Tap + to add your first one." />
        </section>

        <section v-else-if="active === 'wishlist'" key="wishlist" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Someday, together</h2>
          <div v-if="state.wishlist.length" class="grid gap-3 sm:grid-cols-2">
            <sph-place-card
              v-for="(p, i) in state.wishlist"
              :key="p.id"
              :item="p"
              mode="wishlist"
              :style="{ '--i': i }"
              @visited="store.markVisited(p.id)"
              @remove="store.removeItem('wishlist', p.id)"
            />
          </div>
          <sph-empty-state v-else emoji="🧭" message="The list is empty — where to first?" />
        </section>

        <section v-else-if="active === 'visited'" key="visited" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Where we’ve been</h2>
          <div v-if="state.visited.length" class="grid gap-3 sm:grid-cols-2">
            <sph-place-card
              v-for="(p, i) in state.visited"
              :key="p.id"
              :item="p"
              mode="visited"
              :style="{ '--i': i }"
              @remove="store.removeItem('visited', p.id)"
            />
          </div>
          <sph-empty-state v-else emoji="✈️" message="No trips logged yet." />
        </section>

        <section v-else-if="active === 'places'" key="places" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Our shared map</h2>
          <sph-places-panel :user-id="user.name" />
        </section>

        <section v-else-if="active === 'plans'" key="plans" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">What's next for us</h2>
          <sph-plans-panel :user-id="user.name" />
        </section>

        <section v-else-if="active === 'goals'" key="goals" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Things we’re building</h2>
          <div v-if="state.goals.length" class="grid gap-3">
            <sph-goal-card
              v-for="(g, i) in state.goals"
              :key="g.id"
              :item="g"
              :style="{ '--i': i }"
              @bump="(d) => store.bumpGoal(g.id, d)"
              @remove="store.removeItem('goals', g.id)"
            />
          </div>
          <sph-empty-state v-else emoji="🎯" message="No shared goals yet." />
        </section>

        <section v-else-if="active === 'tasks'" key="tasks" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Our little to-dos</h2>
          <div v-if="state.tasks.length" class="grid gap-2">
            <sph-task-item
              v-for="(t, i) in sortedTasks"
              :key="t.id"
              :item="t"
              :me="user.name"
              :style="{ '--i': i }"
              @toggle="store.toggleTask(t.id)"
              @remove="store.removeItem('tasks', t.id)"
            />
          </div>
          <sph-empty-state v-else emoji="✅" message="All clear, lovebirds." />
        </section>

        <section v-else-if="active === 'reminders'" key="reminders" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">So we never forget</h2>
          <sph-reminder-list :user-id="user.name" />
        </section>

        <section v-else-if="active === 'wishes'" key="wishes" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Little scheduled surprises</h2>
          <sph-wishes-panel :user-id="user.name" />
        </section>

        <section v-else-if="active === 'notes'" key="notes" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Things worth keeping</h2>
          <div v-if="state.notes.length" class="masonry">
            <sph-note-card
              v-for="(n, i) in state.notes"
              :key="n.id"
              :item="n"
              :style="{ '--i': i }"
              @remove="store.removeItem('notes', n.id)"
            />
          </div>
          <sph-empty-state v-else emoji="📝" message="No notes yet." hint="Recipes, passwords, lists — anything for us both." />
        </section>

        <section v-else-if="active === 'gratitudeForMe'" key="gfm" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">{{ gratLabels.gratitudeForMe.toLowerCase() }}</h2>
          <sph-gratitude-list
            :items="state.gratitudeForMe"
            intro="Logged with love, so it is never forgotten."
            empty-message="No notes yet — but the sweetness is real."
            @remove="(id) => store.removeItem('gratitudeForMe', id)"
          />
        </section>

        <section v-else-if="active === 'gratitudeForYou'" key="gfy" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">{{ gratLabels.gratitudeForYou.toLowerCase() }}</h2>
          <sph-gratitude-list
            :items="state.gratitudeForYou"
            intro="Keeping score of kindness only — the good kind."
            empty-message="Time to do something sweet."
            @remove="(id) => store.removeItem('gratitudeForYou', id)"
          />
        </section>

        <section v-else key="chat" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Just us, talking</h2>
          <sph-chat-box :items="state.messages" :me="user.name" @send="(text) => store.addMessage(user.name, text)" />
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
      <sph-glass-modal :model-value="!!popupWish" title="A wish arrived 💌" @update:model-value="dismissWishPopup()">
        <div v-if="popupWish">
          <p class="m-0 text-xs font-bold uppercase tracking-widest" style="color: var(--ink-3)">from {{ popupWish.from }}</p>
          <p class="note-body mt-2">{{ popupWish.message }}</p>
          <div class="flex justify-end mt-3">
            <button type="button" class="gbtn gbtn-primary" @click="dismissWishPopup()">Close ♥</button>
          </div>
        </div>
      </sph-glass-modal>

      <!-- floating add (hidden on chat — it has its own composer) -->
      <button v-if="formCfg" class="fab" :aria-label="formCfg.title" :title="formCfg.title" @click="openAdd()">
        <sph-icon name="Plus" :size="24" />
      </button>

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
      <sph-glass-modal v-if="formCfg" v-model="showAdd" :title="formCfg.title">
        <form class="grid gap-3.5" @submit.prevent="saveAdd()">
          <template v-for="f in formCfg.fields" :key="f.k">
            <sph-glass-select v-if="f.type === 'select'" v-model="form[f.k]" :label="f.label" :options="f.options" />
            <sph-glass-photo-input v-else-if="f.type === 'photo'" v-model="form[f.k]" :label="f.label" />
            <div v-else-if="f.type === 'hearts'">
              <span class="glabel">{{ f.label }}</span>
              <sph-heart-rating v-model="form[f.k]" :size="22" />
            </div>
            <sph-glass-input v-else v-model="form[f.k]" :label="f.label" :type="f.type" :placeholder="f.placeholder || ''" />
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
