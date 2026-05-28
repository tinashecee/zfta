import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { ApproverPortalNav } from "~/components/approver-portal-nav";
import { ApplicationDossier } from "~/components/processing/application-dossier";
import type { ApiApplication } from "~/lib/applications-api";
import { getApplication } from "~/lib/applications-api";
import type { ApiApproval } from "~/lib/approvals-api";
import { listApprovals } from "~/lib/approvals-api";
import { getGovernanceChipPair } from "~/lib/approver-approval-helpers";
import { getLatestApprovalForBodyCode } from "~/lib/approval-rules";
import { formatDateTime, labelEventType } from "~/lib/application-display";
import { labelApplicationType } from "~/lib/application-types";
import { downloadDecisionRecord } from "~/lib/download-decision-record";
import { getOrganisation, organisationDisplayName, type ApiOrganisation } from "~/lib/organisations-api";
import { resolvePrimaryBodyFromOrgSport, routingSportForApplication } from "~/lib/sport-routing";
import { listSportBodies } from "~/lib/sport-bodies-api";
import { listZimbabweSports } from "~/lib/zimbabwe-sports-api";
import { apiPersonnelToRow, type TravelPersonnelRow } from "~/lib/travel-personnel-types";

function str(v: string | null | undefined | number | boolean): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v).trim();
}

function isRejectedStatus(status: string | null | undefined): boolean {
  return (status ?? "").trim().toLowerCase() === "rejected";
}

function isApprovedStatus(status: string | null | undefined): boolean {
  const s = (status ?? "").trim().toLowerCase();
  return s === "approved" || s === "certificate_issued";
}

function finalStatusLabel(status: string | null | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "rejected") return "Rejected";
  if (s === "certificate_issued") return "Certificate issued";
  if (s === "approved") return "Approved";
  return str(status).replace(/_/g, " ") || "Closed";
}

