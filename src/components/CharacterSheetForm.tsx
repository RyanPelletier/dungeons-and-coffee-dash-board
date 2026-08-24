"use client";

import { useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import HPBar from "./HPBar";
import GearList from "./GearList";
import LevelUpChecklist from "./LevelUpChecklist";
import { DEFAULT_SAVING_THROW_PROFICIENCIES } from "@/lib/types";
import type { AbilityKey, CharacterDoc, GearItem, SavingThrowProficiencies } from "@/lib/types";

type EditableFields = Pick<
  CharacterDoc,
  | "name"
  | "race"
  | "class"
  | "background"
  | "bio"
  | "avatarUrl"
  | "alignment"
  | "xp"
  | "inspiration"
  | "currentHP"
  | "maxHP"
  | "tempHP"
  | "armorClass"
  | "speed"
  | "hitDiceType"
  | "hitDiceRemaining"
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma"
  | "savingThrowProficiencies"
  | "gold"
  | "isGoldPublic"
>;

const ABILITY_SCORES: { key: AbilityKey; label: string }[] = [
  { key: "strength", label: "STR" },
  { key: "dexterity", label: "DEX" },
  { key: "constitution", label: "CON" },
  { key: "intelligence", label: "INT" },
  { key: "wisdom", label: "WIS" },
  { key: "charisma", label: "CHA" },
];

function modifierValue(score: number) {
  return Math.floor((score - 10) / 2);
}

function formatModifier(mod: number) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// Character docs written before these fields existed won't have them —
// fall back to sane defaults rather than crashing on undefined.
function pickEditable(character: CharacterDoc): EditableFields {
  return {
    name: character.name,
    race: character.race,
    class: character.class,
    background: character.background,
    bio: character.bio,
    avatarUrl: character.avatarUrl,
    alignment: character.alignment ?? null,
    xp: character.xp ?? 0,
    inspiration: character.inspiration ?? false,
    currentHP: character.currentHP,
    maxHP: character.maxHP,
    tempHP: character.tempHP,
    armorClass: character.armorClass,
    speed: character.speed,
    hitDiceType: character.hitDiceType ?? "d8",
    hitDiceRemaining: character.hitDiceRemaining ?? character.level ?? 1,
    strength: character.strength,
    dexterity: character.dexterity,
    constitution: character.constitution,
    intelligence: character.intelligence,
    wisdom: character.wisdom,
    charisma: character.charisma,
    savingThrowProficiencies: {
      ...DEFAULT_SAVING_THROW_PROFICIENCIES,
      ...character.savingThrowProficiencies,
    },
    gold: character.gold,
    isGoldPublic: character.isGoldPublic,
  };
}

export default function CharacterSheetForm({
  character,
  gear,
}: {
  character: CharacterDoc;
  gear: GearItem[];
}) {
  const [draft, setDraft] = useState<EditableFields>(() => pickEditable(character));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof EditableFields>(key: K, value: EditableFields[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function toggleSave(ability: AbilityKey) {
    setDraft((d) => ({
      ...d,
      savingThrowProficiencies: {
        ...d.savingThrowProficiencies,
        [ability]: !d.savingThrowProficiencies[ability],
      } as SavingThrowProficiencies,
    }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const currentHP = Math.max(0, Math.min(draft.currentHP, draft.maxHP));
      // Resend the non-editable identity/DM fields unchanged alongside the
      // draft: harmless for a normal update (unchanged values never show up
      // as "affected" in the rules diff), but it means this same call can
      // also self-heal a character doc that never got created, since
      // Firestore's create rule requires id/userId/level/pendingLevelUp to
      // be present on the first write.
      await setDoc(
        doc(db, "characters", character.id),
        {
          id: character.id,
          userId: character.userId,
          ownerUsername: character.ownerUsername,
          level: character.level,
          proficiencyBonus: character.proficiencyBonus,
          pendingLevelUp: character.pendingLevelUp,
          levelUpChecklist: character.levelUpChecklist,
          ...draft,
          currentHP,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setSavedAt(Date.now());
    } catch {
      setError("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const dexMod = modifierValue(draft.dexterity);
  const wisMod = modifierValue(draft.wisdom);

  return (
    <div className="space-y-6">
      {character.pendingLevelUp && character.levelUpChecklist && (
        <LevelUpChecklist
          characterId={character.id}
          level={character.level}
          checklist={character.levelUpChecklist}
        />
      )}

      <div className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-bold text-gold">
            {draft.name || "Unnamed Adventurer"}
          </h2>
          <div className="flex items-center gap-3 text-sm text-parchment/70">
            <span>Level {character.level}</span>
            <span>·</span>
            <span>{draft.hitDiceRemaining}/{character.level} Hit Dice ({draft.hitDiceType})</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input className="input" value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="label">Avatar URL (optional)</label>
            <input
              className="input"
              value={draft.avatarUrl ?? ""}
              onChange={(e) => set("avatarUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="label">Race</label>
            <input className="input" value={draft.race} onChange={(e) => set("race", e.target.value)} />
          </div>
          <div>
            <label className="label">Class</label>
            <input className="input" value={draft.class} onChange={(e) => set("class", e.target.value)} />
          </div>
          <div>
            <label className="label">Background</label>
            <input
              className="input"
              value={draft.background ?? ""}
              onChange={(e) => set("background", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Alignment</label>
            <input
              className="input"
              value={draft.alignment ?? ""}
              onChange={(e) => set("alignment", e.target.value)}
              placeholder="Chaotic Good"
            />
          </div>
          <div>
            <label className="label">Experience Points</label>
            <input
              type="number"
              className="input"
              value={draft.xp}
              onChange={(e) => set("xp", Number(e.target.value))}
            />
          </div>
          <label className="flex items-center gap-2 pb-2 pt-6 text-sm text-parchment/80">
            <input
              type="checkbox"
              checked={draft.inspiration}
              onChange={(e) => set("inspiration", e.target.checked)}
              className="h-4 w-4 accent-ember"
            />
            Inspiration
          </label>
        </div>

        <div className="mt-4">
          <label className="label">Bio</label>
          <textarea
            className="input min-h-[100px]"
            value={draft.bio ?? ""}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Backstory, personality, notable quirks..."
          />
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-display text-xl font-bold text-gold">Combat Stats</h2>
        <div className="mb-4">
          <HPBar current={draft.currentHP} max={draft.maxHP} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div>
            <label className="label">Current HP</label>
            <input
              type="number"
              className="input"
              value={draft.currentHP}
              onChange={(e) => set("currentHP", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Max HP</label>
            <input
              type="number"
              className="input"
              value={draft.maxHP}
              onChange={(e) => set("maxHP", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Temp HP</label>
            <input
              type="number"
              className="input"
              value={draft.tempHP}
              onChange={(e) => set("tempHP", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Armor Class</label>
            <input
              type="number"
              className="input"
              value={draft.armorClass}
              onChange={(e) => set("armorClass", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Speed</label>
            <input
              type="number"
              className="input"
              value={draft.speed}
              onChange={(e) => set("speed", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="label">Hit Dice Type</label>
            <input
              className="input"
              value={draft.hitDiceType}
              onChange={(e) => set("hitDiceType", e.target.value)}
              placeholder="d8"
            />
          </div>
          <div>
            <label className="label">Hit Dice Remaining</label>
            <input
              type="number"
              className="input"
              value={draft.hitDiceRemaining}
              onChange={(e) => set("hitDiceRemaining", Number(e.target.value))}
            />
          </div>
          <div className="text-center">
            <label className="label">Initiative</label>
            <p className="input flex items-center justify-center !bg-night/60">{formatModifier(dexMod)}</p>
          </div>
          <div className="text-center">
            <label className="label">Passive Perception</label>
            <p className="input flex items-center justify-center !bg-night/60">{10 + wisMod}</p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-display text-xl font-bold text-gold">Ability Scores &amp; Saving Throws</h2>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {ABILITY_SCORES.map(({ key, label }) => {
            const value = draft[key];
            return (
              <div key={key} className="text-center">
                <label className="label">{label}</label>
                <input
                  type="number"
                  className="input text-center"
                  value={value}
                  onChange={(e) => set(key, Number(e.target.value) as never)}
                />
                <p className="mt-1 text-xs text-parchment/50">{formatModifier(modifierValue(value))}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          {ABILITY_SCORES.map(({ key, label }) => {
            const proficient = draft.savingThrowProficiencies[key];
            const bonus = modifierValue(draft[key]) + (proficient ? character.proficiencyBonus : 0);
            return (
              <label key={key} className="flex items-center gap-2 text-sm text-parchment/80">
                <input
                  type="checkbox"
                  checked={proficient}
                  onChange={() => toggleSave(key)}
                  className="h-4 w-4 accent-ember"
                />
                <span className="w-10 text-parchment/60">{label}</span>
                <span className="font-medium text-parchment">{formatModifier(bonus)}</span>
                <span className="text-xs text-parchment/50">save</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-display text-xl font-bold text-gold">Gold</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">Gold (gp)</label>
            <input
              type="number"
              className="input w-32"
              value={draft.gold}
              onChange={(e) => set("gold", Number(e.target.value))}
            />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-parchment/80">
            <input
              type="checkbox"
              checked={draft.isGoldPublic}
              onChange={(e) => set("isGoldPublic", e.target.checked)}
              className="h-4 w-4 accent-ember"
            />
            Show gold on the campaign dashboard
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save Character Sheet"}
        </button>
        {savedAt && <span className="text-sm text-moss">Saved!</span>}
        {error && <span className="text-sm text-ember">{error}</span>}
      </div>

      <GearList characterId={character.id} gear={gear} />
    </div>
  );
}
