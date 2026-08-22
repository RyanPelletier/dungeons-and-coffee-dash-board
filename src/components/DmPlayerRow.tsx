"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type DmPlayer = {
  userId: string;
  username: string;
  isScribe: boolean;
  character: {
    id: string;
    name: string;
    race: string;
    class: string;
    level: number;
    currentHP: number;
    maxHP: number;
    gold: number;
    isGoldPublic: boolean;
    pendingLevelUp: boolean;
  } | null;
};

export default function DmPlayerRow({ player }: { player: DmPlayer }) {
  const router = useRouter();
  const [level, setLevel] = useState(player.character?.level ?? 1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function applyLevel() {
    if (!player.character) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/dm/level", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId: player.character.id, level }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to update level.");
      return;
    }
    router.refresh();
  }

  async function toggleScribe() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/dm/scribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: player.userId, isScribe: !player.isScribe }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Failed to update scribe status.");
      return;
    }
    router.refresh();
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
