/** Catalog sport keys — one governing body per sport type (matches API `sport_type`). */
export const CATALOG_SPORT_KEYS = [
  "cricket",
  "football",
  "rugby",
  "hockey",
  "tennis",
  "chess",
  "darts",
  "boxing",
  "karate",
  "athletics",
  "swimming",
  "netball",
  "golf",
  "basketball",
  "volleyball",
  "cycling",
] as const;

export type CatalogSportKey = (typeof CATALOG_SPORT_KEYS)[number];

export function isCatalogSportKey(s: string): s is CatalogSportKey {
  return (CATALOG_SPORT_KEYS as readonly string[]).includes(s);
}
