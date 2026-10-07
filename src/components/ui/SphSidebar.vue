<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import SphIcon from "./SphIcon.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: "" },
  placement: {
    type: String,
    default: "right",
    validator: (value) => ["left", "right", "bottom"].includes(value),
  },
});
const emit = defineEmits(["update:modelValue"]);

const resizing = ref(false);
const drawerWidth = ref(384);
const drawerHeight = ref(480);
const dragStart = { x: 0, y: 0 };
const sizeStart = { width: 384, height: 480 };

const close = () => emit("update:modelValue", false);
const drawerStyle = computed(() => {
  if (props.placement === "bottom") return { height: `${drawerHeight.value}px` };
  return { width: `${drawerWidth.value}px` };
});
const startResize = (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  resizing.value = true;
  dragStart.x = event.clientX;
  dragStart.y = event.clientY;
  sizeStart.width = drawerWidth.value;
  sizeStart.height = drawerHeight.value;
  event.currentTarget.setPointerCapture?.(event.pointerId);
};
const moveResize = (event) => {
  if (!resizing.value) return;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  if (props.placement === "bottom") {
    const delta = dragStart.y - event.clientY;
    drawerHeight.value = Math.max(240, Math.min(Math.min(720, viewportHeight * 0.82), sizeStart.height + delta));
  } else {
    const delta = props.placement === "left" ? event.clientX - dragStart.x : dragStart.x - event.clientX;
    drawerWidth.value = Math.max(280, Math.min(Math.min(640, viewportWidth - 32), sizeStart.width + delta));
  }
  event.preventDefault();
};
const endResize = () => {
  resizing.value = false;
};
const onKey = (event) => {
  if (event.key === "Escape" && props.modelValue) close();
};
watch(
  () => props.modelValue,
  (open) => {
    if (open) resizing.value = false;
  },
);
onMounted(() => window.addEventListener("keydown", onKey));
onMounted(() => {
  window.addEventListener("pointermove", moveResize, { passive: false });
  window.addEventListener("pointerup", endResize);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("pointermove", moveResize);
  window.removeEventListener("pointerup", endResize);
});
</script>

