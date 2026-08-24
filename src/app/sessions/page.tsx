"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { tsToMillis } from "@/lib/firestoreUtils";
import type { SessionPostDoc } from "@/lib/types";

export default function SessionsPage() {
  const { profile } = useAuth();
  const canPost = Boolean(profile && (profile.role === "DM" || profile.isScribe));
  const [posts, setPosts] = useState<SessionPostDoc[] | null>(null);

  useEffect(() => {
    const q = query(collection(db, "sessionPosts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(
        snap.docs.map((d) => {
          const data = d.data();
          return { id: d.id, ...data, createdAt: tsToMillis(data.createdAt) } as SessionPostDoc;
        })
      );
    });
    return unsub;
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-gold">Session Log</h1>
          <p className="mt-1 text-parchment/70">The story so far, chronicled by the scribe.</p>
        </div>
        {canPost && (
          <Link href="/sessions/new" className="btn-primary">
            + New Session Post
          </Link>
        )}
      </div>

      {posts === null ? (
        <p className="text-parchment/60">Loading session log...</p>
      ) : posts.length === 0 ? (
        <p className="text-parchment/60">No sessions have been logged yet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/sessions/post?id=${post.id}`}
              className="card block p-5 hover:border-gold/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-parchment">
                    {post.sessionNumber ? `Session ${post.sessionNumber}: ` : ""}
                    {post.title}
                  </h2>
                  <p className="mt-1 text-xs text-parchment/50">
                    by {post.authorName} · {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {post.imageUrls?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.imageUrls[0]} alt="" className="h-16 w-16 rounded object-cover" />
                )}
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-parchment/70">{post.content}</p>
              <p className="mt-3 text-xs text-gold/70">{post.commentCount} comment(s)</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
