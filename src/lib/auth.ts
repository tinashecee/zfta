import { getApiBaseUrl, readApiErrorMessage } from "~/lib/api";

export type UserRole = "applicant" | "reviewer" | "supervisor" | "system_admin";

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  mobile_number?: string;
  body?: string | null;
  role: UserRole;
  /** Backend may use `active`, `activated`, etc. */
  status: string;
  email_verified: boolean;
};

/** Values that mean the account may sign in (matches common API enums). */
const LOGIN_ALLOWED_STATUSES = new Set(["active", "activated"]);

function coerceEmailVerified(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes";
  }
  return false;
}

/** Prefer `status`, fall back to `account_status` (some APIs use the latter). */
function pickAccountStatus(raw: Record<string, unknown>): string {
  const s = raw.status ?? raw.account_status;
  if (typeof s === "string") return s.trim();
  if (s != null) return String(s).trim();
  return "";
}

function isLoginAllowedStatus(status: string): boolean {
  return LOGIN_ALLOWED_STATUSES.has(status.trim().toLowerCase());
}

/** Map API user JSON into `AuthUser` and merge status from either field. */
export function normalizeApiUser(u: Partial<AuthUser> & Record<string, unknown>): AuthUser {
  const raw = u as Record<string, unknown>;
  const status = pickAccountStatus(raw) || (typeof u.status === "string" ? u.status : "");
  const rawRole = typeof u.role === "string" ? u.role.trim().toLowerCase() : u.role;
  return {
    id: String(u.id ?? ""),
    email: String(u.email ?? ""),
    full_name: String(u.full_name ?? ""),
    mobile_number: u.mobile_number as string | undefined,
    body: (u.body ?? null) as string | null,
    role: rawRole as UserRole,
    status,
    email_verified: coerceEmailVerified(raw.email_verified ?? u.email_verified),
  };
}

type TokenBundle = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  expires_in: number;
  refresh_expires_at: string;
  user: AuthUser;
};

export type StoredSession = {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  refresh_expires_at?: string;
  user: AuthUser;
};

const AUTH_SESSION_KEY = "zfta_auth_session_v1";

const PENDING_ACCOUNT_INFO_KEY = "ta_pending_account_info_v1";

let refreshInFlight: Promise<boolean> | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getStoredSession(): StoredSession | null {
  if (!isBrowser()) return null;
  const parsed = safeJsonParse<StoredSession>(window.localStorage.getItem(AUTH_SESSION_KEY));
  if (!parsed?.access_token || !parsed?.refresh_token || !parsed?.user?.email) return null;
  return parsed;
}

export function getAccessToken(): string | null {
  return getStoredSession()?.access_token ?? null;
}

export function getCurrentUser(): AuthUser | null {
  return getStoredSession()?.user ?? null;
}

export function clearSession() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(AUTH_SESSION_KEY);
}

function persistFromBundle(bundle: TokenBundle) {
  if (!isBrowser()) return;
  const session: StoredSession = {
    access_token: bundle.access_token,
    refresh_token: bundle.refresh_token,
    expires_at: bundle.expires_at,
    refresh_expires_at: bundle.refresh_expires_at,
    user: normalizeApiUser(bundle.user as Partial<AuthUser> & Record<string, unknown>),
  };
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const sess = getStoredSession();
      if (!sess?.refresh_token) {
        clearSession();
        return false;
      }
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: sess.refresh_token }),
      });
      if (!res.ok) {
        clearSession();
        return false;
      }
      const bundle = (await res.json()) as TokenBundle;
      persistFromBundle(bundle);
      return true;
    } catch {
      clearSession();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** JSON request with Bearer; retries once after refresh on 401. */
export async function apiFetchJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const run = async (): Promise<Response> => {
    const url = `${getApiBaseUrl()}${path}`;
    const headers = new Headers(init.headers);
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const tok = getAccessToken();
    if (tok) headers.set("Authorization", `Bearer ${tok}`);
    return fetch(url, { ...init, headers });
  };

  let res = await run();
  if (res.status === 401 && getStoredSession()?.refresh_token) {
    const refreshed = await refreshSession();
    if (refreshed) res = await run();
  }

  if (res.status === 204 || res.status === 205) {
    return { ok: true, data: undefined as unknown as T };
  }

  if (!res.ok) {
    const err = await readApiErrorMessage(res);
    return { ok: false, status: res.status, error: err };
  }

  const ct = res.headers.get("content-type");
  if (!ct?.includes("application/json")) {
    return { ok: true, data: undefined as unknown as T };
  }

  const data = (await res.json()) as T;
  return { ok: true, data };
}

/** GET (or other) with Bearer; retries once after refresh on 401. Response body as Blob (e.g. file download). */
export async function apiFetchBlob(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: true; blob: Blob; contentType: string | null } | { ok: false; status: number; error: string }> {
  const run = async (): Promise<Response> => {
    const url = `${getApiBaseUrl()}${path}`;
    const headers = new Headers(init.headers);
    const tok = getAccessToken();
    if (tok) headers.set("Authorization", `Bearer ${tok}`);
    return fetch(url, { ...init, headers });
  };

  let res = await run();
  if (res.status === 401 && getStoredSession()?.refresh_token) {
    const refreshed = await refreshSession();
    if (refreshed) res = await run();
  }

  if (!res.ok) {
    const err = await readApiErrorMessage(res);
    return { ok: false, status: res.status, error: err };
  }

  const blob = await res.blob();
  return { ok: true, blob, contentType: res.headers.get("content-type") };
}

/**
 * multipart/form-data POST with Bearer; does not set `Content-Type` so the browser sets the boundary.
 */
