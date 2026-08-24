"use client";

import { useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LevelUpChecklistItem } from "@/lib/levelUpSteps";

export default function LevelUpChecklist({
  characterId,
  level,
  checklist,
}: {
  characterId: string;
  level: number;
  checklist: LevelUpChecklistItem[];
}) {
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allDone = checklist.every((item) => item.done);
  const doneCount = checklist.filter((item) => item.done).length;

  async function toggle(index: number) {
    setBusyIndex(index);
    setError(null);
    const updated = checklist.map((item, i) => (i === index ? { ...item, done: !item.done } : item));
    try {
      await updateDoc(doc(db, "characters", characterId), {
        levelUpChecklist: updated,
        updatedAt: serverTimestamp(),
      });
    } catch {
      setError("Could not update the checklist.");
    } finally {
      setBusyIndex(null);
    }
  }

  async function finish() {
    setFinishing(true);
    setError(null);
    try {
      await updateDoc(doc(db, "characters", characterId), {
        pendingLevelUp: false,
        levelUpChecklist: null,
        updatedAt: serverTimestamp(),
      });
    } catch {
      setError("Could not confirm level up.");
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="card border-gold/60 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-gold">
          Level Up to {level}! ({doneCount}/{checklist.length})
        </h2>
      </div>
      <p className="mb-4 text-sm text-parchment/70">
        Your DM bumped you up a level. Work through the checklist below, then confirm to close it
        out.
      </p>
      <ul className="space-y-2">
        {checklist.map((item, index) => (
          <li key={index}>
            <label className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-gold/5">
              <input
                type="checkbox"
                checked={item.done}
                disabled={busyIndex === index}
                onChange={() => toggle(index)}
                className="mt-1 h-4 w-4 accent-ember"
              />
              <span className={item.done ? "text-parchment/50 line-through" : "text-parchment"}>
                {item.label}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {error && <p className="mt-3 text-sm text-ember">{error}</p>}
      <button onClick={finish} disabled={!allDone || finishing} className="btn-primary mt-4">
        {finishing ? "Confirming..." : "Confirm Level Up"}
      </button>
    </div>
  );
}
