/* Google Maps share links → what we can learn from them without a network
   call. Long links carry the place name and coordinates; short share links
   (maps.app.goo.gl/…) are opaque redirects a browser can't follow (CORS),
   so for those the place name has to be typed in.

   Accepts whatever the share sheet copies — the Maps app shares
   "Place Name\nhttps://maps.app.goo.gl/…", so the URL is pulled out of the
   text and the words before it become the name. A missing "https://" is
   fine too.

   parseMapsLink(text) → { url, name, lat, lng, placeId, short } or null when
   it holds no Google Maps link at all. */

const isGoogleHost = (h) => /(^|\.)google\.[a-z.]+$/.test(h);
/* first thing that looks like a URL, with or without a scheme */
const URL_RE = /(?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>"']*)?/i;

export function parseMapsLink(raw) {
  const text = String(raw || "").trim();
  const found = URL_RE.exec(text);
  if (!found) return null;
  let u;
  try {
    u = new URL(/^https?:\/\//i.test(found[0]) ? found[0] : "https://" + found[0]);
  } catch (e) {
    return null;
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const short =
    host === "maps.app.goo.gl" ||
    (host === "goo.gl" && u.pathname.startsWith("/maps")) ||
    host === "share.google" ||
    (host === "g.co" && u.pathname.startsWith("/kgs"));
  const long = (isGoogleHost(host) && u.pathname.startsWith("/maps")) || /^maps\.google\./.test(host);
  if (!short && !long) return null;

  // shared text: "Baga Beach\nhttps://maps.app.goo.gl/…" → name "Baga Beach"
  const before = text
    .slice(0, found.index)
    .replace(/[\s:–—-]+$/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const sharedName = before.length ? before[0] : "";

  const out = { url: u.href, name: sharedName, lat: null, lng: null, placeId: null, short };
  if (short) return out;

  const setCoords = (lat, lng) => {
    const a = Number(lat);
    const b = Number(lng);
    if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180) {
      out.lat = a;
      out.lng = b;
      return true;
    }
    return false;
  };
  const coordPair = (s) => {
    const m = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(s || "");
    return m ? setCoords(m[1], m[2]) : false;
  };
  const decode = (s) => {
    try {
      return decodeURIComponent(s.replace(/\+/g, " ")).trim();
    } catch (e) {
      return s.trim();
    }
  };

  // …/maps/place/Baga+Beach/@15.55,73.75,15z/data=…!3d15.5553!4d73.7517…
  const place = /\/maps\/place\/([^/@]+)/.exec(u.pathname);
  if (place) out.name = decode(place[1]);
  const pin = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/.exec(u.href);
  if (!(pin && setCoords(pin[1], pin[2]))) {
    const at = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(u.pathname);
    if (at) setCoords(at[1], at[2]);
  }

  // …/maps/search/?api=1&query=…&query_place_id=ChIJ…  or  maps.google.com/?q=…
  const pid = u.searchParams.get("query_place_id");
  if (pid) out.placeId = pid;
  const q = u.searchParams.get("query") || u.searchParams.get("q");
  if (q && !coordPair(q) && !out.name) out.name = q.trim();
  const search = /\/maps\/search\/([^/@]+)/.exec(u.pathname);
  if (search && !out.name) {
    const s = decode(search[1]);
    if (!coordPair(s)) out.name = s;
  }
  return out;
}
