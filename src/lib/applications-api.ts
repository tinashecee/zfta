import { apiFetchFormData, apiFetchJson } from "~/lib/auth";
import type { ApiTravelPersonnel, TravelPersonnelInput } from "~/lib/travel-personnel-types";

/** 201 response from `POST /api/v1/applications/attachments`. */
export type ApplicationAttachmentUploadResponse = {
  support_documents: string | null;
  travel_documents: string | null;
};

export type OutgoingTourUploadResponse = {
  compliance_declaration_doc: string | null;
  invitation_letter_doc: string | null;
  national_assoc_clearance_doc: string | null;
  funding_proof_doc: string | null;
  liabilities_breakdown_doc: string | null;
};

export type OutgoingTourComplianceUploadResponse = {
  compliance_declaration_doc: string | null;
};

export type IncomingTourUploadResponse = {
  statutory_compliance_declaration_doc: string | null;
  funding_proof_doc: string | null;
};

export type HostingCompetitionUploadResponse = {
  hosting_plan_doc: string | null;
  budget_doc: string | null;
  funding_proof_doc: string | null;
  roll_out_plan_doc: string | null;
  organising_committee_doc: string | null;
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
  compliance_declaration_doc?: string | null;
  statutory_compliance_declaration_doc?: string | null;
  invitation_letter_doc?: string | null;
  national_assoc_clearance_doc?: string | null;
  passport_pack_doc?: string | null;
  funding_proof_doc?: string | null;
  liabilities_breakdown_doc?: string | null;
  applicant_id?: string;
  organisation_id?: string;
  /** Sport / discipline for routing (varchar on API). */
  sport?: string | null;
  status?: string;
  /** Client / future API: outgoing_tour | incoming_tour | hosting_competition */
  application_type?: string | null;
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

export async function uploadOutgoingTourDocuments(files: {
  compliance_declaration: File;
  invitation_letter: File;
  national_assoc_clearance: File;
  funding_proof: File;
  liabilities_breakdown: File;
}): Promise<{ ok: true; data: OutgoingTourUploadResponse } | { ok: false; status: number; error: string }> {
  const fd = new FormData();
  fd.append("compliance_declaration", files.compliance_declaration);
  fd.append("invitation_letter", files.invitation_letter);
  fd.append("national_assoc_clearance", files.national_assoc_clearance);
  fd.append("funding_proof", files.funding_proof);
  fd.append("liabilities_breakdown", files.liabilities_breakdown);
  return apiFetchFormData<OutgoingTourUploadResponse>("/api/v1/outgoing-tours/uploads", fd);
}

export async function uploadOutgoingTourComplianceDeclaration(files: {
  compliance_declaration: File;
}): Promise<
  { ok: true; data: OutgoingTourComplianceUploadResponse } | { ok: false; status: number; error: string }
> {
  const fd = new FormData();
  fd.append("compliance_declaration", files.compliance_declaration);
  return apiFetchFormData<OutgoingTourComplianceUploadResponse>("/api/v1/outgoing-tours/uploads/compliance", fd);
}

export async function uploadIncomingTourDocuments(files: {
  statutory_compliance_declaration: File;
  funding_proof: File;
}): Promise<{ ok: true; data: IncomingTourUploadResponse } | { ok: false; status: number; error: string }> {
  const fd = new FormData();
  fd.append("statutory_compliance_declaration", files.statutory_compliance_declaration);
  fd.append("funding_proof", files.funding_proof);
  return apiFetchFormData<IncomingTourUploadResponse>("/api/v1/incoming-tours/uploads", fd);
}

export async function uploadHostingCompetitionDocuments(files: {
  hosting_plan: File;
  budget: File;
  funding_proof: File;
  roll_out_plan: File;
  organising_committee_composition: File;
}): Promise<{ ok: true; data: HostingCompetitionUploadResponse } | { ok: false; status: number; error: string }> {
  const fd = new FormData();
  fd.append("hosting_plan", files.hosting_plan);
  fd.append("budget", files.budget);
  fd.append("funding_proof", files.funding_proof);
  fd.append("roll_out_plan", files.roll_out_plan);
  fd.append("organising_committee_composition", files.organising_committee_composition);
  return apiFetchFormData<HostingCompetitionUploadResponse>("/api/v1/hosting-competitions/uploads", fd);
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

export async function createOutgoingTour(body: {
  application: Record<string, unknown>;
  personnel: TravelPersonnelInput[];
}) {
  // Outgoing tours endpoint expects a flat JSON body (not nested under `application`).
  const payload: Record<string, unknown> = {
    ...body.application,
    ...(Array.isArray(body.personnel) && body.personnel.length ? { personnel: body.personnel } : {}),
  };
  const r = await apiFetchJson<ApiApplication>("/api/v1/outgoing-tours", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!r.ok) return r;
  return { ok: true as const, data: normalizeApplicationJson(r.data) };
}

export async function createIncomingTour(body: {
  application: Record<string, unknown>;
  personnel: TravelPersonnelInput[];
}) {
  const payload: Record<string, unknown> = {
    ...body.application,
    personnel: body.personnel,
  };
  const r = await apiFetchJson<ApiApplication>("/api/v1/incoming-tours", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!r.ok) return r;
  return { ok: true as const, data: normalizeApplicationJson(r.data) };
}

export async function createHostingCompetition(body: {
  application: Record<string, unknown>;
  personnel: TravelPersonnelInput[];
}) {
  const payload: Record<string, unknown> = {
    ...body.application,
    personnel: body.personnel,
  };
  const r = await apiFetchJson<ApiApplication>("/api/v1/hosting-competitions", {
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
