import { getCurrentUser } from "~/lib/auth";
import { CATALOG_SPORT_KEYS } from "~/lib/catalog-sports";
import { listSportBodies, type ApiSportBody } from "~/lib/sport-bodies-api";
import { resolveSportBodyRowForReviewerUser } from "~/lib/users-api";

export type ReviewerSportBodyContext =
  | {
      ok: true;
      row: ApiSportBody;
      /** Catalog sport key for this sport body (e.g. `football`). */
      sportKey: string;
    }
  | {
      ok: false;
      error: string;
    };

function normalizeSportTypeToCatalogKey(raw: string | null | undefined): string | null {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (!s) return null;
  if ((CATALOG_SPORT_KEYS as readonly string[]).includes(s)) return s;
  return null;
}

/**
 * Resolve the current signed-in reviewer's sport-body row (when assigned) and its catalog sport key.
 * Uses user assignment (`approver_body=SPORTS_BODY` + `sports_body` / `sport_body_id`) to map to `sport_bodies`.
 */
export async function resolveCurrentReviewerSportBodyContext(): Promise<ReviewerSportBodyContext> {
  const u = getCurrentUser();
  if (!u?.id) return { ok: false, error: "Not signed in." };
  const r = await listSportBodies({ limit: 500, offset: 0 });
  if (!r.ok) return { ok: false, error: r.error || "Could not load sport bodies." };
  const row = resolveSportBodyRowForReviewerUser(u, r.data);
  if (!row) return { ok: false, error: "Your account is not linked to a sport body." };
  const sportKey = normalizeSportTypeToCatalogKey(row.sport_type);
  if (!sportKey) {
    return { ok: false, error: "Your sport body is missing a sport_type in the catalog." };
  }
  return { ok: true, row, sportKey };
}

