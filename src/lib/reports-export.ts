import {
  fetchAllReportApprovals,
  fetchReportDuration,
  fetchReportOutcomes,
  fetchReportPipeline,
  fetchReportProcessingBySportBody,
  fetchReportProcessingTime,
  fetchReportRejections,
  fetchReportSummary,
  fetchReportTrends,
  fetchReportTournamentClassification,
  fetchReportVolume,
  fetchReportApprovers,
} from "~/lib/reports-api";
import {
  formatReportDateTime,
  formatReportDays,
  formatReportPercent,
  labelReportApplicationType,
  labelReportApproverBody,
  labelReportPipelineStage,
  labelReportRejectionCode,
  labelReportStatus,
  labelReportVolumeKey,
} from "~/lib/reports-format";
import type { ReportFilters, ReportsTab } from "~/lib/reports-types";

type SheetRow = Record<string, string | number | null | undefined>;

function exportFileName(tab: ReportsTab, filters: ReportFilters): string {
  const from = filters.date_from ?? "all";
  const to = filters.date_to ?? "all";
  return `zfta-reports-${tab}-${from}-${to}.xlsx`;
}

async function writeWorkbook(sheets: Array<{ name: string; rows: SheetRow[] }>, filename: string) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const safeName = sheet.name.slice(0, 31).replace(/[\\/?*[\]:]/g, "-") || "Sheet";
    const ws = XLSX.utils.json_to_sheet(sheet.rows.length ? sheet.rows : [{ note: "No data" }]);
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  }
  XLSX.writeFile(wb, filename);
}

function filterMetaRows(filters: ReportFilters): SheetRow[] {
  return [
    { field: "date_from", value: filters.date_from ?? "" },
    { field: "date_to", value: filters.date_to ?? "" },
    { field: "date_field", value: filters.date_field ?? "submitted_at" },
    { field: "application_type", value: filters.application_type ?? "" },
    { field: "sport", value: filters.sport ?? "" },
    { field: "status", value: filters.status ?? "" },
    { field: "tournament_clasification", value: filters.tournament_clasification ?? "" },
    { field: "sport_body_id", value: filters.sport_body_id ?? "" },
  ];
}

async function sheetsForOverview(filters: ReportFilters) {
  const [summaryR, classR] = await Promise.all([
    fetchReportSummary(filters),
    fetchReportTournamentClassification(filters),
  ]);
  if (!summaryR.ok) throw new Error(summaryR.error);
  const s = summaryR.data;
  const sheets: Array<{ name: string; rows: SheetRow[] }> = [
    { name: "Filters", rows: filterMetaRows(filters) },
    {
      name: "Summary",
      rows: [
        { metric: "Total applications", value: s.total_applications },
        { metric: "Pending", value: s.pending_count },
        { metric: "Approved", value: s.approved_count },
        { metric: "Rejected", value: s.rejected_count },
        { metric: "Certificates issued", value: s.certificate_issued_count },
        { metric: "Approval rate", value: formatReportPercent(s.approval_rate) },
        { metric: "Median end-to-end (days)", value: formatReportDays(s.median_end_to_end_days) },
        { metric: "Avg end-to-end (days)", value: formatReportDays(s.avg_end_to_end_days) },
        { metric: "Avg applicant to SRC (days)", value: formatReportDays(s.avg_applicant_to_src_days) },
        { metric: "Overdue approvals", value: s.overdue_approvals_count },
        { metric: "Total travellers", value: s.total_travellers },
      ],
    },
    {
      name: "By status",
      rows: Object.entries(s.by_status).map(([status, count]) => ({
        status: labelReportStatus(status),
        status_code: status,
        count,
      })),
    },
    {
      name: "By type",
      rows: Object.entries(s.by_application_type).map(([type, count]) => ({
        application_type: labelReportApplicationType(type),
        type_code: type,
        count,
      })),
    },
  ];
  if (classR.ok) {
    sheets.push({
      name: "Tournament class",
      rows: classR.data.buckets.map((b) => ({
        classification: labelReportVolumeKey("tournament_clasification", b.key, b.label),
        count: b.count,
        percentage: b.percentage,
      })),
    });
  }
  return sheets;
}

