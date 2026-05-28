import { labelApplicationType } from "~/lib/application-types";
import { tournamentClassificationLabel } from "~/lib/tournament-classification";

export function formatReportPercent(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatReportDays(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)} d`;
}

export function formatReportCount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString();
}

export function labelReportStatus(status: string): string {
  const s = status.trim().toLowerCase();
  const map: Record<string, string> = {
    draft: "Draft",
    awaiting_payment: "Awaiting payment",
    submitted: "Submitted",
    under_review: "Under review",
    awaiting_information: "Awaiting information",
    awaiting_body: "Awaiting sport body",
    awaiting_sport_body: "Awaiting sport body",
    awaiting_zifa: "Awaiting ZIFA",
    awaiting_psl: "Awaiting PSL",
    awaiting_src: "Awaiting SRC",
    awaiting_immigration: "Awaiting immigration",
    approved: "Approved",
    rejected: "Rejected",
    certificate_issued: "Certificate issued",
    withdrawn: "Withdrawn",
  };
  return map[s] ?? status.replace(/_/g, " ");
}

export function labelReportApplicationType(type: string): string {
  return labelApplicationType(type);
}

export function labelReportApproverBody(body: string): string {
  const b = body.trim().toUpperCase();
  if (b === "SPORT_BODY") return "Sport body";
  if (b === "SRC") return "SRC";
  if (b === "AFFILIATE") return "PSL / Affiliate";
  if (b === "IMMIGRATION") return "Immigration";
  return body;
}

export function labelReportPipelineStage(stage: string): string {
  const map: Record<string, string> = {
    submitted_to_sport_body_decision: "Submitted → sport body decision",
    sport_body_to_src_queue: "Sport body → SRC queue",
    src_decision: "SRC decision",
    submitted_to_final_decision: "Submitted → final decision",
  };
  return map[stage] ?? stage.replace(/_/g, " ");
}

export function labelReportRejectionCode(code: string): string {
  return code.replace(/_/g, " ");
}

export function labelReportVolumeKey(groupBy: string, key: string, label?: string): string {
  if (label && label !== key) return label;
  if (groupBy === "application_type") return labelReportApplicationType(key);
  if (groupBy === "status") return labelReportStatus(key);
  if (groupBy === "tournament_clasification") return tournamentClassificationLabel(key === "unset" ? null : key);
  if (groupBy === "psl_affiliate") return key === "true" ? "PSL affiliate" : "Non-PSL";
  return label || key || "—";
}

export function formatReportDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function formatReportMonth(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}
