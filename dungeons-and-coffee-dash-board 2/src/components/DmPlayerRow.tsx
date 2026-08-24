"use client";

import { useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { buildChecklist } from "@/lib/levelUpSteps";
import type { CharacterDoc } from "@/lib/types";

export type DmPlayer = {
  userId: string;
  username: string;
  isScribe: boolean;
  character: CharacterDoc | null;
};

export default function DmPlayerRow({ player }: { player: DmPlayer }) {
  const [level, setLevel] = useState(player.character?.level ?? 1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function applyLevel() {
    const character = player.character;
    if (!character) return;
    setBusy(true);
    setError(null);
    try {
      const leveledUp = level > character.level;
      await updateDoc(doc(db, "characters", character.id), {
        level,
        proficiencyBonus: Math.floor((level - 1) / 4) + 2,
        pendingLevelUp: leveledUp ? true : character.pendingLevelUp,
        levelUpChecklist: leveledUp ? buildChecklist() : character.levelUpChecklist,
        updatedAt: serverTimestamp(),
      });
    } catch {
      setError("Failed to update level.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleScribe() {
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(db, "users", player.userId), { isScribe: !player.isScribe });
    } catch {
      setError("Failed to update scribe status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-b border-gold/10 last:border-0">
      <td className="py-3 pr-4">
        <div className="font-medium text-parchment">{player.username}</div>
        {player.character ? (
          <div className="text-xs text-parchment/50">
            {player.character.name} — {player.character.race} {player.character.class}
          </div>
        ) : (
          <div className="text-xs text-parchment/40">No character created</div>
        )}
      </td>
      <td className="py-3 pr-4">
        {player.character ? `${player.character.currentHP}/${player.character.maxHP}` : "—"}
      </td>
      <td className="py-3 pr-4">
        {player.character ? (
          player.character.isGoldPublic ? `${player.character.gold} gp` : "hidden"
        ) : (
          "—"
        )}
      </td>
      <td className="py-3 pr-4">
        {player.character ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={20}
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="input w-16 !py-1"
            />
            <button onClick={applyLevel} disabled={busy} className="btn-secondary !px-2 !py-1 text-xs">
              Set
            </button>
            {player.character.pendingLevelUp && (
              <span className="rounded bg-gold/20 px-1.5 py-0.5 text-xs text-gold">Pending</span>
            )}
          </div>
        ) : (
          "—"
        )}
      </td>
      <td className="py-3">
        <button
          onClick={toggleScribe}
          disabled={busy}
          className={player.isScribe ? "btn-primary !px-2 !py-1 text-xs" : "btn-secondary !px-2 !py-1 text-xs"}
        >
          {player.isScribe ? "Scribe ✓" : "Make Scribe"}
        </button>
        {error && <div className="mt-1 text-xs text-ember">{error}</div>}
      </td>
    </tr>
  );
}