async function sheetsForVolume(filters: ReportFilters, groupBy: string) {
  const [mainR, typeR, classR] = await Promise.all([
    fetchReportVolume(filters, groupBy),
    fetchReportVolume(filters, "application_type"),
    fetchReportTournamentClassification(filters),
  ]);
  if (!mainR.ok) throw new Error(mainR.error);
  return [
    { name: "Filters", rows: filterMetaRows(filters) },
    {
      name: `By ${groupBy}`,
      rows: mainR.data.buckets.map((b) => ({
        key: b.key,
        label: labelReportVolumeKey(groupBy, b.key, b.label),
        count: b.count,
        percentage: b.percentage,
      })),
    },
    {
      name: "By type",
      rows: (typeR.ok ? typeR.data.buckets : []).map((b) => ({
        label: labelReportApplicationType(b.key),
        count: b.count,
        percentage: b.percentage,
      })),
    },
    {
      name: "Tournament class",
      rows: (classR.ok ? classR.data.buckets : []).map((b) => ({
        label: labelReportVolumeKey("tournament_clasification", b.key, b.label),
        count: b.count,
        percentage: b.percentage,
      })),
    },
  ];
}

async function sheetsForTrends(filters: ReportFilters, period: string, metric: string) {
  const r = await fetchReportTrends(filters, period, metric, "application_type");
  if (!r.ok) throw new Error(r.error);
  return [
    { name: "Filters", rows: filterMetaRows(filters) },
    {
      name: "Trends",
      rows: r.data.series.map((pt) => ({
        bucket_start: pt.bucket_start,
        bucket_end: pt.bucket_end,
        count: pt.count,
        outgoing_tour: pt.splits?.outgoing_tour ?? "",
        incoming_tour: pt.splits?.incoming_tour ?? "",
        hosting_competition: pt.splits?.hosting_competition ?? "",
      })),
    },
  ];
}

async function sheetsForProcessing(filters: ReportFilters) {
  const [e2eR, srcR, sbR, pipeR, durR] = await Promise.all([
    fetchReportProcessingTime(filters, "end_to_end"),
    fetchReportProcessingTime(filters, "applicant_to_src"),
    fetchReportProcessingBySportBody(filters),
    fetchReportPipeline(filters),
    fetchReportDuration(filters, "application_type"),
  ]);
  if (!e2eR.ok) throw new Error(e2eR.error);
  const sheets: Array<{ name: string; rows: SheetRow[] }> = [
    { name: "Filters", rows: filterMetaRows(filters) },
    {
      name: "Turnaround",
      rows: [
        {
          measure: "End-to-end",
          sample_size: e2eR.data.sample_size,
          median_days: formatReportDays(e2eR.data.median_days),
          avg_days: formatReportDays(e2eR.data.avg_days),
          p90_days: formatReportDays(e2eR.data.p90_days),
        },
        ...(srcR.ok
          ? [
              {
                measure: "Applicant to SRC",
                sample_size: srcR.data.sample_size,
                median_days: formatReportDays(srcR.data.median_days),
                avg_days: formatReportDays(srcR.data.avg_days),
                p90_days: formatReportDays(srcR.data.p90_days),
              },
            ]
          : []),
      ],
    },
  ];
  if (pipeR.ok) {
    sheets.push({
      name: "Pipeline",
      rows: pipeR.data.stages.map((s) => ({
        stage: labelReportPipelineStage(s.stage),
        median_days: formatReportDays(s.median_days),
        avg_days: formatReportDays(s.avg_days),
      })),
    });
  }
  if (sbR.ok) {
    sheets.push({
      name: "Sport bodies",
      rows: sbR.data.buckets.map((b) => ({
        sport_body: b.sport_body_name,
        applications: b.applications_count,
        decided: b.decided_count,
        median_days: formatReportDays(b.median_days),
        avg_days: formatReportDays(b.avg_days),
        p90_days: formatReportDays(b.p90_days),
        approval_rate: formatReportPercent(b.approval_rate),
      })),
    });
  }
  if (durR.ok) {
    sheets.push({
      name: "Duration",
      rows: [
        {
          scope: "Overall",
          count: "",
          median_days: formatReportDays(durR.data.median_days),
          avg_days: formatReportDays(durR.data.avg_days),
          min_days: formatReportDays(durR.data.min_days),
          max_days: formatReportDays(durR.data.max_days),
        },
        ...(durR.data.buckets ?? []).map((b) => ({
          scope: labelReportApplicationType(b.key),
          count: b.count,
          median_days: formatReportDays(b.median_days),
          avg_days: formatReportDays(b.avg_days),
          min_days: "",
          max_days: "",
        })),
      ],
    });
  }
  return sheets;
}

