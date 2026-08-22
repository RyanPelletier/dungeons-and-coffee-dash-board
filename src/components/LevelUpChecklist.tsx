"use client";

import { useState } from "react";
import type { LevelUpChecklistItem } from "@/lib/levelUpSteps";

export default function LevelUpChecklist({
  level,
  checklist,
  onChange,
}: {
  level: number;
  checklist: LevelUpChecklistItem[];
  onChange: () => void;
}) {
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allDone = checklist.every((item) => item.done);
  const doneCount = checklist.filter((item) => item.done).length;

  async function toggle(index: number) {
    setBusyIndex(index);
    setError(null);
    await fetch("/api/character/levelup", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });
    setBusyIndex(null);
    onChange();
  }

  async function finish() {
    setFinishing(true);
    setError(null);
    const res = await fetch("/api/character/levelup", { method: "POST" });
    setFinishing(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not confirm level up.");
      return;
    }
    onChange();
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
      <button
        onClick={finish}
        disabled={!allDone || finishing}
        className="btn-primary mt-4"
      >
        {finishing ? "Confirming..." : "Confirm Level Up"}
      </button>
    </div>
  );
}
