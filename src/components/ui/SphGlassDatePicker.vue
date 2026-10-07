<script setup>
/* Glass date (and optional time) picker — replaces the browser's native
   date/datetime-local controls everywhere via SphGlassInput. Opens inline
   under the field (dialogs scroll, so a floating popover would clip), and
   reads/writes the same strings the native inputs did:
     date     → "YYYY-MM-DD"
     datetime → "YYYY-MM-DDTHH:mm"
   Keyboard: arrows move a day/week, PageUp/PageDown a month, Enter picks,
   Escape closes the panel (without closing the dialog). */
import { computed, nextTick, ref } from "vue";
import SphIcon from "./SphIcon.vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
  label: { type: String, default: "" },
  withTime: { type: Boolean, default: false },
  placeholder: { type: String, default: "" },
  /* optional bounds, "YYYY-MM-DD" */
  min: { type: String, default: "" },
  max: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DEFAULT_TIME = { h: 9, m: 0 };

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const sameDay = (a, b) => !!a && !!b && ymd(a) === ymd(b);
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/* "2026-09-30" or "2026-09-30T18:30" → { date: local midnight, h, m } */
function parse(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(v || "");
  if (!m) return null;
  const date = new Date(+m[1], +m[2] - 1, +m[3]);
  if (isNaN(date)) return null;
  return { date, h: m[4] != null ? +m[4] : null, m: m[5] != null ? +m[5] : null };
}

const selected = computed(() => parse(props.modelValue));
const time = computed(() =>
  selected.value && selected.value.h != null ? { h: selected.value.h, m: selected.value.m } : DEFAULT_TIME,
);
const minDate = computed(() => (parse(props.min) || {}).date || null);
const maxDate = computed(() => (parse(props.max) || {}).date || null);
const outOfRange = (d) => (minDate.value && d < minDate.value) || (maxDate.value && d > maxDate.value);

const emitValue = (date, t = time.value) => {
  if (!date) return emit("update:modelValue", "");
  emit("update:modelValue", props.withTime ? ymd(date) + "T" + pad(t.h) + ":" + pad(t.m) : ymd(date));
};

/* ---------- panel state ---------- */
const open = ref(false);
const mode = ref("days"); // "days" | "months"
const view = ref(new Date()); // any day in the month being shown
const focused = ref(null); // keyboard-focused day
const grid = ref(null);
const uid = "dp-" + Math.random().toString(36).slice(2, 8);

const focusDay = async (d) => {
  focused.value = d;
  if (d.getMonth() !== view.value.getMonth() || d.getFullYear() !== view.value.getFullYear()) {
    view.value = new Date(d.getFullYear(), d.getMonth(), 1);
  }
  await nextTick();
  const el = grid.value && grid.value.querySelector('[data-day="' + ymd(d) + '"]');
  if (el) el.focus();
};

const toggle = () => {
  open.value = !open.value;
  if (!open.value) return;
  mode.value = "days";
  const start = selected.value ? selected.value.date : new Date();
  view.value = new Date(start.getFullYear(), start.getMonth(), 1);
  focused.value = start;
};

const today = computed(() => {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
});

/* 6 weeks × 7 days, Sunday first, padded with the neighbouring months */
const cells = computed(() => {
  const first = new Date(view.value.getFullYear(), view.value.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = addDays(start, i);
    return {
      date: d,
      key: ymd(d),
      day: d.getDate(),
      outside: d.getMonth() !== first.getMonth(),
      today: sameDay(d, today.value),
      selected: selected.value && sameDay(d, selected.value.date),
      disabled: outOfRange(d),
      label: d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    };
  });
});

/* the one day reachable by Tab: the focused day if it's on screen, else the 1st */
const tabKey = computed(() => {
  const k = focused.value ? ymd(focused.value) : "";
  return cells.value.some((c) => c.key === k && !c.outside)
    ? k
    : ymd(new Date(view.value.getFullYear(), view.value.getMonth(), 1));
});

