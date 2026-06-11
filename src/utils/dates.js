export function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d + "T12:00:00");
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
