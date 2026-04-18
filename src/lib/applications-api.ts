import { apiFetchFormData, apiFetchJson } from "~/lib/auth";
import type { ApiTravelPersonnel, TravelPersonnelInput } from "~/lib/travel-personnel-types";

/** 201 response from `POST /api/v1/applications/attachments`. */
export type ApplicationAttachmentUploadResponse = {
  support_documents: string | null;
  travel_documents: string | null;
};

/**
 * Application row from API — list items omit `personnel`; GET single includes it.
 * Field names follow backend (snake_case).
 */
export type ApiApplication = {
  id: string;
  reference_number?: string;
  /** Stored file paths from attachment upload. */
  support_documents?: string | null;
  travel_documents?: string | null;
  applicant_id?: string;
  organisation_id?: string;
  /** Sport / discipline for routing (varchar on API). */
  sport?: string | null;
  status?: string;
  priority?: string;
  priority_reason?: string | null;
  event_type?: string;
  tournament_name?: string | null;
  tournament_name_other?: string | null;
  opponent_team_name?: string | null;
  opponent_team_country?: string | null;
  training_facility_name?: string | null;
  training_camp_objective?: string | null;
  event_description?: string | null;
  event_display_name?: string;
  host_country?: string;
  host_city?: string | null;
  port_of_entry?: string | null;
  port_of_exit?: string | null;
  departure_date?: string;
  return_date?: string;
  player_count?: number;
  officials_count?: number;
  total_travellers?: number;
  age_group?: string;
  gender_category?: string;
  travel_mode?: string;
  emergency_contact_name?: string | null;
  emergency_contact_mobile?: string | null;
  emergency_contact_relation?: string | null;
  declaration_accepted?: boolean;
  personnel?: ApiTravelPersonnel[];
  /** When the application was submitted (if distinct from `created_at`). */
  submitted_at?: string;
  created_at?: string;
  updated_at?: string;
};

/** Multipart: `support_document` and/or `travel_document` (at least one). 201 → path strings. */
export async function uploadApplicationAttachments(files: {
  support_document?: File | null;
  travel_document?: File | null;
}): Promise<
  { ok: true; data: ApplicationAttachmentUploadResponse } | { ok: false; status: number; error: string }
> {
  if (!files.support_document && !files.travel_document) {
    return {
      ok: false,
      status: 400,
      error: "Attach at least one document: support (invitation) and/or travel (identity) file.",
    };
  }
  const fd = new FormData();
  if (files.support_document) fd.append("support_document", files.support_document);
  if (files.travel_document) fd.append("travel_document", files.travel_document);
  return apiFetchFormData<ApplicationAttachmentUploadResponse>("/api/v1/applications/attachments", fd);
}

/** Accept snake_case or common JSON aliases for routing field `sport`. */
function normalizeApplicationJson(raw: unknown): ApiApplication {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const base = { ...row } as ApiApplication;
  if (base.sport == null || String(base.sport).trim() === "") {
    const alt = row["Sport"] ?? row["sport_name"] ?? row["sportName"];
    if (alt != null && String(alt).trim() !== "") base.sport = String(alt).trim();
  }
  return base;
}

function unwrapApplications(data: unknown): ApiApplication[] {
  const mapRows = (rows: unknown[]): ApiApplication[] =>
    rows.map((x) => normalizeApplicationJson(x));
  if (Array.isArray(data)) return mapRows(data);
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.items)) return mapRows(o.items);
    if (Array.isArray(o.applications)) return mapRows(o.applications);
    if (Array.isArray(o.data)) return mapRows(o.data);
    if (Array.isArray(o.results)) return mapRows(o.results);
  }
  return [];
}

export async function listApplications(params?: { limit?: number; offset?: number }) {
  const q = new URLSearchParams();
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;
  q.set("limit", String(limit));
  q.set("offset", String(offset));
  const r = await apiFetchJson<unknown>(`/api/v1/applications?${q}`, { method: "GET" });
  if (!r.ok) return r;
  return { ok: true as const, data: unwrapApplications(r.data) };
}

export async function getApplication(id: string) {
  const r = await apiFetchJson<ApiApplication>(`/api/v1/applications/${encodeURIComponent(id)}`, {
    method: "GET",
  });
  if (!r.ok) return r;
  return { ok: true as const, data: normalizeApplicationJson(r.data) };
}

/**
 * POST /api/v1/applications: backend expects application fields at the **root** of the JSON
 * object, plus a `personnel` array — not nested under `application`.
 */
export async function createApplication(body: {
  application: Record<string, unknown>;
  personnel: TravelPersonnelInput[];
}) {
  const payload: Record<string, unknown> = {
    ...body.application,
    personnel: body.personnel,
  };
  const r = await apiFetchJson<ApiApplication>("/api/v1/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!r.ok) return r;
  return { ok: true as const, data: normalizeApplicationJson(r.data) };
}

export async function patchApplication(id: string, patch: Record<string, unknown>) {
  const r = await apiFetchJson<ApiApplication>(`/api/v1/applications/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  if (!r.ok) return r;
  return { ok: true as const, data: normalizeApplicationJson(r.data) };
}

export async function deleteApplication(id: string) {
  return apiFetchJson<void>(`/api/v1/applications/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
