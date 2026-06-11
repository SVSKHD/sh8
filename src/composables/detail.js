/* shared detail dialog state — any card can open the browsable detail dialog */
import { reactive } from "vue";

export const detailState = reactive({ open: false, kind: "", item: null });

export function showDetail(kind, item) {
  detailState.kind = kind;
  detailState.item = item;
  detailState.open = true;
}

/* relative time ("2 years ago", "in 9 days") */
export function relDate(dstr) {
  if (!dstr) return "";
  const d = new Date(dstr + "T12:00:00");
  if (isNaN(d)) return "";
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const days = Math.round((d - now) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  const abs = Math.abs(days);
  let label;
  if (abs >= 365) {
    const y = Math.round((abs / 365.25) * 10) / 10;
    label = (y % 1 === 0 ? y.toFixed(0) : y.toFixed(1)) + (y === 1 ? " year" : " years");
  } else if (abs >= 60) {
    label = Math.round(abs / 30.44) + " months";
  } else {
    label = abs + " days";
  }
  return days > 0 ? "in " + label : label + " ago";
}
