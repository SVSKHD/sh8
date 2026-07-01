const DAY = 86400000;

export function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d + "T12:00:00");
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* Coerce a "YYYY-MM-DD" string (or Date) to a local-midnight Date.
   Always local — parsing via UTC can roll the day back in western zones. */
export function toLocalMidnight(d) {
  if (d instanceof Date) {
    const x = new Date(d.getTime());
    x.setHours(0, 0, 0, 0);
    return isNaN(x) ? null : x;
  }
  if (!d) return null;
  const dt = new Date(d + "T00:00:00");
  return isNaN(dt) ? null : dt;
}

/* The next time an interval reminder is due, rolled forward past `from`.
   - intervalDays <= 0 → one-time: the due date is the anchor itself.
   - anchor in the future → the anchor is the next due date.
   - anchor in the past → advance in whole intervals until it reaches/​passes today. */
export function getNextDueDate(anchorDate, intervalDays, from = new Date()) {
  const anchor = toLocalMidnight(anchorDate);
  if (!anchor) return null;
  const today = toLocalMidnight(from);
  const interval = Math.max(0, Math.floor(Number(intervalDays) || 0));
  if (interval <= 0 || anchor >= today) return anchor;
  const elapsed = Math.floor((today - anchor) / DAY);
  const cycles = Math.ceil(elapsed / interval);
  return new Date(anchor.getTime() + cycles * interval * DAY);
}

/* Whole days from `from` (today) until `date`. Negative once it's in the past. */
export function daysUntil(date, from = new Date()) {
  const target = toLocalMidnight(date);
  const today = toLocalMidnight(from);
  if (!target || !today) return null;
  return Math.round((target - today) / DAY);
}