export async function apiFetchFormData<T>(
  path: string,
  formData: FormData,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const run = async (): Promise<Response> => {
    const url = `${getApiBaseUrl()}${path}`;
    const headers = new Headers();
    const tok = getAccessToken();
    if (tok) headers.set("Authorization", `Bearer ${tok}`);
    return fetch(url, { method: "POST", body: formData, headers });
  };

  let res = await run();
  if (res.status === 401 && getStoredSession()?.refresh_token) {
    const refreshed = await refreshSession();
    if (refreshed) res = await run();
  }

  if (res.status === 204 || res.status === 205) {
    return { ok: true, data: undefined as unknown as T };
  }

  if (!res.ok) {
    const err = await readApiErrorMessage(res);
    return { ok: false, status: res.status, error: err };
  }

  const ct = res.headers.get("content-type");
  if (!ct?.includes("application/json")) {
    return { ok: true, data: undefined as unknown as T };
  }

  const data = (await res.json()) as T;
  return { ok: true, data };
}

const REVIEWER_BODIES = new Set(["ZIFA", "SRC", "IMMIGRATION"]);

export function normalizeApproverBody(body: string | null | undefined): string | null {
  const b = body?.trim().toUpperCase();
  if (!b) return null;
  return REVIEWER_BODIES.has(b) ? b : null;
}

export function isValidReviewerBody(body: string | null | undefined): boolean {
  return normalizeApproverBody(body) !== null;
}

export function getPostLoginRedirectPath(user: AuthUser): string {
  switch (user.role) {
    case "applicant":
      return "/applicant/dashboard/";
    case "reviewer":
      return "/approver/dashboard/";
    case "system_admin":
      return "/admin/dashboard/";
    default:
      return "/";
  }
}

export function redirectPathIfWrongRole(
  user: AuthUser | null,
  allowed: UserRole | UserRole[],
): string | null {
  if (!user) return "/sign-in/";
  const list = Array.isArray(allowed) ? allowed : [allowed];
  if (list.includes(user.role)) return null;
  return getPostLoginRedirectPath(user);
}

export async function signIn(params: {
  email: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isBrowser()) return { ok: false, error: "Not available." };

  const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: params.email.trim().toLowerCase(),
      password: params.password,
    }),
  });

  if (!res.ok) {
    const err = await readApiErrorMessage(res);
    return { ok: false, error: err };
  }

  const bundle = (await res.json()) as TokenBundle;
  const rawUser = bundle.user as unknown as Record<string, unknown>;
  const status = pickAccountStatus(rawUser);
  const emailOk = coerceEmailVerified(rawUser.email_verified);

  if (!isLoginAllowedStatus(status) || !emailOk) {
    return {
      ok: false,
      error: "Your account must be activated and email-verified before you can sign in.",
    };
  }

  const u = normalizeApiUser(bundle.user as Partial<AuthUser> & Record<string, unknown>);

  if (u.role === "supervisor") {
    return { ok: false, error: "Supervisor access is not available yet." };
  }

  if (u.role === "reviewer") {
    if (!isValidReviewerBody(u.body)) {
      return {
        ok: false,
        error: "Approver profile is missing a valid body (ZIFA, SRC, or IMMIGRATION).",
      };
    }
  }

  persistFromBundle(bundle);
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const tok = getAccessToken();
  if (tok && isBrowser()) {
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/auth/sign-out`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tok}`,
        },
      });
    } catch {
      /* ignore network errors */
    }
  }
  clearSession();
}

/** @deprecated Use signOut */
export async function signOutMock() {
  await signOut();
}

export async function fetchMe(): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  const r = await apiFetchJson<AuthUser>("/api/v1/me", { method: "GET" });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, user: r.data };
}

export async function requestPasswordReset(
  email: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });

  const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };

  if (!res.ok) {
    return { ok: false, error: data.error || (await readApiErrorMessage(res)) };
  }

  return {
    ok: true,
    message:
      data.message ||
      "If an account exists for that email, password reset instructions have been sent.",
  };
}

export async function resetPasswordWithToken(params: {
  token: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (params.password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: params.token, password: params.password }),
  });

  if (res.status === 204) return { ok: true };

  return { ok: false, error: await readApiErrorMessage(res) };
}

/**
 * Public self-service registration — `POST /api/v1/auth/sign-up` (no `Authorization` header).
 * Expected keys: `email`, `password`, `full_name`, `mobile_number`, `role`;
 * optional `body` (`ZIFA` | `SRC` | `IMMIGRATION`) when omitted from JSON.
 */
export async function signUp(
  body: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isBrowser()) return { ok: false, error: "Not available in this environment." };

  const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/sign-up`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return { ok: false, error: await readApiErrorMessage(res) };
  }

  return { ok: true };
}

// --- Account setup prompt (local flag only) ---

export function setPendingAccountInfoMock(value: boolean) {
  if (!isBrowser()) return;
  if (!value) {
    window.localStorage.removeItem(PENDING_ACCOUNT_INFO_KEY);
    return;
  }
  window.localStorage.setItem(PENDING_ACCOUNT_INFO_KEY, "1");
}

export function getPendingAccountInfoMock(): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(PENDING_ACCOUNT_INFO_KEY) === "1";
}

export function clearPendingAccountInfoMock() {
  setPendingAccountInfoMock(false);
}

/** @deprecated Use signIn with API */
export function signInMock(params: {
  email: string;
  password: string;
}): { ok: true; user: Pick<AuthUser, "email"> } | { ok: false; error: string } {
  return { ok: false, error: "Use the sign-in page with your API credentials." };
}
