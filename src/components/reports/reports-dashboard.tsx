import { $, component$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { ReportBarChart, ReportDataTable, ReportKpiCard } from "~/components/reports/report-charts";
import {
  defaultReportDateRange,
  fetchReportApprovals,
  fetchReportApprovers,
  fetchReportDuration,
  fetchReportFilters,
  fetchReportOutcomes,
  fetchReportPipeline,
  fetchReportProcessingBySportBody,
  fetchReportProcessingTime,
  fetchReportRejections,
  fetchReportSummary,
  fetchReportTrends,
  fetchReportTournamentClassification,
  fetchReportVolume,
  fetchReportWorkload,
} from "~/lib/reports-api";
import {
  formatReportCount,
  formatReportDateTime,
  formatReportDays,
  formatReportMonth,
  formatReportPercent,
  labelReportApplicationType,
  labelReportApproverBody,
  labelReportPipelineStage,
  labelReportRejectionCode,
  labelReportStatus,
  labelReportVolumeKey,
} from "~/lib/reports-format";
import type {
  ReportApprovalsListData,
  ReportApproversData,
  ReportDurationData,
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
  ReportsTab,
} from "~/lib/reports-types";
import { exportReportsTab } from "~/lib/reports-export";

const TABS: Array<{ id: ReportsTab; label: string; icon: string }> = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "volume", label: "Volume", icon: "pie_chart" },
  { id: "trends", label: "Trends", icon: "show_chart" },
  { id: "processing", label: "Processing", icon: "schedule" },
  { id: "outcomes", label: "Outcomes", icon: "fact_check" },
  { id: "audit", label: "Audit trail", icon: "history" },
];

type ReportsDashboardProps = {
  portal: "admin" | "approver";
};

