import { component$ } from "@builder.io/qwik";
import { approvalDetailRows } from "~/lib/application-dossier-display";
import { buildMergedApplicationTimeline } from "~/lib/application-display";
import type { ApiApplication } from "~/lib/applications-api";
import type { ApiApproval } from "~/lib/approvals-api";

export const ApprovalActivitySection = component$((props: { app: ApiApplication; approvals: ApiApproval[] }) => {
  const timeline = buildMergedApplicationTimeline(props.app, props.approvals);
  const approvalRows = props.approvals.filter((a) => approvalDetailRows(a).length > 0);

  if (!timeline.length && !approvalRows.length) return null;

  return (
    <div class="space-y-8">
      {timeline.length ? (
        <section class="rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
          <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between gap-y-2 mb-6">
            <div>
              <h2 class="text-xl font-bold text-primary flex items-center gap-3">
                <span class="w-1 bg-secondary h-6 rounded-full" />
                <span class="material-symbols-outlined text-secondary text-xl">timeline</span>
                Approval activity
              </h2>
              <p class="text-xs text-on-surface-variant mt-2 max-w-xl">
                Newest updates at the top; older events (including submission) below.
              </p>
            </div>
            <span class="text-on-surface-variant text-xs font-medium uppercase tracking-widest shrink-0">
              Latest first
            </span>
          </div>

          <div class="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/30">
            {timeline.map((ev, i) => (
              <div key={`${ev.title}-${i}`} class="relative">
                <div
                  class={[
                    "absolute -left-10 top-0 w-6 h-6 rounded-full border-4 border-background z-10",
                    ev.variant === "action"
                      ? "bg-tertiary"
                      : ev.variant === "success"
                        ? "bg-primary-fixed-dim"
                        : "bg-outline-variant",
                  ].join(" ")}
                />
                <div
                  class={[
                    "p-5 sm:p-6 rounded-xl border",
                    ev.variant === "action"
                      ? "bg-surface-container-lowest border-l-4 border-tertiary"
                      : ev.variant === "success"
                        ? "bg-surface-container border-outline-variant/20"
                        : "bg-surface-container opacity-95 border-outline-variant/15",
                  ].join(" ")}
                >
                  <div class="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <span
                        class={
                          ev.variant === "action"
                            ? "text-tertiary text-xs font-bold uppercase tracking-widest block mb-1"
                            : "text-on-surface-variant text-xs font-bold uppercase tracking-widest block mb-1"
                        }
                      >
                        {ev.when} · {ev.eyebrow}
                      </span>
                      <h3 class="text-lg font-bold font-headline text-primary">{ev.title}</h3>
                    </div>
                    {ev.variant === "success" ? (
                      <span
                        class="material-symbols-outlined text-on-primary-fixed-variant shrink-0"
                        style="font-variation-settings: 'FILL' 1;"
                      >
                        check_circle
                      </span>
                    ) : null}
                  </div>
                  {ev.body ? <p class="text-sm text-on-surface-variant leading-relaxed mt-2">{ev.body}</p> : null}
                  {ev.approvalDetail ? (
                    <div class="mt-4 space-y-3 text-sm border-t border-outline-variant/20 pt-4">
                      <div>
                        <span class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                          {ev.approvalDetail.timeLabel}
                        </span>
                        <p class="text-on-surface font-medium">{ev.approvalDetail.decidedAt}</p>
                      </div>
                      {ev.approvalDetail.decisionNote ? (
                        <div>
                          <span class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                            Decision note
                          </span>
                          <p class="text-on-surface whitespace-pre-wrap">{ev.approvalDetail.decisionNote}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {approvalRows.length ? (
        <section class="rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
          <h2 class="text-xl font-bold text-primary mb-6 flex items-center gap-3">
            <span class="w-1 bg-secondary h-6 rounded-full" />
            <span class="material-symbols-outlined text-secondary text-xl">gavel</span>
            Approval records
          </h2>
          <div class="space-y-6">
            {approvalRows.map((a) => {
              const rows = approvalDetailRows(a);
              return (
                <div
                  key={a.id}
                  class="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4 sm:p-5"
                >
                  <dl class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    {rows.map((r) => (
                      <div key={r.label} class="min-w-0">
                        <dt class="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">{r.label}</dt>
                        <dd class="font-medium text-on-surface break-words whitespace-pre-wrap">{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
});
