import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import "./styles/main.css";

createApp(App).use(createPinia()).use(router).mount("#app");

/* register the notification service worker — feature-detected, zero-config,
   no bundler plugin. Safe to skip silently on unsupported browsers. */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