const title = computed(() => view.value.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
const shiftMonth = (n) => {
  view.value = new Date(view.value.getFullYear(), view.value.getMonth() + n, 1);
};
const shiftYear = (n) => {
  view.value = new Date(view.value.getFullYear() + n, view.value.getMonth(), 1);
};
const pickMonth = (m) => {
  view.value = new Date(view.value.getFullYear(), m, 1);
  mode.value = "days";
};

const pick = (d) => {
  if (outOfRange(d)) return;
  emitValue(d);
  focused.value = d;
  // date-only closes on pick; with time, stay open to set the time
  if (!props.withTime) open.value = false;
};

/* quick picks */
const QUICK = [
  { id: "today", label: "Today", at: () => today.value },
  { id: "tomorrow", label: "Tomorrow", at: () => addDays(today.value, 1) },
  { id: "week", label: "In a week", at: () => addDays(today.value, 7) },
];
const quickPick = (q) => {
  const d = q.at();
  view.value = new Date(d.getFullYear(), d.getMonth(), 1);
  pick(d);
};
const clear = () => {
  emitValue(null);
  open.value = false;
};

/* ---------- time (withTime) ---------- */
const hour12 = computed(() => time.value.h % 12 || 12);
const pm = computed(() => time.value.h >= 12);
const setTime = (h, m) => {
  const base = selected.value ? selected.value.date : today.value;
  emitValue(base, { h: (h + 24) % 24, m: (m + 60) % 60 });
};
const stepHour = (n) => setTime(time.value.h + n, time.value.m);
const stepMinute = (n) => {
  // snap to the 5-minute grid, carrying into the hour
  const total = time.value.h * 60 + Math.round(time.value.m / 5) * 5 + n;
  const t = (total + 1440) % 1440;
  setTime(Math.floor(t / 60), t % 60);
};
const setPm = (on) => {
  if (on !== pm.value) setTime(time.value.h + (on ? 12 : -12), time.value.m);
};
const TIME_PRESETS = [
  { label: "Morning", h: 9, m: 0 },
  { label: "Noon", h: 12, m: 0 },
  { label: "Evening", h: 19, m: 0 },
  { label: "Night", h: 22, m: 0 },
];
const isPreset = (p) => !!selected.value && time.value.h === p.h && time.value.m === p.m;

/* ---------- field text ---------- */
const display = computed(() => {
  if (!selected.value) return "";
  const d = selected.value.date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (!props.withTime) return d;
  return d + " · " + pad(hour12.value) + ":" + pad(time.value.m) + " " + (pm.value ? "PM" : "AM");
});
const relative = computed(() => {
  if (!selected.value) return "";
  const n = Math.round((selected.value.date - today.value) / 86400000);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  return n > 0 ? "in " + n + " days" : Math.abs(n) + " days ago";
});

/* ---------- keyboard ---------- */
const onGridKey = (e) => {
  const d = focused.value || (selected.value ? selected.value.date : today.value);
  const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  if (e.key in moves) focusDay(addDays(d, moves[e.key]));
  else if (e.key === "PageUp" || e.key === "PageDown") {
    const n = e.key === "PageUp" ? -1 : 1;
    focusDay(new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), 28)));
  } else if (e.key === "Enter" || e.key === " ") pick(d);
  else return;
  e.preventDefault();
};
const onPanelKey = (e) => {
  if (e.key !== "Escape") return;
  // close the panel only — the dialog listens for Escape on window
  e.stopPropagation();
  open.value = false;
};
</script>

