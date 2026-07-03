/* Places state + logic on top of the shared Us store. Unlike reminders,
   places are shared/editable by both users (like tasks/goals/milestones
   already are) — `addedBy` is attribution-only, not a permission gate. */
import { computed, unref } from "vue";
import { useUsStore } from "../stores/us";

const resolve = (u) => (typeof u === "function" ? u() : unref(u)) || null;

export function usePlaces(userId) {
  const store = useUsStore();
  const currentUser = () => resolve(userId);

  const all = computed(() => store.places);
  /* most recently visited first */
  const visited = computed(() =>
    all.value.filter((p) => p.visited).sort((a, b) => (b.visitedDate || "").localeCompare(a.visitedDate || "")),
  );
  /* oldest added first — the order they went on the list */
  const notVisited = computed(() => all.value.filter((p) => !p.visited).sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)));

  const create = ({ name, note = "", image = null }) => {
    if (!name || !name.trim()) return;
    store.addItem("places", {
      name: name.trim(),
      note: (note || "").trim(),
      image: image || null,
      visited: false,
      visitedDate: null,
      addedBy: currentUser(),
    });
  };

  const update = (id, patch) => {
    const next = { ...patch };
    if ("name" in next) next.name = String(next.name || "").trim();
    if ("note" in next) next.note = String(next.note || "").trim();
    store.updateItem("places", id, next);
  };

  const toggleVisited = (id) => {
    const p = store.places.find((x) => x.id === id);
    if (!p) return;
    const willVisit = !p.visited;
    store.updateItem("places", id, {
      visited: willVisit,
      visitedDate: willVisit ? new Date().toISOString().slice(0, 10) : null,
    });
  };

  const remove = (id) => store.removeItem("places", id);

  return { all, visited, notVisited, create, update, toggleVisited, remove };
}
