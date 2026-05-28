/**
 * Single source of truth for reviewer routing, stage predicates, and state transitions
 * across the approval workflow.
 *
 * Workflow overview (outgoing tour, applicable to incoming tour and hosting competition variants):
 *   applicant submits
 *     → `awaiting_psl` (when football + PSL affiliate)
 *         AFFILIATE approves → `awaiting_sport_body`
 *         AFFILIATE rejects  → `rejected`
 *     → `awaiting_sport_body` (otherwise, or after PSL approves)
 *         sport body approves (+ compliance doc 2.1) → `awaiting_src`
 *         sport body rejects                          → `rejected`
 *     → `awaiting_src`
 *         SRC approves → `approved` (+ certificate)
 *         SRC rejects  → `rejected`
 *
 * All other code paths (UI, submit flow, dashboard filters) should reference helpers from this
 * module rather than restating the rules locally.
 */
import type { ApiApplication } from "~/lib/applications-api";
import type { ApiApproval } from "~/lib/approvals-api";
import { approvalActivityInstantIso } from "~/lib/application-display";
import { coerceSportsBodyToString, type AuthUser } from "~/lib/auth";
import type { ApiSportBody } from "~/lib/sport-bodies-api";
import { sportBodyApprovalCode } from "~/lib/sport-bodies-api";
import { resolveSportBodyRowForReviewerUser } from "~/lib/users-api";

// =====================================================================================
// Status sets
// =====================================================================================

/** First-line PSL/AFFILIATE stage (football + PSL affiliates submit here first). */
export const AFFILIATE_STAGE_STATUSES = new Set<string>([
  "awaiting_psl",
  "awaiting_affiliate",
]);

/** Primary sport-body stage (either initial queue for non-PSL apps or after AFFILIATE approves). */
export const PRIMARY_STAGE_STATUSES = new Set<string>([
  "awaiting_body",
  "awaiting_zifa",
  "awaiting_primary_body",
  "awaiting_sport_body",
]);

/** SRC stage (final reviewer). */
export const SRC_STAGE_STATUSES = new Set<string>(["awaiting_src"]);

/** Terminal application statuses (no further reviewer actions). */
export const TERMINAL_STATUSES = new Set<string>([
  "approved",
  "rejected",
  "certificate_issued",
]);

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

export function isAffiliateStageStatus(status: string | null | undefined): boolean {
  return AFFILIATE_STAGE_STATUSES.has(norm(status));
}

export function isPrimaryStageStatus(status: string | null | undefined): boolean {
  return PRIMARY_STAGE_STATUSES.has(norm(status));
}

export function isSrcStageStatus(status: string | null | undefined): boolean {
  return SRC_STAGE_STATUSES.has(norm(status));
}

export function isTerminalStatus(status: string | null | undefined): boolean {
  return TERMINAL_STATUSES.has(norm(status));
}

// =====================================================================================
// Initial submit queue
// =====================================================================================

