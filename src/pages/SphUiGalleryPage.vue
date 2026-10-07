<script setup>
import { computed, reactive, ref } from "vue";
import SphChatBox from "../components/cards/SphChatBox.vue";
import SphDetailModal from "../components/cards/SphDetailModal.vue";
import SphGalleryCard from "../components/cards/SphGalleryCard.vue";
import SphGoalCard from "../components/cards/SphGoalCard.vue";
import SphGratitudeList from "../components/cards/SphGratitudeList.vue";
import SphMemoryCard from "../components/cards/SphMemoryCard.vue";
import SphNoteCard from "../components/cards/SphNoteCard.vue";
import SphPlaceCard from "../components/cards/SphPlaceCard.vue";
import SphPlaceForm from "../components/cards/SphPlaceForm.vue";
import SphPlaceItem from "../components/cards/SphPlaceItem.vue";
import SphPlanForm from "../components/cards/SphPlanForm.vue";
import SphPlanItem from "../components/cards/SphPlanItem.vue";
import SphReminderCard from "../components/cards/SphReminderCard.vue";
import SphReminderForm from "../components/cards/SphReminderForm.vue";
import SphReminderItem from "../components/cards/SphReminderItem.vue";
import SphTaskItem from "../components/cards/SphTaskItem.vue";
import SphTimelineItem from "../components/cards/SphTimelineItem.vue";
import SphWishForm from "../components/cards/SphWishForm.vue";
import SphWishItem from "../components/cards/SphWishItem.vue";
import SphGreetingCard from "../components/SphGreetingCard.vue";
import SphLockScreen from "../components/SphLockScreen.vue";
import SphLoveBook from "../components/SphLoveBook.vue";
import SphEmptyState from "../components/ui/SphEmptyState.vue";
import SphGlassCard from "../components/ui/SphGlassCard.vue";
import SphGlassInput from "../components/ui/SphGlassInput.vue";
import SphGlassModal from "../components/ui/SphGlassModal.vue";
import SphGlassPhotoInput from "../components/ui/SphGlassPhotoInput.vue";
import SphGlassSelect from "../components/ui/SphGlassSelect.vue";
import SphGlassTabBar from "../components/ui/SphGlassTabBar.vue";
import SphGoogleCalendarButton from "../components/ui/SphGoogleCalendarButton.vue";
import SphHeartRating from "../components/ui/SphHeartRating.vue";
import SphIcon from "../components/ui/SphIcon.vue";
import SphNotificationButton from "../components/ui/SphNotificationButton.vue";
import SphPhotoPlaceholder from "../components/ui/SphPhotoPlaceholder.vue";
import SphSegmentedFilter from "../components/ui/SphSegmentedFilter.vue";
import SphSidebar from "../components/ui/SphSidebar.vue";
import SphThemeSwitcher from "../components/ui/SphThemeSwitcher.vue";
import SphTooltip from "../components/ui/SphTooltip.vue";
import { ICONS } from "../icons";
import { useUsStore } from "../stores/us";

const store = useUsStore();
const themeModel = computed({
  get: () => store.theme,
  set: (v) => store.setTheme(v),
});

const iso = (offsetDays) => {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
};

/* mock data — the gallery never touches the real store lists */
const textValue = ref("");
const areaValue = ref("");
const selectValue = ref("Soon");
const rating = ref(3);
const photoValue = ref(null);
const demoTab = ref("one");
const demoTabs = [
  { id: "one", icon: "Heart", label: "Hearts" },
  { id: "two", icon: "Calendar", label: "Dates" },
  { id: "three", icon: "MessageCircle", label: "Chat" },
];
const demoFilter = ref("all");
const openSidebar = ref(null);
const demoFilters = [
  { value: "all", label: "All" },
  { value: "mine", label: "Mine" },
  { value: "shared", label: "Shared" },
];
const iconNames = Object.keys(ICONS).sort();