export default component$(() => {
  const location = useLocation();
  const id = location.url.searchParams.get("id") ?? "";

  const loading = useSignal(true);
  const loadError = useSignal<string | null>(null);
  const application = useSignal<ApiApplication | null>(null);
  const organisation = useSignal<ApiOrganisation | null>(null);
  const personnel = useSignal<TravelPersonnelRow[]>([]);
  const approvals = useSignal<ApiApproval[]>([]);
  const primaryBodyCode = useSignal("");
  const primaryBodyLabel = useSignal("");
  const downloadError = useSignal<string | null>(null);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    if (!id) {
      loading.value = false;
      loadError.value = "No application ID provided.";
      return;
    }

    loading.value = true;
    loadError.value = null;

    const [appR, apprR] = await Promise.all([
      getApplication(id),
      listApprovals({ application_id: id, limit: 50, offset: 0 }),
    ]);

    if (!appR.ok) {
      loading.value = false;
      loadError.value = appR.error;
      return;
    }

    application.value = appR.data;
    personnel.value = (appR.data.personnel ?? []).map(apiPersonnelToRow);
    approvals.value = apprR.ok ? apprR.data : [];

    const oid = appR.data.organisation_id?.trim();
    if (oid) {
      const orgR = await getOrganisation(oid);
      organisation.value = orgR.ok ? orgR.data : null;
    } else {
      organisation.value = null;
    }

    const organisationSport =
      organisation.value?.sport != null && String(organisation.value.sport).trim() !== ""
        ? String(organisation.value.sport).trim()
        : "";

    const [zsR, sbR] = await Promise.all([
      listZimbabweSports({ limit: 200, offset: 0 }),
      listSportBodies({ limit: 200, offset: 0 }),
    ]);
    const zs = zsR.ok ? zsR.data : [];
    const sb = sbR.ok ? sbR.data : [];

    const resolved = resolvePrimaryBodyFromOrgSport(
      routingSportForApplication(appR.data.sport, organisationSport),
      zs,
      sb,
    );
    primaryBodyCode.value = resolved.code;
    primaryBodyLabel.value = resolved.label;

    loading.value = false;
  });

  const app = application.value;
  const organisationName = organisation.value
    ? organisationDisplayName(organisation.value).trim() || "—"
    : "—";
  const organisationSport =
    organisation.value?.sport != null && String(organisation.value.sport).trim() !== ""
      ? String(organisation.value.sport).trim()
      : "";
  const routingSportLabel = app ? routingSportForApplication(app.sport, organisationSport) : "";
  const applicationTypeLabel = app ? labelApplicationType(app.application_type) : "";
  const isRejected = app ? isRejectedStatus(app.status) : location.url.searchParams.get("result") === "rejected";
  const isApproved = app ? isApprovedStatus(app.status) : !isRejected;

  const finalSrcApproval = app ? getLatestApprovalForBodyCode(approvals.value, "SRC") : undefined;
  const finalDecisionNote =
    (finalSrcApproval?.decision_note ?? "").trim() ||
    (isRejected
      ? "Application was rejected after final governance review."
      : isApproved
        ? "Application was approved after all required supporting documents and external checks were completed."
        : "This historical record is read-only.");

  const closedOn = formatDateTime(
    finalSrcApproval?.decided_at ?? app?.updated_at ?? app?.submitted_at ?? app?.created_at,
  );

  return (
    <div class="flex flex-1 flex-col min-h-0 min-w-0 bg-background text-on-background">
      <ApproverPortalNav activeItem="archived" title="Official Approver Portal - Historical Review" />

      <main class="flex-1 min-h-0 min-w-0 w-full">
        <div class="pt-24 px-4 pb-8 sm:px-6 sm:pb-12 lg:px-8">
          {loadError.value ? (
            <div class="mb-6 rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error" role="alert">
              {loadError.value}
            </div>
          ) : null}

          {loading.value ? (
            <p class="text-on-surface-variant pt-8">Loading archived application…</p>
          ) : loadError.value ? null : app ? (
            <>
              <header class="mb-6 rounded-xl bg-white/80 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.04)] backdrop-blur-md sm:mb-10 sm:p-6">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div>
                    {applicationTypeLabel ? (
                      <div class="mb-3">
                        <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
                          <span class="material-symbols-outlined text-sm">category</span>
                          {applicationTypeLabel}
                        </span>
                      </div>
                    ) : null}
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-secondary font-bold text-xs tracking-widest uppercase">
                        Application Reference
                      </span>
                      <span class="bg-surface-container-highest px-2 py-0.5 rounded text-[10px] font-bold">
                        ARCHIVED RECORD
                      </span>
                    </div>
                    <h1 class="break-words text-2xl font-extrabold tracking-tight text-primary sm:text-4xl">
                      {str(app.reference_number) || app.id.slice(0, 8)}
                    </h1>
                    <div class="flex flex-col gap-2 mt-3 max-w-3xl">
                      <div>
                        <span class="text-[10px] font-bold text-outline uppercase tracking-widest block mb-0.5">
                          Organisation
                        </span>
                        <div class="flex flex-col gap-1">
                          <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-secondary text-lg">domain</span>
                            <span class="font-bold text-xl text-on-surface">{organisationName}</span>
                          </div>
                          {routingSportLabel ? (
                            <p class="text-sm text-on-surface-variant pl-8">
                              Sport:{" "}
                              <span class="font-semibold text-on-surface">{routingSportLabel}</span>
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div>
                        <span class="text-[10px] font-bold text-outline uppercase tracking-widest block mb-0.5">
                          Event
                        </span>
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="material-symbols-outlined text-secondary text-lg">sports_soccer</span>
                          <span class="font-bold text-lg">
                            {str(app.event_display_name) || labelEventType(app.event_type)}
                          </span>
                        </div>
                      </div>
                      {str(app.host_country) ? (
                        <div>
                          <span class="text-[10px] font-bold text-outline uppercase tracking-widest block mb-0.5">
                            Destination
                          </span>
                          <div class="text-on-surface-variant font-medium flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">location_on</span>
                            {str(app.host_country)}
                            {str(app.host_city) ? ` · ${str(app.host_city)}` : ""}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div class="w-full md:w-auto md:text-right">
                    <div class="mb-4 flex flex-wrap gap-2 md:justify-end">
                      {getGovernanceChipPair(
                        approvals.value,
                        { code: primaryBodyCode.value, label: primaryBodyLabel.value },
                        { pslAffiliate: Boolean(organisation.value?.psl_affiliate) },
                      ).chips.map((chip) => (
                        <div key={chip.key} class={chip.chipClass}>
                          <span class="material-symbols-outlined text-[14px]">{chip.icon}</span>
                          {chip.label}
                        </div>
                      ))}
                      <div
                        class={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                          isRejected
                            ? "bg-error-container text-on-error-container"
                            : "bg-primary-fixed text-on-primary-fixed-variant"
                        }`}
                      >
                        <span class="material-symbols-outlined text-[14px]">
                          {isRejected ? "cancel" : "verified"}
                        </span>
                        FINAL: {finalStatusLabel(app.status).toUpperCase()}
                      </div>
                    </div>
                    <div class="inline-block w-full rounded-xl bg-surface-container px-4 py-2 text-xs font-medium text-on-surface-variant md:w-auto">
                      Closed on{" "}
                      <span class="text-primary font-bold">{closedOn || "—"}</span>
                    </div>
                  </div>
                </div>
              </header>

              <div class="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 items-start">
                <div class="lg:col-span-8">
                  <ApplicationDossier
                    app={app}
                    organisation={organisation.value}
                    approvals={approvals.value}
                    personnel={personnel.value}
                    routingSportLabel={routingSportLabel}
                  />
                </div>

                <div class="lg:col-span-4">
                  <div class="rounded-2xl bg-[#002b14] p-5 text-white shadow-xl sm:p-8">
                    <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
                      <span class="material-symbols-outlined text-secondary">history</span>
                      Final Determination
                    </h3>
                    <div
                      class={`rounded-2xl p-5 border mb-6 ${
                        isRejected ? "bg-error/10 border-error/40" : "bg-white/5 border-white/10"
                      }`}
                    >
                      <div class="text-[10px] font-bold tracking-widest text-secondary/80 mb-2">RECORDED DECISION</div>
                      <div class="flex items-center gap-3 flex-wrap">
                        <span
                          class={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                            isRejected
                              ? "bg-error-container text-on-error-container"
                              : "bg-primary-fixed text-on-primary-fixed-variant"
                          }`}
                        >
                          <span class="material-symbols-outlined text-sm">{isRejected ? "cancel" : "verified"}</span>
                          {finalStatusLabel(app.status)}
                        </span>
                        {closedOn ? <span class="text-xs text-white/60">{closedOn}</span> : null}
                      </div>
                    </div>

                    <div class="space-y-4 mb-8">
                      <div>
                        <span class="text-[10px] font-bold tracking-widest text-secondary/80">OFFICIAL SUMMARY</span>
                        <div class="mt-2 rounded-xl bg-white/5 border border-white/10 p-4 text-sm leading-relaxed text-white/80">
                          {finalDecisionNote}
                        </div>
                      </div>

                      <div>
                        <span class="text-[10px] font-bold tracking-widest text-secondary/80">AUDIT NOTES</span>
                        <div class="mt-2 rounded-xl bg-white/5 border border-white/10 p-4 text-sm leading-relaxed text-white/60">
                          This historical record is read-only. Any follow-up action should be logged as a new review or
                          audit event.
                        </div>
                      </div>
                    </div>

                    {downloadError.value ? (
                      <p class="mb-4 text-xs text-error bg-error/10 rounded-lg px-3 py-2" role="alert">
                        {downloadError.value}
                      </p>
                    ) : null}

                    <button
                      class="w-full bg-secondary-container text-on-secondary-container py-4 rounded-xl font-extrabold tracking-tight hover:shadow-[0_0_20px_rgba(253,208,0,0.4)] transition-all"
                      type="button"
                      onClick$={() => {
                        downloadError.value = null;
                        try {
                          downloadDecisionRecord({
                            application: app,
                            approvals: approvals.value,
                            organisation: organisation.value,
                            primaryBodyLabel: primaryBodyLabel.value,
                          });
                        } catch {
                          downloadError.value = "Could not download the decision record. Please try again.";
                        }
                      }}
                    >
                      DOWNLOAD DECISION RECORD
                    </button>
                    <div class="mt-6 flex items-center gap-2 text-[10px] text-white/40 justify-center">
                      <span class="material-symbols-outlined text-xs">lock</span>
                      Historical entries are locked after archival
                    </div>
                  </div>

                  <div class="mt-6 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 sm:p-6">
                    <div class="text-xs font-bold text-primary mb-2">QUICK ACTIONS</div>
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        class="flex items-center justify-center gap-2 py-2 bg-white rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                        type="button"
                        onClick$={() => window.print()}
                      >
                        <span class="material-symbols-outlined text-sm">print</span> Print Dossier
                      </button>
                      <a
                        class="flex items-center justify-center gap-2 py-2 bg-white rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                        href="/approver/dashboard/?status=historical"
                      >
                        <span class="material-symbols-outlined text-sm">arrow_back</span> Back to queue
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Historical Application Review",
};
