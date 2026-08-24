export const DEFAULT_LEVEL_UP_STEPS: string[] = [
  "Roll (or take average) new Hit Dice and increase max HP",
  "Update proficiency bonus if it changed",
  "Record new class features gained this level",
  "Choose/prepare new spells or update spell slots (if a caster)",
  "Apply Ability Score Improvement or Feat (levels 4, 8, 12, 16, 19)",
  "Update saving throws / skills affected by new features",
  "Update equipment or gear granted by new features",
  "Re-read and update your bio/background notes if the story changed",
];

export type LevelUpChecklistItem = {
  label: string;
  done: boolean;
};

export function buildChecklist(steps: string[] = DEFAULT_LEVEL_UP_STEPS): LevelUpChecklistItem[] {
  return steps.map((label) => ({ label, done: false }));
}
