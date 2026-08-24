"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { tsToMillis } from "@/lib/firestoreUtils";
import CommentSection from "@/components/CommentSection";
import type { CommentDoc, SessionPostDoc } from "@/lib/types";

function SessionPostContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [post, setPost] = useState<SessionPostDoc | null | undefined>(undefined);
  const [comments, setComments] = useState<CommentDoc[]>([]);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "sessionPosts", id), (snap) => {
      if (!snap.exists()) {
        setPost(null);
        return;
      }
      const data = snap.data();
      setPost({ id: snap.id, ...data, createdAt: tsToMillis(data.createdAt) } as SessionPostDoc);
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "sessionPosts", id, "comments"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setComments(
        snap.docs.map((d) => {
          const data = d.data();
          return { id: d.id, ...data, createdAt: tsToMillis(data.createdAt) } as CommentDoc;
        })
      );
    });
    return unsub;
  }, [id]);

  if (!id || post === null) {
    return <p className="text-parchment/60">Session post not found.</p>;
  }

  if (post === undefined) {
    return <p className="text-parchment/60">Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="card p-6">
        <h1 className="font-display text-3xl font-bold text-parchment">
          {post.sessionNumber ? `Session ${post.sessionNumber}: ` : ""}
          {post.title}
        </h1>
        <p className="mt-1 text-sm text-parchment/50">
          by {post.authorName} · {new Date(post.createdAt).toLocaleString()}
        </p>

        {post.imageUrls.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {post.imageUrls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" className="max-h-80 rounded-lg object-cover" />
            ))}
          </div>
        )}

        <p className="mt-4 whitespace-pre-wrap text-parchment/90">{post.content}</p>
      </div>

      <CommentSection postId={post.id} comments={comments} />
    </div>
  );
}

export default function SessionDetailPage() {
  return (
    <Suspense fallback={<p className="text-parchment/60">Loading...</p>}>
      <SessionPostContent />
    </Suspense>
  );
}
