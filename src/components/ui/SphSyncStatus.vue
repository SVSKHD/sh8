<script setup>
import { computed } from "vue";
import { useUsStore } from "../../stores/us";
import SphIcon from "./SphIcon.vue";

const store = useUsStore();
/* offline → changes are safe on this device and will sync later;
   online with pending → uploading them now */
const offline = computed(() => store.online === false);
const busy = computed(() => !offline.value && (store.syncing || store.pendingCount > 0));
const label = computed(() => {
  const n = store.pendingCount || 0;
  if (offline.value) return n ? "Offline · " + n + " saved" : "Offline";
  if (n) return "Syncing " + n;
  if (store.syncing) return "Syncing";
  if (store.syncError) return "Sync issue";
  return "Synced";
});
const hint = computed(() => {
  if (offline.value)
    return store.pendingCount
      ? "You're offline — your changes are saved on this device and will sync when you're back online"
      : "You're offline — showing what's saved on this device";
  if (store.pendingCount) return "Uploading changes made while offline";
  if (store.syncError) return "Some changes were rejected by the server";
  return "Everything is saved to the cloud";
});
</script>

<template>
  <span
    class="sync-status"
    :class="{ syncing: busy, error: store.syncError || offline }"
    role="status"
    :aria-label="hint"
    :title="hint"
  >
    <span v-if="busy" class="sync-spinner" aria-hidden="true"></span>
    <sph-icon v-else :name="offline || store.syncError ? 'CloudOff' : 'CloudCheck'" :size="14" />
    <span>{{ label }}</span>
  </span>
</template>

<style scoped>
.sync-status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2rem;
  padding: 0.35rem 0.65rem;
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  color: var(--ink-2);
  background: var(--glass-fill);
  box-shadow:
    inset 0 1px 0 var(--glass-highlight),
    0 4px 14px -6px var(--glass-shadow);
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
}
.sync-status.syncing {
  color: var(--accent);
}
.sync-status.error {
  color: var(--ink-2);
}
.sync-spinner {
  width: 0.78rem;
  height: 0.78rem;
  border: 2px solid var(--accent-soft);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: sync-spin 0.8s linear infinite;
}
@keyframes sync-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .sync-spinner {
    animation: none;
  }
}
</style>
