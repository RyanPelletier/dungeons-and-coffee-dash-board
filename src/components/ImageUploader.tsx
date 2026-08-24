"use client";

import { useRef, useState } from "react";

// Images are stored inline as base64 data URIs on the Firestore document
// itself (a deliberate free-tier choice — no external storage service).
// Firestore caps a document at 1 MiB total, so every image has to be
// resized/compressed client-side before it's ever added to the array, and
// a post/comment can only hold a modest combined budget of image data.
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_ORIGINAL_FILE_BYTES = 20 * 1024 * 1024; // guard against hanging on huge originals
const MAX_DIMENSION = 1280; // longest edge, px
const MAX_SINGLE_IMAGE_BYTES = 700 * 1024; // ~700KB per image after compression
const MAX_TOTAL_IMAGE_BYTES = 900 * 1024; // combined budget, leaves room for the rest of the doc

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image file"));
    img.src = URL.createObjectURL(file);
  });
}

async function compressToDataUri(file: File): Promise<string> {
  const img = await loadImage(file);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas isn't supported in this browser");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let quality = 0.72;
    let dataUri = canvas.toDataURL("image/jpeg", quality);
    while (dataUri.length > MAX_SINGLE_IMAGE_BYTES && quality > 0.3) {
      quality -= 0.12;
      dataUri = canvas.toDataURL("image/jpeg", quality);
    }
    if (dataUri.length > MAX_SINGLE_IMAGE_BYTES) {
      throw new Error("Image is still too large even after compression — try a smaller photo");
    }
    return dataUri;
  } finally {
    URL.revokeObjectURL(img.src);
  }
}

export default function ImageUploader({
  urls,
  onChange,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const newUrls: string[] = [];
    let runningTotal = urls.reduce((sum, u) => sum + u.length, 0);

    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Only PNG, JPEG, or WebP images are allowed (animated GIFs aren't supported)");
        continue;
      }
      if (file.size > MAX_ORIGINAL_FILE_BYTES) {
        setError("That image file is too large to process");
        continue;
      }
      try {
        const dataUri = await compressToDataUri(file);
        if (runningTotal + dataUri.length > MAX_TOTAL_IMAGE_BYTES) {
          setError("Adding that image would put this post over the size limit — try removing one first");
          continue;
        }
        runningTotal += dataUri.length;
        newUrls.push(dataUri);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't process that image");
      }
    }
    onChange([...urls, ...newUrls]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    onChange(urls.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {urls.map((url, i) => (
          <div key={i} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-16 w-16 rounded object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ember text-xs text-parchment"
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-secondary !px-3 !py-1.5 text-xs"
        >
          {uploading ? "Processing..." : "Add image(s)"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-1 text-xs text-ember">{error}</p>}
    </div>
  );
}
