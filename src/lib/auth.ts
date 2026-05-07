import { getApiBaseUrl, readApiErrorMessage } from "~/lib/api";

export type UserRole = "applicant" | "reviewer" | "supervisor" | "system_admin";

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  mobile_number?: string;
  /** Applicant organisation FK (uuid) */
  organisation_id?: string | null;
  body?: string | null;
  /** Reviewer kind from API: SPORTS_BODY, SRC */
  approver_body?: string | null;
  /** Sport-body row id as string (varchar) when `approver_body` is SPORTS_BODY */
  sports_body?: string | null;
  /** Legacy numeric FK when API still exposes it */
  sport_body_id?: number | null;
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

function pickOptionalStringField(raw: Record<string, unknown>, key: string): string | null {
  const v = raw[key];
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : null;
  }
  return null;
}

function pickOptionalNumberField(raw: Record<string, unknown>, key: string): number | null {
  const v = raw[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Some APIs send `sports_body` as a number (FK id); never call `.trim()` without coercing. */
export function coerceSportsBodyToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number" && Number.isFinite(value)) return String(Math.trunc(value));
  if (typeof value === "string") return value.trim();
  return String(value).trim();
}

/** Map API user JSON into `AuthUser` and merge status from either field. */
export function normalizeApiUser(u: Partial<AuthUser> & Record<string, unknown>): AuthUser {
  const raw = u as Record<string, unknown>;
  const status = pickAccountStatus(raw) || (typeof u.status === "string" ? u.status : "");
  const rawRole = typeof u.role === "string" ? u.role.trim().toLowerCase() : u.role;
  /** Some APIs use `sports_body` for sport-body approver accounts; reviewer routes apply. */
  const role: UserRole =
    rawRole === "sports_body" ? "reviewer" : (rawRole as UserRole);
  return {
    id: String(u.id ?? ""),
    email: String(u.email ?? ""),
    full_name: String(u.full_name ?? ""),
    mobile_number: (() => {
      const s =
        pickOptionalStringField(raw, "mobile_number") ??
        pickOptionalStringField(raw, "mobileNumber") ??
        pickOptionalStringField(raw, "phone") ??
        pickOptionalStringField(raw, "phone_number");
      if (s) return s;
      const legacy = u.mobile_number;
      if (typeof legacy === "string" && legacy.trim()) return legacy.trim();
      if (typeof legacy === "number" && Number.isFinite(legacy)) return String(Math.trunc(legacy));
      return undefined;
    })(),
    organisation_id:
      pickOptionalStringField(raw, "organisation_id") ??
      pickOptionalStringField(raw, "organisationId") ??
      (u.organisation_id as string | null | undefined) ??
      null,
    body: (u.body ?? null) as string | null,
    approver_body:
      pickOptionalStringField(raw, "approver_body") ??
      pickOptionalStringField(raw, "approverBody") ??
      (u.approver_body as string | null | undefined) ??
      null,
    sports_body: (() => {
      const s =
        pickOptionalStringField(raw, "sports_body") ?? pickOptionalStringField(raw, "sportsBody");
      if (s) return s;
      const n =
        pickOptionalNumberField(raw, "sports_body") ?? pickOptionalNumberField(raw, "sportsBody");
      if (n != null && Number.isFinite(n)) return String(Math.trunc(n));
      const legacy = coerceSportsBodyToString(u.sports_body as unknown);
      return legacy.length ? legacy : null;
    })(),
    sport_body_id:
      pickOptionalNumberField(raw, "sport_body_id") ??
      pickOptionalNumberField(raw, "sportBodyId") ??
      (typeof u.sport_body_id === "number" ? u.sport_body_id : null),
    role,
    status,
    email_verified: coerceEmailVerified(raw.email_verified ?? u.email_verified),
  };
}

/**
 * Sign-in / refresh response from the API.
 *
 * Default server lifetimes (tune with env): access JWT `JWT_ACCESS_TTL_MIN` (often ~15 minutes),
 * refresh session `JWT_REFRESH_TTL_DAYS` (often ~30 days). Production must use a strong
 * `JWT_SECRET` (e.g. 32+ chars); a short dev secret can break token creation.
 *
 * This app calls `POST /api/v1/auth/refresh` when the access token is near `expires_at` (proactive)
 * and again after a 401 before retrying the request once.
 */
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

/** Refresh the access token this many ms before `expires_at` to avoid an avoidable 401. */
const ACCESS_EXPIRY_LEEWAY_MS = 90_000;

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

/** Replace the cached session user (e.g. after `GET /api/v1/me` returns fields missing from the sign-in JWT). */
export function persistStoredSessionUser(user: AuthUser): void {
  if (!isBrowser()) return;
  const sess = getStoredSession();
  if (!sess) return;
  const next: StoredSession = {
    ...sess,
    user: normalizeApiUser(user as Partial<AuthUser> & Record<string, unknown>),
  };
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(next));
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

function accessTokenExpiryMs(session: StoredSession | null): number | null {
  const raw = session?.expires_at?.trim();
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : null;
}

/**
 * When a session exists and `expires_at` is within the leeway window, refresh first.
 * No-op if there is no parseable expiry (legacy session); 401 retry still applies.
 */
async function ensureFreshAccessTokenIfNeeded(): Promise<void> {
  if (!isBrowser()) return;
  const sess = getStoredSession();
  if (!sess?.refresh_token || !sess.access_token) return;
  const exp = accessTokenExpiryMs(sess);
  if (exp == null) return;
  if (Date.now() < exp - ACCESS_EXPIRY_LEEWAY_MS) return;
  await refreshSession();
}

/** JSON request with Bearer; refreshes near expiry, then retries once after 401. */
export async function apiFetchJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  await ensureFreshAccessTokenIfNeeded();
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

/** GET (or other) with Bearer; refreshes near expiry, then retries once after 401. Response body as Blob (e.g. file download). */
export async function apiFetchBlob(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: true; blob: Blob; contentType: string | null } | { ok: false; status: number; error: string }> {
  await ensureFreshAccessTokenIfNeeded();
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
 * Refreshes near expiry, then retries once after 401.
 */
export async function apiFetchFormData<T>(
  path: string,
  formData: FormData,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  await ensureFreshAccessTokenIfNeeded();
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

const FIXED_REVIEWER_BODIES = new Set(["ZIFA", "SRC"]);

function isSportBodyCodeToken(s: string): boolean {
  return /^[A-Z0-9][A-Z0-9_-]{0,40}$/.test(s);
}

/**
 * Normalized approver `body`: SRC, legacy ZIFA, or a sport-body `code` from the catalog.
 */
export function normalizeApproverBody(body: string | null | undefined): string | null {
  const b = body?.trim();
  if (!b) return null;
  const u = b.toUpperCase();
  if (u === "IMMIGRATION") return null;
  if (FIXED_REVIEWER_BODIES.has(u)) return u;
  if (isSportBodyCodeToken(u)) return u;
  return null;
}

export function isValidReviewerBody(body: string | null | undefined): boolean {
  return normalizeApproverBody(body) !== null;
}

/** True when the session user has enough approver profile to use reviewer routes (new `approver_body` or legacy `body`). */
export function reviewerHasValidApproverProfile(
  user: Pick<AuthUser, "body" | "approver_body" | "sport_body_id" | "sports_body">,
): boolean {
  const ab = (user.approver_body ?? "").trim().toUpperCase();
  if (ab === "SRC") return true;
  if (ab === "IMMIGRATION") return false;
  if (ab === "SPORTS_BODY") {
    if (coerceSportsBodyToString(user.sports_body).length > 0) return true;
    return user.sport_body_id != null && Number(user.sport_body_id) > 0;
  }
  return normalizeApproverBody(user.body) !== null;
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
    if (!reviewerHasValidApproverProfile(u)) {
      return {
        ok: false,
        error:
          "Approver profile is incomplete. Choose Sports body (with a sport body) or SRC.",
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
 * optional `approver_body` (`SPORTS_BODY` | `SRC`) and string `sports_body` (sport-body id) when kind is sports body.
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