const milestone = reactive({
  id: "ui-m1",
  date: "2022-03-14",
  title: "The day we met",
  note: "Rainy afternoon, the little coffee shop on 5th. You ordered my order before I did.",
  photo: true,
});
const memory = reactive({ id: "ui-mem1", caption: "Dancing in the kitchen at midnight", date: "2024-11-23", favorite: true });
const galleryItem = reactive({ id: "ui-g1", src: null, caption: "First picnic in the park", date: "2024-05-04" });
const wishlistPlace = reactive({
  id: "ui-p1",
  name: "Kyoto in cherry blossom season",
  note: "Stay in a ryokan, slow mornings, tea.",
  priority: "Dream",
});
const visitedPlace = reactive({
  id: "ui-p2",
  name: "Paris",
  date: "2023-05-19",
  rating: 5,
  story: "We climbed Montmartre at sunrise and shared one croissant because we were broke.",
});
const goal = reactive({ id: "ui-go1", title: "Save for the Japan trip", targetDate: "2027-03-01", progress: 65 });
const task = reactive({ id: "ui-t1", title: "Book anniversary dinner", assignee: "Hithesh", due: iso(9), done: false });
const taskPartner = reactive({
  id: "ui-t2",
  title: "Print photos for the hallway",
  assignee: "Spoorthy",
  due: iso(3),
  done: true,
});
const reminderEvery = reactive({ id: "ui-r1", title: "Monthsary date night", startDate: iso(-10), intervalDays: 30 });
const reminderOnce = reactive({ id: "ui-r2", title: "Pick up the cake", startDate: iso(2), intervalDays: 0 });
const note = reactive({
  id: "ui-n1",
  title: "Our pizza dough",
  body: "500g flour, 325ml water, 10g salt, 3g yeast.\ncold rise 48h — do NOT rush it again.",
  date: "2026-02-21",
});
const gratitudeItems = reactive([
  { id: "ui-gr1", date: iso(-3), note: "You brought me soup and stayed on the phone while I fell asleep." },
  { id: "ui-gr2", date: iso(-12), note: "Flowers. No reason. Just because it was Tuesday." },
]);
const chatMessages = reactive([
  {
    id: "ui-c1",
    from: "Spoorthy",
    text: "Movie night Friday? I’m picking this time 🍿",
    ts: new Date(Date.now() - 360000).toISOString(),
  },
  { id: "ui-c2", from: "Hithesh", text: "Only if I get veto power", ts: new Date(Date.now() - 240000).toISOString() },
]);
const mockUser = { name: "Hithesh", pet: "cuore mio" };

const showModal = ref(false);
const showBook = ref(false);
const showPlaceForm = ref(false);
const showPlanForm = ref(false);
const showReminderForm = ref(false);
const showWishForm = ref(false);
const demoPlace = reactive({
  id: "ui-place-item",
  name: "A quiet bookstore",
  note: "Find the one with the red door.",
  visited: false,
});
const demoPlan = reactive({
  id: "ui-plan-item",
  title: "Weekend by the sea",
  details: "Slow mornings, seafood, no alarms.",
  date: iso(21),
  status: "planned",
  forWhom: "Both",
});
const demoWish = reactive({
  id: "ui-wish-item",
  to: "Spoorthy",
  from: "Hithesh",
  message: "I hope this makes an ordinary Tuesday feel special.",
  scheduledDate: new Date(Date.now() + 86400000).toISOString(),
  delivered: false,
});
const formNotice = ref("");
const sendChat = (text) =>
  chatMessages.push({ id: "ui-c" + (chatMessages.length + 1), from: "Hithesh", text, ts: new Date().toISOString() });
const acknowledgeForm = (label) => {
  formNotice.value = `${label} saved in the gallery preview`;
};
</script>

