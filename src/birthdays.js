/* birthday countdown helpers — all in local time, so "today" flips at the
   user's own midnight rather than UTC's */

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/* next occurrence of the birthday on or after `now`, with the days until it
   (0 = today) and the age being turned on that day */
export function nextBirthday(user, now = new Date()) {
  const { month, day, year } = user.birthday;
  const today = startOfDay(now);
  let next = new Date(today.getFullYear(), month - 1, day);
  if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day);
  const days = Math.round((next - today) / 86400000);
  return { date: next, days, turning: next.getFullYear() - year };
}

export const isBirthdayToday = (user, now = new Date()) => nextBirthday(user, now).days === 0;
