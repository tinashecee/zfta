import { apiFetchJson } from "~/lib/auth";

/**
 * Zimbabwe sport category — links organisation `sport` to a {@link ApiSportBody} via `sport_body_id`.
 */
export type ApiZimbabweSport = {
  id: string;
  name?: string;
  code?: string;
  sport_body_id?: number | null;
  created_at?: string;
  updated_at?: string;
};

function unwrapZimbabweSports(data: unknown): ApiZimbabweSport[] {
  if (Array.isArray(data)) return data as ApiZimbabweSport[];
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as ApiZimbabweSport[];
    if (Array.isArray(o.zimbabwe_sports)) return o.zimbabwe_sports as ApiZimbabweSport[];
    if (Array.isArray(o.data)) return o.data as ApiZimbabweSport[];
    if (Array.isArray(o.results)) return o.results as ApiZimbabweSport[];
  }
  return [];
}

export async function listZimbabweSports(params?: { limit?: number; offset?: number }) {
  const q = new URLSearchParams();
  const limit = params?.limit ?? 100;
  const offset = params?.offset ?? 0;
  q.set("limit", String(limit));
  q.set("offset", String(offset));
  const r = await apiFetchJson<unknown>(`/api/v1/zimbabwe-sports?${q}`, { method: "GET" });
  if (!r.ok) return r;
  return { ok: true as const, data: unwrapZimbabweSports(r.data) };
}

export async function getZimbabweSport(id: string) {
  return apiFetchJson<ApiZimbabweSport>(`/api/v1/zimbabwe-sports/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}
