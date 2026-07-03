/* Web Notification permission handling — feature-detected, gracefully
   no-ops on unsupported browsers/contexts (many iOS browsers outside an
   installed PWA have no Notification API at all). Permission must be
   requested from a user gesture, so this only ever exposes a function to
   call from a button click, never an auto-prompt on load. */
import { computed, ref } from "vue";

export const notificationsSupported = typeof window !== "undefined" && "Notification" in window;

const permission = ref(notificationsSupported ? Notification.permission : "unsupported");

export function useNotifications() {
  const requestPermission = async () => {
    if (!notificationsSupported) return "unsupported";
    try {
      permission.value = await Notification.requestPermission();
    } catch (e) {}
    return permission.value;
  };

  return {
    supported: notificationsSupported,
    permission: computed(() => permission.value),
    granted: computed(() => permission.value === "granted"),
    requestPermission,
  };
}

/* Show a notification via the active service worker if one is registered
   (nicer — supports icon/actions), falling back to the raw Notification
   API. Best-effort: silently no-ops rather than throwing — this is always
   one of several delivery channels, never the only one. */
export async function showWishNotification(title, options) {
  if (!notificationsSupported || Notification.permission !== "granted") return;
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, options);
        return;
      }
    }
    new Notification(title, options);
  } catch (e) {}
}
