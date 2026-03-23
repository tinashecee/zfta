import { apiFetchBlob } from "~/lib/auth";

/** Logical DB path prefix enforced server-side (`validApplicationDocPath`). */
export const APPLICATION_DOC_PATH_PREFIX = "upload_zfta_docs/";

const MAX_APPLICATION_DOC_PATH_LEN = 255;

/**
 * Mirrors backend `validApplicationDocPath`: prefix `upload_zfta_docs/`, no `..`, length ≤ 255.
 * Stored paths match files under `APPLICATION_DOCS_DIR` (e.g. same string as `support_documents` / `travel_documents`).
 */
export function validApplicationDocPath(storedPath: string): boolean {
  const p = storedPath.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!p || p.length > MAX_APPLICATION_DOC_PATH_LEN) return false;
  if (p.includes("..")) return false;
  return p.startsWith(APPLICATION_DOC_PATH_PREFIX);
}

/**
 * `GET /api/v1/documents/{filepath...}` — Auth: Bearer (same as rest of API).
 *
 * Example: stored path `upload_zfta_docs/abc123-20250321120000.pdf` →
 * `/api/v1/documents/upload_zfta_docs/abc123-20250321120000.pdf`
 * (each path segment is URI-encoded; slashes become normal `/` between segments, not `%2F`,
 * unless a segment itself must be encoded.)
 */
export function documentHttpPathFromStoredPath(storedPath: string): string {
  if (!validApplicationDocPath(storedPath)) return "";
  const normalized = storedPath.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  const segments = normalized.split("/").filter(Boolean).map((seg) => encodeURIComponent(seg));
  return `/api/v1/documents/${segments.join("/")}`;
}

export function displayFileNameFromStoredPath(storedPath: string): string {
  const n = storedPath.trim().replace(/\\/g, "/").split("/").filter(Boolean).pop();
  return n || "document";
}

function friendlyDocumentFetchError(status: number, apiMessage: string): string {
  if (status === 404) return "This document could not be found or is not available.";
  if (status === 403) return "You don’t have permission to open this document.";
  if (status === 401) return "Your session has expired. Sign in again and retry.";
  return apiMessage || `Could not load document (${status}).`;
}

export async function fetchDocumentByStoredPath(storedPath: string) {
  const path = documentHttpPathFromStoredPath(storedPath);
  if (!path) {
    return {
      ok: false as const,
      error: "This document reference is invalid or unsupported.",
      status: undefined as number | undefined,
    };
  }
  const r = await apiFetchBlob(path, { method: "GET" });
  if (!r.ok) {
    return {
      ok: false as const,
      error: friendlyDocumentFetchError(r.status, r.error),
      status: r.status,
    };
  }
  return { ok: true as const, blob: r.blob, contentType: r.contentType };
}
