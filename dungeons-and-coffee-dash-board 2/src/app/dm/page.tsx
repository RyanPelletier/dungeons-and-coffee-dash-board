"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import DmPlayerRow, { DmPlayer } from "@/components/DmPlayerRow";
import type { CharacterDoc, UserProfile } from "@/lib/types";

export default function DmDashboardPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [characters, setCharacters] = useState<CharacterDoc[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const isDm = Boolean(profile && profile.role === "DM");

  useEffect(() => {
    if (loading) return;
    if (!profile) router.push("/login");
    else if (profile.role !== "DM") router.push("/");
  }, [loading, profile, router]);

  useEffect(() => {
    if (!isDm) return;
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => d.data() as UserProfile));
    });
    const unsubChars = onSnapshot(query(collection(db, "characters"), orderBy("name", "asc")), (snap) => {
      setCharacters(snap.docs.map((d) => d.data() as CharacterDoc));
      setDataLoading(false);
    });
    return () => {
      unsubUsers();
      unsubChars();
    };
  }, [isDm]);

  if (loading || !isDm) {
    return <p className="text-parchment/60">Loading...</p>;
  }

  const players: DmPlayer[] = users
    .filter((u) => u.role === "PLAYER")
    .map((u) => ({
      userId: u.uid,
      username: u.username,
      isScribe: u.isScribe,
      character: characters.find((c) => c.userId === u.uid) ?? null,
    }))
    .sort((a, b) => a.username.localeCompare(b.username));

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold text-gold">DM Dashboard</h1>
      <p className="mb-6 text-parchment/70">
        Adjust player levels and assign who&apos;s keeping the session log this arc.
      </p>

      <div className="card overflow-x-auto p-5">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gold/20 text-xs uppercase tracking-wide text-gold/70">
              <th className="pb-2 pr-4">Player</th>
              <th className="pb-2 pr-4">HP</th>
              <th className="pb-2 pr-4">Gold</th>
              <th className="pb-2 pr-4">Level</th>
              <th className="pb-2">Scribe</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <DmPlayerRow key={p.userId} player={p} />
            ))}
          </tbody>
        </table>
        {dataLoading ? (
          <p className="py-4 text-center text-parchment/50">Loading players...</p>
        ) : players.length === 0 ? (
          <p className="py-4 text-center text-parchment/50">No players have joined yet.</p>
        ) : null}
      </div>
    </div>
  );
}
