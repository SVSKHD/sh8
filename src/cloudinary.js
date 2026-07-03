/* Cloudinary unsigned upload — reads config from Vite env vars.
   Leave them unset and image inputs fall back to local base64 storage instead. */
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryEnabled = !!(CLOUD_NAME && UPLOAD_PRESET);

/* Uploads a File via Cloudinary's unsigned upload endpoint and returns its
   secure_url. Throws on failure — callers should catch and fall back. */
export async function uploadImage(file) {
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body });
  if (!res.ok) throw new Error("Cloudinary upload failed: " + res.status);
  const data = await res.json();
  return data.secure_url;
}
