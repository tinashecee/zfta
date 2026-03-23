/**
 * API origin (no trailing slash).
 * - **`VITE_API_BASE_URL` set (see `.env.development` for local dev):** use that origin (e.g.
 *   `http://localhost:8080`). The API must allow CORS from the app origin (e.g. 5173).
 * - **Empty:** requests use relative `/api/...` on the app origin (same-origin). With Qwik SSR
 *   dev, Vite’s `/api` proxy often does not run for browser fetches — prefer `VITE_API_BASE_URL` in dev.
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (raw !== undefined && raw.trim() !== "") {
    return raw.trim().replace(/\/$/, "");
  }
  return "";
}

export async function readApiErrorMessage(res: Response): Promise<string> {
  try {
    const text = await res.clone().text();
    if (!text) return res.statusText || `Error ${res.status}`;
    const j = JSON.parse(text) as { error?: string };
    if (j?.error) return j.error;
  } catch {
    /* ignore */
  }
  return res.statusText || `Error ${res.status}`;
}
