import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DmPlayerRow, { DmPlayer } from "@/components/DmPlayerRow";

export const dynamic = "force-dynamic";

export default async function DmDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "DM") redirect("/");

  const users = await prisma.user.findMany({
    where: { role: "PLAYER" },
    include: { character: true },
    orderBy: { username: "asc" },
  });

  const players: DmPlayer[] = users.map((u) => ({
    userId: u.id,
    username: u.username,
    isScribe: u.isScribe,
    character: u.character
      ? {
          id: u.character.id,
          name: u.character.name,
          race: u.character.race,
          class: u.character.class,
          level: u.character.level,
          currentHP: u.character.currentHP,
          maxHP: u.character.maxHP,
          gold: u.character.gold,
          isGoldPublic: u.character.isGoldPublic,
          pendingLevelUp: u.character.pendingLevelUp,
        }
      : null,
  }));

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
        {players.length === 0 && (
          <p className="py-4 text-center text-parchment/50">No players have joined yet.</p>
        )}
      </div>
    </div>
  );
}