<template>
  <div class="mx-auto px-4 pt-6 pb-24" style="max-width: 60rem">
    <header class="flex items-center justify-between gap-3 flex-wrap mb-2 px-1">
      <div class="flex items-baseline gap-2.5">
        <h1 class="font-display m-0 text-4xl font-semibold italic">Sph UI <span style="color: var(--accent)">❤</span></h1>
        <p class="m-0 text-xs" style="color: var(--ink-3)">the Us component gallery — every piece, reusable</p>
      </div>
      <div class="flex items-center gap-2">
        <sph-theme-switcher v-model="themeModel" />
        <router-link to="/" class="gbtn" style="font-size: 0.85rem; text-decoration: none">
          <sph-icon name="Heart" :size="15" /> Open the app
        </router-link>
      </div>
    </header>

    <section class="ui-sec">
      <h2 class="ui-title">Buttons & chips</h2>
      <sph-glass-card radius="1.5rem" pad="1.4rem">
        <div class="flex items-center gap-3 flex-wrap">
          <button class="gbtn">Glass button</button>
          <button class="gbtn gbtn-primary">Primary ♥</button>
          <button class="gbtn gbtn-ghost">Ghost</button>
          <sph-tooltip text="Open the palette">
            <button class="gbtn gbtn-icon" aria-label="Icon button"><sph-icon name="Palette" :size="16" /></button>
          </sph-tooltip>
          <sph-tooltip text="Add something new">
            <button class="fab" style="position: static" aria-label="Floating add"><sph-icon name="Plus" :size="24" /></button>
          </sph-tooltip>
          <span class="chip">chip</span>
          <span class="chip chip-outline">chip-outline</span>
        </div>
      </sph-glass-card>
    </section>

    <section class="ui-sec">
      <h2 class="ui-title">Icon library</h2>
      <sph-glass-card radius="1.5rem" pad="1.4rem">
        <p class="m-0 mb-3 text-xs" style="color: var(--ink-3)">
          Lucide icons registered in <code>src/icons.js</code>. Hover an icon to see its name.
        </p>
        <div class="icon-library-grid">
          <sph-tooltip v-for="name in iconNames" :key="name" :text="name">
            <button class="icon-library-item" :aria-label="name">
              <sph-icon :name="name" :size="20" />
              <span>{{ name }}</span>
            </button>
          </sph-tooltip>
        </div>
      </sph-glass-card>
    </section>

    <section class="ui-sec">
      <h2 class="ui-title">SphTooltip</h2>
      <sph-glass-card radius="1.5rem" pad="1.4rem">
        <div class="tooltip-demo">
          <sph-tooltip text="Appears above" placement="top">
            <button class="gbtn gbtn-icon" aria-label="Tooltip above"><sph-icon name="Plus" :size="16" /></button>
          </sph-tooltip>
          <sph-tooltip text="Appears below" placement="bottom">
            <button class="gbtn gbtn-icon" aria-label="Tooltip below"><sph-icon name="Minus" :size="16" /></button>
          </sph-tooltip>
          <sph-tooltip text="Appears to the left" placement="left">
            <button class="gbtn gbtn-icon" aria-label="Tooltip left"><sph-icon name="ChevronLeft" :size="16" /></button>
          </sph-tooltip>
          <sph-tooltip text="Appears to the right" placement="right">
            <button class="gbtn gbtn-icon" aria-label="Tooltip right"><sph-icon name="ChevronRight" :size="16" /></button>
          </sph-tooltip>
          <sph-tooltip text="Focus me with Tab">
            <button class="gbtn gbtn-primary" aria-label="Keyboard tooltip">Keyboard focus</button>
          </sph-tooltip>
        </div>
        <p class="m-0 mt-3 text-xs" style="color: var(--ink-3)">Hover an icon or focus it with Tab to reveal the glass label.</p>
      </sph-glass-card>
    </section>

    <section class="ui-sec">
      <h2 class="ui-title">SphGlassCard</h2>
      <div class="grid gap-3 sm:grid-cols-3">
        <sph-glass-card><p class="m-0 text-sm">Default surface</p></sph-glass-card>
        <sph-glass-card hover><p class="m-0 text-sm">Hover lift (<code>hover</code>)</p></sph-glass-card>
        <sph-glass-card strong><p class="m-0 text-sm">Strong fill (<code>strong</code>)</p></sph-glass-card>
      </div>
    </section>

    <section class="ui-sec">
      <h2 class="ui-title">SphSidebar · drawers</h2>
      <sph-glass-card radius="1.5rem" pad="1.4rem">
        <div class="flex items-center gap-2 flex-wrap">
          <button class="gbtn" @click="openSidebar = 'left'"><sph-icon name="ChevronLeft" :size="15" /> Left sidebar</button>
          <button class="gbtn" @click="openSidebar = 'right'"><sph-icon name="ChevronRight" :size="15" /> Right sidebar</button>
          <button class="gbtn" @click="openSidebar = 'bottom'"><sph-icon name="Minus" :size="15" /> Bottom drawer</button>
        </div>
        <p class="m-0 mt-3 text-xs" style="color: var(--ink-3)">Each drawer closes with the close button, backdrop, or Escape.</p>
      </sph-glass-card>
      <sph-sidebar
        :model-value="openSidebar === 'left'"
        placement="left"
        title="Left sidebar"
        @update:model-value="openSidebar = $event ? 'left' : null"
      >
        <p class="m-0 text-sm" style="color: var(--ink-2)">
          A floating glass rail for navigation, filters, or a compact collection of controls.
        </p>
      </sph-sidebar>
      <sph-sidebar
        :model-value="openSidebar === 'right'"
        placement="right"
        title="Right sidebar"
        @update:model-value="openSidebar = $event ? 'right' : null"
      >
        <div class="grid gap-3">
          <p class="m-0 text-sm" style="color: var(--ink-2)">The default placement for contextual details and quick actions.</p>
          <button class="gbtn gbtn-primary" @click="openSidebar = null">
            <sph-icon name="Heart" :size="15" /> Keep this moment
          </button>
        </div>
      </sph-sidebar>
      <sph-sidebar
        :model-value="openSidebar === 'bottom'"
        placement="bottom"
        title="Bottom drawer"
        @update:model-value="openSidebar = $event ? 'bottom' : null"
      >
        <p class="m-0 text-sm" style="color: var(--ink-2)">
          A mobile-friendly surface for actions, sheets, and content that needs a little more room.
        </p>
      </sph-sidebar>
    </section>

    <section class="ui-sec">
      <h2 class="ui-title">Inputs</h2>
      <sph-glass-card radius="1.5rem" pad="1.4rem">
        <div class="grid gap-3.5 sm:grid-cols-2">
          <sph-glass-input v-model="textValue" label="Text" placeholder="Type something sweet…" />
          <sph-glass-select v-model="selectValue" label="Select" :options="['Soon', 'Someday', 'Dream']" />
          <sph-glass-input v-model="areaValue" label="Textarea" type="textarea" placeholder="A longer little story…" />
          <div>
            <span class="glabel">Heart rating</span>
            <sph-heart-rating v-model="rating" :size="22" />
            <p class="m-0 mt-2 text-xs" style="color: var(--ink-3)">value: {{ rating }} / 5</p>
          </div>
          <sph-glass-photo-input v-model="photoValue" label="Photo input" />
        </div>
      </sph-glass-card>
    </section>

    <section class="ui-sec">
      <h2 class="ui-title">SphGlassTabBar</h2>
      <div class="flex justify-center">
        <sph-glass-tab-bar v-model="demoTab" :tabs="demoTabs" />
      </div>
      <p class="m-0 mt-2 text-center text-xs" style="color: var(--ink-3)">active: {{ demoTab }}</p>
    </section>

    <section class="ui-sec">
      <h2 class="ui-title">Filters & integrations</h2>
      <sph-glass-card radius="1.5rem" pad="1.4rem">
        <div class="flex items-center gap-3 flex-wrap">
          <sph-segmented-filter v-model="demoFilter" :options="demoFilters" />
          <sph-google-calendar-button />
          <sph-notification-button />
        </div>
        <p class="m-0 mt-3 text-xs" style="color: var(--ink-3)">selected filter: {{ demoFilter }}</p>
      </sph-glass-card>
    </section>

    <section class="ui-sec">
      <h2 class="ui-title">Placeholders & empty states</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <sph-glass-card><sph-photo-placeholder label="product shot goes here" :height="120" /></sph-glass-card>
        <sph-glass-card
          ><sph-empty-state emoji="💌" message="Nothing here yet." hint="Tap the + to add the first one."
        /></sph-glass-card>
      </div>
    </section>

    <section class="ui-sec">
      <h2 class="ui-title">Workflow building blocks</h2>
      <div class="grid gap-3">
        <div>
          <p class="ui-label">SphPlaceItem</p>
          <sph-place-item
            :item="demoPlace"
            @toggle-visited="demoPlace.visited = !demoPlace.visited"
            @edit="showPlaceForm = true"
          />
        </div>
        <div>
          <p class="ui-label">SphPlanItem</p>
          <sph-plan-item :item="demoPlan" @set-status="demoPlan.status = $event" @edit="showPlanForm = true" />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <p class="ui-label">SphReminderItem</p>
            <sph-reminder-item
              :item="reminderEvery"
              can-manage
              @toggle="reminderEvery.enabled = !reminderEvery.enabled"
              @edit="showReminderForm = true"
            />
          </div>
          <div>
            <p class="ui-label">SphWishItem</p>
            <sph-wish-item :item="demoWish" can-edit @edit="showWishForm = true" @cancel="demoWish.cancelled = true" />
          </div>
        </div>
      </div>
    </section>

    <section class="ui-sec">
      <h2 class="ui-title">Create & edit forms</h2>
      <sph-glass-card radius="1.5rem" pad="1.4rem">
        <div class="flex items-center gap-2 flex-wrap">
          <button class="gbtn" @click="showPlaceForm = true"><sph-icon name="MapPin" :size="15" /> Place form</button>
          <button class="gbtn" @click="showPlanForm = true"><sph-icon name="ClipboardList" :size="15" /> Plan form</button>
          <button class="gbtn" @click="showReminderForm = true"><sph-icon name="BellRing" :size="15" /> Reminder form</button>
          <button class="gbtn" @click="showWishForm = true"><sph-icon name="Mail" :size="15" /> Wish form</button>
        </div>
        <p v-if="formNotice" class="m-0 mt-3 text-xs" style="color: var(--accent)">{{ formNotice }}</p>
      </sph-glass-card>
      <sph-place-form v-model="showPlaceForm" :place="demoPlace" @save="acknowledgeForm('Place')" />
      <sph-plan-form v-model="showPlanForm" user-id="ui-gallery" @save="acknowledgeForm('Plan')" />
      <sph-reminder-form v-model="showReminderForm" :reminder="reminderEvery" @save="acknowledgeForm('Reminder')" />
      <sph-wish-form v-model="showWishForm" to-name="Spoorthy" user-id="ui-gallery" @save="acknowledgeForm('Wish')" />
    </section>

    <section class="ui-sec">
      <h2 class="ui-title">Content cards</h2>
      <div class="grid gap-4">
        <div>
          <p class="ui-label">SphTimelineItem</p>
          <ul class="tl">
            <sph-timeline-item :item="milestone" />
          </ul>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <p class="ui-label">SphMemoryCard</p>
            <sph-memory-card :item="memory" @fav="memory.favorite = !memory.favorite" />
          </div>
          <div>
            <p class="ui-label">SphGalleryCard</p>
            <sph-gallery-card :item="galleryItem" />
          </div>
          <div>
            <p class="ui-label">SphPlaceCard · wishlist</p>
            <sph-place-card :item="wishlistPlace" mode="wishlist" />
          </div>
          <div>
            <p class="ui-label">SphPlaceCard · visited</p>
            <sph-place-card :item="visitedPlace" mode="visited" />
          </div>
          <div>
            <p class="ui-label">SphGoalCard</p>
            <sph-goal-card :item="goal" @bump="(d) => (goal.progress = Math.max(0, Math.min(100, goal.progress + d)))" />
          </div>
          <div>
            <p class="ui-label">SphReminderCard</p>
            <div class="grid gap-3">
              <sph-reminder-card :item="reminderEvery" />
              <sph-reminder-card :item="reminderOnce" />
            </div>
          </div>
          <div>
            <p class="ui-label">SphNoteCard</p>
            <sph-note-card :item="note" />
          </div>
          <div>
            <p class="ui-label">SphTaskItem</p>
            <div class="grid gap-2">
              <sph-task-item :item="task" me="Hithesh" @toggle="task.done = !task.done" />
              <sph-task-item :item="taskPartner" me="Hithesh" @toggle="taskPartner.done = !taskPartner.done" />
            </div>
          </div>
        </div>
        <div>
          <p class="ui-label">SphGratitudeList (SphGratitudeCard)</p>
          <sph-gratitude-list :items="gratitudeItems" intro="Logged with love, so it is never forgotten." />
        </div>
      </div>
    </section>

    <section class="ui-sec">
      <h2 class="ui-title">SphGreetingCard</h2>
      <sph-greeting-card :user="mockUser" />
    </section>

    <section class="ui-sec">
      <h2 class="ui-title">SphChatBox</h2>
      <sph-glass-card radius="1.8rem" pad="1.4rem">
        <sph-chat-box :items="chatMessages" me="Hithesh" @send="sendChat" />
      </sph-glass-card>
    </section>

    <section class="ui-sec">
      <h2 class="ui-title">SphGlassModal</h2>
      <button class="gbtn gbtn-primary" @click="showModal = true"><sph-icon name="Plus" :size="15" /> Open modal</button>
      <sph-glass-modal v-model="showModal" title="A glass modal">
        <p class="m-0 text-sm" style="color: var(--ink-2)">Teleported to <code>body</code>, closes on Esc, × or the backdrop.</p>
        <div class="flex justify-end mt-4">
          <button class="gbtn gbtn-primary" @click="showModal = false">Done ♥</button>
        </div>
      </sph-glass-modal>
    </section>

    <section class="ui-sec">
      <h2 class="ui-title">SphLockScreen</h2>
      <p class="m-0 mb-3 text-xs" style="color: var(--ink-3)">live preview — try a wrong code to see the shake</p>
      <div class="ui-screen-demo glass">
        <sph-lock-screen />
      </div>
    </section>

    <section class="ui-sec">
      <h2 class="ui-title">SphLoveBook</h2>
      <p class="m-0 mb-3 text-xs" style="color: var(--ink-3)">
        the birthday book — 100 pages of "I love you", opened from the birthday popup
      </p>
      <button class="gbtn gbtn-primary" @click="showBook = true">
        <sph-icon name="BookHeart" :size="15" /> Preview the book
      </button>
      <sph-love-book v-model="showBook" name="Spoorthy" pet="cuore mia" from="Hithesh" />
    </section>

    <!-- clicking any clamped card above opens the shared detail dialog -->
    <sph-detail-modal />
  </div>
</template>

<style>
.ui-sec {
  margin-top: 2.2rem;
}
.ui-title {
  font-family: "Cormorant Garamond", Georgia, serif;
  font-style: italic;
  font-weight: 600;
  font-size: 1.6rem;
  margin: 0 0 0.8rem;
}
.ui-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin: 0 0 0.5rem;
}
.ui-screen-demo {
  border-radius: 1.8rem;
  overflow: hidden;
  height: 34rem;
}
.ui-screen-demo .lock-wrap {
  min-height: 100%;
  height: 100%;
}
.tooltip-demo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  min-height: 5rem;
  flex-wrap: wrap;
}
.icon-library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.4rem, 1fr));
  gap: 0.45rem;
}
.icon-library-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 3rem;
  padding: 0.45rem;
  border: 1px solid transparent;
  border-radius: 0.8rem;
  color: var(--ink-2);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 0.68rem;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}
.icon-library-item:hover,
.icon-library-item:focus-visible {
  color: var(--accent);
  background: var(--accent-soft);
  border-color: var(--glass-border);
  outline: none;
}
</style>
