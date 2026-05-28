export const TOURNAMENT_CLASSIFICATION_OPTIONS = [
  { value: "international", label: "International" },
  { value: "continental", label: "Continental" },
  { value: "regional", label: "Regional" },
  { value: "local", label: "Local" },
] as const;

export type TournamentClassification = (typeof TOURNAMENT_CLASSIFICATION_OPTIONS)[number]["value"];

const VALUES = new Set<string>(TOURNAMENT_CLASSIFICATION_OPTIONS.map((o) => o.value));

export function isTournamentClassification(value: string): value is TournamentClassification {
  return VALUES.has(value);
}

export function tournamentClassificationLabel(value: string | null | undefined): string {
  if (!value) return "";
  const found = TOURNAMENT_CLASSIFICATION_OPTIONS.find((o) => o.value === value);
  return found?.label ?? value;
}

/** Returns normalized value, null if unset, or an error message if invalid. */
export function validateTournamentClassificationOptional(raw: string): string | null | { error: string } {
  const value = raw.trim();
  if (!value) return null;
  if (!isTournamentClassification(value)) {
    return {
      error: "Select a valid tournament classification: International, Continental, Regional, or Local.",
    };
  }
  return value;
}
