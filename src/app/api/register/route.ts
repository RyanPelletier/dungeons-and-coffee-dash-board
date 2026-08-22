import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, username, password, characterName, race, klass } = body ?? {};

  if (!email || !username || !password || !characterName || !race || !klass) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: normalizedEmail }, { username: String(username).trim() }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email or username already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      username: String(username).trim(),
      passwordHash,
      role: "PLAYER",
      character: {
        create: {
          name: String(characterName).trim(),
          race: String(race).trim(),
          class: String(klass).trim(),
        },
      },
    },
    select: { id: true, email: true, username: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
