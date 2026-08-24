import HPBar from "./HPBar";
import type { CharacterDoc } from "@/lib/types";

export default function CharacterCard({ character }: { character: CharacterDoc }) {
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/40 bg-night text-2xl">
          {character.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={character.avatarUrl} alt={character.name} className="h-full w-full object-cover" />
          ) : (
            "🗡️"
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-bold text-parchment">{character.name}</h3>
            {character.pendingLevelUp && (
              <span className="rounded bg-gold/20 px-1.5 py-0.5 text-xs font-semibold text-gold">
                Leveling Up
              </span>
            )}
          </div>
          <p className="text-sm text-parchment/70">
            Level {character.level} {character.race} {character.class}
          </p>
          <p className="text-xs text-parchment/50">Played by {character.ownerUsername}</p>
        </div>
      </div>

      {character.bio && <p className="text-sm text-parchment/80 line-clamp-3">{character.bio}</p>}

      <HPBar current={character.currentHP} max={character.maxHP} />

      <div className="flex items-center justify-between text-sm text-parchment/70">
        <span>AC {character.armorClass}</span>
        {character.isGoldPublic ? (
          <span className="text-gold">{character.gold} gp</span>
        ) : (
          <span className="text-parchment/40">Gold hidden</span>
        )}
      </div>
    </div>
  );
}
