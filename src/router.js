import { createRouter, createWebHistory } from "vue-router";

const SphHomePage = () => import("./pages/SphHomePage.vue");
const SphUiGalleryPage = () => import("./pages/SphUiGalleryPage.vue");

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: SphHomePage },
    { path: "/ui", name: "ui", component: SphUiGalleryPage },
  ],
});
