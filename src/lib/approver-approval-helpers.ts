import type { ApiApproval } from "~/lib/approvals-api";
import { approvalActivityInstantIso } from "~/lib/application-display";
import type { ApiApplication } from "~/lib/applications-api";

function ts(iso?: string | null): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Case-insensitive match for approval `body` (supports legacy substring rows). */
export function approvalBodyMatches(a: ApiApproval, bodyCode: string): boolean {
  const want = bodyCode.trim().toUpperCase();
  if (!want) return false;

  // Newer APIs may store the specific sport-body code separately from the enum `body`.
  const gotCode = (a.body_code ?? "").trim().toUpperCase();
  if (gotCode) {
    if (gotCode === want) return true;
    if (gotCode.includes(want) || want.includes(gotCode)) return true;
    return false;
  }

  const got = (a.body ?? "").trim().toUpperCase();
  if (!got) return false;
  if (got === want) return true;
  if (got.includes(want) || want.includes(got)) return true;
  return false;
}

/**
 * Latest approval row for a reviewer body code (newest by decided_at → updated_at → created_at),
 * same rule as governance.
 */
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

/**
 * True if we already POSTed an "opened file" marker (`under_review`) for this reviewer body.
 */
export function hasUnderReviewApprovalForBody(
  approvals: ApiApproval[] | null | undefined,
  bodyCode: string,
): boolean {
  if (!approvals?.length) return false;
  return approvals.some((a) => {
    if (!approvalBodyMatches(a, bodyCode)) return false;
    return (a.status ?? "").trim().toLowerCase() === "under_review";
  });
}

function isPrimaryApprovedStatus(status: string | undefined): boolean {
  const s = (status ?? "").trim().toLowerCase();
  if (!s) return false;
  return s.includes("approv") && !s.includes("unapproved");
}

/**
 * Whether the primary (sport) body has **released** the file to SRC: latest non-marker row is approval.
 */
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
    const s = (row.status ?? "").trim().toLowerCase();
    if (s === "pending" || !s) continue;
    if (s === "under_review") continue;
    if (s.includes("reject") || s.includes("denied")) return false;
    return isPrimaryApprovedStatus(row.status);
  }
  return false;
}

/** @deprecated Use {@link isLatestPrimaryBodyApproved} with resolved primary body code. */
export function isLatestZifaApproved(approvals: ApiApproval[] | null | undefined): boolean {
  return isLatestPrimaryBodyApproved(approvals, "ZIFA");
}

/** Latest SRC row is terminal (SRC stage finished for this file). */
export function isLatestSrcTerminal(approvals: ApiApproval[] | null | undefined): boolean {
  const s = getLatestApprovalForBodyCode(approvals, "SRC");
  if (!s) return false;
  const st = (s.status ?? "").trim().toLowerCase();
  return st === "approved" || st === "rejected";
}

/**
 * New API rule (simplified): SRC may act once there is any SPORT_BODY approval row marked approved.
 * This ignores per-sport-body routing codes.
 */
export function hasAnySportBodyApproved(approvals: ApiApproval[] | null | undefined): boolean {
  if (!approvals?.length) return false;
  return approvals.some((a) => {
    const body = (a.body ?? "").trim().toUpperCase();
    const st = (a.status ?? "").trim().toLowerCase();
    return body === "SPORT_BODY" && st === "approved";
  });
}

/**
 * SRC may record decisions only while the application is with SRC (`awaiting_src`), primary body has
 * approved, and SRC has not yet ended with approved/rejected on the approval row.
 */
export function srcCanEditApplication(
  app: Pick<ApiApplication, "status">,
  approvals: ApiApproval[] | null | undefined,
  primaryBodyCode: string,
): boolean {
  const as = (app.status ?? "").trim().toLowerCase();
  if (as !== "awaiting_src") return false;
  // For SRC: status `awaiting_src` means SRC may act, even if the server did not create a SPORT_BODY
  // approval row (common for sport-body-created incoming/hosting applications).
  // (primaryBodyCode kept only for backwards-compat callers)
  if (isLatestSrcTerminal(approvals)) return false;
  return true;
}

export function shouldAutoCreateSrcUnderReview(
  app: Pick<ApiApplication, "status">,
  approvals: ApiApproval[] | null | undefined,
  primaryBodyCode: string,
): boolean {
  if (!srcCanEditApplication(app, approvals, primaryBodyCode)) return false;
  return !hasUnderReviewApprovalForBody(approvals, "SRC");
}

const CHIP_BASE =
  "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold";

/**
 * Header chip for a reviewer body: label/icon/colors from the **latest** approval row for that body
 * (newest by `approvalActivityInstantIso`), or pending when none.
 */
export function getBodyApprovalChipDisplay(
  approvals: ApiApproval[] | null | undefined,
  bodyCode: string,
): { label: string; icon: string; chipClass: string } {
  const row = getLatestApprovalForBodyCode(approvals, bodyCode);
  const status = (row?.status ?? "").trim().toLowerCase();
  if (!status || status === "pending") {
    return {
      label: "PENDING",
      icon: "hourglass_empty",
      chipClass: `${CHIP_BASE} bg-surface-container-highest text-on-surface-variant`,
    };
  }
  if (status === "under_review") {
    return {
      label: "UNDER REVIEW",
      icon: "pending",
      chipClass: `${CHIP_BASE} bg-secondary-fixed text-on-secondary-fixed-variant`,
    };
  }
  if (status === "approved") {
    return {
      label: "APPROVED",
      icon: "check_circle",
      chipClass: `${CHIP_BASE} bg-primary/10 text-primary`,
    };
  }
  if (status === "rejected") {
    return {
      label: "REJECTED",
      icon: "cancel",
      chipClass: `${CHIP_BASE} bg-error-container text-on-error-container`,
    };
  }
  if (status === "information_requested" || status === "awaiting_information") {
    return {
      label: status === "awaiting_information" ? "AWAITING INFORMATION" : "INFO REQUESTED",
      icon: "mail",
      chipClass: `${CHIP_BASE} bg-secondary-fixed/60 text-on-secondary-fixed-variant`,
    };
  }
  const label = status.replace(/_/g, " ").toUpperCase();
  return {
    label,
    icon: "label",
    chipClass: `${CHIP_BASE} bg-surface-container-highest text-on-surface-variant`,
  };
}

export type GovernanceChipPair = {
  primary: { code: string; label: string };
  chips: Array<{ key: string; label: string; icon: string; chipClass: string }>;
};

/** Two chips: primary sport body + SRC (immigration stage removed). */
export function getGovernanceChipPair(
  approvals: ApiApproval[] | null | undefined,
  primary: { code: string; label: string },
): GovernanceChipPair {
  const codes = [
    { code: primary.code, label: primary.label },
    { code: "SRC", label: "SRC" },
  ];
  return {
    primary,
    chips: codes.map(({ code, label }) => {
      const chip = getBodyApprovalChipDisplay(approvals, code);
      return { key: code, label: `${label}: ${chip.label}`, icon: chip.icon, chipClass: chip.chipClass };
    }),
  };
}

/** @deprecated Use {@link getGovernanceChipPair}. */
export function getGovernanceChipTriple(
  approvals: ApiApproval[] | null | undefined,
  primary: { code: string; label: string },
): GovernanceChipPair {
  return getGovernanceChipPair(approvals, primary);
}
