"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import CharacterSheetForm from "@/components/CharacterSheetForm";
import type { CharacterDoc, GearItem } from "@/lib/types";

export default function DashboardPage() {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();
  const [character, setCharacter] = useState<CharacterDoc | null>(null);
  const [gear, setGear] = useState<GearItem[]>([]);
  const [characterLoading, setCharacterLoading] = useState(true);

  useEffect(() => {
    if (!loading && !firebaseUser) router.push("/login");
  }, [loading, firebaseUser, router]);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = onSnapshot(doc(db, "characters", firebaseUser.uid), (snap) => {
      setCharacter(snap.exists() ? (snap.data() as CharacterDoc) : null);
      setCharacterLoading(false);
    });
    return unsub;
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) return;
    const q = query(collection(db, "characters", firebaseUser.uid, "gear"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setGear(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GearItem));
    });
    return unsub;
  }, [firebaseUser]);

  if (loading || (firebaseUser && characterLoading)) {
    return <p className="text-parchment/60">Loading your character...</p>;
  }
  if (!firebaseUser) return null;

  if (!character) {
    return (
      <div className="card mx-auto max-w-lg p-6 text-center">
        <p className="text-parchment/70">
          Your account doesn&apos;t have a character yet. Ask your DM to set one up for you.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold text-gold">My Character</h1>
      <CharacterSheetForm character={character} gear={gear} />
    </div>
  );
}
