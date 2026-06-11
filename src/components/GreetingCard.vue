<script setup>
import { computed, onMounted, ref } from "vue";
import GlassCard from "./ui/GlassCard.vue";
import UsIcon from "./ui/UsIcon.vue";

defineProps({ user: { type: Object, required: true } });

const WX_TABLE = [
  { c: [0, 1], icon: "Sun", nightIcon: "MoonStar", label: "clear skies", quote: "not a cloud up there — just us down here" },
  { c: [2], icon: "CloudSun", nightIcon: "CloudMoon", label: "partly cloudy", quote: "a little cloud, a lot of warmth" },
  { c: [3], icon: "Cloud", nightIcon: "Cloud", label: "overcast", quote: "grey outside, golden in here" },
  { c: [45, 48], icon: "CloudFog", nightIcon: "CloudFog", label: "foggy", quote: "foggy out — hold my hand" },
  { c: [51, 53, 55, 56, 57], icon: "CloudDrizzle", nightIcon: "CloudDrizzle", label: "drizzling", quote: "tiny rain, big cuddle energy" },
  { c: [61, 63, 65, 66, 67, 80, 81, 82], icon: "CloudRain", nightIcon: "CloudRain", label: "raining", quote: "perfect weather to stay in together" },
  { c: [71, 73, 75, 77, 85, 86], icon: "CloudSnow", nightIcon: "CloudSnow", label: "snowing", quote: "cold hands, warm hearts" },
  { c: [95, 96, 99], icon: "CloudLightning", nightIcon: "CloudLightning", label: "stormy", quote: "wild out there, safe in here" },
];
const wxMeta = (code, isDay) => {
  const row = WX_TABLE.find((r) => r.c.indexOf(code) > -1) || WX_TABLE[0];
  return { icon: isDay ? row.icon : row.nightIcon, label: row.label, quote: row.quote };
};

const FALLBACK_QUOTES = [
  "another lucky day — it has you in it",
  "wherever we are is my favorite place",
  "same sky, same team, always",
];

async function fetchWeather() {
  try {
    const cached = JSON.parse(localStorage.getItem("us-weather") || "null");
    if (cached && Date.now() - cached.t < 45 * 60 * 1000) return cached;
  } catch (e) {}

  let lat = null,
    lon = null,
    city = "";
  const pos = await new Promise((res) => {
    if (!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition((p) => res(p), () => res(null), { timeout: 6000, maximumAge: 600000 });
  });
  if (pos) {
    lat = pos.coords.latitude;
    lon = pos.coords.longitude;
    try {
      const g = await (
        await fetch(
          "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" + lat + "&longitude=" + lon + "&localityLanguage=en"
        )
      ).json();
      city = g.city || g.locality || "";
    } catch (e) {}
  } else {
    try {
      const ip = await (await fetch("https://ipapi.co/json/")).json();
      lat = ip.latitude;
      lon = ip.longitude;
      city = ip.city || "";
    } catch (e) {
      return null;
    }
  }
  if (lat == null || lon == null) return null;

  const w = await (
    await fetch("https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&current_weather=true")
  ).json();
  const cw = w.current_weather;
  if (!cw) return null;
  const data = { t: Date.now(), temp: Math.round(cw.temperature), code: cw.weathercode, day: cw.is_day === 1, city };
  try {
    localStorage.setItem("us-weather", JSON.stringify(data));
  } catch (e) {}
  return data;
}

const wx = ref(null);
const h = new Date().getHours();
const greeting = h < 12 ? "good morning" : h < 17 ? "good afternoon" : "good evening";
const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
const meta = computed(() => (wx.value ? wxMeta(wx.value.code, wx.value.day) : null));
const quote = computed(() => (meta.value ? meta.value.quote : FALLBACK_QUOTES[new Date().getDate() % FALLBACK_QUOTES.length]));
onMounted(() => {
  fetchWeather()
    .then((d) => {
      if (d) wx.value = d;
    })
    .catch(() => {});
});
</script>

<template>
  <glass-card radius="1.5rem" pad="1.1rem 1.4rem" class="mb-5">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="min-w-0">
        <h2 class="font-display m-0 text-2xl font-semibold italic leading-tight">
          {{ greeting }}, {{ user.name.toLowerCase() }} <span style="color: var(--accent)">❤</span>
        </h2>
        <p class="m-0 mt-1 text-xs" style="color: var(--ink-3)">
          {{ dateStr }} ·
          <span class="font-display italic" style="font-size: 0.95rem; color: var(--ink-2)">“{{ quote }}”</span>
        </p>
      </div>
      <div v-if="wx" class="flex items-center gap-3" style="flex: 0 0 auto">
        <span style="color: var(--accent)"><us-icon :name="meta.icon" :size="30" :stroke-width="1.7" /></span>
        <div>
          <p class="greet-temp">{{ wx.temp }}°</p>
          <p class="greet-cond">{{ meta.label }}{{ wx.city ? " in " + wx.city : "" }}</p>
        </div>
      </div>
    </div>
  </glass-card>
</template>
