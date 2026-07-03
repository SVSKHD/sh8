/* Plans state + logic on top of the shared Us store. Shared/editable by
   both users (like tasks/goals/places already are) — `addedBy` is
   attribution-only, not a permission gate. */
import { computed, unref } from "vue";
import { useUsStore } from "../stores/us";

const resolve = (u) => (typeof u === "function" ? u() : unref(u)) || null;

const STATUS_RANK = { planned: 0, idea: 1, done: 2 };

/* upcoming/planned first: planned items sort by soonest date, idea and
   done follow after (each stably ordered by added order) */
function byStatus(a, b) {
  const ra = STATUS_RANK[a.status] ?? 1;
  const rb = STATUS_RANK[b.status] ?? 1;
  if (ra !== rb) return ra - rb;
  if (a.status === "planned") {
    const da = a.date || "9999-99-99";
    const db = b.date || "9999-99-99";
    if (da !== db) return da < db ? -1 : 1;
  }
  return (a.createdAt ?? 0) - (b.createdAt ?? 0);
}

export function usePlans(userId) {
  const store = useUsStore();
  const currentUser = () => resolve(userId);

  const all = computed(() => store.plans);
  const sorted = computed(() => all.value.slice().sort(byStatus));

  const create = ({
    title,
    details = "",
    date = "",
    status = "idea",
    forWhom = "Both",
    image = null,
    linkedPlaceId,
    linkedReminderId,
    linkedWishId,
  }) => {
    if (!title || !title.trim()) return;
    store.addItem("plans", {
      title: title.trim(),
      details: (details || "").trim(),
      date: date || "",
      status: STATUS_RANK[status] != null ? status : "idea",
      forWhom: forWhom || "Both",
      image: image || null,
      addedBy: currentUser(),
      linkedPlaceId: linkedPlaceId || null,
      linkedReminderId: linkedReminderId || null,
      linkedWishId: linkedWishId || null,
    });
  };

  const update = (id, patch) => {
    const next = { ...patch };
    if ("title" in next) next.title = String(next.title || "").trim();
    if ("details" in next) next.details = String(next.details || "").trim();
    store.updateItem("plans", id, next);
  };

  const setStatus = (id, status) => {
    if (STATUS_RANK[status] == null) return;
    store.updateItem("plans", id, { status });
  };

  const remove = (id) => store.removeItem("plans", id);

  return { all, sorted, create, update, setStatus, remove };
}