<template>
  <teleport to="body">
    <transition name="sph-sidebar-veil">
      <div v-if="modelValue" class="sph-sidebar-veil" @click.self="close">
        <aside
          class="sph-sidebar"
          :class="[`sph-sidebar-${placement}`, { 'is-resizing': resizing }]"
          :style="drawerStyle"
          role="dialog"
          aria-modal="true"
          :aria-label="title || 'Sidebar'"
        >
          <button
            class="sph-sidebar-grip"
            type="button"
            aria-label="Resize sidebar"
            title="Drag to resize"
            @pointerdown="startResize"
          >
            <span aria-hidden="true"></span>
          </button>
          <header class="sph-sidebar-header">
            <h2 v-if="title" class="font-display m-0 text-2xl font-semibold italic">{{ title }}</h2>
            <button class="gbtn gbtn-ghost gbtn-icon" aria-label="Close sidebar" @click="close">
              <sph-icon name="X" :size="18" />
            </button>
          </header>
          <div class="sph-sidebar-content">
            <slot />
          </div>
        </aside>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.sph-sidebar-veil {
  position: fixed;
  inset: 0;
  z-index: 75;
  display: flex;
  background: color-mix(in srgb, var(--ink) 18%, transparent);
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
}
.sph-sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(24rem, calc(100vw - 2rem));
  max-width: 100%;
  height: calc(100% - 2rem);
  margin: 1rem;
  color: var(--ink);
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--glass-fill-strong) 86%, var(--accent-soft) 14%),
    var(--glass-fill)
  );
  border: 1px solid color-mix(in srgb, var(--glass-border) 72%, var(--accent) 28%);
  box-shadow:
    inset 0 1px 0 var(--glass-highlight),
    0 18px 55px -16px var(--glass-shadow),
    0 0 0 1px color-mix(in srgb, var(--accent-soft) 45%, transparent);
  -webkit-backdrop-filter: blur(24px) saturate(1.45);
  backdrop-filter: blur(24px) saturate(1.45);
}
.sph-sidebar.is-resizing {
  transition: none;
  user-select: none;
}
.sph-sidebar-grip {
  position: absolute;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.4rem;
  height: 3.4rem;
  padding: 0.8rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  cursor: grab;
  touch-action: none;
}
.sph-sidebar-grip:active {
  cursor: grabbing;
}
.sph-sidebar-grip span {
  display: block;
  width: 3.2rem;
  height: 0.34rem;
  border-radius: 999px;
  background: var(--accent);
  box-shadow: 0 2px 8px -3px var(--glass-shadow);
  opacity: 0;
  transform: scaleX(0.72);
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.sph-sidebar-grip:hover span,
.sph-sidebar-grip:focus-visible span {
  opacity: 0.82;
  transform: scaleX(1);
  box-shadow:
    0 0 14px color-mix(in srgb, var(--accent) 78%, transparent),
    0 2px 8px -3px var(--glass-shadow);
}
.sph-sidebar.is-resizing .sph-sidebar-grip span {
  opacity: 0.82;
  box-shadow:
    0 0 14px color-mix(in srgb, var(--accent) 78%, transparent),
    0 2px 8px -3px var(--glass-shadow);
}
.sph-sidebar-left .sph-sidebar-grip,
.sph-sidebar-right .sph-sidebar-grip {
  top: 50%;
  transform: translateY(-50%);
}
.sph-sidebar-left .sph-sidebar-grip {
  right: 0.75rem;
}
.sph-sidebar-right .sph-sidebar-grip {
  left: 0.75rem;
}
.sph-sidebar-left .sph-sidebar-grip span,
.sph-sidebar-right .sph-sidebar-grip span {
  width: 0.24rem;
  height: 5.2rem;
  transform: scaleY(0.72);
}
.sph-sidebar-left .sph-sidebar-grip:hover span,
.sph-sidebar-left .sph-sidebar-grip:focus-visible span,
.sph-sidebar-right .sph-sidebar-grip:hover span,
.sph-sidebar-right .sph-sidebar-grip:focus-visible span {
  transform: scaleY(1);
}
.sph-sidebar-left.is-resizing .sph-sidebar-grip span,
.sph-sidebar-right.is-resizing .sph-sidebar-grip span {
  transform: scaleY(1);
}
.sph-sidebar-bottom .sph-sidebar-grip {
  top: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
}
.sph-sidebar-left {
  margin-right: auto;
  border-radius: 1.5rem;
}
.sph-sidebar-right {
  margin-left: auto;
  border-radius: 1.5rem;
}
.sph-sidebar-bottom {
  align-self: flex-end;
  width: calc(100% - 2rem);
  height: min(30rem, calc(82vh - 1rem));
  margin-top: auto;
  border-radius: 1.5rem;
}
.sph-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.15rem 1.25rem 0.7rem;
  border-bottom: 1px solid color-mix(in srgb, var(--glass-border) 70%, var(--accent) 30%);
}
.sph-sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
}
.sph-sidebar-veil-enter-active,
.sph-sidebar-veil-leave-active {
  transition: opacity 0.22s ease;
}
.sph-sidebar-veil-enter-active .sph-sidebar,
.sph-sidebar-veil-leave-active .sph-sidebar {
  transition: transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.sph-sidebar-veil-enter-from,
.sph-sidebar-veil-leave-to {
  opacity: 0;
}
.sph-sidebar-veil-enter-from .sph-sidebar-left,
.sph-sidebar-veil-leave-to .sph-sidebar-left {
  transform: translateX(-100%);
}
.sph-sidebar-veil-enter-from .sph-sidebar-right,
.sph-sidebar-veil-leave-to .sph-sidebar-right {
  transform: translateX(100%);
}
.sph-sidebar-veil-enter-from .sph-sidebar-bottom,
.sph-sidebar-veil-leave-to .sph-sidebar-bottom {
  transform: translateY(100%);
}
@media (max-width: 640px) {
  .sph-sidebar {
    width: min(21rem, calc(100vw - 1.5rem));
    height: calc(100% - 1.5rem);
    margin: 0.75rem;
  }
  .sph-sidebar-bottom {
    width: calc(100% - 1.5rem);
    height: min(30rem, calc(82vh - 0.75rem));
  }
}
@media (prefers-reduced-motion: reduce) {
  .sph-sidebar-veil-enter-active,
  .sph-sidebar-veil-leave-active,
  .sph-sidebar-veil-enter-active .sph-sidebar,
  .sph-sidebar-veil-leave-active .sph-sidebar {
    transition: none;
  }
  .sph-sidebar-grip span {
    transition: none;
  }
}
</style>
