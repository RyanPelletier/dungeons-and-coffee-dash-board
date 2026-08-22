import { prisma } from "@/lib/prisma";
import CharacterCard, { DashboardCharacter } from "@/components/CharacterCard";

export const dynamic = "force-dynamic";

export default async function CampaignDashboard() {
  const characters = await prisma.character.findMany({
    include: { user: { select: { username: true } } },
    orderBy: { name: "asc" },
  });

  const cards: DashboardCharacter[] = characters.map((c) => ({
    id: c.id,
    name: c.name,
    race: c.race,
    class: c.class,
    background: c.background,
    bio: c.bio,
    level: c.level,
    currentHP: c.currentHP,
    maxHP: c.maxHP,
    armorClass: c.armorClass,
    gold: c.gold,
    isGoldPublic: c.isGoldPublic,
    avatarUrl: c.avatarUrl,
    pendingLevelUp: c.pendingLevelUp,
    playerName: c.user.username,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gold">Campaign Dashboard</h1>
        <p className="mt-1 text-parchment/70">
          The current state of the party, at a glance. Sign in to update your own sheet.
        </p>
      </div>

      {cards.length === 0 ? (
        <p className="text-parchment/60">No adventurers have joined the party yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <CharacterCard key={c.id} character={c} />
          ))}
        </div>
      )}
    </div>
  );
}
