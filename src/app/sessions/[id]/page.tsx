import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CommentSection from "@/components/CommentSection";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({ params }: { params: { id: string } }) {
  const post = await prisma.sessionPost.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { username: true } },
      images: true,
      comments: {
        include: { author: { select: { username: true } }, images: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="card p-6">
        <h1 className="font-display text-3xl font-bold text-parchment">
          {post.sessionNumber ? `Session ${post.sessionNumber}: ` : ""}
          {post.title}
        </h1>
        <p className="mt-1 text-sm text-parchment/50">
          by {post.author.username} · {new Date(post.createdAt).toLocaleString()}
        </p>

        {post.images.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {post.images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.id} src={img.url} alt="" className="max-h-80 rounded-lg object-cover" />
            ))}
          </div>
        )}

        <p className="mt-4 whitespace-pre-wrap text-parchment/90">{post.content}</p>
      </div>

      <CommentSection
        postId={post.id}
        comments={post.comments.map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt.toISOString(),
          author: c.author,
          images: c.images,
        }))}
      />
    </div>
  );
}
