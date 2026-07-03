import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("SphNotificationButton", () => {
  let originalNotification;
  beforeEach(() => {
    originalNotification = window.Notification;
    vi.resetModules();
  });
  afterEach(() => {
    window.Notification = originalNotification;
  });

  it("renders nothing when the Notification API is unsupported", async () => {
    delete window.Notification;
    const { default: SphNotificationButton } = await import("../src/components/ui/SphNotificationButton.vue");
    const w = mount(SphNotificationButton);
    expect(w.text()).toBe("");
  });

  it("shows an enable button when permission is not yet granted", async () => {
    window.Notification = { permission: "default", requestPermission: vi.fn().mockResolvedValue("granted") };
    const { default: SphNotificationButton } = await import("../src/components/ui/SphNotificationButton.vue");
    const w = mount(SphNotificationButton);
    expect(w.text()).toContain("Enable notifications");
  });

  it("shows a granted indicator once permission is on", async () => {
    window.Notification = { permission: "granted", requestPermission: vi.fn() };
    const { default: SphNotificationButton } = await import("../src/components/ui/SphNotificationButton.vue");
    const w = mount(SphNotificationButton);
    expect(w.text()).toContain("Notifications on");
  });

  it("requests permission on click", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    window.Notification = { permission: "default", requestPermission };
    const { default: SphNotificationButton } = await import("../src/components/ui/SphNotificationButton.vue");
    const w = mount(SphNotificationButton);
    await w.find("button").trigger("click");
    expect(requestPermission).toHaveBeenCalled();
  });
});
