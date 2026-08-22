import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const content = String(body?.content ?? "").trim();
  const imageUrls: string[] = Array.isArray(body?.imageUrls) ? body.imageUrls : [];

  if (!content) return NextResponse.json({ error: "Comment can't be empty" }, { status: 400 });

  const post = await prisma.sessionPost.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: {
      postId: params.id,
      authorId: session.user.id,
      content,
      images: { create: imageUrls.filter(Boolean).map((url) => ({ url })) },
    },
    include: { author: { select: { username: true } }, images: true },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
