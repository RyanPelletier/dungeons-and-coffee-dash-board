"use client";

import { useState } from "react";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { GearItem } from "@/lib/types";

export default function GearList({ characterId, gear }: { characterId: string; gear: GearItem[] }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      await addDoc(collection(db, "characters", characterId, "gear"), {
        name: name.trim(),
        quantity,
        description: null,
        equipped: false,
        createdAt: serverTimestamp(),
      });
      setName("");
      setQuantity(1);
    } finally {
      setAdding(false);
    }
  }

  async function toggleEquipped(item: GearItem) {
    await updateDoc(doc(db, "characters", characterId, "gear", item.id), {
      equipped: !item.equipped,
    });
  }

  async function removeItem(item: GearItem) {
    await deleteDoc(doc(db, "characters", characterId, "gear", item.id));
  }

  return (
    <div className="card p-5">
      <h2 className="mb-3 font-display text-xl font-bold text-gold">Gear &amp; Inventory</h2>
      <ul className="mb-4 space-y-2">
        {gear.length === 0 && <li className="text-sm text-parchment/50">No gear yet.</li>}
        {gear.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-2 rounded-md border border-gold/10 bg-night/60 px-3 py-2"
          >
            <div>
              <span className="font-medium">{item.name}</span>
              {item.quantity > 1 && <span className="ml-1 text-parchment/50">x{item.quantity}</span>}
              {item.equipped && (
                <span className="ml-2 rounded bg-moss/40 px-1.5 py-0.5 text-xs">Equipped</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleEquipped(item)} className="text-xs text-gold hover:underline">
                {item.equipped ? "Unequip" : "Equip"}
              </button>
              <button onClick={() => removeItem(item)} className="text-xs text-ember hover:underline">
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={addItem} className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Item name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          min={1}
          className="input w-20"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
        />
        <button type="submit" disabled={adding} className="btn-secondary">
          Add
        </button>
      </form>
    </div>
  );
}
