import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DM") {
    return NextResponse.json({ error: "Only the DM can do that" }, { status: 403 });
  }

  const body = await req.json();
  const userId = String(body?.userId ?? "");
  const isScribe = Boolean(body?.isScribe);

  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isScribe },
  });

  return NextResponse.json({ user: { id: user.id, isScribe: user.isScribe } });
}
