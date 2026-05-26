import {
  coerceSportsBodyToString,
  getPostLoginRedirectPath,
  normalizeApproverBody,
  type AuthUser,
} from "~/lib/auth";

type ReviewerSession = Pick<
  AuthUser,
  "role" | "body" | "approver_body" | "sport_body_id" | "sports_body"
>;

function approverKind(user: ReviewerSession | null | undefined): string {
  return (user?.approver_body ?? "").trim().toUpperCase();
}

function legacyBody(user: ReviewerSession | null | undefined): string {
  return (user?.body ?? "").trim().toUpperCase();
}

/** SRC reviewer — manages hosting opportunities and reviews submitted bids. */
export function isSrcReviewerSession(user: ReviewerSession | null | undefined): boolean {
  if (!user || user.role !== "reviewer") return false;
  const ab = approverKind(user);
  const legacy = legacyBody(user);
  return ab === "SRC" || legacy === "SRC";
}

/**
 * Sport-body reviewer — browses opportunities for their sport and submits bids.
 * Matches approver nav rules (SPORTS_BODY enum, legacy tokens, sport_body_id, sports_body, catalog code in body).
 */
export function isSportBodyReviewerSession(user: ReviewerSession | null | undefined): boolean {
  if (!user || user.role !== "reviewer") return false;

  const ab = approverKind(user);
  const legacy = legacyBody(user);
  if (ab === "SRC" || ab === "AFFILIATE" || ab === "IMMIGRATION") return false;
  if (legacy === "SRC" || legacy === "AFFILIATE" || legacy === "IMMIGRATION") return false;

  if (ab === "SPORTS_BODY" || legacy === "SPORT_BODY" || legacy === "SPORTS_BODY") return true;
  if (user.sport_body_id != null && Number(user.sport_body_id) > 0) return true;
  if (coerceSportsBodyToString(user.sports_body).length > 0) return true;

  const normalized = normalizeApproverBody(user.body);
  return normalized != null && normalized !== "SRC" && normalized !== "ZIFA";
}

/** Create/publish hosting events and review all submitted bids (SRC approver or system admin). */
export function userCanManageHostingEvents(
  user: ReviewerSession & { role: string } | null | undefined,
): boolean {
  if (!user) return false;
  if (user.role === "system_admin") return true;
  return isSrcReviewerSession(user);
}

/** Browse open opportunities and start or edit own bids (sport-body approver or system admin browse). */
export function userCanBidOnHostingOpportunities(
  user: ReviewerSession & { role: string } | null | undefined,
): boolean {
  if (!user) return false;
  if (user.role === "system_admin") return true;
  return isSportBodyReviewerSession(user);
}

/** @deprecated Use `userCanBidOnHostingOpportunities` — kept for existing imports. */
export function userCanBrowseApproverHostingPages(
  user: ReviewerSession & { role: string } | null | undefined,
): boolean {
  return userCanBidOnHostingOpportunities(user);
}

export function redirectPathIfNoHostingManageAccess(
  user: AuthUser | null,
): string | null {
  if (!user) return "/sign-in/";
  if (userCanManageHostingEvents(user)) return null;
  if (user.role === "system_admin") return "/admin/dashboard/";
  return getPostLoginRedirectPath(user);
}

export function redirectPathIfNoHostingBidAccess(user: AuthUser | null): string | null {
  if (!user) return "/sign-in/";
  if (userCanBidOnHostingOpportunities(user)) return null;
  if (isSrcReviewerSession(user)) return "/approver/hosting-events/";
  if (user.role === "system_admin") return "/admin/dashboard/";
  return getPostLoginRedirectPath(user);
}
