import { component$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { ApplicantPortalNav } from "~/components/applicant-portal-nav";
import { ApplicationDocumentLink } from "~/components/application-document-link";
import { TravelPersonnelRoster } from "~/components/travel-personnel-roster";
import type { ApiApplication } from "~/lib/applications-api";
import { getApplication } from "~/lib/applications-api";
import type { ApiApproval } from "~/lib/approvals-api";
import { listApprovals } from "~/lib/approvals-api";
import {
  applicantFacingStatusLabel,
  buildMergedApplicationTimeline,
  formatIsoDate,
  governanceFromApprovals,
  labelEventType,
  type GovernanceStake,
} from "~/lib/application-display";
import {
  certificateFileNameFromRecord,
  createCertificate,
  fetchCertificatePdfBlob,
  getApplicationCertificate,
  hasCertificateOpenableFile,
  type ApiCertificate,
} from "~/lib/certificates-api";
import { getCurrentUser } from "~/lib/auth";
import { getOrganisation, organisationDisplayName } from "~/lib/organisations-api";
import { apiPersonnelToRow, type TravelPersonnelRow } from "~/lib/travel-personnel-types";

type CertPhase = "skip" | "loading" | "missing" | "present";

function str(v: string | null | undefined | number | boolean): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v).trim();
}

function stakeBadgeClasses(s: GovernanceStake["state"]): string {
  if (s === "approved") return "bg-primary-fixed text-on-primary-fixed-variant";
  if (s === "rejected") return "bg-error-container text-on-error-container";
  if (s === "reviewing") return "bg-secondary-fixed text-on-secondary-fixed-variant";
  return "bg-white/10 text-white/40";
}

function stakeLabel(s: GovernanceStake["state"]): string {
  if (s === "approved") return "Approved";
  if (s === "rejected") return "Not approved";
  if (s === "reviewing") return "Reviewing";
  return "Pending";
}

function governanceIconName(row: GovernanceStake): string {
  if (row.state === "rejected") return "cancel";
  if (row.name === "SRC") return "info";
  if (row.name === "IMMIGRATION") return "pending";
  return "verified_user";
}

