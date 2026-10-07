/* Google photos for a place, via the Maps JavaScript API's Places library
   (Place.searchByText / fetchFields → photo.getURI). Needs
   VITE_GOOGLE_MAPS_API_KEY with "Places API (New)" + "Maps JavaScript API"
   enabled; without it `placePhotosEnabled` is false and callers just show
   the trip's own photo and an "Open in Maps" link.

   Photo URLs are short-lived and Google's terms don't allow storing them,
   so nothing is saved — lookups are cached in memory for the session only.
   Each photo carries its author attribution, which must be shown. */

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
export const placePhotosEnabled = !!KEY;

let loading = null;
function loadPlaces() {
  if (!KEY) return Promise.reject(new Error("no-maps-key"));
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      if (window.google && window.google.maps && window.google.maps.importLibrary) return resolve();
      const cb = "__splMapsReady";
      window[cb] = () => resolve();
      const s = document.createElement("script");
      s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(KEY) + "&v=weekly&loading=async&callback=" + cb;
      s.async = true;
      s.onerror = () => reject(new Error("maps-load-failed"));
      document.head.appendChild(s);
    })
      .then(() => window.google.maps.importLibrary("places"))
      .catch((e) => {
        loading = null; // allow a retry (e.g. after coming back online)
        throw e;
      });
  }
  return loading;
}

const FIELDS = ["id", "displayName", "photos", "googleMapsURI"];
const cache = new Map();
const keyOf = (stop) => stop.placeId || [stop.name || "", stop.lat ?? "", stop.lng ?? ""].join("@");

/* → Promise<{ placeId, name, mapsUrl, photos: Photo[] }> (photos may be []) */
function lookup(stop) {
  const key = keyOf(stop);
  if (cache.has(key)) return cache.get(key);
  const p = loadPlaces().then(async ({ Place }) => {
    let place = null;
    if (stop.placeId) {
      place = new Place({ id: stop.placeId });
      await place.fetchFields({ fields: FIELDS });
    } else if (stop.name) {
      const req = { textQuery: stop.name, fields: FIELDS, maxResultCount: 1 };
      if (stop.lat != null && stop.lng != null) req.locationBias = { lat: stop.lat, lng: stop.lng };
      const { places } = await Place.searchByText(req);
      place = (places && places[0]) || null;
    }
    if (!place) return { placeId: null, name: stop.name || "", mapsUrl: null, photos: [] };
    return { placeId: place.id, name: place.displayName, mapsUrl: place.googleMapsURI, photos: place.photos || [] };
  });
  cache.set(key, p);
  p.catch(() => cache.delete(key));
  return p;
}

/* slides for SphPhotoCarousel: [{ src, alt, credit, creditUrl }] */
export async function getPlacePhotos(stop, { max = 8, width = 1200 } = {}) {
  if (!placePhotosEnabled || !stop) return [];
  const { name, photos } = await lookup(stop);
  return photos.slice(0, max).map((ph, i) => {
    const a = (ph.authorAttributions && ph.authorAttributions[0]) || {};
    return {
      src: ph.getURI({ maxWidth: width }),
      alt: (name || stop.name || "place") + " photo " + (i + 1),
      credit: a.displayName || "",
      creditUrl: a.uri || "",
    };
  });
}
