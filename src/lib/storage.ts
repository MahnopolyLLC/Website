import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "property-photos";

// iPhones default to HEIC, which almost no browser can actually display
// in an <img> — an uploaded HEIC photo just renders as a broken image
// on the public site forever (happened for real, 25 Sep 2026). Convert
// to JPEG client-side, before the upload, so this can't ship broken
// again.
//
// Using libheif-js, not the more commonly reached-for heic2any — tested
// both directly against a real listing photo that was failing on the
// live site (a 5712x4284 HDR/"gain map" HEIC, the format newer iPhones
// default to) and heic2any's bundled libheif build couldn't decode it
// at all (ERR_LIBHEIF format not supported). libheif-js's build
// (actively maintained, more recent libheif) decoded it correctly.
// WASM-based and browser-only, so dynamically imported here rather
// than at module scope. No TS types for the ergonomic HeifDecoder
// wrapper ship with the package (its .d.ts only covers the low-level C
// API), hence the `any`.
function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;
  return /\.(heic|heif)$/i.test(file.name);
}

async function convertHeicToJpeg(file: File): Promise<File> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const libheifFactory = (await import("libheif-js/libheif-wasm/libheif-bundle.js")).default as any;
  const Module = await libheifFactory();
  const decoder = new Module.HeifDecoder();

  const buf = await file.arrayBuffer();
  const images = decoder.decode(buf);
  if (!images.length) throw new Error("no image data decoded");
  const image = images[0];
  const width = image.get_width();
  const height = image.get_height();

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  const imageData = ctx.createImageData(width, height);

  await new Promise<void>((resolve, reject) => {
    image.display(imageData, (displayData: unknown) => {
      if (!displayData) return reject(new Error("HEIF processing error"));
      resolve();
    });
  });
  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9)
  );
  if (!blob) throw new Error("canvas produced no blob");

  const name = file.name.replace(/\.(heic|heif)$/i, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}

// Uploads happen client-side (browser Supabase client, carrying the
// logged-in staff member's session cookie) rather than through a Server
// Action, since routing binary file uploads through an action is both
// slower and hits body-size limits sooner. RLS on storage.objects (see
// supabase/storage.sql) is what actually enforces "only staff can write"
// — the client-side call is convenience, not the security boundary.
export async function uploadPhoto(
  supabase: SupabaseClient,
  file: File,
  folder?: string
): Promise<{ url: string } | { error: string }> {
  // Wrapped in try/catch on top of the normal {error} return the SDK
  // gives for an ordinary failure — a dropped connection or anything
  // else that makes the call itself throw needs to become a returned
  // error too, not an uncaught rejection. Uncaught here means the
  // caller's upload loop (PhotoUpload.tsx) breaks mid-batch without
  // ever flipping "uploading" back off, which looks exactly like the
  // whole admin panel freezing even though earlier files in the same
  // batch already uploaded fine (found happening for real, 25 Aug 2026).
  try {
    if (isHeic(file)) {
      try {
        file = await convertHeicToJpeg(file);
      } catch (err) {
        console.error("uploadPhoto: HEIC conversion failed", err);
        return { error: "Couldn't convert this HEIC photo. Try saving it as JPEG first." };
      }
    }

    const ext = file.name.split(".").pop() || "jpg";
    const name = `${crypto.randomUUID()}.${ext}`;
    const path = folder ? `${folder}/${name}` : name;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      console.error("uploadPhoto: upload failed", error);
      return { error: "Upload failed. Try again." };
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (err) {
    console.error("uploadPhoto: unexpected error", err);
    return { error: "Upload failed. Try again." };
  }
}

export async function deletePhoto(supabase: SupabaseClient, url: string) {
  // Public URLs look like .../storage/v1/object/public/property-photos/<path>
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return; // not a photo from this bucket — nothing to do
  const path = url.slice(idx + marker.length);
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error("deletePhoto: remove failed", error);
}
