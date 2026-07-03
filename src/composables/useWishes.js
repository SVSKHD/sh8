/* Scheduled Wishes — one user schedules a private message for their partner
   at a future date/time. Google Calendar sync is deliberately SENDER-side:
   only the OAuth-connected account this app is running as can create/modify
   events on ITS OWN calendar (no backend, no cross-account access), so the
   sender creates the event and invites the recipient as an attendee by
   email — Google's own infrastructure then delivers the invite, rather
   than this app trying to act on the recipient's calendar directly. */
import { computed, unref } from "vue";
import { buildWishEventPayload, createEvent, deleteEvent, isConnected, updateEvent } from "../googleCalendar";
import { showWishNotification } from "./useNotifications";
import { useUsStore } from "../stores/us";

const resolve = (u) => (typeof u === "function" ? u() : unref(u)) || null;

/* Create/refresh the calendar invite for a wish — a no-op when not
   connected or the recipient's email isn't known yet. Best-effort: any
   failure here never affects the local wish (googleCalendar.js never
   throws). `sendUpdates: 'all'` so the recipient's invite actually reflects
   edits, not just the initial creation. */
function syncUpsert(store, wish) {
  if (!isConnected.value) return;
  const email = store.emails && store.emails[wish.to];
  if (!email) return;
  const payload = buildWishEventPayload(wish, email);
  const p = wish.googleEventId
    ? updateEvent(wish.googleEventId, payload, { sendUpdates: "all" }).then(
        (id) => id || createEvent(payload, { sendUpdates: "all" }),
      )
    : createEvent(payload, { sendUpdates: "all" });
  p.then((eventId) => {
    if (eventId && eventId !== wish.googleEventId) store.updateItem("wishes", wish.id, { googleEventId: eventId });
  }).catch(() => {});
}

export function useWishes(userId) {
  const store = useUsStore();
  const currentUser = () => resolve(userId);

  const all = computed(() => store.wishes);
  const sent = computed(() =>
    all.value.filter((w) => w.from === currentUser()).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
  );
  /* every non-cancelled wish addressed to me, delivered or not — used
     internally to schedule/check deliveries. Not for display: an
     undelivered wish must stay invisible to the recipient, or it
     spoils the surprise. */
  const received = computed(() =>
    all.value
      .filter((w) => w.to === currentUser() && !w.cancelled)
      .sort((a, b) => (a.scheduledDate || "").localeCompare(b.scheduledDate || "")),
  );
  /* what the recipient actually sees listed — delivered only */
  const receivedVisible = computed(() => received.value.filter((w) => w.delivered));
  const deliveredUnseen = computed(() => received.value.filter((w) => w.delivered && !w.seenAt));

  /* the sender may remove their own wish at any point */
  const isMine = (w) => w && w.from === currentUser();
  /* editing/cancelling only makes sense before it's already been delivered */
  const canEdit = (w) => isMine(w) && !w.delivered && !w.cancelled;

  const create = ({ to, message, scheduledDate, flair = "" }) => {
    const from = currentUser();
    if (!from || !to || !message || !message.trim() || !scheduledDate) return;
    const w = store.addItem("wishes", {
      from,
      to,
      message: message.trim(),
      scheduledDate,
      flair,
      delivered: false,
      seenAt: null,
      cancelled: false,
      googleEventId: null,
    });
    syncUpsert(store, w);
  };

  const update = (id, patch) => {
    const w = store.wishes.find((x) => x.id === id);
    if (!canEdit(w)) return;
    const next = { ...patch };
    if ("message" in next) next.message = String(next.message || "").trim();
    const updated = store.updateItem("wishes", id, next);
    if (updated) syncUpsert(store, updated);
  };

  /* soft-cancel (so the sender can still see it) + quietly delete the
     calendar invite (sendUpdates: 'none' — a cancellation email would tip
     the recipient off that a surprise had been planned) */
  const cancel = (id) => {
    const w = store.wishes.find((x) => x.id === id);
    if (!canEdit(w)) return;
    const updated = store.updateItem("wishes", id, { cancelled: true });
    if (updated?.googleEventId && isConnected.value) {
      const eventId = updated.googleEventId;
      store.updateItem("wishes", id, { googleEventId: null });
      deleteEvent(eventId, { sendUpdates: "none" }).catch(() => {});
    }
  };

  const remove = (id) => {
    const w = store.wishes.find((x) => x.id === id);
    if (!isMine(w)) return;
    if (w.googleEventId && isConnected.value) deleteEvent(w.googleEventId, { sendUpdates: "none" }).catch(() => {});
    store.removeItem("wishes", id);
  };

  const markSeen = (id) => store.updateItem("wishes", id, { seenAt: new Date().toISOString() });

  /* due (scheduledDate has passed) + not yet delivered → mark delivered.
     Call on mount as a catch-up pass, and whenever the precisely-timed
     scheduler (useNotifications) fires. */
  const checkDeliveries = () => {
    const now = new Date();
    for (const w of received.value) {
      if (w.delivered || !w.scheduledDate) continue;
      if (new Date(w.scheduledDate) <= now) store.updateItem("wishes", w.id, { delivered: true });
    }
  };

  const nextDelivery = computed(() => {
    const upcoming = received.value.filter((w) => !w.delivered && w.scheduledDate);
    if (!upcoming.length) return null;
    return upcoming.reduce((soonest, w) => (w.scheduledDate < soonest.scheduledDate ? w : soonest));
  });

  return {
    all,
    sent,
    received,
    receivedVisible,
    deliveredUnseen,
    isMine,
    canEdit,
    create,
    update,
    cancel,
    remove,
    markSeen,
    checkDeliveries,
    nextDelivery,
  };
}

/* JS setTimeout can't reliably sleep more than ~24.8 days (32-bit overflow),
   and there's no point precisely timing a wish that's a year out anyway —
   cap the wait and just re-check periodically until we're close. */
const MAX_DELAY_MS = 24 * 60 * 60 * 1000;
let deliveryTimer = null;

/* One setTimeout, always for the single soonest upcoming undelivered wish
   addressed to `userId` — fires a catch-up delivery check, a Web
   Notification for anything newly delivered, and reschedules itself for
   the next one. Call this ONCE per session (e.g. from the root page once
   the user is known) rather than from every useWishes() instance, or
   multiple mount points would stack duplicate timers. Idempotent: always
   clears any previous timer first, so calling it again (e.g. after the
   wishes list changes) just re-plans from scratch. */
export function scheduleWishDelivery(userId) {
  clearTimeout(deliveryTimer);
  if (!userId) return;
  const W = useWishes(userId);
  W.checkDeliveries();
  for (const w of W.deliveredUnseen.value) {
    // `tag` lets the OS de-duplicate/replace rather than stack repeats if
    // this fires more than once for the same wish before it's been seen
    showWishNotification("A wish arrived 💌", { body: "Open the app to see it.", tag: "us-wish-" + w.id, icon: "/icon.svg" });
  }
  const next = W.nextDelivery.value;
  if (!next) return;
  const ms = new Date(next.scheduledDate).getTime() - Date.now();
  const delay = Math.min(Math.max(0, ms), MAX_DELAY_MS);
  deliveryTimer = setTimeout(() => scheduleWishDelivery(userId), delay);
}