/** Football organisation + PSL affiliate → AFFILIATE queue; else sport-body queue. */
export function initialTravelApplicationStatus(
  organisationSport: string,
  pslAffiliate: boolean,
): "awaiting_psl" | "awaiting_sport_body" {
  const sport = String(organisationSport ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const usePslRoute = sport === "football" && Boolean(pslAffiliate);
  return usePslRoute ? "awaiting_psl" : "awaiting_sport_body";
}

// =====================================================================================
// Reviewer routing token (resolves the signed-in user to a routing code)
// =====================================================================================

/** Routing token used by the approver UI: "SRC" | "AFFILIATE" | sport-body code | null. */
export type ReviewerRoutingBody = string | null;

/**
 * Resolves the reviewer routing token from the signed-in user.
 *
 * Order:
 *   1. `approver_body = SRC` → "SRC"
 *   2. `approver_body = AFFILIATE` → "AFFILIATE"
 *   3. `approver_body = IMMIGRATION` → null (legacy, no longer supported)
 *   4. Legacy `body` field with SRC / AFFILIATE / IMMIGRATION
 *   5. Sport-body row (via `sport_body_id` / `sports_body` / legacy `body` matching catalog)
 *   6. Free-text legacy `body` code (e.g. "ZIFA")
 */
export function reviewerRoutingBodyFromSession(
  user: Pick<AuthUser, "body" | "approver_body" | "sport_body_id" | "sports_body"> | null | undefined,
  sportBodies: ApiSportBody[],
): ReviewerRoutingBody {
  if (!user) return null;
  const ab = (user.approver_body ?? "").trim().toUpperCase();
  if (ab === "SRC") return "SRC";
  if (ab === "AFFILIATE") return "AFFILIATE";
  if (ab === "IMMIGRATION") return null;

  const legacyHi = (user.body ?? "").trim().toUpperCase();
  if (legacyHi === "SRC") return "SRC";
  if (legacyHi === "AFFILIATE") return "AFFILIATE";
  if (legacyHi === "IMMIGRATION") return null;

  const row = resolveSportBodyRowForReviewerUser(user, sportBodies);
  if (row) return sportBodyApprovalCode(row);

  const sbStored = coerceSportsBodyToString(user.sports_body);
  if (ab === "SPORTS_BODY" && sbStored) return sbStored.toUpperCase();

  const legacy = (user.body ?? "").trim();
  if (legacy) {
    const u = legacy.toUpperCase();
    if (u === "SPORT_BODY" || u === "SPORTS_BODY") return null;
    if (/^[A-Z0-9][A-Z0-9_-]{0,40}$/.test(u)) return u;
  }

  return null;
}

// =====================================================================================
// Approval-row body match
// =====================================================================================

/** Case-insensitive match for approval `body`/`body_code` (supports legacy substring rows). */
export function approvalBodyMatches(a: ApiApproval, bodyCode: string): boolean {
  const want = bodyCode.trim().toUpperCase();
  if (!want) return false;

  const gotCode = (a.body_code ?? "").trim().toUpperCase();
  if (gotCode) {
    if (gotCode === want) return true;
    if (gotCode.includes(want) || want.includes(gotCode)) return true;
    return false;
  }

  const got = (a.body ?? "").trim().toUpperCase();
  if (!got) return false;
  // When the API stores only the enum `SPORT_BODY` (no `body_code`), treat it as the primary sport-body stake.
  if (got === "SPORT_BODY" && want !== "SRC" && want !== "AFFILIATE") return true;
  if (got === want) return true;
  if (got.includes(want) || want.includes(got)) return true;
  return false;
}

function ts(iso?: string | null): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Latest approval row for a reviewer body code (newest by `approvalActivityInstantIso`). */
export function getLatestApprovalForBodyCode(
  approvals: ApiApproval[] | null | undefined,
  bodyCode: string,
): ApiApproval | undefined {
  if (!approvals?.length) return undefined;
  const sorted = [...approvals].sort(
    (a, b) => ts(approvalActivityInstantIso(b)) - ts(approvalActivityInstantIso(a)),
  );
  for (const a of sorted) {
    if (approvalBodyMatches(a, bodyCode)) return a;
  }
  return undefined;
}

/** True when we already POSTed an "opened file" marker (`under_review`) for this reviewer body. */
export function hasUnderReviewApprovalForBody(
  approvals: ApiApproval[] | null | undefined,
  bodyCode: string,
): boolean {
  if (!approvals?.length) return false;
  return approvals.some((a) => {
    if (!approvalBodyMatches(a, bodyCode)) return false;
    return norm(a.status) === "under_review";
  });
}

function isPrimaryApprovedStatus(status: string | undefined): boolean {
  const s = norm(status);
  if (!s) return false;
  return s.includes("approv") && !s.includes("unapproved");
}

/** Whether the primary (sport) body released the file to SRC: latest non-marker row is approval. */
export function isLatestPrimaryBodyApproved(
  approvals: ApiApproval[] | null | undefined,
  primaryBodyCode: string,
): boolean {
  if (!approvals?.length) return false;
  const rows = approvals.filter((a) => approvalBodyMatches(a, primaryBodyCode));
  if (!rows.length) return false;
  const sorted = [...rows].sort(
    (a, b) => ts(approvalActivityInstantIso(b)) - ts(approvalActivityInstantIso(a)),
  );
  for (const row of sorted) {
    const s = norm(row.status);
    if (s === "pending" || !s) continue;
    if (s === "under_review") continue;
    if (s.includes("reject") || s.includes("denied")) return false;
    return isPrimaryApprovedStatus(row.status);
  }
  return false;
}

/** Latest SRC row is terminal (SRC stage finished for this file). */
export function isLatestSrcTerminal(approvals: ApiApproval[] | null | undefined): boolean {
  const s = getLatestApprovalForBodyCode(approvals, "SRC");
  if (!s) return false;
  const st = norm(s.status);
  return st === "approved" || st === "rejected";
}

/** Latest AFFILIATE row is terminal (PSL stage finished for this file). */
export function isLatestAffiliateTerminal(approvals: ApiApproval[] | null | undefined): boolean {
  const s = getLatestApprovalForBodyCode(approvals, "AFFILIATE");
  if (!s) return false;
  const st = norm(s.status);
  return st === "approved" || st === "rejected";
}

/** True if any SPORT_BODY approval row is marked approved (used by SRC eligibility rule). */
export function hasAnySportBodyApproved(approvals: ApiApproval[] | null | undefined): boolean {
  if (!approvals?.length) return false;
  return approvals.some((a) => {
    const body = (a.body ?? "").trim().toUpperCase();
    const st = norm(a.status);
    return body === "SPORT_BODY" && st === "approved";
  });
}

// =====================================================================================
// Per-reviewer "can edit" predicates
// =====================================================================================

/** AFFILIATE may act while status is in the AFFILIATE stage and the latest AFFILIATE row is not terminal. */
export function affiliateCanEditApplication(
  app: Pick<ApiApplication, "status">,
  approvals: ApiApproval[] | null | undefined,
): boolean {
  if (!isAffiliateStageStatus(app.status)) return false;
  if (isLatestAffiliateTerminal(approvals)) return false;
  return true;
}

/** Sport-body reviewer may act while the status is in the primary stage. */
export function primaryReviewerCanEditApplication(
  app: Pick<ApiApplication, "status">,
): boolean {
  return isPrimaryStageStatus(app.status);
}

/** SRC may act while status is `awaiting_src` and the latest SRC row is not terminal. */
export function srcCanEditApplication(
  app: Pick<ApiApplication, "status">,
  approvals: ApiApproval[] | null | undefined,
  // Kept for backwards-compat callers; the rule no longer depends on it.
  _primaryBodyCode?: string,
): boolean {
  if (!isSrcStageStatus(app.status)) return false;
  if (isLatestSrcTerminal(approvals)) return false;
  return true;
}

/** Auto-create an SRC `under_review` row when SRC opens an eligible file with no prior SRC marker. */
export function shouldAutoCreateSrcUnderReview(
  app: Pick<ApiApplication, "status">,
  approvals: ApiApproval[] | null | undefined,
  _primaryBodyCode?: string,
): boolean {
  if (!srcCanEditApplication(app, approvals)) return false;
  return !hasUnderReviewApprovalForBody(approvals, "SRC");
}

/** Auto-create an AFFILIATE `under_review` row when AFFILIATE opens an eligible file. */
export function shouldAutoCreateAffiliateUnderReview(
  app: Pick<ApiApplication, "status">,
  approvals: ApiApproval[] | null | undefined,
): boolean {
  if (!affiliateCanEditApplication(app, approvals)) return false;
  return !hasUnderReviewApprovalForBody(approvals, "AFFILIATE");
}

// =====================================================================================
// Reviewer ↔ application stage match
// =====================================================================================

/** Loose case-insensitive equality used for legacy sport-body code rows. */
export function reviewerPrimaryCodesEqual(resolvedCode: string, reviewerRoutingBody: string): boolean {
  const a = resolvedCode.trim().toUpperCase();
  const b = reviewerRoutingBody.trim().toUpperCase();
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}

/** True when the reviewer routing token matches the application's current stage. */
export function reviewerMatchesApplicationStage(args: {
  reviewerBody: ReviewerRoutingBody;
  applicationStatus: string | null | undefined;
  applicationPrimaryBodyCode: string;
}): boolean {
  const reviewer = (args.reviewerBody ?? "").trim().toUpperCase();
  if (!reviewer) return false;

  if (reviewer === "SRC") return isSrcStageStatus(args.applicationStatus);
  if (reviewer === "AFFILIATE") return isAffiliateStageStatus(args.applicationStatus);
  if (!isPrimaryStageStatus(args.applicationStatus)) return false;
  if (!args.applicationPrimaryBodyCode) return false;
  return reviewerPrimaryCodesEqual(args.applicationPrimaryBodyCode, reviewer);
}

// =====================================================================================
// State transitions (used by the processing page on Approve/Reject)
// =====================================================================================

export type ReviewerRole = "AFFILIATE" | "PRIMARY" | "SRC";
export type ApprovalRowBody = "AFFILIATE" | "SPORT_BODY" | "SRC";
export type NextApplicationStatus =
  | "awaiting_psl"
  | "awaiting_sport_body"
  | "awaiting_src"
  | "approved"
  | "rejected";

/** Map a reviewer routing token to the role used for transitions. */
export function reviewerRoleForRoutingBody(reviewer: ReviewerRoutingBody): ReviewerRole | null {
  const r = (reviewer ?? "").trim().toUpperCase();
  if (!r) return null;
  if (r === "SRC") return "SRC";
  if (r === "AFFILIATE") return "AFFILIATE";
  return "PRIMARY";
}

/** Approval-row `body` value to send when recording the reviewer's decision. */
export function approvalBodyForRole(role: ReviewerRole): ApprovalRowBody {
  if (role === "AFFILIATE") return "AFFILIATE";
  if (role === "SRC") return "SRC";
  return "SPORT_BODY";
}

/** Next application status after the reviewer approves (terminal/forwarding). */
export function nextStatusOnApprove(role: ReviewerRole): NextApplicationStatus {
  if (role === "AFFILIATE") return "awaiting_sport_body";
  if (role === "PRIMARY") return "awaiting_src";
  return "approved";
}

/** Next application status after the reviewer rejects (always `rejected`). */
export function nextStatusOnReject(_role: ReviewerRole): NextApplicationStatus {
  return "rejected";
}

// =====================================================================================
// Read-only explanations (rendered when the reviewer cannot act on the current dossier)
// =====================================================================================

export type ReadOnlyExplanation = { title: string; body: string };

/** AFFILIATE reviewer opening a file that is no longer in the AFFILIATE stage. */
export function affiliateReadOnlyExplanation(
  status: string | null | undefined,
): ReadOnlyExplanation {
  const s = norm(status);
  if (s === "awaiting_sport_body") {
    return {
      title: "Forwarded to sport body",
      body: "You approved this dossier. It has moved to the sport body queue — no further PSL actions are available.",
    };
  }
  if (s === "awaiting_src") {
    return {
      title: "With SRC now",
      body: "PSL and sport body reviews are complete. The dossier is awaiting SRC.",
    };
  }
  if (s === "approved" || s === "certificate_issued") {
    return {
      title: "Approved",
      body: "This application has been fully approved.",
    };
  }
  if (s === "rejected") {
    return {
      title: "Rejected",
      body: "This application is closed. No further PSL actions are available.",
    };
  }
  if (s === "information_requested" || s === "awaiting_information") {
    return {
      title: "Awaiting applicant",
      body: "Information has been requested from the applicant. New official PSL decisions will be available once the application is re-submitted for review.",
    };
  }
  return {
    title: "Read-only",
    body: "This application cannot be edited from the PSL reviewer screen.",
  };
}

/** Sport-body reviewer opening a file that is no longer in the primary stage. */
export function primaryReadOnlyExplanation(
  status: string | null | undefined,
  primaryLabel: string,
): ReadOnlyExplanation {
  const label = primaryLabel?.trim() || "sport body";
  const s = norm(status);
  if (s === "awaiting_psl" || s === "awaiting_affiliate") {
    return {
      title: "With PSL",
      body: `This dossier is currently with PSL. ${label} review will become available after PSL approves.`,
    };
  }
  if (s === "awaiting_src") {
    return {
      title: "With SRC now",
      body: `${label}'s review is complete. This application is with SRC — you cannot submit further ${label} decisions here.`,
    };
  }
  if (s === "rejected") {
    return {
      title: "Not editable",
      body: `This application is no longer open for ${label} decisions.`,
    };
  }
  if (s === "information_requested" || s === "awaiting_information") {
    return {
      title: "Awaiting applicant",
      body: `Information was requested from the applicant. You can review the dossier below; new official decisions from ${label} will be available when the application is submitted again for review.`,
    };
  }
  if (s === "approved" || s === "certificate_issued") {
    return {
      title: "Approved",
      body: "This application is fully approved or is with SRC. No further first-line body changes apply.",
    };
  }
  return {
    title: "Read-only",
    body: `This application cannot be edited from the ${label} reviewer screen.`,
  };
}

/** SRC reviewer opening a file that is not eligible for SRC action. */
export function srcReadOnlyExplanation(
  app: Pick<ApiApplication, "status">,
  approvals: ApiApproval[] | null | undefined,
  _primaryBodyCode: string,
  primaryLabel: string,
): ReadOnlyExplanation {
  const label = primaryLabel?.trim() || "the sport body";
  const s = norm(app.status);
  if (!isSrcStageStatus(s)) {
    if (isAffiliateStageStatus(s)) {
      return {
        title: "With PSL",
        body: "This dossier is currently with PSL. SRC actions become available once it reaches SRC.",
      };
    }
    if (isPrimaryStageStatus(s)) {
      return {
        title: "With sport body",
        body: `This dossier is currently with ${label}. SRC actions become available once it reaches SRC.`,
      };
    }
    if (s === "approved" || s === "certificate_issued") {
      return {
        title: "Approved",
        body: "This application has been fully approved.",
      };
    }
    if (s === "rejected") {
      return {
        title: "Rejected",
        body: "This application has been rejected.",
      };
    }
    return {
      title: "Not in SRC queue",
      body: "SRC actions are available when the application status is awaiting SRC.",
    };
  }
  if (isLatestSrcTerminal(approvals)) {
    return {
      title: "SRC decision recorded",
      body: "The SRC approval row is complete — you cannot submit further SRC decisions here.",
    };
  }
  return {
    title: "Read-only",
    body: "This application cannot be edited from the SRC reviewer screen.",
  };
}
