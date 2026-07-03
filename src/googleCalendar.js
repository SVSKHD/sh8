/* Google Calendar sync — client-side only OAuth via Google Identity Services
   (GIS) token flow, no backend, no npm dependency (the GIS script is lazily
   injected). Leave VITE_GOOGLE_CLIENT_ID unset and reminders/wishes stay
   fully local; every call here is optional and never throws into its
   caller — failures just leave the item unsynced.

   Two payload builders sit on top of the same generic create/update/delete
   primitives: `buildEventPayload` (all-day, recurring — reminders) and
   `buildWishEventPayload` (timed, one-off, with the recipient invited as an
   attendee — wishes). Reminder-specific wrappers below keep the exact
   signatures useReminders.js already depends on. */
import { ref } from "vue";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const TOKEN_KEY = "us-google-token";
const GIS_SRC = "https://accounts.google.com/gsi/client";
const EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

export const googleCalendarConfigured = !!CLIENT_ID;

/* shared reactive connection state — a singleton, like detailState */
export const isConnected = ref(false);

let tokenClient = null;
let gisLoadPromise = null;

function loadToken() {
  try {
    const t = JSON.parse(localStorage.getItem(TOKEN_KEY) || "null");
    if (t && t.access_token && t.expiresAt > Date.now()) return t;
  } catch (e) {}
  return null;
}
function saveToken(t) {
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
  } catch (e) {}
}
function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {}
}

isConnected.value = !!loadToken();

function loadGisScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoadPromise) return gisLoadPromise;
  gisLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(s);
  });
  return gisLoadPromise;
}

function requestAccessToken({ prompt } = {}) {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: () => {}, // overridden per-request below
      });
    }
    tokenClient.callback = (resp) => {
      if (resp && resp.access_token) resolve(resp);
      else reject(new Error(resp?.error || "No access token returned"));
    };
    tokenClient.error_callback = (err) => reject(err);
    tokenClient.requestAccessToken({ prompt: prompt ?? "" });
  });
}

/* Interactive connect — call from a user gesture (button click). */
export async function connect() {
  if (!googleCalendarConfigured) return false;
  await loadGisScript();
  const resp = await requestAccessToken({ prompt: "consent" });
  saveToken({ access_token: resp.access_token, expiresAt: Date.now() + (resp.expires_in || 3600) * 1000 });
  isConnected.value = true;
  return true;
}

export async function disconnect() {
  const t = loadToken();
  clearToken();
  isConnected.value = false;
  if (t && window.google?.accounts?.oauth2) {
    try {
      window.google.accounts.oauth2.revoke(t.access_token, () => {});
    } catch (e) {}
  }
}

/* Returns a valid access token, silently refreshing if expired. Returns
   null (and marks disconnected) if no session is available — never throws. */
async function ensureFreshToken() {
  const cached = loadToken();
  if (cached) return cached.access_token;
  if (!googleCalendarConfigured || !isConnected.value) return null;
  try {
    await loadGisScript();
    const resp = await requestAccessToken({ prompt: "" });
    saveToken({ access_token: resp.access_token, expiresAt: Date.now() + (resp.expires_in || 3600) * 1000 });
    return resp.access_token;
  } catch (e) {
    isConnected.value = false;
    clearToken();
    return null;
  }
}

function isoLocalDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return isoLocalDate(d);
}
function addMinutes(dateTimeLocal, n) {
  const d = new Date(dateTimeLocal);
  d.setMinutes(d.getMinutes() + n);
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

/* Pure — builds the Calendar API event body for a reminder. All-day event
   (exclusive end date = anchor + 1 day); a recurring RRULE when the
   reminder repeats, matching the app's own next-due-date math exactly. */
export function buildEventPayload(reminder) {
  const interval = Math.max(0, Math.floor(Number(reminder.intervalDays) || 0));
  const start = reminder.anchorDate;
  const payload = {
    summary: reminder.title,
    description: reminder.note || "",
    start: { date: start },
    end: { date: addDays(start, 1) },
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 60 }] },
  };
  if (interval > 0) payload.recurrence = [`RRULE:FREQ=DAILY;INTERVAL=${interval}`];
  return payload;
}

/* Pure — builds the Calendar API event body for a scheduled wish. A timed,
   one-off event (not all-day, no recurrence) with the recipient invited as
   an attendee — this event is created on the SENDER's own calendar (the
   only account this app can act on), and Google's own invite/notification
   is what actually reaches the recipient. The description is deliberately
   generic — the wish's real message stays in-app, never on a calendar
   entry anyone else could see. */
export function buildWishEventPayload(wish, recipientEmail) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const payload = {
    summary: "Open the app 💌",
    description: "A scheduled wish is waiting for you in Us ❤",
    start: { dateTime: wish.scheduledDate + ":00", timeZone: tz },
    end: { dateTime: addMinutes(wish.scheduledDate, 30), timeZone: tz },
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 60 }] },
  };
  if (recipientEmail) payload.attendees = [{ email: recipientEmail }];
  return payload;
}

function buildQuery(opts) {
  return opts && opts.sendUpdates ? "?sendUpdates=" + encodeURIComponent(opts.sendUpdates) : "";
}

async function apiFetch(path, options) {
  const token = await ensureFreshToken();
  if (!token) return null;
  const res = await fetch(EVENTS_URL + path, {
    ...options,
    headers: { ...(options?.headers || {}), Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    isConnected.value = false;
    clearToken();
    return null;
  }
  return res;
}

/* Generic create/update/delete against the connected user's own calendar.
   `opts.sendUpdates`: 'all' | 'externalOnly' | 'none' — passed through as
   the Calendar API's own query param. All three are best-effort: any
   failure resolves to null/false rather than throwing, so a sync problem
   never blocks the local item from working. */
export async function createEvent(payload, opts) {
  try {
    const res = await apiFetch(buildQuery(opts), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res || !res.ok) return null;
    const data = await res.json();
    return data.id || null;
  } catch (e) {
    return null;
  }
}

export async function updateEvent(eventId, payload, opts) {
  if (!eventId) return null;
  try {
    const res = await apiFetch("/" + encodeURIComponent(eventId) + buildQuery(opts), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res || !res.ok) return null;
    const data = await res.json();
    return data.id || eventId;
  } catch (e) {
    return null;
  }
}

export async function deleteEvent(eventId, opts) {
  if (!eventId) return true;
  try {
    const res = await apiFetch("/" + encodeURIComponent(eventId) + buildQuery(opts), { method: "DELETE" });
    // no token available — nothing was attempted, so this is NOT a confirmed
    // delete; don't let a caller mistake "couldn't try" for "succeeded"
    if (!res) return false;
    // 404/410: already gone — treat as success either way
    return res.ok || res.status === 404 || res.status === 410;
  } catch (e) {
    return false;
  }
}

export function createReminderEvent(reminder) {
  return createEvent(buildEventPayload(reminder));
}
export function updateReminderEvent(eventId, reminder) {
  return updateEvent(eventId, buildEventPayload(reminder));
}
export function deleteReminderEvent(eventId) {
  return deleteEvent(eventId);
}
