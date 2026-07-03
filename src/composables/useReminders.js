/* Reminder state + logic on top of the shared Us store.
   - "common" reminders are shared/global (ownerId null) and read-only.
   - "user" reminders are scoped to a single user (ownerId = their name).
   Persistence, Firestore sync and localStorage fallback all come for free
   from the store's reminders list — this layer only adds scope rules and
   next-due-date math. */
import { computed, unref } from "vue";
import { createReminderEvent, deleteReminderEvent, isConnected, updateReminderEvent } from "../googleCalendar";
import { useUsStore } from "../stores/us";
import { daysUntil, getNextDueDate } from "../utils/dates";

/* Create/refresh the Google Calendar event mirroring a reminder — a no-op
   when not connected or the reminder is paused. Best-effort: any failure
   here never affects the local reminder (googleCalendar.js never throws). */
function syncUpsert(store, reminder) {
  if (!isConnected.value || !reminder.enabled) return;
  const p = reminder.googleEventId
    ? updateReminderEvent(reminder.googleEventId, reminder).then((id) => id || createReminderEvent(reminder))
    : createReminderEvent(reminder);
  p.then((eventId) => {
    if (eventId && eventId !== reminder.googleEventId) store.updateItem("reminders", reminder.id, { googleEventId: eventId });
  }).catch(() => {});
}

const resolve = (u) => (typeof u === "function" ? u() : unref(u)) || null;

/* Normalise a stored reminder (new or legacy) and attach its next due date.
   Legacy items used `startDate` and had no scope → treated as shared/common. */
function decorate(r) {
  const anchor = r.anchorDate || r.startDate || "";
  const interval = Math.max(0, Math.floor(Number(r.intervalDays) || 0));
  const scope = r.scope === "user" ? "user" : "common";
  const enabled = r.enabled !== false;
  const nextDue = getNextDueDate(anchor, interval);
  const daysLeft = nextDue ? daysUntil(nextDue) : null;
  return {
    ...r,
    anchorDate: anchor,
    intervalDays: interval,
    scope,
    ownerId: scope === "user" ? (r.ownerId ?? null) : null,
    enabled,
    nextDue,
    daysLeft,
  };
}

/* enabled first, then soonest due */
const byDue = (a, b) => {
  if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
  return (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity);
};

export function useReminders(userId) {
  const store = useUsStore();
  const currentUser = () => resolve(userId);

  const all = computed(() => store.reminders.map(decorate));
  const common = computed(() => all.value.filter((r) => r.scope === "common").sort(byDue));
  const mine = computed(() => all.value.filter((r) => r.scope === "user" && r.ownerId === currentUser()).sort(byDue));
  /* everything this user may see, soonest first */
  const visible = computed(() => [...common.value, ...mine.value].sort(byDue));
  /* upcoming = visible + enabled, for surfacing "what's next" */
  const upcoming = computed(() => visible.value.filter((r) => r.enabled));

  /* common reminders are read-only for normal users; only own user items are managed */
  const canManage = (r) => r && r.scope === "user" && r.ownerId === currentUser();

  const create = ({ title, note = "", intervalDays = 0, anchorDate }) => {
    const owner = currentUser();
    if (!owner || !title || !title.trim()) return;
    const it = store.addItem("reminders", {
      title: title.trim(),
      note: (note || "").trim(),
      intervalDays: Math.max(0, Math.floor(Number(intervalDays) || 0)),
      anchorDate: anchorDate || new Date().toISOString().slice(0, 10),
      scope: "user",
      ownerId: owner,
      enabled: true,
    });
    syncUpsert(store, it);
  };

  const update = (id, patch) => {
    const r = store.reminders.find((x) => x.id === id);
    if (!canManage(decorate(r || {}))) return;
    const next = { ...patch };
    if ("title" in next) next.title = String(next.title || "").trim();
    if ("note" in next) next.note = String(next.note || "").trim();
    if ("intervalDays" in next) next.intervalDays = Math.max(0, Math.floor(Number(next.intervalDays) || 0));
    const updated = store.updateItem("reminders", id, next);
    if (updated) syncUpsert(store, updated);
  };

  /* pausing deletes the calendar event (so the calendar only ever mirrors
     active reminders); resuming recreates it */
  const toggle = (id) => {
    const r = store.reminders.find((x) => x.id === id);
    if (!r || !canManage(decorate(r))) return;
    const enabling = r.enabled === false;
    const updated = store.updateItem("reminders", id, { enabled: enabling });
    if (!updated) return;
    if (enabling) {
      syncUpsert(store, updated);
    } else if (updated.googleEventId) {
      const eventId = updated.googleEventId;
      store.updateItem("reminders", id, { googleEventId: null });
      if (isConnected.value) deleteReminderEvent(eventId).catch(() => {});
    }
  };

  const remove = (id) => {
    const r = store.reminders.find((x) => x.id === id);
    if (!r || !canManage(decorate(r))) return;
    store.removeItem("reminders", id);
    if (r.googleEventId && isConnected.value) deleteReminderEvent(r.googleEventId).catch(() => {});
  };

  return { all, common, mine, visible, upcoming, canManage, create, update, toggle, remove };
}
