import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const posts = await prisma.sessionPost.findMany({
    include: {
      author: { select: { username: true } },
      images: true,
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "DM" && !session.user.isScribe) {
    return NextResponse.json(
      { error: "Only the scribe (or the DM) can post a session recap." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const title = String(body?.title ?? "").trim();
  const content = String(body?.content ?? "").trim();
  const sessionNumber = body?.sessionNumber ? Number(body.sessionNumber) : null;
  const imageUrls: string[] = Array.isArray(body?.imageUrls) ? body.imageUrls : [];

  if (!title || !content) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const post = await prisma.sessionPost.create({
    data: {
      title,
      content,
      sessionNumber: Number.isFinite(sessionNumber) ? sessionNumber : null,
      authorId: session.user.id,
      images: {
        create: imageUrls.filter(Boolean).map((url) => ({ url })),
      },
    },
    include: { author: { select: { username: true } }, images: true },
  });

  return NextResponse.json({ post }, { status: 201 });
}
