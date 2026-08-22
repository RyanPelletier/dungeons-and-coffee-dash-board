import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ownsGear(userId: string, gearId: string) {
  const gear = await prisma.gear.findUnique({
    where: { id: gearId },
    include: { character: true },
  });
  if (!gear || gear.character.userId !== userId) return null;
  return gear;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gear = await ownsGear(session.user.id, params.id);
  if (!gear) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if ("name" in body) data.name = String(body.name).trim();
  if ("description" in body) data.description = body.description ? String(body.description) : null;
  if ("quantity" in body) data.quantity = Math.max(1, Math.round(Number(body.quantity) || 1));
  if ("equipped" in body) data.equipped = Boolean(body.equipped);

  const updated = await prisma.gear.update({ where: { id: params.id }, data });
  return NextResponse.json({ gear: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gear = await ownsGear(session.user.id, params.id);
  if (!gear) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.gear.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
