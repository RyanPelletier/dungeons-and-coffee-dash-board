import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { LevelUpChecklistItem } from "@/lib/levelUpSteps";

// Toggle a single checklist item.
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const index = Number(body?.index);

  const character = await prisma.character.findUnique({ where: { userId: session.user.id } });
  if (!character) return NextResponse.json({ error: "No character found" }, { status: 404 });
  if (!character.pendingLevelUp || !character.levelUpChecklist) {
    return NextResponse.json({ error: "No level up in progress" }, { status: 400 });
  }

  const checklist: LevelUpChecklistItem[] = JSON.parse(character.levelUpChecklist);
  if (!checklist[index]) {
    return NextResponse.json({ error: "Invalid checklist item" }, { status: 400 });
  }
  checklist[index] = { ...checklist[index], done: !checklist[index].done };

  const updated = await prisma.character.update({
    where: { userId: session.user.id },
    data: { levelUpChecklist: JSON.stringify(checklist) },
  });

  return NextResponse.json({ character: updated });
}

// Finish the level up once every step is checked off.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const character = await prisma.character.findUnique({ where: { userId: session.user.id } });
  if (!character) return NextResponse.json({ error: "No character found" }, { status: 404 });
  if (!character.pendingLevelUp || !character.levelUpChecklist) {
    return NextResponse.json({ error: "No level up in progress" }, { status: 400 });
  }

  const checklist: LevelUpChecklistItem[] = JSON.parse(character.levelUpChecklist);
  const allDone = checklist.every((item) => item.done);
  if (!allDone) {
    return NextResponse.json({ error: "Finish every checklist item first" }, { status: 400 });
  }

  const updated = await prisma.character.update({
    where: { userId: session.user.id },
    data: { pendingLevelUp: false, levelUpChecklist: null },
  });

  return NextResponse.json({ character: updated });
}
