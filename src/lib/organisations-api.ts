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

  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
};

function unwrapOrganisations(data: unknown): ApiOrganisation[] {
  if (Array.isArray(data)) return data as ApiOrganisation[];
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as ApiOrganisation[];
    if (Array.isArray(o.organisations)) return o.organisations as ApiOrganisation[];
    if (Array.isArray(o.data)) return o.data as ApiOrganisation[];
    if (Array.isArray(o.results)) return o.results as ApiOrganisation[];
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
  return { ok: true as const, data: unwrapOrganisations(r.data) };
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
        map.set(orgId, { name, orgType });
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

/** Compare org owner to logged-in user (JWT `sub` ↔ `user_id` on the row). */
export function organisationOwnedByUser(org: ApiOrganisation, userId: string): boolean {
  const uid = org.user_id ?? org.userId;
  return String(uid ?? "").trim() === String(userId).trim();
}

/**
 * Fetches `GET /api/v1/organisations` and returns the row whose `user_id` matches `userId`, or `null`.
 */
export async function getOrganisationForUser(userId: string) {
  const r = await listOrganisations({ limit: 100, offset: 0 });
  if (!r.ok) return r;
  const organisation = r.data.find((o) => organisationOwnedByUser(o, userId)) ?? null;
  return { ok: true as const, organisation };
}
