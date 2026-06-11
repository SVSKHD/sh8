<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import ChatBox from "./components/cards/ChatBox.vue";
import DetailModal from "./components/cards/DetailModal.vue";
import GalleryCard from "./components/cards/GalleryCard.vue";
import GoalCard from "./components/cards/GoalCard.vue";
import GratitudeList from "./components/cards/GratitudeList.vue";
import MemoryCard from "./components/cards/MemoryCard.vue";
import NoteCard from "./components/cards/NoteCard.vue";
import PlaceCard from "./components/cards/PlaceCard.vue";
import ReminderCard from "./components/cards/ReminderCard.vue";
import TaskItem from "./components/cards/TaskItem.vue";
import TimelineItem from "./components/cards/TimelineItem.vue";
import GreetingCard from "./components/GreetingCard.vue";
import LockScreen from "./components/LockScreen.vue";
import EmptyState from "./components/ui/EmptyState.vue";
import GlassInput from "./components/ui/GlassInput.vue";
import GlassModal from "./components/ui/GlassModal.vue";
import GlassPhotoInput from "./components/ui/GlassPhotoInput.vue";
import GlassSelect from "./components/ui/GlassSelect.vue";
import GlassTabBar from "./components/ui/GlassTabBar.vue";
import HeartRating from "./components/ui/HeartRating.vue";
import ThemeSwitcher from "./components/ui/ThemeSwitcher.vue";
import UsIcon from "./components/ui/UsIcon.vue";
import { detailState } from "./composables/detail";
import { useUsStore } from "./stores/us";
import { userByName } from "./users";

const store = useUsStore();
store.init();
const state = store;
const today = () => new Date().toISOString().slice(0, 10);

