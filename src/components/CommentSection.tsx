"use client";

import { FormEvent, useState } from "react";
import { collection, doc, increment, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import ImageUploader from "./ImageUploader";
import type { CommentDoc } from "@/lib/types";

export default function CommentSection({
  postId,
  comments,
}: {
  postId: string;
  comments: CommentDoc[];
}) {
  const { firebaseUser, profile } = useAuth();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim() || !firebaseUser || !profile) return;
    setSubmitting(true);
    setError(null);
    try {
      const batch = writeBatch(db);
      const commentRef = doc(collection(db, "sessionPosts", postId, "comments"));
      batch.set(commentRef, {
        postId,
        authorId: firebaseUser.uid,
        authorName: profile.username,
        content: content.trim(),
        imageUrls: images,
        createdAt: serverTimestamp(),
      });
      batch.update(doc(db, "sessionPosts", postId), { commentCount: increment(1) });
      await batch.commit();
      setContent("");
      setImages([]);
    } catch {
      setError("Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
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
              <span className="font-semibold text-parchment">{c.authorName}</span>
              <span className="text-xs text-parchment/50">
                {new Date(c.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-parchment/80">{c.content}</p>
            {c.imageUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {c.imageUrls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt="" className="h-24 w-24 rounded object-cover" />
                ))}
              </div>
            )}
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm text-parchment/50">No comments yet.</p>}
      </div>

      {firebaseUser && profile ? (
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
