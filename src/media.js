/* photo pipeline: validate → compress + convert → upload.
   - accepts any image up to 5 MB
   - always re-encodes in the browser: downscaled to MAX_DIM on the long
     edge, converted to WebP (JPEG where the browser can't encode WebP),
     stepping quality/size down until it's under TARGET_BYTES
   - uploads to Firebase Cloud Storage and returns the download URL; without
     Storage configured it returns a data URL instead (localStorage mode) */
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";
import { uid } from "./stores/seed";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_DIM = 1600;
const TARGET_BYTES = 450 * 1024;
const MEDIA_ROOT = "spl_media";

export class MediaError extends Error {}

const decode = async (file) => {
  if (window.createImageBitmap) {
    try {
      // imageOrientation honours EXIF rotation from phone cameras
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch (e) {
      // fall through to <img> decoding (older Safari)
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new MediaError("That file couldn't be read as an image."));
    };
    img.src = url;
  });
};

const encode = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/* returns { blob, type, ext, width, height } */
export async function compressImage(file, { maxDim = MAX_DIM, targetBytes = TARGET_BYTES } = {}) {
  const src = await decode(file);
  const w0 = src.width;
  const h0 = src.height;
  let scale = Math.min(1, maxDim / Math.max(w0, h0));
  let quality = 0.82;
  let type = "image/webp";
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  let blob = null;

  for (let attempt = 0; attempt < 8; attempt++) {
    canvas.width = Math.max(1, Math.round(w0 * scale));
    canvas.height = Math.max(1, Math.round(h0 * scale));
    // white under transparent PNGs, in case we land on JPEG
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
    blob = await encode(canvas, type, quality);
    // browsers that can't encode WebP silently hand back PNG — switch to JPEG
    if (!blob || blob.type !== type) {
      type = "image/jpeg";
      blob = await encode(canvas, type, quality);
    }
    if (!blob) throw new MediaError("Couldn't compress that image.");
    if (blob.size <= targetBytes) break;
    if (quality > 0.6) quality -= 0.1;
    else scale *= 0.8;
  }
  if (src.close) src.close();
  return { blob, type, ext: type === "image/webp" ? "webp" : "jpg", width: canvas.width, height: canvas.height };
}

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

export function validateImage(file) {
  if (!file || !/^image\//.test(file.type)) throw new MediaError("Please choose an image file.");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new MediaError("That photo is " + (file.size / 1048576).toFixed(1) + " MB — the limit is 5 MB.");
  }
}

const isOffline = () => typeof navigator !== "undefined" && navigator.onLine === false;

/* upload an already-compressed blob to Storage, returning its download URL */
export async function uploadBlob(blob, folder = "misc") {
  const type = blob.type || "image/jpeg";
  const ext = type === "image/webp" ? "webp" : "jpg";
  const path = MEDIA_ROOT + "/" + folder + "/" + Date.now() + "-" + uid() + "." + ext;
  const r = storageRef(storage, path);
  await uploadBytes(r, blob, { contentType: type, cacheControl: "public, max-age=31536000, immutable" });
  return getDownloadURL(r);
}

export const dataUrlToBlob = async (dataUrl) => (await fetch(dataUrl)).blob();
export const isDataUrl = (v) => typeof v === "string" && v.startsWith("data:image/");

/* validate + compress + upload; `folder` groups files by tab (e.g. "gallery").
   Offline, the compressed photo comes back as a data URL instead — the store
   queues it and uploads it to Storage (swapping in the real URL) once the
   connection is back. */
export async function uploadImage(file, folder = "misc") {
  validateImage(file);
  if (!storage) {
    // no Cloud Storage: keep it small enough to live inside localStorage
    const { blob } = await compressImage(file, { maxDim: 1000, targetBytes: 200 * 1024 });
    return blobToDataUrl(blob);
  }
  if (isOffline()) {
    // held on-device until we're back online — kept well under Firestore's 1 MB doc limit
    const { blob } = await compressImage(file, { maxDim: 1280, targetBytes: 300 * 1024 });
    return blobToDataUrl(blob);
  }
  const { blob } = await compressImage(file);
  return uploadBlob(blob, folder);
}

export const isStorageUrl = (url) =>
  typeof url === "string" && /^https:\/\/(firebasestorage\.googleapis\.com|[^/]*\.firebasestorage\.app)\//.test(url);

/* best-effort delete of an uploaded photo — ignores data URLs, external
   links, and files that are already gone */
export function deleteImage(url) {
  if (!storage || !isStorageUrl(url)) return Promise.resolve();
  try {
    return deleteObject(storageRef(storage, url)).catch(() => {});
  } catch (e) {
    return Promise.resolve();
  }
}
