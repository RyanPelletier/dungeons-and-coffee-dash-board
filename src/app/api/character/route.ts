import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EDITABLE_NUMBER_FIELDS = [
  "currentHP",
  "maxHP",
  "tempHP",
  "armorClass",
  "speed",
  "gold",
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
  "proficiencyBonus",
] as const;

const EDITABLE_STRING_FIELDS = [
  "name",
  "race",
  "class",
  "background",
  "bio",
  "avatarUrl",
] as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const character = await prisma.character.findUnique({
    where: { userId: session.user.id },
    include: { gear: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({ character });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  for (const field of EDITABLE_NUMBER_FIELDS) {
    if (field in body) {
      const value = Number(body[field]);
      if (!Number.isFinite(value)) {
        return NextResponse.json({ error: `Invalid value for ${field}` }, { status: 400 });
      }
      data[field] = Math.round(value);
    }
  }

  for (const field of EDITABLE_STRING_FIELDS) {
    if (field in body) {
      data[field] = body[field] === null ? null : String(body[field]);
    }
  }

  if ("isGoldPublic" in body) {
    data.isGoldPublic = Boolean(body.isGoldPublic);
  }

  // Guard rails: HP can't go negative or above max.
  const existing = await prisma.character.findUnique({ where: { userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "No character found" }, { status: 404 });

  const nextMax = typeof data.maxHP === "number" ? data.maxHP : existing.maxHP;
  if (typeof data.currentHP === "number") {
    data.currentHP = Math.max(0, Math.min(data.currentHP, nextMax));
  }

  const character = await prisma.character.update({
    where: { userId: session.user.id },
    data,
    include: { gear: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({ character });
}