const TABS = [
  { id: "timeline", icon: "Calendar", label: "Timeline" },
  { id: "memories", icon: "Image", label: "Memories" },
  { id: "gallery", icon: "Images", label: "Gallery" },
  { id: "wishlist", icon: "MapPin", label: "Places to Visit" },
  { id: "visited", icon: "Map", label: "Places We Visited" },
  { id: "goals", icon: "Target", label: "Goals" },
  { id: "tasks", icon: "ListChecks", label: "Tasks" },
  { id: "reminders", icon: "BellRing", label: "Reminders" },
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
  reminders: {
    title: "Add a reminder",
    list: "reminders",
    fields: [
      { k: "title", label: "Reminder", type: "text", placeholder: "Don’t let us forget…" },
      { k: "startDate", label: "First date", type: "date" },
      { k: "intervalDays", label: "Repeat every (days)", type: "number", placeholder: "e.g. 25 — leave 0 for once" },
    ],
    blank: () => ({ title: "", startDate: today(), intervalDays: 30 }),
    valid: (f) => f.title.trim() && f.startDate,
    normalize: (f) => {
      f.intervalDays = Math.max(0, parseInt(f.intervalDays, 10) || 0);
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
  TABS.map((t) => (gratLabels.value[t.id] ? Object.assign({}, t, { label: gratLabels.value[t.id] }) : t))
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
  }
);

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
onMounted(() => {
  window.addEventListener("keydown", onLbKey);
  window.addEventListener("keydown", onTabKey);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onLbKey);
  window.removeEventListener("keydown", onTabKey);
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
    <div class="bg-mesh" aria-hidden="true">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
      <div class="blob blob-4"></div>
    </div>

    <lock-screen v-if="!unlocked" @unlock="onUnlock" />

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
          <theme-switcher v-model="themeModel" />
          <button class="gbtn gbtn-icon" aria-label="Lock the app" title="Lock" @click="lock()"><us-icon name="Lock" :size="16" /></button>
        </div>
      </header>

      <!-- tab bar (docks to bottom on mobile) -->
      <div class="tabbar-wrap flex justify-center mb-5">
        <glass-tab-bar v-model="active" :tabs="tabsView" />
      </div>

      <!-- greeting card: time, weather, location -->
      <greeting-card :key="user.name" :user="user" />

      <!-- content panel -->
      <main class="glass content-panel">
        <section v-if="active === 'timeline'" key="timeline" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Our story so far</h2>
          <ul v-if="sortedMilestones.length" class="tl">
            <timeline-item
              v-for="(m, i) in sortedMilestones"
              :key="m.id"
              :item="m"
              :style="{ '--i': i }"
              @remove="store.removeItem('milestones', m.id)"
            />
          </ul>
          <empty-state v-else emoji="💞" message="No milestones yet." />
        </section>

        <section v-else-if="active === 'memories'" key="memories" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Little moments, kept</h2>
          <div v-if="state.memories.length" class="masonry">
            <memory-card
              v-for="(m, i) in state.memories"
              :key="m.id"
              :item="m"
              :style="{ '--i': i }"
              @fav="store.toggleFavorite(m.id)"
              @remove="store.removeItem('memories', m.id)"
            />
          </div>
          <empty-state v-else emoji="📸" message="No memories saved yet." />
        </section>

        <section v-else-if="active === 'gallery'" key="gallery" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Us, in pictures</h2>
          <div v-if="state.gallery.length" class="masonry">
            <gallery-card
              v-for="(g, i) in state.gallery"
              :key="g.id"
              :item="g"
              :style="{ '--i': i }"
              @view="openLightbox(g)"
              @remove="store.removeItem('gallery', g.id)"
            />
          </div>
          <empty-state v-else emoji="🖼️" message="No photos yet." hint="Tap + to add your first one." />
        </section>

        <section v-else-if="active === 'wishlist'" key="wishlist" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Someday, together</h2>
          <div v-if="state.wishlist.length" class="grid gap-3 sm:grid-cols-2">
            <place-card
              v-for="(p, i) in state.wishlist"
              :key="p.id"
              :item="p"
              mode="wishlist"
              :style="{ '--i': i }"
              @visited="store.markVisited(p.id)"
              @remove="store.removeItem('wishlist', p.id)"
            />
          </div>
          <empty-state v-else emoji="🧭" message="The list is empty — where to first?" />
        </section>

        <section v-else-if="active === 'visited'" key="visited" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Where we’ve been</h2>
          <div v-if="state.visited.length" class="grid gap-3 sm:grid-cols-2">
            <place-card
              v-for="(p, i) in state.visited"
              :key="p.id"
              :item="p"
              mode="visited"
              :style="{ '--i': i }"
              @remove="store.removeItem('visited', p.id)"
            />
          </div>
          <empty-state v-else emoji="✈️" message="No trips logged yet." />
        </section>

        <section v-else-if="active === 'goals'" key="goals" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Things we’re building</h2>
          <div v-if="state.goals.length" class="grid gap-3">
            <goal-card
              v-for="(g, i) in state.goals"
              :key="g.id"
              :item="g"
              :style="{ '--i': i }"
              @bump="(d) => store.bumpGoal(g.id, d)"
              @remove="store.removeItem('goals', g.id)"
            />
          </div>
          <empty-state v-else emoji="🎯" message="No shared goals yet." />
        </section>

        <section v-else-if="active === 'tasks'" key="tasks" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Our little to-dos</h2>
          <div v-if="state.tasks.length" class="grid gap-2">
            <task-item
              v-for="(t, i) in sortedTasks"
              :key="t.id"
              :item="t"
              :me="user.name"
              :style="{ '--i': i }"
              @toggle="store.toggleTask(t.id)"
              @remove="store.removeItem('tasks', t.id)"
            />
          </div>
          <empty-state v-else emoji="✅" message="All clear, lovebirds." />
        </section>

        <section v-else-if="active === 'reminders'" key="reminders" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">So we never forget</h2>
          <div v-if="state.reminders.length" class="grid gap-3">
            <reminder-card
              v-for="(r, i) in state.reminders"
              :key="r.id"
              :item="r"
              :style="{ '--i': i }"
              @remove="store.removeItem('reminders', r.id)"
            />
          </div>
          <empty-state v-else emoji="🔔" message="Nothing to remember yet." hint="Add a date and how often it repeats." />
        </section>

        <section v-else-if="active === 'notes'" key="notes" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Things worth keeping</h2>
          <div v-if="state.notes.length" class="masonry">
            <note-card
              v-for="(n, i) in state.notes"
              :key="n.id"
              :item="n"
              :style="{ '--i': i }"
              @remove="store.removeItem('notes', n.id)"
            />
          </div>
          <empty-state v-else emoji="📝" message="No notes yet." hint="Recipes, passwords, lists — anything for us both." />
        </section>

        <section v-else-if="active === 'gratitudeForMe'" key="gfm" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">{{ gratLabels.gratitudeForMe.toLowerCase() }}</h2>
          <gratitude-list
            :items="state.gratitudeForMe"
            intro="Logged with love, so it is never forgotten."
            empty-message="No notes yet — but the sweetness is real."
            @remove="(id) => store.removeItem('gratitudeForMe', id)"
          />
        </section>

        <section v-else-if="active === 'gratitudeForYou'" key="gfy" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">{{ gratLabels.gratitudeForYou.toLowerCase() }}</h2>
          <gratitude-list
            :items="state.gratitudeForYou"
            intro="Keeping score of kindness only — the good kind."
            empty-message="Time to do something sweet."
            @remove="(id) => store.removeItem('gratitudeForYou', id)"
          />
        </section>

        <section v-else key="chat" class="tab-section">
          <h2 class="font-display mt-0 mb-4 text-3xl font-semibold italic">Just us, talking</h2>
          <chat-box :items="state.messages" :me="user.name" @send="(text) => store.addMessage(user.name, text)" />
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

      <!-- floating add (hidden on chat — it has its own composer) -->
      <button v-if="formCfg" class="fab" :aria-label="formCfg.title" :title="formCfg.title" @click="openAdd()">
        <us-icon name="Plus" :size="24" />
      </button>

      <!-- gallery lightbox carousel -->
      <div v-if="lbPhoto" class="lightbox" @click.self="lbIndex = -1" @touchstart="lbTouchStart($event)" @touchend="lbTouchEnd($event)">
        <img :key="lbPhoto.id" :src="lbPhoto.src" :alt="lbPhoto.caption" />
        <button v-if="photos.length > 1" class="lb-arrow lb-prev" aria-label="Previous photo" @click.stop="lbStep(-1)">
          <us-icon name="ChevronLeft" :size="26" />
        </button>
        <button v-if="photos.length > 1" class="lb-arrow lb-next" aria-label="Next photo" @click.stop="lbStep(1)">
          <us-icon name="ChevronRight" :size="26" />
        </button>
        <button class="lb-close" aria-label="Close" @click.stop="lbIndex = -1"><us-icon name="X" :size="19" /></button>
        <div class="lb-bar" @click.stop>
          <p>{{ lbPhoto.caption }}</p>
          <span v-if="photos.length > 1">{{ lbIndex + 1 }} / {{ photos.length }}</span>
        </div>
      </div>

      <!-- add modal -->
      <glass-modal v-if="formCfg" v-model="showAdd" :title="formCfg.title">
        <form class="grid gap-3.5" @submit.prevent="saveAdd()">
          <template v-for="f in formCfg.fields" :key="f.k">
            <glass-select v-if="f.type === 'select'" v-model="form[f.k]" :label="f.label" :options="f.options" />
            <glass-photo-input v-else-if="f.type === 'photo'" v-model="form[f.k]" :label="f.label" />
            <div v-else-if="f.type === 'hearts'">
              <span class="glabel">{{ f.label }}</span>
              <heart-rating v-model="form[f.k]" :size="22" />
            </div>
            <glass-input v-else v-model="form[f.k]" :label="f.label" :type="f.type" :placeholder="f.placeholder || ''" />
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
      </glass-modal>

      <!-- card detail dialog (full content, scrollable, browsable) -->
      <detail-modal />
    </div>
  </div>
</template>
