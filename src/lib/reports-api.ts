import { apiFetchJson } from "~/lib/auth";
import type {
  ReportApprovalsListData,
  ReportApprovalRow,
  ReportApproversData,
  ReportDurationData,
  ReportEnvelope,
  ReportFilters,
  ReportFiltersData,
  ReportOutcomesData,
  ReportPipelineData,
  ReportProcessingTimeData,
  ReportRejectionsData,
  ReportSportBodyProcessingData,
  ReportSummaryData,
  ReportTrendsData,
  ReportVolumeData,
  ReportWorkloadData,
} from "~/lib/reports-types";

function buildReportQuery(filters: ReportFilters, extra?: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  if (filters.date_from) q.set("date_from", filters.date_from);
  if (filters.date_to) q.set("date_to", filters.date_to);
  if (filters.date_field) q.set("date_field", filters.date_field);
  if (filters.application_type) q.set("application_type", filters.application_type);
  if (filters.sport) q.set("sport", filters.sport);
  if (filters.status) q.set("status", filters.status);
  if (filters.tournament_clasification) q.set("tournament_clasification", filters.tournament_clasification);
  if (filters.organisation_id) q.set("organisation_id", filters.organisation_id);
  if (filters.sport_body_id) q.set("sport_body_id", filters.sport_body_id);
  if (filters.priority) q.set("priority", filters.priority);
  if (filters.host_country) q.set("host_country", filters.host_country);
  if (filters.represented_country) q.set("represented_country", filters.represented_country);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined && v !== "") q.set(k, String(v));
    }
  }
  return q.toString();
}

async function fetchReport<T>(path: string, filters: ReportFilters, extra?: Record<string, string | number | undefined>) {
  const qs = buildReportQuery(filters, extra);
  const suffix = qs ? `?${qs}` : "";
  const r = await apiFetchJson<ReportEnvelope<T>>(`/api/v1/reports/${path}${suffix}`, { method: "GET" });
  if (!r.ok) return r;
  return { ok: true as const, data: r.data.data, generatedAt: r.data.generated_at };
}

export async function fetchReportFilters() {
  return apiFetchJson<ReportEnvelope<ReportFiltersData>>("/api/v1/reports/filters", { method: "GET" });
}

export function fetchReportSummary(filters: ReportFilters) {
  return fetchReport<ReportSummaryData>("summary", filters);
}

export function fetchReportVolume(filters: ReportFilters, groupBy: string, limit?: number) {
  return fetchReport<ReportVolumeData>("volume", filters, { group_by: groupBy, limit });
}

export function fetchReportTrends(
  filters: ReportFilters,
  period: string,
  metric: string,
  splitBy?: string,
) {
  return fetchReport<ReportTrendsData>("trends", filters, {
    period,
    metric,
    split_by: splitBy,
  });
}

export function fetchReportProcessingTime(filters: ReportFilters, measure: string) {
  return fetchReport<ReportProcessingTimeData>("processing-time", filters, { measure });
}

export function fetchReportProcessingBySportBody(filters: ReportFilters) {
  return fetchReport<ReportSportBodyProcessingData>("processing-time/by-sport-body", filters);
}

export function fetchReportPipeline(filters: ReportFilters) {
  return fetchReport<ReportPipelineData>("processing-time/pipeline", filters);
}

export function fetchReportDuration(filters: ReportFilters, groupBy?: string) {
  return fetchReport<ReportDurationData>("duration", filters, { group_by: groupBy });
}

export function fetchReportTournamentClassification(filters: ReportFilters) {
  return fetchReport<ReportVolumeData>("tournament-classification", filters);
}

export function fetchReportOutcomes(filters: ReportFilters, groupBy?: string) {
  return fetchReport<ReportOutcomesData>("outcomes", filters, { group_by: groupBy });
}

export function fetchReportRejections(filters: ReportFilters, body?: string) {
  return fetchReport<ReportRejectionsData>("rejections", filters, { body });
}

export function fetchReportApprovals(
  filters: ReportFilters,
  opts: { body?: string; approval_status?: string; limit?: number; offset?: number },
) {
  return fetchReport<ReportApprovalsListData>("approvals", filters, {
    body: opts.body,
    approval_status: opts.approval_status,
    limit: opts.limit ?? 50,
    offset: opts.offset ?? 0,
    sort: "-decided_at",
  });
}

/** Fetch all approval audit rows for export (paginated, max 10k rows). */
export async function fetchAllReportApprovals(filters: ReportFilters) {
  const limit = 200;
  let offset = 0;
  let total = Infinity;
  const rows: ReportApprovalRow[] = [];
  const maxRows = 10_000;
  while (offset < total && rows.length < maxRows) {
    const r = await fetchReportApprovals(filters, { limit, offset });
    if (!r.ok) throw new Error(r.error);
    total = r.data.total;
    rows.push(...r.data.rows);
    if (r.data.rows.length === 0) break;
    offset += limit;
  }
  return rows;
}

export function fetchReportApprovers(filters: ReportFilters, body?: string) {
  return fetchReport<ReportApproversData>("approvers", filters, { body });
}

export function fetchReportWorkload() {
  return apiFetchJson<ReportEnvelope<ReportWorkloadData>>("/api/v1/reports/workload", { method: "GET" });
}

/** Default date range: last 12 months through today (YYYY-MM-DD). */
export function defaultReportDateRange(): { date_from: string; date_to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setFullYear(from.getFullYear() - 1);
  return {
    date_from: from.toISOString().slice(0, 10),
    date_to: to.toISOString().slice(0, 10),
  };
}
