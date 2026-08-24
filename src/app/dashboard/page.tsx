"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import CharacterSheetForm from "@/components/CharacterSheetForm";
import { DEFAULT_CHARACTER } from "@/lib/types";
import type { CharacterDoc, GearItem } from "@/lib/types";

type CharacterStatus = "loading" | "found" | "missing" | "error";

export default function DashboardPage() {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();
  const [character, setCharacter] = useState<CharacterDoc | null>(null);
  const [characterStatus, setCharacterStatus] = useState<CharacterStatus>("loading");
  const [gear, setGear] = useState<GearItem[]>([]);

  useEffect(() => {
    if (!loading && !firebaseUser) router.push("/login");
  }, [loading, firebaseUser, router]);

  useEffect(() => {
    if (!firebaseUser) return;
    setCharacterStatus("loading");
    const unsub = onSnapshot(
      doc(db, "characters", firebaseUser.uid),
      (snap) => {
        if (snap.exists()) {
          setCharacter(snap.data() as CharacterDoc);
          setCharacterStatus("found");
        } else {
          setCharacter(null);
          setCharacterStatus("missing");
        }
      },
      (error) => {
        console.error("Failed to load character:", error);
        setCharacterStatus("error");
      }
    );
    return unsub;
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) return;
    const q = query(collection(db, "characters", firebaseUser.uid, "gear"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => setGear(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GearItem)),
      (error) => console.error("Failed to load gear:", error)
    );
    return unsub;
  }, [firebaseUser]);

  // Always have something valid to render the sheet with, even before the
  // real document has loaded (or if it turns out there isn't one yet) — a
  // blank sheet beats a spinner that can get stuck forever.
  const displayCharacter: CharacterDoc = useMemo(() => {
    if (character) return character;
    if (!firebaseUser) return null as unknown as CharacterDoc;
    return {
      ...DEFAULT_CHARACTER,
      id: firebaseUser.uid,
      userId: firebaseUser.uid,
      ownerUsername: firebaseUser.displayName ?? "",
      updatedAt: Date.now(),
    };
  }, [character, firebaseUser]);

  if (!firebaseUser) return null;

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold text-gold">My Character</h1>

      {characterStatus === "loading" && (
        <p className="mb-4 text-sm text-parchment/50">Syncing with the server...</p>
      )}
      {characterStatus === "missing" && (
        <div className="card mb-6 border-gold/60 p-4 text-sm text-parchment/70">
          No character is on file for your account yet. Fill this out and save to create one, or
          ask your DM if that seems wrong.
        </div>
      )}
      {characterStatus === "error" && (
        <div className="card mb-6 border-ember/60 p-4 text-sm text-ember">
          Couldn&apos;t reach the server to load your character — showing a blank sheet. Try
          refreshing before you save, or your changes may not stick.
        </div>
      )}

      {/* CharacterSheetForm only seeds its editable draft on mount, so force
          a remount the moment real data first arrives — otherwise a form
          that started blank (while status was "loading") would keep
          showing blank fields even after the real character loads. */}
      <CharacterSheetForm
        key={characterStatus === "found" ? "loaded" : "pending"}
        character={displayCharacter}
        gear={gear}
      />
    </div>
  );
}
