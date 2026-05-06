import { apiFetchJson } from "~/lib/auth";

/**
 * National sport governing body — `code` is the value stored on reviewer `body` and approval rows.
 */
export type ApiSportBody = {
  id: number;
  /** Display name, e.g. "Cricket Zimbabwe" */
  name?: string;
  /** Approval / reviewer `body` code, often uppercase sport name */
  code?: string;
  /** Stable sport key from the catalog, e.g. `cricket` */
  sport_type?: string | null;
  /** Omitted in JSON when unset (omitempty). */
  short_name?: string;
  created_at?: string;
  updated_at?: string;
};

function unwrapSportBodies(data: unknown): ApiSportBody[] {
  if (Array.isArray(data)) return data as ApiSportBody[];
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as ApiSportBody[];
    if (Array.isArray(o.sport_bodies)) return o.sport_bodies as ApiSportBody[];
    if (Array.isArray(o.data)) return o.data as ApiSportBody[];
    if (Array.isArray(o.results)) return o.results as ApiSportBody[];
  }
  return [];
}

export async function listSportBodies(params?: { limit?: number; offset?: number }) {
  const q = new URLSearchParams();
  const limit = params?.limit ?? 100;
  const offset = params?.offset ?? 0;
  q.set("limit", String(limit));
  q.set("offset", String(offset));
  const r = await apiFetchJson<unknown>(`/api/v1/sport-bodies?${q}`, { method: "GET" });
  if (!r.ok) return r;
  return { ok: true as const, data: unwrapSportBodies(r.data) };
}

export async function getSportBody(id: number) {
  return apiFetchJson<ApiSportBody>(`/api/v1/sport-bodies/${id}`, { method: "GET" });
}

/** POST body: `short_name` optional. */
export async function createSportBody(body: Record<string, unknown>) {
  return apiFetchJson<ApiSportBody>("/api/v1/sport-bodies", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * PATCH body: optional `short_name`; if `clear_short_name` is true, stored short name is cleared
 * (otherwise `short_name` updates the field when provided).
 */
export async function patchSportBody(
  id: number,
  patch: Record<string, unknown> & { clear_short_name?: boolean },
) {
  return apiFetchJson<ApiSportBody>(`/api/v1/sport-bodies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteSportBody(id: number) {
  return apiFetchJson<void>(`/api/v1/sport-bodies/${id}`, { method: "DELETE" });
}

/** Stable uppercase code for routing (falls back to `sport_type`, then name). */
export function sportBodyApprovalCode(b: ApiSportBody): string {
  const c = (b.code ?? "").trim();
  if (c) return c.toUpperCase();
  const st = (b.sport_type ?? "").trim();
  if (st) return st.toUpperCase().replace(/\s+/g, "_");
  const n = (b.name ?? "").trim();
  return n ? n.toUpperCase().replace(/\s+/g, "_") : `BODY_${b.id}`;
}

/** One-line label from a `sport_body` row for UI (not the raw `SPORTS_BODY` enum). */
export function formatSportBodyRowForDisplay(b: ApiSportBody): string {
  const name = (b.name ?? "").trim();
  const code = sportBodyApprovalCode(b);
  const shortN = (b.short_name ?? "").trim();
  const st = (b.sport_type ?? "").trim();
  if (name) {
    const bits = [name];
    if (shortN && shortN.toLowerCase() !== name.toLowerCase()) bits.push(shortN);
    const tail = code && code.replace(/_/g, " ").toLowerCase() !== name.toLowerCase() ? ` (${code})` : "";
    let s = bits.join(" · ") + tail;
    if (st) s += ` — ${st}`;
    return s;
  }
  if (shortN) return st ? `${shortN} — ${st}` : `${shortN} (${code})`;
  if (st) return `${st} (${code})`;
  return `${code} · id ${b.id}`;
}

/**
 * Value for `users.sports_body` when the API stores the sport-body row id as a string (varchar / text).
 */
export function sportBodyUserPayloadId(b: ApiSportBody): string {
  return String(b.id);
}

/** Fixed national bodies listed before/after sport-body codes from `GET /api/v1/sport-bodies`. */
export const APPROVER_BODY_FIXED_FIRST = ["ZIFA", "SRC"] as const;

const RESERVED_APPROVER_BODY_CODES = new Set<string>(
  [...APPROVER_BODY_FIXED_FIRST].map((s) => s.toUpperCase()),
);

/**
 * Values for reviewer `body` `<select>`: ZIFA, SRC, then sorted unique API codes (excluding reserved slots).
 */
export function approverBodySelectValuesFromSportBodies(rows: ApiSportBody[]): string[] {
  const fromApi = rows.map((b) => sportBodyApprovalCode(b));
  const unique = [...new Set(fromApi.map((c) => c.toUpperCase()))].filter(
    (c) => !RESERVED_APPROVER_BODY_CODES.has(c),
  );
  unique.sort((a, b) => a.localeCompare(b));
  return [...APPROVER_BODY_FIXED_FIRST, ...unique];
}

/** Rows for labelled options — omits bodies whose code duplicates ZIFA / SRC. */
export function sportBodiesForApproverSelect(rows: ApiSportBody[]): ApiSportBody[] {
  return rows.filter((b) => !RESERVED_APPROVER_BODY_CODES.has(sportBodyApprovalCode(b)));
}
