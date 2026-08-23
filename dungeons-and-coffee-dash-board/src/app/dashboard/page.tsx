import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CharacterSheetForm from "@/components/CharacterSheetForm";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const character = await prisma.character.findUnique({
    where: { userId: session.user.id },
    include: { gear: { orderBy: { createdAt: "asc" } } },
  });

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
      <CharacterSheetForm initialCharacter={character} />
    </div>
  );
}