<template>
  <div class="block dp">
    <span v-if="label" :id="uid + '-label'" class="glabel">{{ label }}</span>
    <div class="dp-field" :class="{ open }">
      <button
        type="button"
        class="dp-trigger"
        :aria-expanded="open"
        :aria-controls="uid"
        :aria-labelledby="label ? uid + '-label ' + uid + '-value' : undefined"
        @click="toggle()"
      >
        <span class="dp-icon"><sph-icon :name="withTime ? 'Clock' : 'Calendar'" :size="16" /></span>
        <span :id="uid + '-value'" class="dp-value" :class="{ empty: !display }">
          {{ display || placeholder || (withTime ? "Pick a date & time" : "Pick a date") }}
        </span>
        <span v-if="relative" class="dp-rel">{{ relative }}</span>
        <sph-icon name="ChevronDown" :size="16" class="dp-caret" />
      </button>
      <button v-if="display" type="button" class="dp-clear" aria-label="Clear date" @click="clear()">
        <sph-icon name="X" :size="14" />
      </button>
    </div>

    <transition name="dp-pop">
      <div v-if="open" :id="uid" class="dp-panel" role="group" :aria-label="label || 'Date picker'" @keydown="onPanelKey">
        <!-- header: month title (tap for month/year grid) + arrows -->
        <div class="dp-head">
          <button
            type="button"
            class="dp-title"
            :aria-label="mode === 'days' ? 'Choose month and year' : 'Back to days'"
            @click="mode = mode === 'days' ? 'months' : 'days'"
          >
            {{ mode === "days" ? title : view.getFullYear() }}
            <sph-icon :name="mode === 'days' ? 'ChevronDown' : 'ChevronUp'" :size="14" />
          </button>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="gbtn gbtn-ghost gbtn-icon"
              :aria-label="mode === 'days' ? 'Previous month' : 'Previous year'"
              @click="mode === 'days' ? shiftMonth(-1) : shiftYear(-1)"
            >
              <sph-icon name="ChevronLeft" :size="16" />
            </button>
            <button
              type="button"
              class="gbtn gbtn-ghost gbtn-icon"
              :aria-label="mode === 'days' ? 'Next month' : 'Next year'"
              @click="mode === 'days' ? shiftMonth(1) : shiftYear(1)"
            >
              <sph-icon name="ChevronRight" :size="16" />
            </button>
          </div>
        </div>

        <!-- days -->
        <div v-if="mode === 'days'" ref="grid" class="dp-grid" role="grid" @keydown="onGridKey">
          <span v-for="w in WEEKDAYS" :key="w" class="dp-wd" role="columnheader">{{ w }}</span>
          <button
            v-for="c in cells"
            :key="c.key"
            type="button"
            class="dp-day"
            :class="{ outside: c.outside, today: c.today, selected: c.selected }"
            :data-day="c.key"
            :disabled="c.disabled"
            :tabindex="c.key === tabKey ? 0 : -1"
            :aria-label="c.label"
            :aria-pressed="!!c.selected"
            @click="pick(c.date)"
          >
            {{ c.day }}
          </button>
        </div>

        <!-- months -->
        <div v-else class="dp-months">
          <button
            v-for="(m, i) in MONTHS"
            :key="m"
            type="button"
            class="dp-month"
            :class="{
              selected: selected && selected.date.getMonth() === i && selected.date.getFullYear() === view.getFullYear(),
              current: today.getMonth() === i && today.getFullYear() === view.getFullYear(),
            }"
            @click="pickMonth(i)"
          >
            {{ m }}
          </button>
        </div>

        <!-- time -->
        <div v-if="withTime" class="dp-time">
          <div class="dp-clock">
            <div class="dp-spin">
              <button type="button" class="dp-step" aria-label="Hour up" @click="stepHour(1)">
                <sph-icon name="ChevronUp" :size="14" />
              </button>
              <span class="dp-num" aria-live="polite">{{ pad(hour12) }}</span>
              <button type="button" class="dp-step" aria-label="Hour down" @click="stepHour(-1)">
                <sph-icon name="ChevronDown" :size="14" />
              </button>
            </div>
            <span class="dp-colon">:</span>
            <div class="dp-spin">
              <button type="button" class="dp-step" aria-label="Minutes up" @click="stepMinute(5)">
                <sph-icon name="ChevronUp" :size="14" />
              </button>
              <span class="dp-num" aria-live="polite">{{ pad(time.m) }}</span>
              <button type="button" class="dp-step" aria-label="Minutes down" @click="stepMinute(-5)">
                <sph-icon name="ChevronDown" :size="14" />
              </button>
            </div>
            <div class="seg dp-ampm" role="group" aria-label="AM or PM">
              <button type="button" :class="{ on: !pm }" :aria-pressed="!pm" @click="setPm(false)">AM</button>
              <button type="button" :class="{ on: pm }" :aria-pressed="pm" @click="setPm(true)">PM</button>
            </div>
          </div>
          <div class="dp-chips">
            <button
              v-for="p in TIME_PRESETS"
              :key="p.label"
              type="button"
              class="dp-chip"
              :class="{ on: isPreset(p) }"
              @click="setTime(p.h, p.m)"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <!-- footer: quick dates + done -->
        <div class="dp-foot">
          <div class="dp-chips">
            <button
              v-for="q in QUICK"
              :key="q.id"
              type="button"
              class="dp-chip"
              :class="{ on: selected && sameDay(selected.date, q.at()) }"
              :disabled="outOfRange(q.at())"
              @click="quickPick(q)"
            >
              {{ q.label }}
            </button>
          </div>
          <button type="button" class="gbtn gbtn-primary dp-done" @click="open = false">Done</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* ---------- field ---------- */
.dp-field {
  position: relative;
  display: flex;
  align-items: center;
}
.dp-trigger {
  font: inherit;
  color: var(--ink);
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-align: left;
  cursor: pointer;
  background: var(--glass-fill-strong);
  border: 1px solid var(--glass-border);
  border-radius: 0.9rem;
  padding: 0.5rem 0.75rem 0.5rem 0.5rem;
  box-shadow: inset 0 1px 0 var(--glass-highlight);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.dp-field:has(.dp-clear) .dp-trigger {
  padding-right: 2.4rem;
}
.dp-trigger:focus-visible,
.dp-field.open .dp-trigger {
  outline: none;
  border-color: var(--accent);
  box-shadow:
    inset 0 1px 0 var(--glass-highlight),
    0 0 0 3px var(--accent-soft);
}
.dp-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 0.65rem;
  background: var(--accent-soft);
  color: var(--accent);
}
.dp-value {
  flex: 1;
  min-width: 0;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dp-value.empty {
  color: var(--ink-3);
  font-weight: 400;
}
.dp-rel {
  flex-shrink: 0;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
}
.dp-caret {
  flex-shrink: 0;
  color: var(--ink-3);
  transition: transform 0.25s ease;
}
.dp-field.open .dp-caret {
  transform: rotate(180deg);
}
.dp-field:has(.dp-clear) .dp-caret {
  display: none;
}
.dp-clear {
  position: absolute;
  right: 0.45rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.7rem;
  height: 1.7rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--ink-3);
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}
.dp-clear:hover {
  background: var(--accent-soft);
  color: var(--accent);
}

