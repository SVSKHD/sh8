import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("useNotifications", () => {
  let originalNotification;
  beforeEach(() => {
    originalNotification = window.Notification;
    vi.resetModules();
  });
  afterEach(() => {
    window.Notification = originalNotification;
  });

  it("reports unsupported when the Notification API doesn't exist", async () => {
    delete window.Notification;
    const { useNotifications, notificationsSupported } = await import("../src/composables/useNotifications");
    expect(notificationsSupported).toBe(false);
    const N = useNotifications();
    expect(N.supported).toBe(false);
    expect(N.granted.value).toBe(false);
    expect(await N.requestPermission()).toBe("unsupported");
  });

  it("exposes the current permission and can request it from a user gesture", async () => {
    window.Notification = { permission: "default", requestPermission: vi.fn().mockResolvedValue("granted") };
    const { useNotifications } = await import("../src/composables/useNotifications");
    const N = useNotifications();
    expect(N.supported).toBe(true);
    expect(N.permission.value).toBe("default");
    expect(N.granted.value).toBe(false);
    const result = await N.requestPermission();
    expect(result).toBe("granted");
    expect(N.granted.value).toBe(true);
  });

  it("does not throw if requestPermission rejects", async () => {
    window.Notification = { permission: "default", requestPermission: vi.fn().mockRejectedValue(new Error("blocked")) };
    const { useNotifications } = await import("../src/composables/useNotifications");
    const N = useNotifications();
    await expect(N.requestPermission()).resolves.not.toThrow();
  });
});

describe("showWishNotification", () => {
  let originalNotification;
  beforeEach(() => {
    originalNotification = window.Notification;
    vi.resetModules();
  });
  afterEach(() => {
    window.Notification = originalNotification;
  });

  it("no-ops silently when permission isn't granted", async () => {
    window.Notification = vi.fn();
    window.Notification.permission = "default";
    const { showWishNotification } = await import("../src/composables/useNotifications");
    await expect(showWishNotification("Title", {})).resolves.toBeUndefined();
    expect(window.Notification).not.toHaveBeenCalled();
  });

  it("falls back to the raw Notification API when there's no service worker registration", async () => {
    window.Notification = vi.fn();
    window.Notification.permission = "granted";
    const { showWishNotification } = await import("../src/composables/useNotifications");
    await showWishNotification("A wish arrived", { body: "Open the app" });
    expect(window.Notification).toHaveBeenCalledWith("A wish arrived", { body: "Open the app" });
  });
});
