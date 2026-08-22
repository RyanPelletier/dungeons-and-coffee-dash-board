"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ImageUploader from "./ImageUploader";

export type CommentData = {
  id: string;
  content: string;
  createdAt: string;
  author: { username: string };
  images: { id: string; url: string }[];
};

export default function CommentSection({
  postId,
  comments,
}: {
  postId: string;
  comments: CommentData[];
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/sessions/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, imageUrls: images }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to post comment.");
      return;
    }
    setContent("");
    setImages([]);
    router.refresh();
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 font-display text-xl font-bold text-gold">
        Comments ({comments.length})
      </h2>

      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-semibold text-parchment">{c.author.username}</span>
              <span className="text-xs text-parchment/50">
                {new Date(c.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-parchment/80">{c.content}</p>
            {c.images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {c.images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={img.id} src={img.url} alt="" className="h-24 w-24 rounded object-cover" />
                ))}
              </div>
            )}
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm text-parchment/50">No comments yet.</p>}
      </div>

      {session ? (
        <form onSubmit={handleSubmit} className="card mt-4 p-4">
          <label className="label">Add a comment</label>
          <textarea
            className="input min-h-[80px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What do you remember?"
          />
          <div className="mt-2">
            <ImageUploader urls={images} onChange={setImages} />
          </div>
          {error && <p className="mt-2 text-sm text-ember">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary mt-3">
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-parchment/50">Sign in to leave a comment.</p>
      )}
    </div>
  );
}
