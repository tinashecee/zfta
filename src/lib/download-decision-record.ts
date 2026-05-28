import { approvalDetailRows } from "~/lib/application-dossier-display";
import { formatDateTime, labelEventType } from "~/lib/application-display";
import type { ApiApplication } from "~/lib/applications-api";
import type { ApiApproval } from "~/lib/approvals-api";
import { organisationDisplayName, type ApiOrganisation } from "~/lib/organisations-api";

export type DecisionRecordInput = {
  application: ApiApplication;
  approvals: ApiApproval[];
  organisation: ApiOrganisation | null;
  primaryBodyLabel?: string;
};

function line(label: string, value: string | null | undefined): string {
  const v = (value ?? "").trim();
  return v ? `${label}: ${v}` : "";
}

/** Build a plain-text audit record suitable for download. */
export function buildDecisionRecordText(input: DecisionRecordInput): string {
  const app = input.application;
  const orgName = input.organisation ? organisationDisplayName(input.organisation).trim() : "";
  const status = (app.status ?? "").replace(/_/g, " ").toUpperCase();
  const ref = (app.reference_number ?? app.id).trim();

  const header = [
    "ZFTA DECISION RECORD",
    "=".repeat(40),
    line("Application reference", ref),
    line("Application ID", app.id),
    line("Final status", status),
    line("Organisation", orgName || undefined),
    line("Sport body", input.primaryBodyLabel),
    line("Event", app.event_display_name || labelEventType(app.event_type)),
    line("Destination", [app.host_city, app.host_country].filter(Boolean).join(", ") || undefined),
    line("Submitted", formatDateTime(app.submitted_at ?? app.created_at)),
    line("Exported", formatDateTime(new Date().toISOString())),
    "",
  ].filter(Boolean);

  const approvalSections = input.approvals
    .slice()
    .sort((a, b) => {
      const ta = new Date(a.decided_at ?? a.updated_at ?? a.created_at ?? 0).getTime();
      const tb = new Date(b.decided_at ?? b.updated_at ?? b.created_at ?? 0).getTime();
      return ta - tb;
    })
    .map((approval, index) => {
      const rows = approvalDetailRows(approval);
      const body = [
        `--- Approval ${index + 1} ---`,
        ...rows.map((r) => line(r.label, r.value)),
      ].filter(Boolean);
      return body.join("\n");
    });

  const footer = [
    "",
    "END OF RECORD",
    "This document was generated from the ZFTA approver portal.",
  ];

  return [...header, "APPROVAL HISTORY", "-".repeat(40), ...approvalSections, ...footer].join("\n");
}

export function decisionRecordFileName(application: ApiApplication): string {
  const ref = (application.reference_number ?? application.id)
    .trim()
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  const date = new Date().toISOString().slice(0, 10);
  return `decision-record-${ref || "application"}-${date}.txt`;
}

/** Trigger a browser download of the decision record as plain text. */
export function downloadDecisionRecord(input: DecisionRecordInput): void {
  const text = buildDecisionRecordText(input);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = decisionRecordFileName(input.application);
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