export default component$(() => {
  const loc = useLocation();
  const id = loc.params.id;
  const loading = useSignal(true);
  const loadError = useSignal<string | null>(null);
  const application = useSignal<ApiApplication | null>(null);
  const approvals = useSignal<ApiApproval[]>([]);
  const approvalsLoadError = useSignal<string | null>(null);
  const organisationName = useSignal<string>("");
  const personnel = useStore<TravelPersonnelRow[]>([]);

  const certPhase = useSignal<CertPhase>("skip");
  const certData = useSignal<ApiCertificate | null>(null);
  const certActionLoading = useSignal(false);
  const certGenerateError = useSignal<string | null>(null);
  const certViewError = useSignal<string | null>(null);

  useVisibleTask$(async ({ track }) => {
    track(() => loc.params.id);
    if (!id) return;
    loading.value = true;
    loadError.value = null;
    application.value = null;
    approvals.value = [];
    approvalsLoadError.value = null;
    organisationName.value = "";
    certPhase.value = "skip";
    certData.value = null;
    certGenerateError.value = null;
    certViewError.value = null;

    const [appR, apprR] = await Promise.all([
      getApplication(id),
      listApprovals({ application_id: id, limit: 50, offset: 0 }),
    ]);

    loading.value = false;

    if (!appR.ok) {
      loadError.value = appR.error;
      return;
    }

    application.value = appR.data;
    personnel.length = 0;
    (appR.data.personnel ?? []).forEach((p) => personnel.push(apiPersonnelToRow(p)));

    const oid = appR.data.organisation_id?.trim();
    if (oid) {
      const orgR = await getOrganisation(oid);
      organisationName.value = orgR.ok ? organisationDisplayName(orgR.data) || "—" : "—";
    }

    if (!apprR.ok) {
      approvalsLoadError.value = apprR.error;
    } else {
      approvals.value = apprR.data;
    }

    const statusLower = (appR.data.status ?? "").trim().toLowerCase();
    if (statusLower === "approved") {
      certPhase.value = "loading";
      const cr = await getApplicationCertificate(id);
      if (cr.ok && cr.data != null) {
        certData.value = cr.data;
        certPhase.value = "present";
      } else {
        certPhase.value = "missing";
      }
    }
  });

  const app = application.value;
  const governance = app ? governanceFromApprovals(app.status, approvals.value) : null;

  return (
    <div class="bg-background font-body text-on-surface min-h-screen">
      <ApplicantPortalNav activeItem="applications" />

      <main class="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 pt-28">
        {loadError.value ? (
          <div class="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error mb-6" role="alert">
            {loadError.value}
          </div>
        ) : null}

        {loading.value ? (
          <p class="text-on-surface-variant">Loading application…</p>
        ) : loadError.value ? null : app ? (
          <>
            {approvalsLoadError.value ? (
              <div
                class="mb-8 rounded-xl border border-secondary/30 bg-secondary/5 p-4 text-sm text-on-surface-variant"
                role="status"
              >
                Approval activity could not be loaded ({approvalsLoadError.value}). Timeline falls back to
                submission status; governance shows all bodies as pending.
              </div>
            ) : null}

            {/* Hero — summary */}
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
              <div>
                <nav class="flex items-center gap-2 text-on-surface-variant mb-4 text-sm font-medium">
                  <a class="hover:text-primary transition-colors" href="/applicant/dashboard/#applications">
                    Applications
                  </a>
                  <span class="material-symbols-outlined text-xs">chevron_right</span>
                  <span class="text-secondary font-semibold">
                    Ref: {app.reference_number ?? app.id.slice(0, 8)}
                  </span>
                </nav>
                <h1 class="text-4xl sm:text-5xl font-extrabold font-headline tracking-tighter text-primary mb-2">
                  {str(app.event_display_name) || "Travel application"}
                </h1>
                {organisationName.value ? (
                  <p class="text-on-surface-variant flex items-center gap-2 flex-wrap mb-2">
                    <span class="material-symbols-outlined text-lg text-secondary">domain</span>
                    <span class="font-semibold text-on-surface">{organisationName.value}</span>
                  </p>
                ) : null}
                <p class="text-on-surface-variant flex items-center gap-2 flex-wrap">
                  <span class="material-symbols-outlined text-lg text-secondary">flight_takeoff</span>
                  Destination:{" "}
                  <span class="font-bold text-on-surface">{str(app.host_country) || "—"}</span>
                  {str(app.host_city) ? (
                    <span class="text-on-surface-variant">({str(app.host_city)})</span>
                  ) : null}
                </p>
              </div>
              <div class="flex flex-wrap gap-3">
                <div class="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                  <span class="material-symbols-outlined text-lg">hourglass_empty</span>
                  Status: {applicantFacingStatusLabel(app.status)}
                </div>
                {str(app.priority) && app.priority !== "normal" ? (
                  <div class="bg-primary-fixed text-on-primary-fixed-variant px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                    <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">
                      flag
                    </span>
                    Priority: {str(app.priority)}
                  </div>
                ) : null}
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Timeline */}
              <div class="lg:col-span-8 space-y-8">
                <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between gap-y-2 mb-2">
                  <div>
                    <h2 class="text-2xl font-bold font-headline tracking-tight text-primary">Application timeline</h2>
                    {approvalsLoadError.value ? null : (
                      <p class="text-xs text-on-surface-variant mt-1 max-w-xl">
                        {approvals.value.length > 0
                          ? "Newest updates at the top; older events (including submission) below."
                          : "No approval updates yet — timeline shows your submission and current application status."}
                      </p>
                    )}
                  </div>
                  <span class="text-on-surface-variant text-sm font-medium uppercase tracking-widest shrink-0">
                    Latest first
                  </span>
                </div>

                <div class="relative pl-8 space-y-12 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/30">
                  {buildMergedApplicationTimeline(app, approvals.value).map((ev, i) => (
                    <div key={`${ev.title}-${i}`} class="relative group">
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
                          "p-6 sm:p-8 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] border",
                          ev.variant === "action"
                            ? "bg-surface-container-lowest border-l-4 border-tertiary"
                            : ev.variant === "success"
                              ? "bg-surface-container border-outline-variant/20"
                              : "bg-surface-container opacity-95 border-outline-variant/15",
                        ].join(" ")}
                      >
                        <div class="flex justify-between items-start gap-4 mb-3">
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
                            <h3 class="text-xl font-bold font-headline text-primary">{ev.title}</h3>
                          </div>
                          {ev.variant === "action" ? (
                            <span class="bg-error-container text-on-error-container px-3 py-1 rounded-full text-xs font-bold uppercase shrink-0">
                              Priority
                            </span>
                          ) : ev.variant === "success" ? (
                            <span
                              class="material-symbols-outlined text-on-primary-fixed-variant"
                              style="font-variation-settings: 'FILL' 1;"
                            >
                              check_circle
                            </span>
                          ) : null}
                        </div>
                        {ev.approvalDetail ? (
                          <div class="mt-4 space-y-4 text-sm border-t border-outline-variant/20 pt-4">
                            <div>
                              <span class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1.5">
                                {ev.approvalDetail.timeLabel}
                              </span>
                              <p class="text-on-surface font-medium">{ev.approvalDetail.decidedAt}</p>
                            </div>
                            <div>
                              <span class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1.5">
                                Decision note
                              </span>
                              <p class="text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                                {ev.approvalDetail.decisionNote ?? "—"}
                              </p>
                            </div>
                          </div>
                        ) : ev.body ? (
                          <p
                            class={
                              ev.variant === "action"
                                ? "bg-surface-container-low p-4 rounded-lg mb-4 italic text-on-surface-variant border-l-2 border-outline-variant text-sm"
                                : "text-on-surface-variant text-sm leading-relaxed whitespace-pre-wrap"
                            }
                          >
                            {ev.body}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div class="lg:col-span-4 space-y-6">
                <div class="bg-primary text-white p-8 rounded-xl shadow-2xl relative overflow-hidden">
                  <div class="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <span class="material-symbols-outlined text-9xl">account_balance</span>
                  </div>
                  <h2 class="text-2xl font-bold font-headline mb-6 relative z-10">Governance check</h2>
                  <div class="space-y-6 relative z-10">
                    {(governance?.rows ?? []).map((row) => (
                      <div key={row.name} class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-4 min-w-0">
                          <div
                            class={[
                              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                              row.state === "approved"
                                ? "bg-primary-fixed"
                                : row.state === "rejected"
                                  ? "bg-error-container"
                                  : row.state === "reviewing"
                                    ? "bg-secondary-fixed"
                                    : "bg-white/10",
                            ].join(" ")}
                          >
                            <span
                              class={[
                                "material-symbols-outlined text-lg",
                                row.state === "pending" ? "text-white/40" : "",
                                row.state === "approved" ? "text-on-primary-fixed-variant" : "",
                                row.state === "reviewing" ? "text-on-secondary-fixed-variant" : "",
                                row.state === "rejected" ? "text-on-error-container" : "",
                              ].filter(Boolean).join(" ")}
                            >
                              {governanceIconName(row)}
                            </span>
                          </div>
                          <div class="min-w-0">
                            <p class="font-bold truncate">{row.name}</p>
                            <p class="text-xs text-white/60">{row.subtitle}</p>
                          </div>
                        </div>
                        <span class={`px-3 py-1 rounded-full text-xs font-black uppercase shrink-0 ${stakeBadgeClasses(row.state)}`}>
                          {stakeLabel(row.state)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div class="mt-8 pt-8 border-t border-white/10 relative z-10">
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-sm font-medium text-white/60">Overall completion</span>
                      <span class="text-sm font-bold">{governance?.completion ?? 0}%</span>
                    </div>
                    <div class="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div
                        class="bg-secondary h-full rounded-full shadow-[0_0_10px_rgba(253,208,0,0.5)] transition-all duration-500"
                        style={{ width: `${governance?.completion ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {certPhase.value !== "skip" ? (
                  <div class="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
                    <h3 class="font-bold font-headline text-primary mb-2 flex items-center gap-2">
                      <span class="material-symbols-outlined text-secondary">badge</span>
                      Travel certificate
                    </h3>
                    {certPhase.value === "loading" ? (
                      <p class="text-sm text-on-surface-variant flex items-center gap-2">
                        <span class="material-symbols-outlined text-base animate-pulse">hourglass_empty</span>
                        Checking certificate…
                      </p>
                    ) : certPhase.value === "missing" ? (
                      <div class="space-y-3">
                        <p class="text-sm text-on-surface-variant leading-relaxed">
                          No certificate is on file yet. Generate one for your approved application.
                        </p>
                        {certGenerateError.value ? (
                          <p class="text-xs text-error" role="alert">
                            {certGenerateError.value}
                          </p>
                        ) : null}
                        <button
                          type="button"
                          class="inline-flex items-center justify-center gap-2 w-full rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={certActionLoading.value}
                          onClick$={async () => {
                            certGenerateError.value = null;
                            const org = organisationName.value.trim();
                            if (!org || org === "—") {
                              certGenerateError.value =
                                "Organisation name is required to generate a certificate. It will load from your profile.";
                              return;
                            }
                            const uid = getCurrentUser()?.id?.trim() ?? "";
                            if (!uid) {
                              certGenerateError.value = "You must be signed in to generate a certificate.";
                              return;
                            }
                            certActionLoading.value = true;
                            const postR = await createCertificate({
                              application_id: id,
                              org_name: org,
                              user_id: uid,
                            });
                            certActionLoading.value = false;
                            if (!postR.ok) {
                              certGenerateError.value = postR.error;
                              return;
                            }
                            const fromPost = certificateFileNameFromRecord(postR.data);
                            if (fromPost && postR.data) {
                              certData.value = postR.data;
                              certPhase.value = "present";
                              return;
                            }
                            const again = await getApplicationCertificate(id);
                            if (again.ok && again.data != null) {
                              certData.value = again.data;
                              certPhase.value = "present";
                            } else {
                              certGenerateError.value =
                                "Certificate may have been created but could not be confirmed. Refresh the page.";
                            }
                          }}
                        >
                          <span class="material-symbols-outlined text-base">add_circle</span>
                          {certActionLoading.value ? "Generating…" : "Generate certificate"}
                        </button>
                      </div>
                    ) : (
                      <div class="space-y-3">
                        {hasCertificateOpenableFile(certData.value) ? (
                          <>
                            {certViewError.value ? (
                              <p class="text-xs text-error" role="alert">
                                {certViewError.value}
                              </p>
                            ) : null}
                            <button
                              type="button"
                              class="inline-flex items-center justify-center gap-2 w-full rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={certActionLoading.value}
                              onClick$={async () => {
                                certViewError.value = null;
                                certActionLoading.value = true;
                                const r = await fetchCertificatePdfBlob(certData.value);
                                certActionLoading.value = false;
                                if (!r.ok) {
                                  certViewError.value = r.error;
                                  return;
                                }
                                const url = URL.createObjectURL(r.blob);
                                const w = window.open(url, "_blank", "noopener,noreferrer");
                                if (!w) {
                                  certViewError.value =
                                    "Could not open a new tab. Allow pop-ups for this site or try again.";
                                  URL.revokeObjectURL(url);
                                  return;
                                }
                                window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
                              }}
                            >
                              <span class="material-symbols-outlined text-base">open_in_new</span>
                              {certActionLoading.value ? "Opening…" : "View certificate"}
                            </button>
                          </>
                        ) : (
                          <p class="text-sm text-on-surface-variant leading-relaxed">
                            A certificate record exists, but no file name or file path was returned. Try refreshing the
                            page or contact support.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}

                <div class="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
                  <h3 class="font-bold font-headline text-primary mb-2">Need assistance?</h3>
                  <p class="text-sm text-on-surface-variant mb-4 leading-relaxed">
                    Contact your designated travel liaison for help with documentation or SRC requirements.
                  </p>
                  <div class="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
                    <div class="w-12 h-12 rounded-full bg-secondary-container/30 flex items-center justify-center shrink-0">
                      <span class="material-symbols-outlined text-secondary text-2xl">support_agent</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Liaison</p>
                      <p class="text-sm font-medium text-on-surface">ZFTA support desk</p>
                    </div>
                    <a
                      class="material-symbols-outlined text-secondary hover:text-primary transition-colors p-2"
                      href="mailto:support@zifa.org.zw"
                      aria-label="Email support"
                    >
                      chat
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Full application summary — read-only, below timeline + governance */}
            <section class="mt-14 space-y-8 border-t border-outline-variant/20 pt-12">
              <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <h2 class="text-2xl font-bold font-headline tracking-tight text-primary">Application summary</h2>
                  <p class="text-sm text-on-surface-variant mt-1 max-w-2xl">
                    Submitted details for reference. Editing is not available on this screen.
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 md:p-8 shadow-sm">
                  <h3 class="text-sm font-bold uppercase tracking-wider text-secondary mb-4 flex items-center gap-2">
                    <span class="material-symbols-outlined text-lg">emoji_events</span>
                    Event
                  </h3>
                  <dl class="space-y-3 text-sm">
                    {organisationName.value ? (
                      <div class="grid sm:grid-cols-3 gap-1">
                        <dt class="text-on-surface-variant">Organisation</dt>
                        <dd class="sm:col-span-2">{organisationName.value}</dd>
                      </div>
                    ) : null}
                    <div class="grid sm:grid-cols-3 gap-1">
                      <dt class="text-on-surface-variant">Event type</dt>
                      <dd class="sm:col-span-2">{labelEventType(app.event_type)}</dd>
                    </div>
                    <div class="grid sm:grid-cols-3 gap-1">
                      <dt class="text-on-surface-variant">Host country</dt>
                      <dd class="sm:col-span-2">{str(app.host_country) || "—"}</dd>
                    </div>
                    {str(app.host_city) ? (
                      <div class="grid sm:grid-cols-3 gap-1">
                        <dt class="text-on-surface-variant">Host city / venue</dt>
                        <dd class="sm:col-span-2">{str(app.host_city)}</dd>
                      </div>
                    ) : null}
                    {str(app.tournament_name) ? (
                      <div class="grid sm:grid-cols-3 gap-1">
                        <dt class="text-on-surface-variant">Tournament</dt>
                        <dd class="sm:col-span-2">{str(app.tournament_name)}</dd>
                      </div>
                    ) : null}
                    {str(app.tournament_name_other) ? (
                      <div class="grid sm:grid-cols-3 gap-1">
                        <dt class="text-on-surface-variant">Other name</dt>
                        <dd class="sm:col-span-2">{str(app.tournament_name_other)}</dd>
                      </div>
                    ) : null}
                    {str(app.opponent_team_name) || str(app.opponent_team_country) ? (
                      <div class="grid sm:grid-cols-3 gap-1">
                        <dt class="text-on-surface-variant">Opponent</dt>
                        <dd class="sm:col-span-2">
                          {[str(app.opponent_team_name), str(app.opponent_team_country)].filter(Boolean).join(" · ")}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>

                <div class="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 md:p-8 shadow-sm">
                  <h3 class="text-sm font-bold uppercase tracking-wider text-secondary mb-4 flex items-center gap-2">
                    <span class="material-symbols-outlined text-lg">calendar_month</span>
                    Logistics &amp; squad
                  </h3>
                  <dl class="space-y-3 text-sm">
                    <div class="grid sm:grid-cols-3 gap-1">
                      <dt class="text-on-surface-variant">Travel dates</dt>
                      <dd class="sm:col-span-2">
                        {formatIsoDate(app.departure_date)} – {formatIsoDate(app.return_date)}
                      </dd>
                    </div>
                    <div class="grid sm:grid-cols-3 gap-1">
                      <dt class="text-on-surface-variant">Players / staff</dt>
                      <dd class="sm:col-span-2">
                        {app.player_count ?? "—"} players · {app.officials_count ?? "—"} staff
                      </dd>
                    </div>
                    <div class="grid sm:grid-cols-3 gap-1">
                      <dt class="text-on-surface-variant">Age / gender / mode</dt>
                      <dd class="sm:col-span-2">
                        {[str(app.age_group), str(app.gender_category), str(app.travel_mode)].filter(Boolean).join(" · ") ||
                          "—"}
                      </dd>
                    </div>
                    {str(app.port_of_entry) || str(app.port_of_exit) ? (
                      <div class="grid sm:grid-cols-3 gap-1">
                        <dt class="text-on-surface-variant">Port of entry / exit</dt>
                        <dd class="sm:col-span-2">
                          {[str(app.port_of_entry), str(app.port_of_exit)].filter(Boolean).join(" → ")}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>

                <div class="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 md:p-8 shadow-sm lg:col-span-2">
                  <h3 class="text-sm font-bold uppercase tracking-wider text-secondary mb-4 flex items-center gap-2">
                    <span class="material-symbols-outlined text-lg">description</span>
                    Documents
                  </h3>
                  <div class="grid sm:grid-cols-2 gap-6 text-sm">
                    <ApplicationDocumentLink kind="Support (invitation)" storedPath={app.support_documents} />
                    <ApplicationDocumentLink kind="Travel / identity" storedPath={app.travel_documents} />
                  </div>
                </div>

                {(str(app.emergency_contact_name) || str(app.emergency_contact_mobile)) ? (
                  <div class="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 md:p-8 shadow-sm lg:col-span-2">
                    <h3 class="text-sm font-bold uppercase tracking-wider text-secondary mb-4 flex items-center gap-2">
                      <span class="material-symbols-outlined text-lg">contact_phone</span>
                      Emergency contact
                    </h3>
                    <dl class="grid sm:grid-cols-3 gap-4 text-sm">
                      {str(app.emergency_contact_name) ? (
                        <div>
                          <dt class="text-on-surface-variant text-xs uppercase mb-1">Name</dt>
                          <dd>{str(app.emergency_contact_name)}</dd>
                        </div>
                      ) : null}
                      {str(app.emergency_contact_mobile) ? (
                        <div>
                          <dt class="text-on-surface-variant text-xs uppercase mb-1">Mobile</dt>
                          <dd>{str(app.emergency_contact_mobile)}</dd>
                        </div>
                      ) : null}
                      {str(app.emergency_contact_relation) ? (
                        <div>
                          <dt class="text-on-surface-variant text-xs uppercase mb-1">Relation</dt>
                          <dd>{str(app.emergency_contact_relation)}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                ) : null}

                {app.declaration_accepted != null ? (
                  <div class="lg:col-span-2 rounded-xl border border-outline-variant/10 bg-surface-container-low/80 px-4 py-3 text-sm text-on-surface-variant">
                    Declaration accepted:{" "}
                    <span class="font-semibold text-on-surface">{app.declaration_accepted ? "Yes" : "No"}</span>
                  </div>
                ) : null}
              </div>
            </section>

            <section class="mt-12 space-y-4 border-t border-outline-variant/20 pt-12">
              <h2 class="text-2xl font-bold font-headline text-primary">Travelling personnel</h2>
              <p class="text-sm text-on-surface-variant max-w-2xl">
                Submitted squad roster (read-only).
              </p>
              <div class="bg-surface-container-lowest p-6 md:p-8 rounded-xl shadow-sm border border-outline-variant/15">
                <TravelPersonnelRoster personnel={personnel} mode="view" />
              </div>
            </section>

            <div class="mt-10 flex flex-wrap gap-4">
              <a
                class="inline-flex items-center px-8 py-3 bg-surface-container-highest text-primary font-headline font-bold rounded-xl hover:bg-surface-container-high transition-colors"
                href="/applicant/dashboard/"
              >
                Back to dashboard
              </a>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Application Detail | Zimbabwe Football Travel Authority",
};
