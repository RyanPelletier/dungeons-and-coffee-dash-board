import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const session = await getServerSession(authOptions);
  const canPost = Boolean(session && (session.user.role === "DM" || session.user.isScribe));

  const posts = await prisma.sessionPost.findMany({
    include: {
      author: { select: { username: true } },
      images: true,
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

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

      {posts.length === 0 ? (
        <p className="text-parchment/60">No sessions have been logged yet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link key={post.id} href={`/sessions/${post.id}`} className="card block p-5 hover:border-gold/60">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-parchment">
                    {post.sessionNumber ? `Session ${post.sessionNumber}: ` : ""}
                    {post.title}
                  </h2>
                  <p className="mt-1 text-xs text-parchment/50">
                    by {post.author.username} · {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {post.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.images[0].url} alt="" className="h-16 w-16 rounded object-cover" />
                )}
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-parchment/70">{post.content}</p>
              <p className="mt-3 text-xs text-gold/70">{post._count.comments} comment(s)</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
