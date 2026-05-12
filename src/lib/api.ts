/**
 * API origin (no trailing slash).
 * - `VITE_API_BASE_URL` set: use that origin (e.g. `http://localhost:8080`).
 * - Empty: requests use relative `/api/...` on the app origin (same-origin).
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (raw !== undefined && raw.trim() !== "") {
    return raw.trim().replace(/\/$/, "");
  }
  return "";
}

/**
 * Reads `{ error: string }` from API JSON bodies; falls back to status text.
 * Hosting submit can return `{ error, missing: [] }` — include missing list when present.
 */
export async function readApiErrorMessage(res: Response): Promise<string> {
  try {
    const text = await res.clone().text();
    if (!text) return res.statusText || `Error ${res.status}`;
    const j = JSON.parse(text) as { error?: string; missing?: unknown };
    if (typeof j.error === "string" && j.error) {
      if (Array.isArray(j.missing)) {
        const miss = j.missing.filter((x): x is string => typeof x === "string");
        if (miss.length) return `${j.error} — Missing: ${miss.join(", ")}`;
      }
      return j.error;
    }
  } catch {
    /* ignore */
  }
  return res.statusText || `Error ${res.status}`;
}

