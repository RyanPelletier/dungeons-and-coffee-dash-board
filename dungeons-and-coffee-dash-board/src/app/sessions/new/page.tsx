"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ImageUploader from "@/components/ImageUploader";

export default function NewSessionPostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [sessionNumber, setSessionNumber] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === "loading") return null;

  const canPost = Boolean(session && (session.user.role === "DM" || session.user.isScribe));
  if (!canPost) {
    return (
      <div className="card mx-auto max-w-lg p-6 text-center">
        <p className="text-parchment/70">
          Only the party&apos;s scribe (or the DM) can post a new session recap. Ask your DM to
          make you the scribe from the DM Dashboard if it should be you.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        sessionNumber: sessionNumber || null,
        content,
        imageUrls: images,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to post.");
      return;
    }
    const data = await res.json();
    router.push(`/sessions/${data.post.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card p-6">
        <h1 className="mb-4 font-display text-2xl font-bold text-gold">New Session Post</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="label">Title</label>
              <input required className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="label">Session #</label>
              <input
                type="number"
                className="input"
                value={sessionNumber}
                onChange={(e) => setSessionNumber(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">What happened?</label>
            <textarea
              required
              className="input min-h-[220px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Recap the session for the party..."
            />
          </div>
          <div>
            <label className="label">Art / Screenshots (optional)</label>
            <ImageUploader urls={images} onChange={setImages} />
          </div>
          {error && <p className="text-sm text-ember">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Posting..." : "Post Session Recap"}
          </button>
        </form>
      </div>
    </div>
  );
}
