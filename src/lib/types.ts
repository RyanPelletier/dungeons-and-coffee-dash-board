import type { LevelUpChecklistItem } from "./levelUpSteps";

export type Role = "PLAYER" | "DM";

export type UserProfile = {
  uid: string;
  email: string;
  username: string;
  role: Role;
  isScribe: boolean;
  createdAt: number;
};

export type AbilityKey =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

export type SavingThrowProficiencies = Record<AbilityKey, boolean>;

export type CharacterDoc = {
  id: string; // Firestore doc id == owning user's uid
  userId: string;
  ownerUsername: string;
  name: string;
  race: string;
  class: string;
  background: string | null;
  bio: string | null;
  avatarUrl: string | null;
  alignment: string | null;

  level: number;
  xp: number;
  proficiencyBonus: number;
  inspiration: boolean;

  maxHP: number;
  currentHP: number;
  tempHP: number;
  armorClass: number;
  speed: number;
  hitDiceType: string; // e.g. "d8"
  hitDiceRemaining: number;

  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  savingThrowProficiencies: SavingThrowProficiencies;

  gold: number;
  isGoldPublic: boolean;

  pendingLevelUp: boolean;
  levelUpChecklist: LevelUpChecklistItem[] | null;

  updatedAt: number;
};

export type GearItem = {
  id: string;
  name: string;
  quantity: number;
  description: string | null;
  equipped: boolean;
  createdAt: number;
};

export type SessionPostDoc = {
  id: string;
  title: string;
  sessionNumber: number | null;
  content: string;
  authorId: string;
  authorName: string;
  imageUrls: string[];
  commentCount: number;
  createdAt: number;
};

export type CommentDoc = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  imageUrls: string[];
  createdAt: number;
};

export const DEFAULT_SAVING_THROW_PROFICIENCIES: SavingThrowProficiencies = {
  strength: false,
  dexterity: false,
  constitution: false,
  intelligence: false,
  wisdom: false,
  charisma: false,
};

export const DEFAULT_CHARACTER: Omit<CharacterDoc, "id" | "userId" | "ownerUsername" | "updatedAt"> = {
  name: "",
  race: "",
  class: "",
  background: null,
  bio: null,
  avatarUrl: null,
  alignment: null,
  level: 1,
  xp: 0,
  proficiencyBonus: 2,
  inspiration: false,
  maxHP: 10,
  currentHP: 10,
  tempHP: 0,
  armorClass: 10,
  speed: 30,
  hitDiceType: "d8",
  hitDiceRemaining: 1,
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
  savingThrowProficiencies: DEFAULT_SAVING_THROW_PROFICIENCIES,
  gold: 0,
  isGoldPublic: true,
  pendingLevelUp: false,
  levelUpChecklist: null,
};
