import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Item name is required" }, { status: 400 });

  const character = await prisma.character.findUnique({ where: { userId: session.user.id } });
  if (!character) return NextResponse.json({ error: "No character found" }, { status: 404 });

  const gear = await prisma.gear.create({
    data: {
      characterId: character.id,
      name,
      quantity: Number.isFinite(Number(body?.quantity)) ? Math.max(1, Math.round(Number(body.quantity))) : 1,
      description: body?.description ? String(body.description) : null,
      equipped: Boolean(body?.equipped),
    },
  });

  return NextResponse.json({ gear }, { status: 201 });
}
