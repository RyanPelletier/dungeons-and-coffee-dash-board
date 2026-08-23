"use client";

import { useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import HPBar from "./HPBar";
import GearList from "./GearList";
import LevelUpChecklist from "./LevelUpChecklist";
import type { CharacterDoc, GearItem } from "@/lib/types";

type EditableFields = Pick<
  CharacterDoc,
  | "name"
  | "race"
  | "class"
  | "background"
  | "bio"
  | "avatarUrl"
  | "currentHP"
  | "maxHP"
  | "tempHP"
  | "armorClass"
  | "speed"
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma"
  | "gold"
  | "isGoldPublic"
>;

const EDITABLE_KEYS: (keyof EditableFields)[] = [
  "name",
  "race",
  "class",
  "background",
  "bio",
  "avatarUrl",
  "currentHP",
  "maxHP",
  "tempHP",
  "armorClass",
  "speed",
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
  "gold",
  "isGoldPublic",
];

const ABILITY_SCORES: { key: keyof EditableFields; label: string }[] = [
  { key: "strength", label: "STR" },
  { key: "dexterity", label: "DEX" },
  { key: "constitution", label: "CON" },
  { key: "intelligence", label: "INT" },
  { key: "wisdom", label: "WIS" },
  { key: "charisma", label: "CHA" },
];

function modifier(score: number) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function pickEditable(character: CharacterDoc): EditableFields {
  const draft = {} as EditableFields;
  for (const key of EDITABLE_KEYS) {
    (draft as Record<string, unknown>)[key] = character[key];
  }
  return draft;
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

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const currentHP = Math.max(0, Math.min(draft.currentHP, draft.maxHP));
      await updateDoc(doc(db, "characters", character.id), {
        ...draft,
        currentHP,
        updatedAt: serverTimestamp(),
      });
      setSavedAt(Date.now());
    } catch {
      setError("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-gold">
            {draft.name || "Unnamed Adventurer"}
          </h2>
          <span className="text-sm text-parchment/70">Level {character.level}</span>
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
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-display text-xl font-bold text-gold">Ability Scores</h2>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {ABILITY_SCORES.map(({ key, label }) => {
            const value = draft[key] as number;
            return (
              <div key={key} className="text-center">
                <label className="label">{label}</label>
                <input
                  type="number"
                  className="input text-center"
                  value={value}
                  onChange={(e) => set(key, Number(e.target.value) as never)}
                />
                <p className="mt-1 text-xs text-parchment/50">{modifier(value)}</p>
              </div>
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