async function sheetsForOutcomes(filters: ReportFilters) {
  const [oR, rR] = await Promise.all([
    fetchReportOutcomes(filters, "sport"),
    fetchReportRejections(filters),
  ]);
  if (!oR.ok) throw new Error(oR.error);
  const sheets: Array<{ name: string; rows: SheetRow[] }> = [
    { name: "Filters", rows: filterMetaRows(filters) },
    {
      name: "Outcomes by sport",
      rows: oR.data.buckets.map((b) => ({
        sport: b.label || b.key,
        submitted: b.submitted,
        approved: b.approved,
        rejected: b.rejected,
        withdrawn: b.withdrawn,
        still_pending: b.still_pending,
        terminal_rate: formatReportPercent(b.terminal_rate),
        cohort_rate: formatReportPercent(b.cohort_rate),
      })),
    },
  ];
  if (rR.ok) {
    sheets.push({
      name: "Rejections",
      rows: rR.data.buckets.map((b) => ({
        reason: labelReportRejectionCode(b.code),
        count: b.count,
        with_detail: b.other_detail_count,
      })),
    });
  }
  return sheets;
}

async function sheetsForAudit(filters: ReportFilters) {
  const [rows, approversR] = await Promise.all([
    fetchAllReportApprovals(filters),
    fetchReportApprovers(filters),
  ]);
  const sheets: Array<{ name: string; rows: SheetRow[] }> = [
    { name: "Filters", rows: filterMetaRows(filters) },
    {
      name: "Approvals",
      rows: rows.map((row) => ({
        reference: row.reference_number,
        event: row.event_display_name,
        application_type: labelReportApplicationType(row.application_type),
        sport: row.sport ?? "",
        body: labelReportApproverBody(row.body),
        status: row.status,
        decided_by: row.decided_by_name ?? row.decided_by_email ?? "",
        decided_at: formatReportDateTime(row.decided_at),
        processing_days: row.processing_days != null ? formatReportDays(row.processing_days) : "",
        decision_note: row.decision_note ?? "",
        rejection_reason: row.rejection_reason_code ?? "",
        rejection_detail: row.rejection_reason_detail ?? "",
        overridden: row.overridden ? "Yes" : "No",
        overridden_by: row.overridden_by_name ?? "",
      })),
    },
  ];
  if (approversR.ok) {
    sheets.push({
      name: "Approvers",
      rows: approversR.data.approvers.map((a) => ({
        approver: a.full_name,
        body: labelReportApproverBody(a.body),
        approved: a.approved_count,
        rejected: a.rejected_count,
        information_requested: a.information_requested_count,
        median_days: formatReportDays(a.median_decision_days),
        avg_days: formatReportDays(a.avg_decision_days),
        overdue: a.overdue_count,
      })),
    });
  }
  return sheets;
}

export type ExportReportsOptions = {
  volumeGroupBy?: string;
  trendsPeriod?: string;
  trendsMetric?: string;
};

export async function exportReportsTab(
  tab: ReportsTab,
  filters: ReportFilters,
  options: ExportReportsOptions = {},
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    let sheets: Array<{ name: string; rows: SheetRow[] }>;
    switch (tab) {
      case "overview":
        sheets = await sheetsForOverview(filters);
        break;
      case "volume":
        sheets = await sheetsForVolume(filters, options.volumeGroupBy ?? "status");
        break;
      case "trends":
        sheets = await sheetsForTrends(
          filters,
          options.trendsPeriod ?? "month",
          options.trendsMetric ?? "submissions",
        );
        break;
      case "processing":
        sheets = await sheetsForProcessing(filters);
        break;
      case "outcomes":
        sheets = await sheetsForOutcomes(filters);
        break;
      case "audit":
        sheets = await sheetsForAudit(filters);
        break;
      default:
        return { ok: false, error: "Unknown report tab." };
    }
    await writeWorkbook(sheets, exportFileName(tab, filters));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Export failed." };
  }
}
