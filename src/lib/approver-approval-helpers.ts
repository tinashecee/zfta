import type { ApiApproval } from "~/lib/approvals-api";
import { approvalActivityInstantIso } from "~/lib/application-display";
import type { ApiApplication } from "~/lib/applications-api";

function ts(iso?: string | null): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function matchBodyKey(body: string | null | undefined): "ZIFA" | "SRC" | "IMMIGRATION" | null {
  const s = (body ?? "").toUpperCase();
  if (s.includes("ZIFA")) return "ZIFA";
  if (s.includes("SRC")) return "SRC";
  if (s.includes("IMMIGRATION")) return "IMMIGRATION";
  return null;
}

/**
 * Latest approval row for a reviewer body (newest by decided_at → updated_at → created_at),
 * same rule as governance.
 */
export function getLatestApprovalForBody(
  approvals: ApiApproval[] | null | undefined,
  body: "ZIFA" | "SRC" | "IMMIGRATION",
): ApiApproval | undefined {
  if (!approvals?.length) return undefined;
  const sorted = [...approvals].sort(
    (a, b) => ts(approvalActivityInstantIso(b)) - ts(approvalActivityInstantIso(a)),
  );
  for (const a of sorted) {
    const key = matchBodyKey(a.body);
    if (key === body) return a;
  }
  return undefined;
}

/**
 * True if we already POSTed an "opened file" marker (`under_review`) for this reviewer body.
 * Used to avoid duplicate `createApproval` POSTs on every visit — only the first open should POST.
 */
export function hasUnderReviewApprovalForBody(
  approvals: ApiApproval[] | null | undefined,
  body: "ZIFA" | "SRC" | "IMMIGRATION",
): boolean {
  if (!approvals?.length) return false;
  return approvals.some((a) => {
    if (matchBodyKey(a.body) !== body) return false;
    return (a.status ?? "").trim().toLowerCase() === "under_review";
  });
}

/** True if status string means ZIFA has approved the application (handoff to SRC). */
function isZifaApprovedStatus(status: string | undefined): boolean {
  const s = (status ?? "").trim().toLowerCase();
  if (!s) return false;
  return s.includes("approv") && !s.includes("unapproved");
}

/**
 * Whether ZIFA has **released** the file to SRC: there is a ZIFA row whose status is a real
 * decision (not `pending` / `under_review` open markers), and that decision is approval.
 *
 * We walk ZIFA rows newest-first and skip `pending` and `under_review` so an older `approved`
 * row still counts if a newer auto `under_review` row exists (same application can have both).
 */
export function isLatestZifaApproved(approvals: ApiApproval[] | null | undefined): boolean {
  if (!approvals?.length) return false;
  const zifaRows = approvals.filter((a) => matchBodyKey(a.body) === "ZIFA");
  if (!zifaRows.length) return false;
  const sorted = [...zifaRows].sort(
    (a, b) => ts(approvalActivityInstantIso(b)) - ts(approvalActivityInstantIso(a)),
  );
  for (const row of sorted) {
    const s = (row.status ?? "").trim().toLowerCase();
    if (s === "pending" || !s) continue;
    if (s === "under_review") continue;
    if (s.includes("reject") || s.includes("denied")) return false;
    return isZifaApprovedStatus(row.status);
  }
  return false;
}

/** Latest SRC row is terminal (SRC stage finished for this file). */
export function isLatestSrcTerminal(approvals: ApiApproval[] | null | undefined): boolean {
  const s = getLatestApprovalForBody(approvals, "SRC");
  if (!s) return false;
  const st = (s.status ?? "").trim().toLowerCase();
  return st === "approved" || st === "rejected";
}

/** Latest IMMIGRATION row is terminal (final approve or reject for this file). */
export function isLatestImmigrationTerminal(approvals: ApiApproval[] | null | undefined): boolean {
  const s = getLatestApprovalForBody(approvals, "IMMIGRATION");
  if (!s) return false;
  const st = (s.status ?? "").trim().toLowerCase();
  return st === "approved" || st === "rejected";
}

/**
 * SRC may record decisions only while the application is with SRC (`awaiting_src`), ZIFA has
 * approved, and SRC has not yet ended with approved/rejected on the approval row.
 */
export function srcCanEditApplication(
  app: Pick<ApiApplication, "status">,
  approvals: ApiApproval[] | null | undefined,
): boolean {
  const as = (app.status ?? "").trim().toLowerCase();
  if (as !== "awaiting_src") return false;
  if (!isLatestZifaApproved(approvals)) return false;
  if (isLatestSrcTerminal(approvals)) return false;
  return true;
}

/**
 * Whether to POST a new SRC `under_review` "opened" row on load. Only when SRC may edit and we
 * have not already POSTed `under_review` for SRC (no duplicate POSTs).
 */
export function shouldAutoCreateSrcUnderReview(
  app: Pick<ApiApplication, "status">,
  approvals: ApiApproval[] | null | undefined,
): boolean {
  if (!srcCanEditApplication(app, approvals)) return false;
  return !hasUnderReviewApprovalForBody(approvals, "SRC");
}

/**
 * Immigration may record a final decision only while the application is awaiting immigration
 * review and there is no terminal IMMIGRATION approval row yet.
 */
export function immigrationCanEditApplication(
  app: Pick<ApiApplication, "status">,
  approvals: ApiApproval[] | null | undefined,
): boolean {
  const as = (app.status ?? "").trim().toLowerCase();
  if (as !== "awaiting_immigration") return false;
  if (isLatestImmigrationTerminal(approvals)) return false;
  return true;
}

/**
 * Whether to POST a new IMMIGRATION `under_review` "opened" row on load. Only when immigration
 * may edit and we have not already POSTed `under_review` for IMMIGRATION (no duplicate POSTs).
 */
export function shouldAutoCreateImmigrationUnderReview(
  app: Pick<ApiApplication, "status">,
  approvals: ApiApproval[] | null | undefined,
): boolean {
  if (!immigrationCanEditApplication(app, approvals)) return false;
  return !hasUnderReviewApprovalForBody(approvals, "IMMIGRATION");
}

const CHIP_BASE =
  "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold";

/**
 * Header chip for a reviewer body: label/icon/colors from the **latest** approval row for that body
 * (newest by `approvalActivityInstantIso`), or pending when none.
 */
export function getBodyApprovalChipDisplay(
  approvals: ApiApproval[] | null | undefined,
  body: "ZIFA" | "SRC" | "IMMIGRATION",
): { label: string; icon: string; chipClass: string } {
  const row = getLatestApprovalForBody(approvals, body);
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
