import type { ApiSportBody } from "~/lib/sport-bodies-api";
import { sportBodyApprovalCode } from "~/lib/sport-bodies-api";
import type { ApiZimbabweSport } from "~/lib/zimbabwe-sports-api";

/** First-stage application statuses (sport-specific body, then SRC, then immigration). */
export const PRIMARY_STAGE_STATUSES = new Set([
  "awaiting_body",
  "awaiting_zifa",
  "awaiting_primary_body",
  "awaiting_sport_body",
]);

export function isPrimaryStageStatus(status: string | undefined): boolean {
  return PRIMARY_STAGE_STATUSES.has((status ?? "").trim().toLowerCase());
}

/** Per-trip `application.sport` wins over the organisation default for first-line routing. */
export function routingSportForApplication(
  applicationSport: string | null | undefined,
  organisationSport: string | null | undefined,
): string {
  const a = String(applicationSport ?? "").trim();
  if (a) return a;
  return String(organisationSport ?? "").trim();
}

export type ResolvedPrimaryBody = {
  /** Value for `approval.body` and match to `user.body` for reviewers. */
  code: string;
  /** Short display label (sport body name or code). */
  label: string;
};

function normLoose(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * When `application.sport` (or org sport) is free text, map it to a sport-body row without going
 * through Zimbabwe-sports name/code (e.g. matches body `code`, `sport_type`, or display `name`).
 */
function findSportBodyByRoutingHint(
  raw: string | null | undefined,
  sportBodies: ApiSportBody[],
): ApiSportBody | undefined {
  const t = raw?.trim();
  if (!t || !sportBodies.length) return undefined;

  const lower = normLoose(t);
  const upperCompact = t.toUpperCase().replace(/\s+/g, "_");
  const upperSpaced = t.toUpperCase().replace(/_/g, " ").trim();

  if (/^\d+$/.test(t)) {
    const id = Number(t);
    const byId = sportBodies.find((b) => Number(b.id) === id);
    if (byId) return byId;
  }

  for (const b of sportBodies) {
    const code = (b.code ?? "").trim();
    if (code) {
      const cup = code.toUpperCase();
      if (cup === t.toUpperCase()) return b;
      if (cup.replace(/\s+/g, "_") === upperCompact) return b;
      if (cup.replace(/_/g, " ") === upperSpaced) return b;
    }

    const st = (b.sport_type ?? "").trim().toLowerCase();
    if (st) {
      if (st === lower.replace(/\s/g, "_")) return b;
      if (st.replace(/_/g, " ") === lower) return b;
      if (normLoose(st.replace(/_/g, " ")) === lower) return b;
    }

    const name = normLoose(b.name ?? "");
    if (name && name === lower) return b;

    const sn = normLoose(b.short_name ?? "");
    if (sn && sn === lower) return b;

    const ap = sportBodyApprovalCode(b);
    if (ap === t.toUpperCase()) return b;
    if (ap.replace(/_/g, " ") === upperSpaced) return b;
  }

  return undefined;
}

function resolvedFromSportBody(body: ApiSportBody): ResolvedPrimaryBody {
  const codeStr = sportBodyApprovalCode(body);
  const label = String(body.name ?? body.code ?? codeStr).trim() || codeStr;
  return { code: codeStr, label };
}

/**
 * True when a resolved primary routing code is the same “body” as the reviewer’s routing token
 * (case-insensitive; allows substring match like approval rows).
 */
export function reviewerPrimaryCodesEqual(resolvedCode: string, reviewerRoutingBody: string): boolean {
  const a = resolvedCode.trim().toUpperCase();
  const b = reviewerRoutingBody.trim().toUpperCase();
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}

/**
 * Maps organisation / application `sport` text to the first-line approver body using the catalog.
 * Falls back to ZIFA when the catalog is empty or no row matches (legacy data).
 */
export function resolvePrimaryBodyFromOrgSport(
  orgSport: string | null | undefined,
  zimbabweSports: ApiZimbabweSport[],
  sportBodies: ApiSportBody[],
): ResolvedPrimaryBody {
  const raw = orgSport?.trim();
  const legacy = (): ResolvedPrimaryBody => ({ code: "ZIFA", label: "ZIFA" });

  if (!raw) return legacy();
  if (!sportBodies.length) return legacy();

  if (zimbabweSports.length) {
    const lower = raw.toLowerCase();
    for (const row of zimbabweSports) {
      const name = String(row.name ?? "")
        .trim()
        .toLowerCase();
      const code = String(row.code ?? "")
        .trim()
        .toLowerCase();
      const id = String(row.id ?? "").trim().toLowerCase();
      if (name !== lower && code !== lower && id !== lower) continue;

      const bid = row.sport_body_id;
      if (bid == null) continue;

      const body = sportBodies.find((b) => Number(b.id) === Number(bid));
      if (!body) continue;

      return resolvedFromSportBody(body);
    }
  }

  const direct = findSportBodyByRoutingHint(raw, sportBodies);
  if (direct) return resolvedFromSportBody(direct);

  return legacy();
}
