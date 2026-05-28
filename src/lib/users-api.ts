import { apiFetchJson, coerceSportsBodyToString, normalizeApiUser, type AuthUser } from "~/lib/auth";
import type { ApiSportBody } from "~/lib/sport-bodies-api";
import {
  formatSportBodyRowForDisplay,
  sportBodyApprovalCode,
  sportBodyUserPayloadId,
} from "~/lib/sport-bodies-api";

export const USER_ROLES = ["applicant", "reviewer", "supervisor", "system_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** API enum for reviewer routing — send `sports_body` (sport-body row id as string) when `approver_body` is `SPORTS_BODY`. */
export const APPROVER_BODY_KINDS = ["SPORTS_BODY", "SRC", "AFFILIATE"] as const;
export type ApproverBodyKind = (typeof APPROVER_BODY_KINDS)[number];

/** @deprecated Legacy flat codes; prefer {@link ApproverBodyKind}. */
export const APPROVER_BODIES = ["SRC"] as const;
export type ApproverBody = (typeof APPROVER_BODIES)[number];

/** @deprecated */
export const APPROVER_BODY_OPTIONS = ["", ...APPROVER_BODIES] as const;

export function displayApproverBodyKind(kind: string | null | undefined): string {
  const k = (kind ?? "").trim().toUpperCase();
  if (k === "SPORTS_BODY") return "Sports body";
  if (k === "SRC") return "SRC";
  if (k === "AFFILIATE") return "Affiliate";
  if (k === "IMMIGRATION") return "Legacy (no longer supported)";
  return (kind ?? "").trim() || "—";
}

/**
 * Populate admin/sign-up form from API user. Uses `approver_body` + `sports_body` (id string) or legacy ids, with fallbacks
 * for legacy `body` + catalog match.
 */
function findSportBodyRowByStoredSportsBody(
  rows: ApiSportBody[],
  stored: string | null | undefined,
): ApiSportBody | undefined {
  const t = stored?.trim();
  if (!t) return undefined;
  if (/^\d+$/.test(t)) {
    const id = Number(t);
    const byId = rows.find((x) => Number(x.id) === id);
    if (byId) return byId;
  }
  const byName = rows.find((x) => (x.name ?? "").trim() === t);
  if (byName) return byName;
  return rows.find((x) => sportBodyApprovalCode(x).toUpperCase() === t.toUpperCase());
}

/**
 * Sport-body row for the signed-in reviewer when `sports_body` / `sport_body_id` / legacy `body` maps to the catalog.
 */
export function resolveSportBodyRowForReviewerUser(
  user: Pick<AuthUser, "body" | "approver_body" | "sport_body_id" | "sports_body"> | null | undefined,
  sportBodies: ApiSportBody[],
): ApiSportBody | undefined {
  if (!user || sportBodies.length === 0) return undefined;
  const ab = (user.approver_body ?? "").trim().toUpperCase();
  if (ab === "IMMIGRATION") return undefined;
  if (ab === "SRC") return undefined;
  if (ab === "AFFILIATE") return undefined;
  if (!ab) {
    const loose = coerceSportsBodyToString(user.sports_body);
    if (loose) {
      const row = findSportBodyRowByStoredSportsBody(sportBodies, loose);
      if (row) return row;
    }
  }
  if (ab === "SPORTS_BODY") {
    const stored = coerceSportsBodyToString(user.sports_body);
    if (stored) {
      const row = findSportBodyRowByStoredSportsBody(sportBodies, stored);
      if (row) return row;
    }
    if (user.sport_body_id != null && Number(user.sport_body_id) > 0) {
      const sid = Number(user.sport_body_id);
      return sportBodies.find((x) => Number(x.id) === sid);
    }
    return undefined;
  }
  if (user.sport_body_id != null && Number(user.sport_body_id) > 0) {
    const sid = Number(user.sport_body_id);
    return sportBodies.find((x) => Number(x.id) === sid);
  }
  const legacy = (user.body ?? "").trim();
  if (!legacy) return undefined;
  const uLegacy = legacy.toUpperCase();
  if (uLegacy === "SRC") return undefined;
  if (uLegacy === "IMMIGRATION") return undefined;
  if (uLegacy === "SPORT_BODY" || uLegacy === "SPORTS_BODY") return undefined;
  return sportBodies.find((x) => sportBodyApprovalCode(x).toUpperCase() === uLegacy);
}

export function inferApproverFormFromUser(
  u: ApiUser,
  sportBodies: ApiSportBody[],
): { kind: ApproverBodyKind | ""; sportsBodyCode: string } {
  const ab = (u.approver_body ?? "").trim().toUpperCase();
  if (ab === "SPORTS_BODY") {
    const stored = coerceSportsBodyToString(u.sports_body);
    if (stored) {
      const row = findSportBodyRowByStoredSportsBody(sportBodies, stored);
      return {
        kind: "SPORTS_BODY",
        sportsBodyCode: row ? sportBodyUserPayloadId(row) : /^\d+$/.test(stored) ? stored : "",
      };
    }
    if (u.sport_body_id != null && u.sport_body_id > 0) {
      const sid = Number(u.sport_body_id);
      const row = sportBodies.find((x) => Number(x.id) === sid);
      return { kind: "SPORTS_BODY", sportsBodyCode: row ? sportBodyUserPayloadId(row) : String(u.sport_body_id) };
    }
    return { kind: "SPORTS_BODY", sportsBodyCode: "" };
  }
  if (ab === "SRC") return { kind: "SRC", sportsBodyCode: "" };
  if (ab === "AFFILIATE") return { kind: "AFFILIATE", sportsBodyCode: "" };
  if (ab === "IMMIGRATION") return { kind: "", sportsBodyCode: "" };

  const legacy = (u.body ?? "").trim().toUpperCase();
  if (legacy === "AFFILIATE") return { kind: "AFFILIATE", sportsBodyCode: "" };
  if (legacy === "SRC") return { kind: "SRC", sportsBodyCode: "" };
  if (legacy === "IMMIGRATION") return { kind: "", sportsBodyCode: "" };
  if (u.sport_body_id != null && u.sport_body_id > 0) {
    const sid = Number(u.sport_body_id);
    const row = sportBodies.find((x) => Number(x.id) === sid);
    return {
      kind: "SPORTS_BODY",
      sportsBodyCode: row ? sportBodyUserPayloadId(row) : "",
    };
  }
  for (const row of sportBodies) {
    if (sportBodyApprovalCode(row) === legacy) {
      return { kind: "SPORTS_BODY", sportsBodyCode: sportBodyUserPayloadId(row) };
    }
  }
  return { kind: "", sportsBodyCode: "" };
}

/**
 * Reviewer routing is owned by {@link "~/lib/approval-rules"}; re-exported for back-compat.
 */
import { reviewerRoutingBodyFromSession } from "~/lib/approval-rules";
export { reviewerRoutingBodyFromSession };

/**
 * Short label for approver chrome: sport-body **name** when the user maps to a catalog row; otherwise routing token (SRC, code).
 */
export function reviewerPortalAffiliationLabel(
  user: Pick<AuthUser, "body" | "approver_body" | "sport_body_id" | "sports_body"> | null | undefined,
  sportBodies: ApiSportBody[],
): string | null {
  if (!user) return null;
  const ab = (user.approver_body ?? "").trim().toUpperCase();
  if (ab === "SRC") {
    return reviewerRoutingBodyFromSession(user, sportBodies);
  }
  const row = resolveSportBodyRowForReviewerUser(user, sportBodies);
  if (row) {
    const name = (row.name ?? "").trim();
    if (name) return name;
    return sportBodyApprovalCode(row);
  }
  return reviewerRoutingBodyFromSession(user, sportBodies);
}

/** Table / detail line for reviewer assignment. */
export function formatUserApproverSummary(u: ApiUser, sportBodies?: ApiSportBody[]): string {
  const ab = (u.approver_body ?? "").trim().toUpperCase();
  if (ab === "SRC") return displayApproverBodyKind(ab);

  const row =
    sportBodies && sportBodies.length > 0
      ? resolveSportBodyRowForReviewerUser(u as AuthUser, sportBodies)
      : undefined;
  if (row) return formatSportBodyRowForDisplay(row);

  if (ab === "SPORTS_BODY") {
    const rawCode = coerceSportsBodyToString(u.sports_body);
    if (rawCode) return `Sport body (id ${rawCode} — not in catalog)`;
    if (u.sport_body_id != null && u.sport_body_id > 0) {
      return `Sport body (id ${u.sport_body_id} — not in catalog)`;
    }
    return "Sport body (not assigned)";
  }
  if (ab) return displayApproverBodyKind(ab);
  if (u.body?.trim()) {
    const bu = u.body.trim().toUpperCase();
    if (bu === "SPORT_BODY" || bu === "SPORTS_BODY") {
      return "Sport body (missing link to sport_body row — try reloading after sign-in or contact admin)";
    }
    return u.body.trim();
  }
  return "—";
}

export const ACCOUNT_STATUSES = [
  "pending_profile",
  "pending_approval",
  "active",
  "suspended",
  "rejected",
  "inactive",
] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/**
 * Map a single user JSON object to `ApiUser` (snake_case), including camelCase aliases some APIs emit.
 */
export function normalizeUserApiRow(u: unknown): ApiUser {
  const r = u as Record<string, unknown>;
  const base = u as ApiUser;
  const rawAppr = r.approver_body ?? r["approverBody"] ?? r["ApproverBody"];

  const rawOrgId = r.organisation_id ?? r["organisationId"] ?? r["organisation_id"] ?? r["organisationID"];
  let organisation_id: string | null = base.organisation_id ?? null;
  if (typeof rawOrgId === "string") {
    const t = rawOrgId.trim();
    organisation_id = t.length ? t : null;
  } else if (rawOrgId != null && rawOrgId !== "") {
    organisation_id = String(rawOrgId).trim() || null;
  }

  const rawSportsVarchar = r.sports_body ?? r["sportsBody"];
  let sports_body: string | null = base.sports_body ?? null;
  if (typeof rawSportsVarchar === "string") {
    const t = rawSportsVarchar.trim();
    sports_body = t.length ? t : null;
  } else if (typeof rawSportsVarchar === "number" && Number.isFinite(rawSportsVarchar)) {
    sports_body = String(Math.trunc(rawSportsVarchar));
  }

  const rawNumericId =
    r.sport_body_id ?? r["sportBodyId"] ?? r["sports_body_id"] ?? r["sportsBodyId"];
  let sport_body_id: number | null = base.sport_body_id ?? null;
  if (rawNumericId !== undefined && rawNumericId !== null && rawNumericId !== "") {
    const n = typeof rawNumericId === "number" ? rawNumericId : Number(String(rawNumericId).trim());
    if (Number.isFinite(n)) sport_body_id = n;
  }
  /** Some APIs use `sport_body` (singular) for the FK to `sport_bodies.id`. */
  const rawSportBodyCol = r.sport_body ?? r["sportBody"];
  if (rawSportBodyCol !== undefined && rawSportBodyCol !== null && rawSportBodyCol !== "") {
    if (typeof rawSportBodyCol === "number" && Number.isFinite(rawSportBodyCol)) {
      if (sport_body_id == null || sport_body_id <= 0) sport_body_id = rawSportBodyCol;
    } else if (typeof rawSportBodyCol === "string") {
      const t = rawSportBodyCol.trim();
      if (t && /^\d+$/.test(t)) {
        if (!sports_body) sports_body = t;
        const n = Number(t);
        if (Number.isFinite(n) && (sport_body_id == null || sport_body_id <= 0)) sport_body_id = n;
      }
    }
  }
  if (
    sports_body &&
    /^\d+$/.test(sports_body) &&
    (sport_body_id == null || sport_body_id <= 0)
  ) {
    const n = Number(sports_body);
    if (Number.isFinite(n)) sport_body_id = n;
  }

  let approver_body: string | null = base.approver_body ?? null;
  if (rawAppr !== undefined && rawAppr !== null) {
    const s = String(rawAppr).trim();
    approver_body = s.length ? s : null;
  }

  const rawMobile = r.mobile_number ?? r["mobileNumber"] ?? r["phone"] ?? r["phone_number"];
  let mobile_number: string | null | undefined = base.mobile_number ?? null;
  if (typeof rawMobile === "string") {
    const t = rawMobile.trim();
    mobile_number = t.length ? t : null;
  } else if (typeof rawMobile === "number" && Number.isFinite(rawMobile)) {
    mobile_number = String(Math.trunc(rawMobile));
  }

  return { ...base, organisation_id, sport_body_id, approver_body, sports_body, mobile_number };
}

/**
 * Map `GET /api/v1/me` JSON into session `AuthUser` (camelCase + varchar `sports_body` → numeric id).
 * Some backends put `SPORT_BODY` / `SPORTS_BODY` in legacy `body` instead of `approver_body`.
 */
export function meResponseToAuthUser(raw: unknown): AuthUser {
  const row = normalizeUserApiRow(raw);
  const r = raw as Record<string, unknown>;
  const bodyRaw = row.body ?? r.body;
  const bodyStuffed =
    typeof bodyRaw === "string" ? bodyRaw.trim().toUpperCase() : String(bodyRaw ?? "").trim().toUpperCase();

  let approver_body = row.approver_body;
  if (!approver_body?.trim() && (bodyStuffed === "SPORT_BODY" || bodyStuffed === "SPORTS_BODY")) {
    approver_body = "SPORTS_BODY";
  }

  return normalizeApiUser({
    ...r,
    ...row,
    approver_body: approver_body ?? row.approver_body ?? null,
  } as Partial<AuthUser> & Record<string, unknown>);
}

/** User row from GET/PATCH/POST /api/v1/users */
export type ApiUser = {
  id: string;
  email: string;
  full_name: string;
  mobile_number?: string | null;
  organisation_id?: string | null;
  /** Legacy flat reviewer code; may still be set for older rows. */
  body?: string | null;
  /** Reviewer kind: SPORTS_BODY, SRC */
  approver_body?: string | null;
  /** Sport-body row id as string (varchar) when `approver_body` is SPORTS_BODY */
  sports_body?: string | null;
  /** Legacy numeric FK when API still exposes it */
  sport_body_id?: number | null;
  role: string;
  status: string;
  status_reason?: string | null;
  email_verified: boolean;
  email_verified_at?: string | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
};

export async function listUsers(params?: { limit?: number; offset?: number }) {
  const limit = Math.min(params?.limit ?? 50, 500);
  const offset = params?.offset ?? 0;
  const q = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const r = await apiFetchJson<ApiUser[]>(`/api/v1/users?${q}`, { method: "GET" });
  if (!r.ok) return r;
  return { ok: true as const, data: r.data.map(normalizeUserApiRow) };
}

export async function getUser(id: string) {
  const r = await apiFetchJson<ApiUser>(`/api/v1/users/${encodeURIComponent(id)}`, { method: "GET" });
  if (!r.ok) return r;
  return { ok: true as const, data: normalizeUserApiRow(r.data) };
}

export async function createUser(body: {
  email: string;
  password: string;
  full_name: string;
  mobile_number?: string;
  organisation_id?: string | null;
  body?: string;
  approver_body?: string;
  /** Sport-body row id as string (varchar) when `approver_body` is `SPORTS_BODY` */
  sports_body?: string | null;
  role?: string;
  status?: string;
  status_reason?: string;
  email_verified?: boolean;
}) {
  const r = await apiFetchJson<ApiUser>("/api/v1/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!r.ok) return r;
  return { ok: true as const, data: normalizeUserApiRow(r.data) };
}

export async function patchUser(id: string, patch: Record<string, unknown>) {
  const r = await apiFetchJson<ApiUser>(`/api/v1/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  if (!r.ok) return r;
  return { ok: true as const, data: normalizeUserApiRow(r.data) };
}

export async function deleteUser(id: string) {
  return apiFetchJson<void>(`/api/v1/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function formatUserDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function roleBadgeClass(role: string): string {
  const r = role.toLowerCase();
  if (r === "system_admin") return "bg-tertiary text-white";
  if (r === "reviewer") return "bg-primary text-white";
  if (r === "supervisor") return "bg-secondary-container text-on-secondary-container";
  return "bg-surface-container-highest text-on-surface";
}

export function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "active" || s === "activated") return "bg-primary-fixed text-on-primary-fixed-variant";
  if (s === "pending_profile" || s === "pending_approval") {
    return "bg-secondary-fixed text-on-secondary-fixed-variant";
  }
  if (s === "rejected" || s === "suspended") return "bg-error-container text-on-error-container";
  if (s === "inactive") return "bg-surface-container-high text-on-surface-variant";
  if (s.includes("pending")) return "bg-secondary-fixed text-on-secondary-fixed-variant";
  return "bg-surface-container-high text-on-surface-variant";
}

/** Map API values into account_status select (handles legacy `activated`). */
export function normalizeAccountStatusForForm(status: string): AccountStatus {
  const s = status.trim().toLowerCase();
  if (s === "activated") return "active";
  if ((ACCOUNT_STATUSES as readonly string[]).includes(s)) return s as AccountStatus;
  return "pending_profile";
}

export function normalizeApproverBodyForForm(body: string | null | undefined): string {
  if (!body?.trim()) return "";
  return body.trim().toUpperCase();
}

export function normalizeUserRoleForForm(role: string): UserRole {
  const r = role.trim().toLowerCase();
  if ((USER_ROLES as readonly string[]).includes(r)) return r as UserRole;
  return "applicant";
}
