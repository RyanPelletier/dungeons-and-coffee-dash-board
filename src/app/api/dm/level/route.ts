import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildChecklist } from "@/lib/levelUpSteps";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DM") {
    return NextResponse.json({ error: "Only the DM can do that" }, { status: 403 });
  }

  const body = await req.json();
  const characterId = String(body?.characterId ?? "");
  const level = Number(body?.level);

  if (!characterId || !Number.isInteger(level) || level < 1 || level > 20) {
    return NextResponse.json({ error: "Invalid character or level" }, { status: 400 });
  }

  const character = await prisma.character.findUnique({ where: { id: characterId } });
  if (!character) return NextResponse.json({ error: "Character not found" }, { status: 404 });

  const leveledUp = level > character.level;

  const updated = await prisma.character.update({
    where: { id: characterId },
    data: {
      level,
      proficiencyBonus: Math.floor((level - 1) / 4) + 2,
      pendingLevelUp: leveledUp ? true : character.pendingLevelUp,
      levelUpChecklist: leveledUp ? JSON.stringify(buildChecklist()) : character.levelUpChecklist,
    },
  });

  return NextResponse.json({ character: updated });
}