/* ---------- panel ---------- */
.dp-panel {
  margin-top: 0.5rem;
  padding: 0.75rem;
  border-radius: 1.15rem;
  background: var(--glass-fill-strong);
  border: 1px solid var(--glass-border);
  box-shadow:
    inset 0 1px 0 var(--glass-highlight),
    0 14px 30px -18px var(--glass-shadow);
  transform-origin: top center;
}
.dp-pop-enter-active,
.dp-pop-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.25s cubic-bezier(0.3, 1.3, 0.4, 1);
}
.dp-pop-enter-from,
.dp-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
@media (prefers-reduced-motion: reduce) {
  .dp-pop-enter-active,
  .dp-pop-leave-active {
    transition: none;
  }
}

.dp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}
.dp-title {
  font: inherit;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: none;
  background: transparent;
  color: var(--ink);
  font-family: "Cormorant Garamond", Georgia, serif;
  font-size: 1.15rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  margin-left: -0.25rem;
  border-radius: 0.6rem;
  cursor: pointer;
}
.dp-title:hover,
.dp-title:focus-visible {
  outline: none;
  background: var(--accent-soft);
}

/* ---------- days ---------- */
.dp-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.15rem;
}
.dp-wd {
  text-align: center;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
  padding: 0.2rem 0 0.35rem;
}
.dp-day {
  font: inherit;
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  aspect-ratio: 1;
  max-height: 2.5rem;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.75rem;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  position: relative;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;
}
.dp-day:hover:not(:disabled) {
  background: var(--accent-soft);
}
.dp-day:active:not(:disabled) {
  transform: scale(0.92);
}
.dp-day:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}
.dp-day.outside {
  color: var(--ink-3);
  opacity: 0.55;
}
.dp-day.today:not(.selected) {
  color: var(--accent);
  font-weight: 700;
}
.dp-day.today:not(.selected)::after {
  content: "";
  position: absolute;
  bottom: 0.3rem;
  width: 0.25rem;
  height: 0.25rem;
  border-radius: 999px;
  background: var(--accent);
}
.dp-day.selected {
  background: var(--accent);
  color: var(--on-accent, #fff);
  font-weight: 700;
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--glass-highlight) 70%, transparent),
    0 6px 14px -6px var(--accent);
}
.dp-day:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

/* ---------- months ---------- */
.dp-months {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.35rem;
  padding: 0.2rem 0;
}
.dp-month {
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.7rem 0;
  border: none;
  border-radius: 0.8rem;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  transition: background 0.15s ease;
}
.dp-month:hover {
  background: var(--accent-soft);
}
.dp-month.current {
  color: var(--accent);
}
.dp-month.selected {
  background: var(--accent);
  color: var(--on-accent, #fff);
}

/* ---------- time ---------- */
.dp-time {
  margin-top: 0.6rem;
  padding-top: 0.7rem;
  border-top: 1px solid var(--glass-border);
}
.dp-clock {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}
.dp-spin {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.dp-step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 1.5rem;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--ink-3);
  cursor: pointer;
}
.dp-step:hover {
  background: var(--accent-soft);
  color: var(--accent);
}
.dp-num {
  font-family: "Cormorant Garamond", Georgia, serif;
  font-size: 1.7rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  min-width: 2.4rem;
  text-align: center;
  padding: 0.1rem 0;
  border-radius: 0.6rem;
  background: var(--glass-fill);
  border: 1px solid var(--glass-border);
}
.dp-colon {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ink-3);
}
.dp-ampm {
  margin-left: 0.5rem;
}
.dp-ampm button.on {
  background: var(--accent);
  color: var(--on-accent, #fff);
}

/* ---------- chips + footer ---------- */
.dp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.dp-time .dp-chips {
  justify-content: center;
  margin-top: 0.6rem;
}
.dp-chip {
  font: inherit;
  font-size: 0.74rem;
  font-weight: 600;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: var(--glass-fill);
  color: var(--ink-2);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}
.dp-chip:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}
.dp-chip.on {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
}
.dp-chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.dp-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.7rem;
  padding-top: 0.7rem;
  border-top: 1px solid var(--glass-border);
}
.dp-done {
  flex-shrink: 0;
  font-size: 0.8rem;
  padding: 0.4rem 1rem;
}
</style>
