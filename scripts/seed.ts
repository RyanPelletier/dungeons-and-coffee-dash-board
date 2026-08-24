// Seeds a DM account plus two sample players (with characters and a sample
// session post) into Firestore/Auth.
//
// Against the local emulator suite (the default — no setup needed):
//   firebase emulators:start        # in one terminal
//   npm run seed                    # in another
//
// Against a real Firebase project: set GOOGLE_APPLICATION_CREDENTIALS to a
// service account key JSON file, and FIREBASE_PROJECT_ID to your project id,
// then run `npm run seed`.
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID || "demo-dungeons-and-coffee";
const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

if (!usingEmulator && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log(
    "No FIRESTORE_EMULATOR_HOST or GOOGLE_APPLICATION_CREDENTIALS set — " +
      "defaulting to the local emulator suite at 127.0.0.1. Start it first with " +
      "`firebase emulators:start` if you haven't."
  );
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
}

const app = initializeApp({ projectId });
const auth = getAuth(app);
const db = getFirestore(app);

type PlayerSeed = {
  email: string;
  username: string;
  password: string;
  isScribe?: boolean;
  character: {
    name: string;
    race: string;
    class: string;
    background: string;
    bio: string;
    alignment: string;
    level: number;
    maxHP: number;
    currentHP: number;
    armorClass: number;
    hitDiceType: string;
    gold: number;
    isGoldPublic: boolean;
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    savingThrowProficiencies: Partial<Record<
      "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma",
      boolean
    >>;
    gear: { name: string; quantity?: number; equipped?: boolean }[];
  };
};

async function getOrCreateAuthUser(email: string, password: string, displayName: string) {
  try {
    return await auth.getUserByEmail(email);
  } catch {
    return auth.createUser({ email, password, displayName, emailVerified: true });
  }
}

async function seedDM() {
  const user = await getOrCreateAuthUser("dm@table.game", "dungeonmaster", "TheDM");
  await db.doc(`users/${user.uid}`).set(
    {
      uid: user.uid,
      email: "dm@table.game",
      username: "TheDM",
      role: "DM",
      isScribe: false,
      createdAt: Date.now(),
    },
    { merge: true }
  );
  console.log("DM login:      dm@table.game / dungeonmaster");
}

async function seedPlayer(seed: PlayerSeed) {
  const user = await getOrCreateAuthUser(seed.email, seed.password, seed.username);

  await db.doc(`users/${user.uid}`).set(
    {
      uid: user.uid,
      email: seed.email,
      username: seed.username,
      role: "PLAYER",
      isScribe: Boolean(seed.isScribe),
      createdAt: Date.now(),
    },
    { merge: true }
  );

  const characterRef = db.doc(`characters/${user.uid}`);
  const existing = await characterRef.get();
  if (!existing.exists) {
    const c = seed.character;
    await characterRef.set({
      id: user.uid,
      userId: user.uid,
      ownerUsername: seed.username,
      name: c.name,
      race: c.race,
      class: c.class,
      background: c.background,
      bio: c.bio,
      avatarUrl: null,
      alignment: c.alignment,
      level: c.level,
      xp: 0,
      proficiencyBonus: Math.floor((c.level - 1) / 4) + 2,
      inspiration: false,
      maxHP: c.maxHP,
      currentHP: c.currentHP,
      tempHP: 0,
      armorClass: c.armorClass,
      speed: 30,
      hitDiceType: c.hitDiceType,
      hitDiceRemaining: c.level,
      strength: c.strength,
      dexterity: c.dexterity,
      constitution: c.constitution,
      intelligence: c.intelligence,
      wisdom: c.wisdom,
      charisma: c.charisma,
      savingThrowProficiencies: {
        strength: false,
        dexterity: false,
        constitution: false,
        intelligence: false,
        wisdom: false,
        charisma: false,
        ...c.savingThrowProficiencies,
      },
      gold: c.gold,
      isGoldPublic: c.isGoldPublic,
      pendingLevelUp: false,
      levelUpChecklist: null,
      updatedAt: Date.now(),
    });

    for (const item of c.gear) {
      await characterRef.collection("gear").add({
        name: item.name,
        quantity: item.quantity ?? 1,
        description: null,
        equipped: Boolean(item.equipped),
        createdAt: Date.now(),
      });
    }
  }

  console.log(`Player login:  ${seed.email} / ${seed.password}${seed.isScribe ? " (scribe)" : ""}`);
  return user;
}

async function seedSamplePost(authorUid: string, authorName: string, commenterUid: string, commenterName: string) {
  const existing = await db.collection("sessionPosts").limit(1).get();
  if (!existing.empty) return;

  const postRef = await db.collection("sessionPosts").add({
    title: "Session 1: Into the Whispering Wood",
    sessionNumber: 1,
    content:
      "Our party met at the Rusty Tankard in Millhaven and took a job to investigate strange lights in the Whispering Wood. By nightfall we found an abandoned shrine, half-swallowed by roots, humming with faint magic...",
    authorId: authorUid,
    authorName,
    imageUrls: [],
    commentCount: 1,
    createdAt: Date.now(),
  });

  await postRef.collection("comments").add({
    postId: postRef.id,
    authorId: commenterUid,
    authorName: commenterName,
    content: "I still think we should've looted the shrine before the vines woke up.",
    imageUrls: [],
    createdAt: Date.now(),
  });
}

async function main() {
  await seedDM();

  const aria = await seedPlayer({
    email: "aria@table.game",
    username: "Aria",
    password: "password123",
    isScribe: true,
    character: {
      name: "Aria Windwhisper",
      race: "Half-Elf",
      class: "Bard",
      background: "Entertainer",
      bio: "A wandering storyteller with a silver tongue and a habit of collecting odd trinkets.",
      alignment: "Chaotic Good",
      level: 3,
      maxHP: 21,
      currentHP: 21,
      armorClass: 14,
      hitDiceType: "d8",
      gold: 45,
      isGoldPublic: true,
      strength: 8,
      dexterity: 16,
      constitution: 12,
      intelligence: 10,
      wisdom: 12,
      charisma: 17,
      savingThrowProficiencies: { dexterity: true, charisma: true },
      gear: [
        { name: "Lute", equipped: true },
        { name: "Rapier", equipped: true },
        { name: "Diplomat's Pack" },
      ],
    },
  });

  const borin = await seedPlayer({
    email: "borin@table.game",
    username: "Borin",
    password: "password123",
    character: {
      name: "Borin Ironfoot",
      race: "Dwarf",
      class: "Fighter",
      background: "Soldier",
      bio: "Stout and stubborn, Borin has never met a door he couldn't kick down.",
      alignment: "Lawful Neutral",
      level: 3,
      maxHP: 32,
      currentHP: 27,
      armorClass: 17,
      hitDiceType: "d10",
      gold: 12,
      isGoldPublic: false,
      strength: 16,
      dexterity: 12,
      constitution: 16,
      intelligence: 9,
      wisdom: 11,
      charisma: 8,
      savingThrowProficiencies: { strength: true, constitution: true },
      gear: [
        { name: "Chain Mail", equipped: true },
        { name: "Battleaxe", equipped: true },
        { name: "Shield", equipped: true },
      ],
    },
  });

  await seedSamplePost(aria.uid, "Aria", borin.uid, "Borin");

  console.log("Seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
