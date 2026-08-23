"use client";

import { useRef, useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

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
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Only PNG, JPEG, GIF, or WebP images are allowed");
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError("Image must be smaller than 8MB");
        continue;
      }
      try {
        const path = `sessionImages/${crypto.randomUUID()}-${file.name}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file, { contentType: file.type });
        const url = await getDownloadURL(fileRef);
        newUrls.push(url);
      } catch {
        setError("Upload failed");
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
          <div key={url} className="relative">
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
          {uploading ? "Uploading..." : "Add image(s)"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-1 text-xs text-ember">{error}</p>}
    </div>
  );
}
