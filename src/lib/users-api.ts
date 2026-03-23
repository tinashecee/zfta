import { apiFetchJson } from "~/lib/auth";

export const USER_ROLES = ["applicant", "reviewer", "supervisor", "system_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const APPROVER_BODIES = ["ZIFA", "SRC", "IMMIGRATION"] as const;
export type ApproverBody = (typeof APPROVER_BODIES)[number];

/** First value empty = no approver body */
export const APPROVER_BODY_OPTIONS = ["", ...APPROVER_BODIES] as const;

export const ACCOUNT_STATUSES = [
  "pending_profile",
  "pending_approval",
  "active",
  "suspended",
  "rejected",
  "inactive",
] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/** User row from GET/PATCH/POST /api/v1/users */
export type ApiUser = {
  id: string;
  email: string;
  full_name: string;
  mobile_number?: string | null;
  body?: string | null;
  role: string;
  status: string;
  status_reason?: string | null;
  email_verified: boolean;
  email_verified_at?: string | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
};

export async function listUsers(params?: { limit?: number; offset?: number }) {
  const limit = Math.min(params?.limit ?? 50, 500);
  const offset = params?.offset ?? 0;
  const q = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return apiFetchJson<ApiUser[]>(`/api/v1/users?${q}`, { method: "GET" });
}

export async function getUser(id: string) {
  return apiFetchJson<ApiUser>(`/api/v1/users/${encodeURIComponent(id)}`, { method: "GET" });
}

export async function createUser(body: {
  email: string;
  password: string;
  full_name: string;
  mobile_number?: string;
  body?: string;
  role?: string;
  status?: string;
  status_reason?: string;
  email_verified?: boolean;
}) {
  return apiFetchJson<ApiUser>("/api/v1/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchUser(id: string, patch: Record<string, unknown>) {
  return apiFetchJson<ApiUser>(`/api/v1/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteUser(id: string) {
  return apiFetchJson<void>(`/api/v1/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function formatUserDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function roleBadgeClass(role: string): string {
  const r = role.toLowerCase();
  if (r === "system_admin") return "bg-tertiary text-white";
  if (r === "reviewer") return "bg-primary text-white";
  if (r === "supervisor") return "bg-secondary-container text-on-secondary-container";
  return "bg-surface-container-highest text-on-surface";
}

export function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "active" || s === "activated") return "bg-primary-fixed text-on-primary-fixed-variant";
  if (s === "pending_profile" || s === "pending_approval") {
    return "bg-secondary-fixed text-on-secondary-fixed-variant";
  }
  if (s === "rejected" || s === "suspended") return "bg-error-container text-on-error-container";
  if (s === "inactive") return "bg-surface-container-high text-on-surface-variant";
  if (s.includes("pending")) return "bg-secondary-fixed text-on-secondary-fixed-variant";
  return "bg-surface-container-high text-on-surface-variant";
}

/** Map API values into account_status select (handles legacy `activated`). */
export function normalizeAccountStatusForForm(status: string): AccountStatus {
  const s = status.trim().toLowerCase();
  if (s === "activated") return "active";
  if ((ACCOUNT_STATUSES as readonly string[]).includes(s)) return s as AccountStatus;
  return "pending_profile";
}

export function normalizeApproverBodyForForm(body: string | null | undefined): string {
  if (!body?.trim()) return "";
  const u = body.trim().toUpperCase();
  if (u === "ZIFA" || u === "SRC" || u === "IMMIGRATION") return u;
  return "";
}

export function normalizeUserRoleForForm(role: string): UserRole {
  const r = role.trim().toLowerCase();
  if ((USER_ROLES as readonly string[]).includes(r)) return r as UserRole;
  return "applicant";
}
