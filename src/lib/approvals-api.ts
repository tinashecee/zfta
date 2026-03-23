import { apiFetchJson } from "~/lib/auth";

/**
 * Approval record — field names follow backend (snake_case).
 * Extend as the API schema is documented.
 */
export type ApiApproval = {
  id: string;
  application_id: string;
  assigned_to?: string | null;
  status?: string;
  /** Reviewer body, e.g. ZIFA, SRC, IMMIGRATION */
  body?: string | null;
  notes?: string | null;
  decision?: string | null;
  /** Set when a decision is recorded (TIMESTAMPTZ from API). */
  decided_at?: string | null;
  /** UUID of the user who recorded the decision. */
  decided_by?: string | null;
  /** Free-text decision / rationale (TEXT from API). */
  decision_note?: string | null;
  created_at?: string;
  updated_at?: string;
};

function unwrapApprovals(data: unknown): ApiApproval[] {
  if (Array.isArray(data)) return data as ApiApproval[];
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as ApiApproval[];
    if (Array.isArray(o.approvals)) return o.approvals as ApiApproval[];
    if (Array.isArray(o.data)) return o.data as ApiApproval[];
    if (Array.isArray(o.results)) return o.results as ApiApproval[];
  }
  return [];
}

/**
 * List approvals. Non–system-admin must pass `application_id` (same access as GET application).
 * System admin may omit `application_id` to list all.
 */
export async function listApprovals(params?: {
  application_id?: string;
  limit?: number;
  offset?: number;
}) {
  const q = new URLSearchParams();
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;
  q.set("limit", String(limit));
  q.set("offset", String(offset));
  if (params?.application_id) {
    q.set("application_id", params.application_id);
  }
  const r = await apiFetchJson<unknown>(`/api/v1/approvals?${q}`, { method: "GET" });
  if (!r.ok) return r;
  return { ok: true as const, data: unwrapApprovals(r.data) };
}

/** System admin, reviewer, or supervisor only. */
export async function createApproval(body: Record<string, unknown>) {
  return apiFetchJson<ApiApproval>("/api/v1/approvals", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** System admin, assigned user, or application applicant. */
export async function getApproval(id: string) {
  return apiFetchJson<ApiApproval>(`/api/v1/approvals/${encodeURIComponent(id)}`, { method: "GET" });
}

/** Staff roles only. Empty string on nullable fields clears them. */
export async function patchApproval(id: string, patch: Record<string, unknown>) {
  return apiFetchJson<ApiApproval>(`/api/v1/approvals/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

/** Staff roles only. **204** on success. */
export async function deleteApproval(id: string) {
  return apiFetchJson<void>(`/api/v1/approvals/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