export const ReportsDashboard = component$<ReportsDashboardProps>(({ portal }) => {
  const defaults = defaultReportDateRange();
  const filters = useStore<ReportFilters>({
    date_from: defaults.date_from,
    date_to: defaults.date_to,
    date_field: "submitted_at",
  });

  const meta = useSignal<ReportFiltersData | null>(null);
  const activeTab = useSignal<ReportsTab>("overview");
  const loading = useSignal(true);
  const loadError = useSignal<string | null>(null);
  const refreshNonce = useSignal(0);

  const summary = useSignal<ReportSummaryData | null>(null);
  const workload = useSignal<ReportWorkloadData | null>(null);
  const volumeStatus = useSignal<ReportVolumeData | null>(null);
  const volumeType = useSignal<ReportVolumeData | null>(null);
  const tournamentClass = useSignal<ReportVolumeData | null>(null);
  const trends = useSignal<ReportTrendsData | null>(null);
  const processingE2E = useSignal<ReportProcessingTimeData | null>(null);
  const processingSrc = useSignal<ReportProcessingTimeData | null>(null);
  const processingSportBody = useSignal<ReportSportBodyProcessingData | null>(null);
  const pipeline = useSignal<ReportPipelineData | null>(null);
  const duration = useSignal<ReportDurationData | null>(null);
  const outcomesSport = useSignal<ReportOutcomesData | null>(null);
  const rejections = useSignal<ReportRejectionsData | null>(null);
  const approvals = useSignal<ReportApprovalsListData | null>(null);
  const approvers = useSignal<ReportApproversData | null>(null);

  const volumeGroupBy = useSignal("status");
  const trendsPeriod = useSignal("month");
  const trendsMetric = useSignal("submissions");
  const auditOffset = useSignal(0);
  const exportBusy = useSignal(false);
  const exportMessage = useSignal<string | null>(null);
  const exportError = useSignal(false);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    const r = await fetchReportFilters();
    if (r.ok) meta.value = r.data.data;
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    track(() => [
      activeTab.value,
      refreshNonce.value,
      auditOffset.value,
      volumeGroupBy.value,
      trendsPeriod.value,
      trendsMetric.value,
      filters.date_from,
      filters.date_to,
      filters.date_field,
      filters.application_type,
      filters.sport,
      filters.status,
      filters.tournament_clasification,
      filters.sport_body_id,
    ]);

    loading.value = true;
    loadError.value = null;

    const f = { ...filters };
    const tab = activeTab.value;

    try {
      if (tab === "overview") {
        const [sR, wR, tR] = await Promise.all([
          fetchReportSummary(f),
          fetchReportWorkload(),
          fetchReportTournamentClassification(f),
        ]);
        if (!sR.ok) throw new Error(sR.error);
        if (!wR.ok) throw new Error(wR.error);
        summary.value = sR.data;
        workload.value = wR.data.data;
        tournamentClass.value = tR.ok ? tR.data : null;
        return;
      }

      if (tab === "volume") {
        const gb = volumeGroupBy.value;
        const [mainR, typeR, classR] = await Promise.all([
          fetchReportVolume(f, gb),
          fetchReportVolume(f, "application_type"),
          fetchReportTournamentClassification(f),
        ]);
        if (!mainR.ok) throw new Error(mainR.error);
        volumeStatus.value = mainR.data;
        volumeType.value = typeR.ok ? typeR.data : null;
        tournamentClass.value = classR.ok ? classR.data : null;
        return;
      }

      if (tab === "trends") {
        const r = await fetchReportTrends(f, trendsPeriod.value, trendsMetric.value, "application_type");
        if (!r.ok) throw new Error(r.error);
        trends.value = r.data;
        return;
      }

      if (tab === "processing") {
        const [e2eR, srcR, sbR, pipeR, durR] = await Promise.all([
          fetchReportProcessingTime(f, "end_to_end"),
          fetchReportProcessingTime(f, "applicant_to_src"),
          fetchReportProcessingBySportBody(f),
          fetchReportPipeline(f),
          fetchReportDuration(f, "application_type"),
        ]);
        if (!e2eR.ok) throw new Error(e2eR.error);
        processingE2E.value = e2eR.data;
        processingSrc.value = srcR.ok ? srcR.data : null;
        processingSportBody.value = sbR.ok ? sbR.data : null;
        pipeline.value = pipeR.ok ? pipeR.data : null;
        duration.value = durR.ok ? durR.data : null;
        return;
      }

      if (tab === "outcomes") {
        const [oR, rR] = await Promise.all([
          fetchReportOutcomes(f, "sport"),
          fetchReportRejections(f),
        ]);
        if (!oR.ok) throw new Error(oR.error);
        outcomesSport.value = oR.data;
        rejections.value = rR.ok ? rR.data : null;
        return;
      }

      if (tab === "audit") {
        const [aR, pR] = await Promise.all([
          fetchReportApprovals(f, { limit: 50, offset: auditOffset.value }),
          fetchReportApprovers(f),
        ]);
        if (!aR.ok) throw new Error(aR.error);
        approvals.value = aR.data;
        approvers.value = pR.ok ? pR.data : null;
      }
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : "Failed to load report data.";
    } finally {
      loading.value = false;
    }
  });

  const applyFilters$ = $(() => {
    refreshNonce.value++;
    auditOffset.value = 0;
  });

  const onExport$ = $(async () => {
    exportBusy.value = true;
    exportMessage.value = null;
    exportError.value = false;
    const r = await exportReportsTab(activeTab.value, { ...filters }, {
      volumeGroupBy: volumeGroupBy.value,
      trendsPeriod: trendsPeriod.value,
      trendsMetric: trendsMetric.value,
    });
    exportBusy.value = false;
    if (!r.ok) {
      exportMessage.value = r.error;
      exportError.value = true;
      return;
    }
    exportMessage.value = "Export downloaded.";
  });

  const maxTrendCount = trends.value?.series.reduce((m, p) => Math.max(m, p.count), 0) ?? 1;

  return (
    <div class="space-y-8">
      <section class="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
        <div class="flex flex-wrap items-end gap-4">
          <div class="space-y-1 min-w-[9rem]">
            <label class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">From</label>
            <input
              type="date"
              class="w-full rounded-lg border border-outline-variant/20 bg-surface-container-highest px-3 py-2 text-sm"
              value={filters.date_from ?? ""}
              onInput$={(e) => {
                filters.date_from = (e.target as HTMLInputElement).value;
              }}
            />
          </div>
          <div class="space-y-1 min-w-[9rem]">
            <label class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">To</label>
            <input
              type="date"
              class="w-full rounded-lg border border-outline-variant/20 bg-surface-container-highest px-3 py-2 text-sm"
              value={filters.date_to ?? ""}
              onInput$={(e) => {
                filters.date_to = (e.target as HTMLInputElement).value;
              }}
            />
          </div>
          <div class="space-y-1 min-w-[10rem]">
            <label class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Date field</label>
            <select
              class="w-full rounded-lg border border-outline-variant/20 bg-surface-container-highest px-3 py-2 text-sm"
              value={filters.date_field ?? "submitted_at"}
              onChange$={(e) => {
                filters.date_field = (e.target as HTMLSelectElement).value;
              }}
            >
              <option value="submitted_at">Submitted</option>
              <option value="created_at">Created</option>
              <option value="decided_at">Decided</option>
              <option value="departure_date">Departure</option>
              <option value="tour_start_date">Tour start</option>
            </select>
          </div>
          <div class="space-y-1 min-w-[10rem]">
            <label class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Application type</label>
            <select
              class="w-full rounded-lg border border-outline-variant/20 bg-surface-container-highest px-3 py-2 text-sm"
              value={filters.application_type ?? ""}
              onChange$={(e) => {
                filters.application_type = (e.target as HTMLSelectElement).value || undefined;
              }}
            >
              <option value="">All types</option>
              {(meta.value?.application_types ?? []).map((t) => (
                <option key={t} value={t}>
                  {labelReportApplicationType(t)}
                </option>
              ))}
            </select>
          </div>
          <div class="space-y-1 min-w-[10rem]">
            <label class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Sport</label>
            <select
              class="w-full rounded-lg border border-outline-variant/20 bg-surface-container-highest px-3 py-2 text-sm"
              value={filters.sport ?? ""}
              onChange$={(e) => {
                filters.sport = (e.target as HTMLSelectElement).value || undefined;
              }}
            >
              <option value="">All sports</option>
              {(meta.value?.sports ?? []).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div class="space-y-1 min-w-[10rem]">
            <label class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Status</label>
            <select
              class="w-full rounded-lg border border-outline-variant/20 bg-surface-container-highest px-3 py-2 text-sm"
              value={filters.status ?? ""}
              onChange$={(e) => {
                filters.status = (e.target as HTMLSelectElement).value || undefined;
              }}
            >
              <option value="">All statuses</option>
              {(meta.value?.statuses ?? []).map((s) => (
                <option key={s} value={s}>
                  {labelReportStatus(s)}
                </option>
              ))}
            </select>
          </div>
          <div class="space-y-1 min-w-[10rem]">
            <label class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Tournament class</label>
            <select
              class="w-full rounded-lg border border-outline-variant/20 bg-surface-container-highest px-3 py-2 text-sm"
              value={filters.tournament_clasification ?? ""}
              onChange$={(e) => {
                filters.tournament_clasification = (e.target as HTMLSelectElement).value || undefined;
              }}
            >
              <option value="">All</option>
              {(meta.value?.tournament_clasifications ?? []).map((c) => (
                <option key={c} value={c}>
                  {labelReportVolumeKey("tournament_clasification", c, c)}
                </option>
              ))}
            </select>
          </div>
          <div class="space-y-1 min-w-[11rem]">
            <label class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Sport body</label>
            <select
              class="w-full rounded-lg border border-outline-variant/20 bg-surface-container-highest px-3 py-2 text-sm"
              value={filters.sport_body_id ?? ""}
              onChange$={(e) => {
                const v = (e.target as HTMLSelectElement).value;
                filters.sport_body_id = v || undefined;
              }}
            >
              <option value="">All sport bodies</option>
              {(meta.value?.sport_bodies ?? []).map((sb) => (
                <option key={sb.id} value={String(sb.id)}>
                  {sb.short_name?.trim() || sb.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            class="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-sm hover:opacity-90"
            onClick$={applyFilters$}
          >
            Apply filters
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-outline-variant/25 bg-surface-container-highest px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-50"
            disabled={exportBusy.value}
            onClick$={onExport$}
          >
            {exportBusy.value ? (
              <span class="inline-block size-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" />
            ) : (
              <span class="material-symbols-outlined text-lg">download</span>
            )}
            Export Excel
          </button>
        </div>
        {exportMessage.value ? (
          <p
            class={exportError.value ? "mt-3 text-xs text-error" : "mt-3 text-xs text-primary"}
            role={exportError.value ? "alert" : "status"}
          >
            {exportMessage.value}
          </p>
        ) : null}
        {portal === "approver" ? (
          <p class="mt-3 text-xs text-on-surface-variant">
            SRC reports only. Open queue counts on Overview are live snapshots.
          </p>
        ) : null}
      </section>

      <nav class="flex flex-wrap gap-2 border-b border-outline-variant/15 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            class={
              activeTab.value === tab.id
                ? "inline-flex items-center gap-2 rounded-t-lg border border-b-0 border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 text-sm font-bold text-primary"
                : "inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
            }
            onClick$={() => {
              activeTab.value = tab.id;
            }}
          >
            <span class="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {loadError.value ? (
        <div class="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error" role="alert">
          {loadError.value}
        </div>
      ) : null}

      {loading.value ? (
        <div class="flex items-center justify-center gap-3 py-20 text-on-surface-variant">
          <span class="inline-block size-6 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" />
          Loading report data…
        </div>
      ) : (
        <>
          {activeTab.value === "overview" && summary.value ? (
            <div class="space-y-8">
              <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ReportKpiCard label="Total applications" value={formatReportCount(summary.value.total_applications)} />
                <ReportKpiCard
                  label="Approval rate"
                  value={formatReportPercent(summary.value.approval_rate)}
                  hint={`${formatReportCount(summary.value.approved_count)} approved · ${formatReportCount(summary.value.rejected_count)} rejected`}
                  tone="success"
                />
                <ReportKpiCard
                  label="Pending"
                  value={formatReportCount(summary.value.pending_count)}
                  hint="Non-terminal statuses in range"
                  tone="warning"
                />
                <ReportKpiCard label="Total travellers" value={formatReportCount(summary.value.total_travellers)} />
                <ReportKpiCard
                  label="Median end-to-end"
                  value={formatReportDays(summary.value.median_end_to_end_days)}
                  hint={`Avg ${formatReportDays(summary.value.avg_end_to_end_days)}`}
                />
                <ReportKpiCard
                  label="Applicant → SRC"
                  value={formatReportDays(summary.value.avg_applicant_to_src_days)}
                  hint="Average days to SRC approval"
                />
                <ReportKpiCard
                  label="Overdue approvals"
                  value={formatReportCount(summary.value.overdue_approvals_count)}
                  tone={summary.value.overdue_approvals_count > 0 ? "error" : "default"}
                />
                <ReportKpiCard
                  label="Certificates issued"
                  value={formatReportCount(summary.value.certificate_issued_count)}
                />
              </div>

              {workload.value ? (
                <section class="grid gap-6 lg:grid-cols-2">
                  <ReportBarChart
                    title="Open queue by application status"
                    groupBy="status"
                    buckets={Object.entries(workload.value.by_application_status).map(([key, count]) => ({
                      key,
                      label: labelReportStatus(key),
                      count,
                      percentage: 0,
                    }))}
                  />
                  <ReportBarChart
                    title="Open approvals by body"
                    groupBy="body"
                    buckets={Object.entries(workload.value.by_approval_body).map(([key, count]) => ({
                      key,
                      label: labelReportApproverBody(key),
                      count,
                      percentage: 0,
                    }))}
                  />
                </section>
              ) : null}

              <section class="grid gap-6 lg:grid-cols-2">
                <ReportBarChart
                  title="By application type"
                  groupBy="application_type"
                  buckets={Object.entries(summary.value.by_application_type).map(([key, count]) => ({
                    key,
                    label: labelReportApplicationType(key),
                    count,
                    percentage: summary.value!.total_applications
                      ? Math.round((count / summary.value!.total_applications) * 1000) / 10
                      : 0,
                  }))}
                />
                {tournamentClass.value ? (
                  <ReportBarChart
                    title="Tournament classification"
                    groupBy="tournament_clasification"
                    buckets={tournamentClass.value.buckets}
                  />
                ) : null}
              </section>
            </div>
          ) : null}

          {activeTab.value === "volume" ? (
            <div class="space-y-6">
              <div class="flex flex-wrap items-center gap-3">
                <label class="text-sm font-semibold text-on-surface-variant">Group by</label>
                <select
                  class="rounded-lg border border-outline-variant/20 bg-surface-container-highest px-3 py-2 text-sm"
                  value={volumeGroupBy.value}
                  onChange$={(e) => {
                    volumeGroupBy.value = (e.target as HTMLSelectElement).value;
                    refreshNonce.value++;
                  }}
                >
                  <option value="status">Status</option>
                  <option value="application_type">Application type</option>
                  <option value="sport">Sport</option>
                  <option value="event_type">Event type</option>
                  <option value="tournament_clasification">Tournament classification</option>
                  <option value="priority">Priority</option>
                  <option value="host_country">Host country</option>
                  <option value="province">Province</option>
                  <option value="org_type">Organisation type</option>
                </select>
              </div>
              <div class="grid gap-6 lg:grid-cols-2">
                {volumeStatus.value ? (
                  <ReportBarChart
                    title={`Volume by ${volumeGroupBy.value.replace(/_/g, " ")}`}
                    groupBy={volumeGroupBy.value}
                    buckets={volumeStatus.value.buckets}
                  />
                ) : null}
                {volumeType.value ? (
                  <ReportBarChart
                    title="By application type"
                    groupBy="application_type"
                    buckets={volumeType.value.buckets}
                  />
                ) : null}
                {tournamentClass.value ? (
                  <ReportBarChart
                    title="Tournament classification"
                    groupBy="tournament_clasification"
                    buckets={tournamentClass.value.buckets}
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          {activeTab.value === "trends" && trends.value ? (
            <div class="space-y-6">
              <div class="flex flex-wrap items-center gap-4">
                <div class="space-y-1">
                  <label class="text-xs font-semibold uppercase text-on-surface-variant">Period</label>
                  <select
                    class="rounded-lg border border-outline-variant/20 bg-surface-container-highest px-3 py-2 text-sm"
                    value={trendsPeriod.value}
                    onChange$={(e) => {
                      trendsPeriod.value = (e.target as HTMLSelectElement).value;
                      refreshNonce.value++;
                    }}
                  >
                    <option value="month">Month</option>
                    <option value="week">Week</option>
                    <option value="quarter">Quarter</option>
                    <option value="year">Year</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-semibold uppercase text-on-surface-variant">Metric</label>
                  <select
                    class="rounded-lg border border-outline-variant/20 bg-surface-container-highest px-3 py-2 text-sm"
                    value={trendsMetric.value}
                    onChange$={(e) => {
                      trendsMetric.value = (e.target as HTMLSelectElement).value;
                      refreshNonce.value++;
                    }}
                  >
                    <option value="submissions">Submissions</option>
                    <option value="decisions">Decisions</option>
                    <option value="approvals">Approvals</option>
                    <option value="rejections">Rejections</option>
                    <option value="certificates">Certificates</option>
                  </select>
                </div>
              </div>

              <div class="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
                <h3 class="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-6">
                  {trends.value.metric} over time ({trends.value.period})
                </h3>
                {trends.value.series.length === 0 ? (
                  <p class="text-sm text-on-surface-variant">No trend data for this range.</p>
                ) : (
                  <div class="flex items-end gap-2 h-48 overflow-x-auto pb-2">
                    {trends.value.series.map((pt) => (
                      <div key={pt.bucket_start} class="flex flex-col items-center min-w-[3rem] flex-1">
                        <span class="text-[10px] tabular-nums text-on-surface-variant mb-1">{pt.count}</span>
                        <div
                          class="w-full max-w-[2.5rem] rounded-t bg-primary/80"
                          style={{ height: `${Math.max(4, Math.round((pt.count / maxTrendCount) * 100))}%` }}
                          title={`${pt.bucket_start} – ${pt.bucket_end}: ${pt.count}`}
                        />
                        <span class="text-[9px] text-on-surface-variant mt-2 -rotate-45 origin-top-left whitespace-nowrap">
                          {formatReportMonth(pt.bucket_start)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {activeTab.value === "processing" ? (
            <div class="space-y-8">
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {processingE2E.value ? (
                  <>
                    <ReportKpiCard
                      label="End-to-end (median)"
                      value={formatReportDays(processingE2E.value.median_days)}
                      hint={`n=${processingE2E.value.sample_size} · p90 ${formatReportDays(processingE2E.value.p90_days)}`}
                    />
                    <ReportKpiCard label="End-to-end (avg)" value={formatReportDays(processingE2E.value.avg_days)} />
                  </>
                ) : null}
                {processingSrc.value ? (
                  <ReportKpiCard
                    label="Applicant → SRC (median)"
                    value={formatReportDays(processingSrc.value.median_days)}
                    hint={`n=${processingSrc.value.sample_size}`}
                  />
                ) : null}
                {duration.value ? (
                  <ReportKpiCard
                    label="Trip duration (median)"
                    value={formatReportDays(duration.value.median_days)}
                    hint={`${formatReportDays(duration.value.min_days)} – ${formatReportDays(duration.value.max_days)}`}
                  />
                ) : null}
              </div>

              {pipeline.value?.stages.length ? (
                <div class="space-y-3">
                  <h3 class="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Processing pipeline</h3>
                  <ReportDataTable
                    columns={[
                      { key: "stage", label: "Stage" },
                      { key: "median", label: "Median days", class: "text-right" },
                      { key: "avg", label: "Avg days", class: "text-right" },
                    ]}
                    rows={pipeline.value.stages.map((s) => ({
                      _key: s.stage,
                      stage: labelReportPipelineStage(s.stage),
                      median: formatReportDays(s.median_days),
                      avg: formatReportDays(s.avg_days),
                    }))}
                  />
                </div>
              ) : null}

              {processingSportBody.value?.buckets.length ? (
                <div class="space-y-3">
                  <h3 class="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Sport body approval times</h3>
                  <ReportDataTable
                    columns={[
                      { key: "name", label: "Sport body" },
                      { key: "apps", label: "Applications", class: "text-right" },
                      { key: "decided", label: "Decided", class: "text-right" },
                      { key: "median", label: "Median", class: "text-right" },
                      { key: "avg", label: "Avg", class: "text-right" },
                      { key: "p90", label: "P90", class: "text-right" },
                      { key: "rate", label: "Approval rate", class: "text-right" },
                    ]}
                    rows={processingSportBody.value.buckets.map((b) => ({
                      _key: b.sport_body_id,
                      name: b.sport_body_name,
                      apps: b.applications_count,
                      decided: b.decided_count,
                      median: formatReportDays(b.median_days),
                      avg: formatReportDays(b.avg_days),
                      p90: formatReportDays(b.p90_days),
                      rate: formatReportPercent(b.approval_rate),
                    }))}
                  />
                </div>
              ) : null}

              {duration.value?.buckets?.length ? (
                <div class="space-y-3">
                  <h3 class="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Duration by type</h3>
                  <ReportDataTable
                    columns={[
                      { key: "type", label: "Type" },
                      { key: "count", label: "Count", class: "text-right" },
                      { key: "median", label: "Median days", class: "text-right" },
                      { key: "avg", label: "Avg days", class: "text-right" },
                    ]}
                    rows={duration.value.buckets.map((b) => ({
                      _key: b.key,
                      type: labelReportApplicationType(b.key),
                      count: b.count,
                      median: formatReportDays(b.median_days),
                      avg: formatReportDays(b.avg_days),
                    }))}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab.value === "outcomes" ? (
            <div class="space-y-8">
              {outcomesSport.value?.buckets.length ? (
                <div class="space-y-3">
                  <h3 class="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Outcomes by sport</h3>
                  <ReportDataTable
                    columns={[
                      { key: "sport", label: "Sport" },
                      { key: "submitted", label: "Submitted", class: "text-right" },
                      { key: "approved", label: "Approved", class: "text-right" },
                      { key: "rejected", label: "Rejected", class: "text-right" },
                      { key: "pending", label: "Pending", class: "text-right" },
                      { key: "terminal", label: "Terminal rate", class: "text-right" },
                      { key: "cohort", label: "Cohort rate", class: "text-right" },
                    ]}
                    rows={outcomesSport.value.buckets.map((b) => ({
                      _key: b.key,
                      sport: b.label || b.key,
                      submitted: b.submitted,
                      approved: b.approved,
                      rejected: b.rejected,
                      pending: b.still_pending,
                      terminal: formatReportPercent(b.terminal_rate),
                      cohort: formatReportPercent(b.cohort_rate),
                    }))}
                  />
                </div>
              ) : null}

              {rejections.value?.buckets.length ? (
                <ReportBarChart
                  title="Rejection reasons"
                  groupBy="code"
                  buckets={rejections.value.buckets.map((b) => ({
                    key: b.code,
                    label: labelReportRejectionCode(b.code),
                    count: b.count,
                    percentage: 0,
                  }))}
                />
              ) : null}
            </div>
          ) : null}

          {activeTab.value === "audit" ? (
            <div class="space-y-8">
              {approvers.value?.approvers.length ? (
                <div class="space-y-3">
                  <h3 class="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Approver statistics</h3>
                  <ReportDataTable
                    columns={[
                      { key: "name", label: "Approver" },
                      { key: "body", label: "Body" },
                      { key: "approved", label: "Approved", class: "text-right" },
                      { key: "rejected", label: "Rejected", class: "text-right" },
                      { key: "info", label: "Info req.", class: "text-right" },
                      { key: "median", label: "Median days", class: "text-right" },
                      { key: "overdue", label: "Overdue", class: "text-right" },
                    ]}
                    rows={approvers.value.approvers.map((a) => ({
                      _key: `${a.user_id}-${a.body}`,
                      name: a.full_name,
                      body: labelReportApproverBody(a.body),
                      approved: a.approved_count,
                      rejected: a.rejected_count,
                      info: a.information_requested_count,
                      median: formatReportDays(a.median_decision_days),
                      overdue: a.overdue_count,
                    }))}
                  />
                </div>
              ) : null}

              {approvals.value ? (
                <div class="space-y-3">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <h3 class="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
                      Approval audit trail ({approvals.value.total.toLocaleString()} total)
                    </h3>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        class="rounded-lg border border-outline-variant/20 px-3 py-1.5 text-sm disabled:opacity-40"
                        disabled={auditOffset.value <= 0}
                        onClick$={() => {
                          auditOffset.value = Math.max(0, auditOffset.value - 50);
                        }}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        class="rounded-lg border border-outline-variant/20 px-3 py-1.5 text-sm disabled:opacity-40"
                        disabled={auditOffset.value + 50 >= approvals.value!.total}
                        onClick$={() => {
                          auditOffset.value += 50;
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                  <ReportDataTable
                    columns={[
                      { key: "ref", label: "Reference" },
                      { key: "event", label: "Event" },
                      { key: "body", label: "Body" },
                      { key: "status", label: "Status" },
                      { key: "approver", label: "Decided by" },
                      { key: "at", label: "Decided at" },
                      { key: "days", label: "Days", class: "text-right" },
                    ]}
                    rows={approvals.value.rows.map((row) => ({
                      _key: row.approval_id,
                      ref: row.reference_number,
                      event: row.event_display_name,
                      body: labelReportApproverBody(row.body),
                      status: row.status.replace(/_/g, " "),
                      approver: row.decided_by_name ?? row.decided_by_email ?? "—",
                      at: formatReportDateTime(row.decided_at),
                      days: row.processing_days != null ? formatReportDays(row.processing_days) : "—",
                    }))}
                    emptyMessage="No approval decisions in this range."
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
});
