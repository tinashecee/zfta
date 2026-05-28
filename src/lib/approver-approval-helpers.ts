import type { ApiApproval } from "~/lib/approvals-api";
import {
  approvalBodyMatches,
  getLatestApprovalForBodyCode,
  hasAnySportBodyApproved,
  hasUnderReviewApprovalForBody,
  isLatestPrimaryBodyApproved,
  isLatestSrcTerminal,
  shouldAutoCreateSrcUnderReview,
  srcCanEditApplication,
} from "~/lib/approval-rules";

/**
 * Reviewer routing / approval-stage predicates are sourced from {@link "~/lib/approval-rules"}.
 * This file only exposes UI/chip rendering helpers below.
 */
export {
  approvalBodyMatches,
  getLatestApprovalForBodyCode,
  hasAnySportBodyApproved,
  hasUnderReviewApprovalForBody,
  isLatestPrimaryBodyApproved,
  isLatestSrcTerminal,
  shouldAutoCreateSrcUnderReview,
  srcCanEditApplication,
};

/** @deprecated Use {@link isLatestPrimaryBodyApproved} with resolved primary body code. */
export function isLatestZifaApproved(approvals: ApiApproval[] | null | undefined): boolean {
  return isLatestPrimaryBodyApproved(approvals, "ZIFA");
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

export type GovernanceChipPairOptions = {
  /** When true, prepend a chip for approval body AFFILIATE (PSL sports affiliate). */
  pslAffiliate?: boolean;
};

/** Primary sport body + SRC (immigration stage removed); optional PSL (AFFILIATE) chip first. */
export function getGovernanceChipPair(
  approvals: ApiApproval[] | null | undefined,
  primary: { code: string; label: string },
  options?: GovernanceChipPairOptions,
): GovernanceChipPair {
  const codes: Array<{ code: string; label: string }> = [];
  if (options?.pslAffiliate === true) {
    codes.push({ code: "AFFILIATE", label: "PSL" });
  }
  codes.push({ code: primary.code, label: primary.label }, { code: "SRC", label: "SRC" });
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
