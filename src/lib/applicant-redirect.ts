import { getPostLoginRedirectPath, type AuthUser } from "~/lib/auth";

/**
 * After sign-in: applicants without an organisation linked on their user record go to the org profile.
 */
export async function resolveApplicantPostLoginPath(user: AuthUser): Promise<string> {
  if (user.role !== "applicant") {
    return getPostLoginRedirectPath(user);
  }
  if (!String(user.organisation_id ?? "").trim()) {
    return "/applicant/organization-profile/?onboarding=1";
  }
  return "/applicant/dashboard/";
}
