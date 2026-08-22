"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import HPBar from "./HPBar";
import GearList, { GearItem } from "./GearList";
import LevelUpChecklist from "./LevelUpChecklist";
import type { LevelUpChecklistItem } from "@/lib/levelUpSteps";

export type FullCharacter = {
  id: string;
  name: string;
  race: string;
  class: string;
  background: string | null;
  bio: string | null;
  avatarUrl: string | null;
  level: number;
  xp: number;
  proficiencyBonus: number;
  maxHP: number;
  currentHP: number;
  tempHP: number;
  armorClass: number;
  speed: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  gold: number;
  isGoldPublic: boolean;
  pendingLevelUp: boolean;
  levelUpChecklist: string | null;
  gear: GearItem[];
};

const ABILITY_SCORES: { key: keyof FullCharacter; label: string }[] = [
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

export default function CharacterSheetForm({ initialCharacter }: { initialCharacter: FullCharacter }) {
  const router = useRouter();
  const [character, setCharacter] = useState(initialCharacter);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checklist: LevelUpChecklistItem[] | null = useMemo(() => {
    if (!character.pendingLevelUp || !character.levelUpChecklist) return null;
    try {
      return JSON.parse(character.levelUpChecklist);
    } catch {
      return null;
    }
  }, [character.pendingLevelUp, character.levelUpChecklist]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/character");
    if (res.ok) {
      const data = await res.json();
      if (data.character) setCharacter(data.character);
    }
    router.refresh();
  }, [router]);

  function set<K extends keyof FullCharacter>(key: K, value: FullCharacter[K]) {
    setCharacter((c) => ({ ...c, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/character", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: character.name,
        race: character.race,
        class: character.class,
        background: character.background,
        bio: character.bio,
        avatarUrl: character.avatarUrl,
        currentHP: character.currentHP,
        maxHP: character.maxHP,
        tempHP: character.tempHP,
        armorClass: character.armorClass,
        speed: character.speed,
        strength: character.strength,
        dexterity: character.dexterity,
        constitution: character.constitution,
        intelligence: character.intelligence,
        wisdom: character.wisdom,
        charisma: character.charisma,
        gold: character.gold,
        isGoldPublic: character.isGoldPublic,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save.");
      return;
    }
    const data = await res.json();
    setCharacter(data.character);
    setSavedAt(Date.now());
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {checklist && (
        <LevelUpChecklist level={character.level} checklist={checklist} onChange={refresh} />
      )}

      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-gold">
            {character.name || "Unnamed Adventurer"}
          </h2>
          <span className="text-sm text-parchment/70">Level {character.level}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input className="input" value={character.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="label">Avatar URL (optional)</label>
            <input
              className="input"
              value={character.avatarUrl ?? ""}
              onChange={(e) => set("avatarUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="label">Race</label>
            <input className="input" value={character.race} onChange={(e) => set("race", e.target.value)} />
          </div>
          <div>
            <label className="label">Class</label>
            <input className="input" value={character.class} onChange={(e) => set("class", e.target.value)} />
          </div>
          <div>
            <label className="label">Background</label>
            <input
              className="input"
              value={character.background ?? ""}
              onChange={(e) => set("background", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="label">Bio</label>
          <textarea
            className="input min-h-[100px]"
            value={character.bio ?? ""}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Backstory, personality, notable quirks..."
          />
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-display text-xl font-bold text-gold">Combat Stats</h2>
        <div className="mb-4">
          <HPBar current={character.currentHP} max={character.maxHP} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div>
            <label className="label">Current HP</label>
            <input
              type="number"
              className="input"
              value={character.currentHP}
              onChange={(e) => set("currentHP", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Max HP</label>
            <input
              type="number"
              className="input"
              value={character.maxHP}
              onChange={(e) => set("maxHP", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Temp HP</label>
            <input
              type="number"
              className="input"
              value={character.tempHP}
              onChange={(e) => set("tempHP", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Armor Class</label>
            <input
              type="number"
              className="input"
              value={character.armorClass}
              onChange={(e) => set("armorClass", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Speed</label>
            <input
              type="number"
              className="input"
              value={character.speed}
              onChange={(e) => set("speed", Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-display text-xl font-bold text-gold">Ability Scores</h2>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {ABILITY_SCORES.map(({ key, label }) => {
            const value = character[key] as number;
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
              value={character.gold}
              onChange={(e) => set("gold", Number(e.target.value))}
            />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-parchment/80">
            <input
              type="checkbox"
              checked={character.isGoldPublic}
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

      <GearList gear={character.gear} onChange={refresh} />
    </div>
  );
}
