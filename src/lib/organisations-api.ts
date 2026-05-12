import { apiFetchJson } from "~/lib/auth";

/** Full `org_status` enum from the API. */
export const ORG_STATUSES = [
  "incomplete",
  "pending_approval",
  "approved",
  "rejected",
  "suspended",
] as const;
export type OrgStatus = (typeof ORG_STATUSES)[number];

/** Owner may PATCH status only to these values when submitting. */
export const OWNER_ORG_STATUSES = ["incomplete", "pending_approval"] as const;
export type OwnerOrgStatus = (typeof OWNER_ORG_STATUSES)[number];

/**
 * Organisation row — matches backend JSON (`org_name`, `org_type`, `physical_address`, …).
 * Legacy keys kept for older responses.
 */
export type ApiOrganisation = {
  id: string;
  user_id?: string;
  userId?: string;

  org_name?: string;
  name?: string;
  organization_name?: string;

  org_type?: string;
  organization_type?: string;

  physical_address?: string | null;
  street_address?: string | null;
  city?: string | null;
  province?: string | null;

  website?: string | null;
  establishment_date?: string | null;

  division?: string | null;
  division_league?: string | null;

  is_zifa_registered?: boolean | null;
  zifa_registration_active?: string | boolean | null;
  zifa_affiliation_number?: string | null;
  affiliation_number?: string | null;
  moe_registration_number?: string | null;

  principal_name?: string | null;
  is_official_school_sport?: boolean | null;
  sport_in_official_program?: string | boolean | null;
  /** Optional; empty string on PATCH clears stored value to null. */
  sport?: string | null;

  primary_contact_name?: string | null;
  primary_contact_title?: string | null;
  primary_role?: string | null;
  primary_contact_mobile?: string | null;
  primary_mobile?: string | null;
  primary_contact_email?: string | null;
  primary_email?: string | null;

  secondary_contact_name?: string | null;
  secondary_contact_title?: string | null;
  secondary_contact_mobile?: string | null;
  secondary_mobile?: string | null;
  secondary_contact_email?: string | null;

  emergency_contact_name?: string | null;
  emergency_contact_mobile?: string | null;
  emergency_contact_relation?: string | null;

  /** New field: whether the organisation is a PSL affiliate (primarily for football). */
  psl_affiliate?: boolean | null;
  /** Legacy / alternate casing some APIs may emit. */
  pslAffiliate?: boolean | null;
  PslAffiliate?: boolean | null;

  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
};

function unwrapOrganisations(data: unknown): ApiOrganisation[] {
  const visited = new Set<unknown>();
  const queue: unknown[] = [data];
  let steps = 0;

  while (queue.length && steps < 20) {
    steps++;
    const cur = queue.shift();
    if (cur == null) continue;
    if (visited.has(cur)) continue;
    visited.add(cur);

    if (Array.isArray(cur)) return cur as ApiOrganisation[];

    if (typeof cur === "object") {
      const o = cur as Record<string, unknown>;
      if (Array.isArray(o.items)) return o.items as ApiOrganisation[];
      if (Array.isArray(o.organisations)) return o.organisations as ApiOrganisation[];
      if (Array.isArray(o.data)) return o.data as ApiOrganisation[];
      if (Array.isArray(o.results)) return o.results as ApiOrganisation[];

      // Common wrapper shapes: { data: { items: [...] } }, { result: { organisations: [...] } }, etc.
      for (const key of ["items", "organisations", "data", "results", "result"]) {
        if (o[key] && typeof o[key] === "object") queue.push(o[key]);
      }

      // Fallback: enqueue any nested object values (shallow) to find arrays one level down.
      for (const v of Object.values(o)) {
        if (v && typeof v === "object") queue.push(v);
      }
    }
  }

  return [];
}

export async function listOrganisations(params?: { limit?: number; offset?: number }) {
  const q = new URLSearchParams();
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;
  q.set("limit", String(limit));
  q.set("offset", String(offset));
  const r = await apiFetchJson<unknown>(`/api/v1/organisations?${q}`, { method: "GET" });
  if (!r.ok) return r;
  const rows = unwrapOrganisations(r.data);
  if (rows.length === 0 && typeof window !== "undefined") {
    try {
      const topKeys =
        r.data && typeof r.data === "object" && !Array.isArray(r.data) ? Object.keys(r.data as object) : [];
      console.info("[organisations-api] unwrap returned 0 rows", {
        limit,
        offset,
        topKeys,
        rawType: Array.isArray(r.data) ? "array" : typeof r.data,
      });
    } catch {
      // ignore
    }
  }
  return { ok: true as const, data: rows };
}

export async function getOrganisation(id: string) {
  return apiFetchJson<ApiOrganisation>(`/api/v1/organisations/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

/** Name + type for approver lists (dashboard table Organization column + subtitle). */
export type OrganisationRowLabel = {
  /** `org_name` via {@link organisationDisplayName} — never substituted with application event title. */
  name: string;
  /** `org_type` / `organization_type` from the organisation row. */
  orgType: string;
  /** Present when `sport` is set on the organisation row. */
  sport?: string;
};

/**
 * Loads organisation display fields per distinct `organisation_id`.
 * One `GET /api/v1/organisations/:id` per unique id, in parallel.
 */
export async function getOrganisationRowLabelsByIds(
  ids: (string | undefined | null)[],
  fallback = "—",
): Promise<Map<string, OrganisationRowLabel>> {
  const unique = [...new Set(ids.map((id) => String(id ?? "").trim()).filter(Boolean))];
  const map = new Map<string, OrganisationRowLabel>();
  await Promise.all(
    unique.map(async (orgId) => {
      const r = await getOrganisation(orgId);
      if (r.ok) {
        const name = organisationDisplayName(r.data).trim() || fallback;
        const orgTypeRaw = r.data.org_type ?? r.data.organization_type ?? "";
        const orgType = String(orgTypeRaw).trim() || fallback;
        const sportRaw = r.data.sport;
        const sport =
          sportRaw != null && String(sportRaw).trim() !== "" ? String(sportRaw).trim() : undefined;
        map.set(orgId, { name, orgType, ...(sport ? { sport } : {}) });
      } else {
        map.set(orgId, { name: fallback, orgType: fallback });
      }
    }),
  );
  return map;
}

/**
 * @deprecated Prefer {@link getOrganisationRowLabelsByIds} when you need `org_name` without mixing in application fields.
 */
export async function getOrganisationDisplayNamesByIds(
  ids: (string | undefined | null)[],
  fallback = "—",
): Promise<Map<string, string>> {
  const rows = await getOrganisationRowLabelsByIds(ids, fallback);
  const map = new Map<string, string>();
  for (const [id, row] of rows) {
    map.set(id, row.name);
  }
  return map;
}

/** No `user_id` in body — owner is the JWT subject. */
export async function createOrganisation(body: Record<string, unknown>) {
  return apiFetchJson<ApiOrganisation>("/api/v1/organisations", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchOrganisation(id: string, patch: Record<string, unknown>) {
  return apiFetchJson<ApiOrganisation>(`/api/v1/organisations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteOrganisation(id: string) {
  return apiFetchJson<void>(`/api/v1/organisations/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function organisationDisplayName(o: ApiOrganisation): string {
  return (o.org_name ?? o.name ?? o.organization_name ?? "").trim();
}
