"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import CharacterCard from "@/components/CharacterCard";
import type { CharacterDoc } from "@/lib/types";

export default function CampaignDashboard() {
  const [characters, setCharacters] = useState<CharacterDoc[] | null>(null);

  useEffect(() => {
    const q = query(collection(db, "characters"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setCharacters(snap.docs.map((d) => d.data() as CharacterDoc));
    });
    return unsub;
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gold">Campaign Dashboard</h1>
        <p className="mt-1 text-parchment/70">
          The current state of the party, at a glance. Sign in to update your own sheet.
        </p>
      </div>

      {characters === null ? (
        <p className="text-parchment/60">Loading the party...</p>
      ) : characters.length === 0 ? (
        <p className="text-parchment/60">No adventurers have joined the party yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((c) => (
            <CharacterCard key={c.id} character={c} />
          ))}
        </div>
      )}
    </div>
  );
}
