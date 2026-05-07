import { apiFetchJson, getPostLoginRedirectPath, persistStoredSessionUser, type AuthUser } from "~/lib/auth";
import { meResponseToAuthUser } from "~/lib/users-api";

/**
 * After sign-in: applicants without an organisation linked on their user record go to the org profile.
 */
export async function resolveApplicantPostLoginPath(user: AuthUser): Promise<string> {
  if (user.role !== "applicant") {
    return getPostLoginRedirectPath(user);
  }
  if (!String(user.organisation_id ?? "").trim()) {
    // Some backends omit `organisation_id` from the sign-in bundle. Try `/me` once to refresh the session user.
    const me = await apiFetchJson<unknown>("/api/v1/me", { method: "GET" });
    if (me.ok) {
      const refreshed = meResponseToAuthUser(me.data);
      persistStoredSessionUser(refreshed);
      if (String(refreshed.organisation_id ?? "").trim()) {
        return "/applicant/dashboard/";
      }
    }
    return "/applicant/organization-profile/?onboarding=1";
  }
  return "/applicant/dashboard/";
}
