import { getPostLoginRedirectPath, type AuthUser } from "~/lib/auth";
import { getOrganisationForUser } from "~/lib/organisations-api";

/**
 * After sign-in: applicants without an organisation owned by their `user_id` go to the org profile
 * (with `onboarding=1` when we confirmed the list has no matching row). If the organisations
 * request fails, we still open the org page so they can retry loading.
 */
export async function resolveApplicantPostLoginPath(user: AuthUser): Promise<string> {
  if (user.role !== "applicant") {
    return getPostLoginRedirectPath(user);
  }
  const r = await getOrganisationForUser(user.id);
  if (!r.ok) {
    return "/applicant/organization-profile/";
  }
  if (!r.organisation) {
    return "/applicant/organization-profile/?onboarding=1";
  }
  return "/applicant/dashboard/";
}
