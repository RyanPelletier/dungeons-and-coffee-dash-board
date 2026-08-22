import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(opts: {
  email: string;
  username: string;
  password: string;
  role: "PLAYER" | "DM";
  isScribe?: boolean;
}) {
  const passwordHash = await bcrypt.hash(opts.password, 10);
  return prisma.user.upsert({
    where: { email: opts.email },
    update: {},
    create: {
      email: opts.email,
      username: opts.username,
      passwordHash,
      role: opts.role,
      isScribe: opts.isScribe ?? false,
    },
  });
}

async function main() {
  const dm = await upsertUser({
    email: "dm@table.game",
    username: "TheDM",
    password: "dungeonmaster",
    role: "DM",
  });

  const aria = await upsertUser({
    email: "aria@table.game",
    username: "Aria",
    password: "password123",
    role: "PLAYER",
    isScribe: true,
  });

  const borin = await upsertUser({
    email: "borin@table.game",
    username: "Borin",
    password: "password123",
    role: "PLAYER",
  });

  const existingAria = await prisma.character.findUnique({ where: { userId: aria.id } });
  if (!existingAria) {
    await prisma.character.create({
      data: {
        userId: aria.id,
        name: "Aria Windwhisper",
        race: "Half-Elf",
        class: "Bard",
        background: "Entertainer",
        bio: "A wandering storyteller with a silver tongue and a habit of collecting odd trinkets.",
        level: 3,
        maxHP: 21,
        currentHP: 21,
        armorClass: 14,
        gold: 45,
        isGoldPublic: true,
        strength: 8,
        dexterity: 16,
        constitution: 12,
        intelligence: 10,
        wisdom: 12,
        charisma: 17,
        gear: {
          create: [
            { name: "Lute", quantity: 1, equipped: true },
            { name: "Rapier", quantity: 1, equipped: true },
            { name: "Diplomat's Pack", quantity: 1 },
          ],
        },
      },
    });
  }

  const existingBorin = await prisma.character.findUnique({ where: { userId: borin.id } });
  if (!existingBorin) {
    await prisma.character.create({
      data: {
        userId: borin.id,
        name: "Borin Ironfoot",
        race: "Dwarf",
        class: "Fighter",
        background: "Soldier",
        bio: "Stout and stubborn, Borin has never met a door he couldn't kick down.",
        level: 3,
        maxHP: 32,
        currentHP: 27,
        armorClass: 17,
        gold: 12,
        isGoldPublic: false,
        strength: 16,
        dexterity: 12,
        constitution: 16,
        intelligence: 9,
        wisdom: 11,
        charisma: 8,
        gear: {
          create: [
            { name: "Chain Mail", quantity: 1, equipped: true },
            { name: "Battleaxe", quantity: 1, equipped: true },
            { name: "Shield", quantity: 1, equipped: true },
          ],
        },
      },
    });
  }

  const postCount = await prisma.sessionPost.count();
  if (postCount === 0) {
    await prisma.sessionPost.create({
      data: {
        title: "Session 1: Into the Whispering Wood",
        sessionNumber: 1,
        authorId: aria.id,
        content:
          "Our party met at the Rusty Tankard in Millhaven and took a job to investigate strange lights in the Whispering Wood. By nightfall we found an abandoned shrine, half-swallowed by roots, humming with faint magic...",
        comments: {
          create: [
            {
              authorId: borin.id,
              content: "I still think we should've looted the shrine before the vines woke up.",
            },
          ],
        },
      },
    });
  }

  console.log("Seed complete.");
  console.log("DM login:      dm@table.game / dungeonmaster");
  console.log("Player login:  aria@table.game / password123 (scribe)");
  console.log("Player login:  borin@table.game / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
