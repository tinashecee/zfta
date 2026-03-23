import { apiFetchBlob, apiFetchJson } from "~/lib/auth";

/**
 * Certificate row from GET /api/v1/applications/{id}/certificate or POST /api/v1/certificates (201).
 * Field names follow backend (snake_case).
 */
export type ApiCertificate = {
  id?: string;
  application_id?: string;
  certificate_number?: string | null;
  org_name?: string | null;
  file_name?: string | null;
  file_path?: string | null;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  issued_by?: string | null;
  issued_at?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  is_revoked?: boolean | null;
  revoked_at?: string | null;
  revoked_by?: string | null;
  revocation_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

/** POST /api/v1/certificates — applicants must send user_id (JWT sub); staff may ignore. */
export type CreateCertificatePayload = {
  application_id: string;
  org_name: string;
  user_id: string;
};

export function certificateFileNameFromRecord(c: ApiCertificate | null | undefined): string {
  if (!c) return "";
  const raw = c.file_name;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return "";
}

export function certificateFilePathFromRecord(c: ApiCertificate | null | undefined): string {
  if (!c) return "";
  const raw = c.file_path;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return "";
}

/** True if we can open the PDF via file name or stored path. */
export function hasCertificateOpenableFile(c: ApiCertificate | null | undefined): boolean {
  return Boolean(certificateFileNameFromRecord(c) || certificateFilePathFromRecord(c));
}

export async function getApplicationCertificate(applicationId: string) {
  return apiFetchJson<ApiCertificate>(
    `/api/v1/applications/${encodeURIComponent(applicationId)}/certificate`,
    { method: "GET" },
  );
}

export async function createCertificate(payload: CreateCertificatePayload) {
  return apiFetchJson<ApiCertificate>("/api/v1/certificates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * A) By basename — GET /api/v1/certificates/files/{file_name}
 */
export async function fetchCertificateFile(fileName: string) {
  const name = fileName.trim();
  if (!name) {
    return { ok: false as const, status: undefined as number | undefined, error: "Missing file name." };
  }
  return apiFetchBlob(`/api/v1/certificates/files/${encodeURIComponent(name)}`, { method: "GET" });
}

/**
 * B) By stored path — GET /api/v1/certificates/file?file_path=...
 */
export async function fetchCertificateFileByPath(filePath: string) {
  const p = filePath.trim();
  if (!p) {
    return { ok: false as const, status: undefined as number | undefined, error: "Missing file path." };
  }
  const q = new URLSearchParams();
  q.set("file_path", p);
  return apiFetchBlob(`/api/v1/certificates/file?${q.toString()}`, { method: "GET" });
}

/**
 * Prefer file name (A); fall back to file path (B).
 */
export async function fetchCertificatePdfBlob(c: ApiCertificate | null | undefined) {
  const name = certificateFileNameFromRecord(c);
  if (name) return fetchCertificateFile(name);
  const path = certificateFilePathFromRecord(c);
  if (path) return fetchCertificateFileByPath(path);
  return {
    ok: false as const,
    status: undefined as number | undefined,
    error: "No certificate file name or file path is available.",
  };
}
