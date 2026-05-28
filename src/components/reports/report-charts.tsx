import { component$ } from "@builder.io/qwik";
import type { ReportVolumeBucket } from "~/lib/reports-types";
import { labelReportVolumeKey } from "~/lib/reports-format";

type BarChartProps = {
  title: string;
  groupBy: string;
  buckets: ReportVolumeBucket[];
  emptyMessage?: string;
};

export const ReportBarChart = component$<BarChartProps>(({ title, groupBy, buckets, emptyMessage }) => {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div class="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
      <h3 class="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4">{title}</h3>
      {buckets.length === 0 ? (
        <p class="text-sm text-on-surface-variant">{emptyMessage ?? "No data for the selected filters."}</p>
      ) : (
        <ul class="space-y-3">
          {buckets.map((b) => (
            <li key={b.key}>
              <div class="flex items-center justify-between gap-3 text-sm mb-1">
                <span class="truncate font-medium text-on-surface" title={b.label}>
                  {labelReportVolumeKey(groupBy, b.key, b.label)}
                </span>
                <span class="shrink-0 tabular-nums text-on-surface-variant">
                  {b.count.toLocaleString()}
                  {b.percentage > 0 ? ` (${b.percentage}%)` : ""}
                </span>
              </div>
              <div class="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                <div
                  class="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.round((b.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "error";
};

export const ReportKpiCard = component$<KpiCardProps>(({ label, value, hint, tone = "default" }) => {
  const toneClass =
    tone === "success"
      ? "border-primary/25 bg-primary/5"
      : tone === "warning"
        ? "border-amber-500/30 bg-amber-500/5"
        : tone === "error"
          ? "border-error/30 bg-error/5"
          : "border-outline-variant/15 bg-surface-container-lowest";
  return (
    <div class={`rounded-xl border p-4 shadow-sm ${toneClass}`}>
      <p class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p class="mt-2 text-2xl font-bold tabular-nums text-on-surface">{value}</p>
      {hint ? <p class="mt-1 text-xs text-on-surface-variant">{hint}</p> : null}
    </div>
  );
});

type DataTableProps = {
  columns: Array<{ key: string; label: string; class?: string }>;
  rows: Array<Record<string, string | number | null | undefined>>;
  emptyMessage?: string;
};

export const ReportDataTable = component$<DataTableProps>(({ columns, rows, emptyMessage }) => {
  if (rows.length === 0) {
    return <p class="text-sm text-on-surface-variant py-6 text-center">{emptyMessage ?? "No rows to display."}</p>;
  }
  return (
    <div class="overflow-x-auto rounded-xl border border-outline-variant/15">
      <table class="min-w-full text-sm">
        <thead class="bg-surface-container-low text-left text-xs uppercase tracking-wider text-on-surface-variant">
          <tr>
            {columns.map((c) => (
              <th key={c.key} class={`px-4 py-3 font-semibold ${c.class ?? ""}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant/10 bg-surface-container-lowest">
          {rows.map((row, i) => (
            <tr key={String(row._key ?? i)} class="hover:bg-surface-container-low/60">
              {columns.map((c) => (
                <td key={c.key} class={`px-4 py-3 text-on-surface ${c.class ?? ""}`}>
                  {row[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
