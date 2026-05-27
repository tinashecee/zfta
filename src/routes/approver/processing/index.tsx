import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { ApproverPortalNav } from "~/components/approver-portal-nav";
import { AttachmentField } from "~/components/application-form/attachment-field";
import { ApplicationDocumentLink } from "~/components/application-document-link";
import { TravelPersonnelRoster } from "~/components/travel-personnel-roster";
import type { ApiApplication } from "~/lib/applications-api";
import { getApplication, patchApplication, uploadOutgoingTourComplianceDeclaration } from "~/lib/applications-api";
import type { ApiApproval } from "~/lib/approvals-api";
import { listApprovals, createApproval } from "~/lib/approvals-api";
import {
  getGovernanceChipPair,
  hasUnderReviewApprovalForBody,
  hasAnySportBodyApproved,
  isLatestPrimaryBodyApproved,
  isLatestSrcTerminal,
  shouldAutoCreateSrcUnderReview,
  srcCanEditApplication,
} from "~/lib/approver-approval-helpers";
import { apiFetchJson, getCurrentUser, persistStoredSessionUser } from "~/lib/auth";
import { meResponseToAuthUser, reviewerRoutingBodyFromSession } from "~/lib/users-api";
import {
  isPrimaryStageStatus,
  resolvePrimaryBodyFromOrgSport,
  reviewerPrimaryCodesEqual,
  routingSportForApplication,
} from "~/lib/sport-routing";
import { listSportBodies } from "~/lib/sport-bodies-api";
import { listZimbabweSports } from "~/lib/zimbabwe-sports-api";
import { formatIsoDate, formatDateTime, labelEventType } from "~/lib/application-display";
import { createCertificate } from "~/lib/certificates-api";
import { getOrganisation, organisationDisplayName } from "~/lib/organisations-api";
import { apiPersonnelToRow, type TravelPersonnelRow } from "~/lib/travel-personnel-types";

type DecisionAction = "approved" | "rejected" | "information_requested";
type SrcDecisionAction = "awaiting_information" | "approved" | "rejected";
type ReviewerBody = string | null;

function str(v: string | null | undefined | number | boolean): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v).trim();
}

/** First-line sport body may record decisions only while the application is in a primary-stage status. */
function primaryStageCanEditApplication(app: ApiApplication): boolean {
  return isPrimaryStageStatus(app.status);
}

function primaryReadOnlyExplanation(
  status: string | undefined,
  primaryLabel: string,
): { title: string; body: string } {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "awaiting_src") {
    return {
      title: "With SRC now",
      body: `${primaryLabel}’s review is complete. This application is with SRC — you cannot submit further ${primaryLabel} decisions here.`,
    };
  }
  if (s === "rejected") {
    return {
      title: "Not editable",
      body: `This application is no longer open for ${primaryLabel} decisions.`,
    };
  }
  if (s === "information_requested") {
    return {
      title: "Awaiting applicant",
      body: `Information was requested from the applicant. You can review the dossier below; new official decisions from ${primaryLabel} will be available when the application is submitted again for review.`,
    };
  }
  if (s === "approved") {
    return {
      title: "Approved",
      body: "This application is fully approved or is with SRC. No further first-line body changes apply.",
    };
  }
  return {
    title: "Read-only",
    body: `This application cannot be edited from the ${primaryLabel} reviewer screen.`,
  };
}

function successMessageForDecision(action: DecisionAction): string {
  if (action === "approved") {
    return "Decision saved: approved. The application is now awaiting SRC.";
  }
  if (action === "rejected") {
    return "Decision saved: rejected.";
  }
  return "Decision saved: information requested — recorded on the approval dossier.";
}

function successMessageForSrcDecision(action: SrcDecisionAction): string {
  if (action === "awaiting_information") {
    return "Decision saved: information requested — recorded on the approval dossier.";
  }
  if (action === "approved") {
    return "Decision saved: approved. The application is now fully approved.";
  }
  return "Decision saved: rejected.";
}

function processingPortalTitle(body: ReviewerBody, primaryLabel: string): string {
  if (body === "SRC") return "Official Approver Portal - SRC Queue";
  return `Official Approver Portal - ${primaryLabel} Queue`;
}

function srcReadOnlyExplanation(
  app: ApiApplication,
  approvals: ApiApproval[],
  primaryBodyCode: string,
  primaryLabel: string,
): { title: string; body: string } {
  const st = (app.status ?? "").trim().toLowerCase();
  if (st !== "awaiting_src") {
    return {
      title: "Not in SRC queue",
      body: "SRC actions are available when the application status is awaiting SRC.",
    };
  }
  if (isLatestSrcTerminal(approvals)) {
    return {
      title: "SRC decision recorded",
      body: "The SRC approval row is complete — you cannot submit further SRC decisions here.",
    };
  }
  return {
    title: "Read-only",
    body: "This application cannot be edited from the SRC reviewer screen.",
  };
}

/** True when the signed-in reviewer’s routing token matches the application’s first-line body code. */
function primaryReviewerMatchesApplication(reviewer: ReviewerBody, primaryCode: string): boolean {
  if (reviewer == null || reviewer === "" || !primaryCode) return false;
  return reviewerPrimaryCodesEqual(primaryCode, reviewer);
}

function submittedDays(app: ApiApplication): string {
  const iso = app.submitted_at ?? app.created_at;
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day in queue";
  return `${days} days in queue`;
}

export default component$(() => {
  const location = useLocation();
  const id = location.url.searchParams.get("id") ?? "";

  const loading = useSignal(true);
  const loadError = useSignal<string | null>(null);
  const application = useSignal<ApiApplication | null>(null);
  const organisationName = useSignal<string>("");
  const organisationSport = useSignal<string>("");
  const personnel = useSignal<TravelPersonnelRow[]>([]);

  const actionSelected = useSignal<DecisionAction | null>(null);
  const srcActionSelected = useSignal<SrcDecisionAction | null>(null);
  const decisionNote = useSignal("");
  const complianceDeclarationFile = useSignal<File | null>(null);
  const nationalAssocClearanceFile = useSignal<File | null>(null);
  const submitting = useSignal(false);
  const submitError = useSignal<string | null>(null);
  const successToast = useSignal<string | null>(null);
  const approvals = useSignal<ApiApproval[]>([]);
  const reviewerBody = useSignal<ReviewerBody>(null);
  const primaryBodyCode = useSignal("ZIFA");
  const primaryBodyLabel = useSignal("ZIFA");

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

    const oid = appR.data.organisation_id?.trim();
    if (oid) {
      const orgR = await getOrganisation(oid);
      organisationName.value = orgR.ok
        ? organisationDisplayName(orgR.data).trim() || "—"
        : "—";
      if (orgR.ok) {
        const sp = orgR.data.sport;
        organisationSport.value =
          sp != null && String(sp).trim() !== "" ? String(sp).trim() : "";
      } else {
        organisationSport.value = "";
      }
    } else {
      organisationName.value = "—";
      organisationSport.value = "";
    }

    const [zsR, sbR] = await Promise.all([
      listZimbabweSports({ limit: 200, offset: 0 }),
      listSportBodies({ limit: 200, offset: 0 }),
    ]);
    const zs = zsR.ok ? zsR.data : [];
    const sb = sbR.ok ? sbR.data : [];

    const meR = await apiFetchJson<unknown>("/api/v1/me", { method: "GET" });
    if (meR.ok) {
      persistStoredSessionUser(meResponseToAuthUser(meR.data));
    }

    reviewerBody.value = reviewerRoutingBodyFromSession(getCurrentUser(), sb) as ReviewerBody;
    const resolved = resolvePrimaryBodyFromOrgSport(
      routingSportForApplication(appR.data.sport, organisationSport.value),
      zs,
      sb,
    );
    primaryBodyCode.value = resolved.code;
    primaryBodyLabel.value = resolved.label;

    let approvalRows: ApiApproval[] = apprR.ok ? apprR.data : [];

    const primaryCode = primaryBodyCode.value;
    // Primary stage: POST `under_review` once per first-line body (first open only).
    if (
      apprR.ok &&
      primaryStageCanEditApplication(appR.data) &&
      !hasUnderReviewApprovalForBody(approvalRows, primaryCode)
    ) {
      const u = getCurrentUser();
      await createApproval({
        application_id: id,
        body: "SPORT_BODY",
        body_code: primaryCode,
        sports_body: u?.sports_body ?? (u?.sport_body_id != null ? String(u.sport_body_id) : null),
        status: "under_review",
      });
      const refetch = await listApprovals({ application_id: id, limit: 50, offset: 0 });
      if (refetch.ok) approvalRows = refetch.data;
    }

    if (apprR.ok && reviewerBody.value === "SRC" && shouldAutoCreateSrcUnderReview(appR.data, approvalRows, primaryCode)) {
      await createApproval({
        application_id: id,
        body: "SRC",
        status: "under_review",
      });
      const refetch = await listApprovals({ application_id: id, limit: 50, offset: 0 });
      if (refetch.ok) approvalRows = refetch.data;
    }

    approvals.value = approvalRows;
    loading.value = false;
  });

  const app = application.value;
  const routingSportLabel = app ? routingSportForApplication(app.sport, organisationSport.value) : "";

  return (
    <div class="flex flex-1 flex-col min-h-0 min-w-0 bg-background text-on-background">
      {successToast.value ? (
        <div
          class="fixed bottom-6 left-1/2 z-[100] flex w-[min(100%,24rem)] -translate-x-1/2 flex-col gap-1 rounded-2xl border border-primary/25 bg-surface-container-highest px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:bottom-10 sm:px-5 sm:py-4"
          role="status"
          aria-live="polite"
        >
          <div class="flex items-start gap-3">
            <span
              class="material-symbols-outlined text-primary shrink-0 text-2xl"
              style="font-variation-settings: 'FILL' 1;"
            >
              check_circle
            </span>
            <div>
              <p class="text-sm font-bold text-primary">Official decision submitted</p>
              <p class="mt-1 text-sm text-on-surface leading-snug">{successToast.value}</p>
              <p class="mt-2 text-xs text-on-surface-variant">Redirecting to your queue…</p>
            </div>
          </div>
        </div>
      ) : null}

      <ApproverPortalNav
        activeItem="pendingQueue"
        title={processingPortalTitle(reviewerBody.value, primaryBodyLabel.value)}
      />

      <main class="flex-1 min-h-0 min-w-0 w-full">
        <div class="pt-24 px-4 pb-8 sm:px-6 sm:pb-12 lg:px-8">

          {loadError.value ? (
            <div class="mb-6 rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error" role="alert">
              {loadError.value}
            </div>
          ) : null}

          {loading.value ? (
            <p class="text-on-surface-variant pt-8">Loading application…</p>
          ) : loadError.value ? null : app ? (
            <>
              <header class="mb-6 rounded-xl bg-white/80 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.04)] backdrop-blur-md sm:mb-10 sm:p-6">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-secondary font-bold text-xs tracking-widest uppercase">
                        Application Reference
                      </span>
                      {submittedDays(app) ? (
                        <span class="bg-surface-container-highest px-2 py-0.5 rounded text-[10px] font-bold">
                          {submittedDays(app).toUpperCase()}
                        </span>
                      ) : null}
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
                            <span class="font-bold text-xl text-on-surface">{organisationName.value}</span>
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
                      {getGovernanceChipPair(approvals.value, {
                        code: primaryBodyCode.value,
                        label: primaryBodyLabel.value,
                      }).chips
                        .filter((chip) => {
                          const at = (app.application_type ?? "").trim().toLowerCase();
                          if (at === "incoming_tour" || at === "hosting_competition") {
                            return chip.key === "SRC";
                          }
                          return true;
                        })
                        .map((chip) => (
                        <div key={chip.key} class={chip.chipClass}>
                          <span class="material-symbols-outlined text-[14px]">{chip.icon}</span>
                          {chip.label}
                        </div>
                      ))}
                    </div>
                    <div class="inline-block w-full rounded-xl bg-surface-container px-4 py-2 text-xs font-medium text-on-surface-variant md:w-auto">
                      Submitted:{" "}
                      <span class="text-primary font-bold">
                        {formatDateTime(app.submitted_at ?? app.created_at) || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </header>

              <div class="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 items-start">
                <div class="lg:col-span-8 space-y-8">

                  {/* Trip Details */}
                  <section class="rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
                    <div class="mb-6 flex items-start justify-between gap-4">
                      <h2 class="text-xl font-bold text-primary flex items-center gap-3">
                        <span class="w-1 bg-secondary h-6 rounded-full" />
                        Trip Details
                      </h2>
                    </div>
                    <div class="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:gap-12">
                      <div class="flex gap-4 min-w-0">
                        <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                          <span class="material-symbols-outlined text-3xl">flight_takeoff</span>
                        </div>
                        <div>
                          <div class="text-[10px] text-outline font-extrabold tracking-widest">SCHEDULE</div>
                          <div class="text-sm font-bold">
                            {formatIsoDate(app.departure_date)} – {formatIsoDate(app.return_date)}
                          </div>
                          {app.departure_date && app.return_date ? (
                            <div class="text-xs text-on-surface-variant italic">
                              {Math.ceil(
                                (new Date(app.return_date).getTime() - new Date(app.departure_date).getTime()) /
                                  86400000,
                              )}{" "}
                              days
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div class="flex gap-4 min-w-0">
                        <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                          <span class="material-symbols-outlined text-3xl">groups</span>
                        </div>
                        <div>
                          <div class="text-[10px] text-outline font-extrabold tracking-widest">DELEGATION</div>
                          <div class="text-sm font-bold">
                            {(app.player_count ?? 0) + (app.officials_count ?? 0)} Personnel
                          </div>
                          <div class="text-xs text-on-surface-variant">
                            {app.player_count ?? "—"} Players · {app.officials_count ?? "—"} Officials
                          </div>
                        </div>
                      </div>

                      <div class="flex gap-4 min-w-0">
                        <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                          <span class="material-symbols-outlined text-3xl">location_on</span>
                        </div>
                        <div>
                          <div class="text-[10px] text-outline font-extrabold tracking-widest">DESTINATION</div>
                          <div class="text-sm font-bold">{str(app.host_country) || "—"}</div>
                          {str(app.host_city) ? (
                            <div class="text-xs text-on-surface-variant">{str(app.host_city)}</div>
                          ) : null}
                        </div>
                      </div>

                      {str(app.travel_mode) ? (
                        <div class="flex gap-4 min-w-0">
                          <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                            <span class="material-symbols-outlined text-3xl">connecting_airports</span>
                          </div>
                          <div>
                            <div class="text-[10px] text-outline font-extrabold tracking-widest">TRAVEL MODE</div>
                            <div class="text-sm font-bold">{str(app.travel_mode)}</div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {str(app.port_of_entry) || str(app.port_of_exit) ? (
                      <div class="mt-6 grid grid-cols-2 gap-4 text-sm">
                        {str(app.port_of_entry) ? (
                          <div>
                            <div class="text-[10px] text-outline font-extrabold tracking-widest mb-1">PORT OF ENTRY</div>
                            <div class="font-medium">{str(app.port_of_entry)}</div>
                          </div>
                        ) : null}
                        {str(app.port_of_exit) ? (
                          <div>
                            <div class="text-[10px] text-outline font-extrabold tracking-widest mb-1">PORT OF EXIT</div>
                            <div class="font-medium">{str(app.port_of_exit)}</div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </section>

                  {/* Application Details */}
                  <section class="group rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
                    <div class="mb-6 flex items-start justify-between gap-4">
                      <h2 class="text-xl font-bold text-primary flex items-center gap-3">
                        <span class="w-1 bg-secondary h-6 rounded-full" />
                        Application Details
                      </h2>
                    </div>
                    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 md:gap-y-6 md:gap-x-12 text-sm">
                      {organisationName.value ? (
                        <div>
                          <div class="text-xs text-outline mb-1 font-bold">ORGANISATION</div>
                          <div class="font-semibold">{organisationName.value}</div>
                          {routingSportLabel ? (
                            <div class="text-xs text-on-surface-variant mt-1">Sport: {routingSportLabel}</div>
                          ) : null}
                        </div>
                      ) : null}
                      {str(app.event_type) ? (
                        <div>
                          <div class="text-xs text-outline mb-1 font-bold">EVENT TYPE</div>
                          <div class="font-semibold">{labelEventType(app.event_type)}</div>
                        </div>
                      ) : null}
                      {str(app.tournament_name) ? (
                        <div>
                          <div class="text-xs text-outline mb-1 font-bold">TOURNAMENT</div>
                          <div class="font-semibold">{str(app.tournament_name)}</div>
                        </div>
                      ) : null}
                      {str(app.age_group) ? (
                        <div>
                          <div class="text-xs text-outline mb-1 font-bold">AGE GROUP</div>
                          <div class="font-semibold">{str(app.age_group)}</div>
                        </div>
                      ) : null}
                      {str(app.gender_category) ? (
                        <div>
                          <div class="text-xs text-outline mb-1 font-bold">GENDER CATEGORY</div>
                          <div class="font-semibold">{str(app.gender_category)}</div>
                        </div>
                      ) : null}
                      {str(app.opponent_team_name) || str(app.opponent_team_country) ? (
                        <div>
                          <div class="text-xs text-outline mb-1 font-bold">OPPONENT</div>
                          <div class="font-semibold">
                            {[str(app.opponent_team_name), str(app.opponent_team_country)]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </div>
                      ) : null}
                      {str(app.priority) && app.priority !== "normal" ? (
                        <div>
                          <div class="text-xs text-outline mb-1 font-bold">PRIORITY</div>
                          <div class="font-semibold text-tertiary uppercase">{str(app.priority)}</div>
                        </div>
                      ) : null}
                    </div>
                    {str(app.priority_reason) ? (
                      <div class="mt-6 bg-tertiary/5 border-l-4 border-tertiary px-4 py-3 rounded text-sm">
                        <div class="text-xs font-bold text-tertiary uppercase mb-1">Priority Reason</div>
                        <p class="text-on-surface">{str(app.priority_reason)}</p>
                      </div>
                    ) : null}
                  </section>

                  {/* Players & Officials */}
                  {personnel.value.length > 0 ? (
                    <section class="rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
                      <div class="mb-4 flex items-start justify-between gap-4">
                        <h2 class="text-xl font-bold text-primary flex items-center gap-3">
                          <span class="w-1 bg-secondary h-6 rounded-full" />
                          Players &amp; Officials
                        </h2>
                      </div>
                      <TravelPersonnelRoster personnel={personnel.value} mode="view" />
                    </section>
                  ) : null}

                  {/* Verification Documents */}
                  <section class="rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
                    <h2 class="text-xl font-bold text-primary mb-6 flex items-center gap-3">
                      <span class="w-1 bg-secondary h-6 rounded-full" />
                      Verification Documents
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ApplicationDocumentLink kind="2.1 Compliance declaration" storedPath={app.compliance_declaration_doc} />
                      <ApplicationDocumentLink kind="2.3 Invitation letter" storedPath={app.invitation_letter_doc} />
                      <ApplicationDocumentLink
                        kind="2.4 National association clearance"
                        storedPath={app.national_assoc_clearance_doc}
                      />
                      <ApplicationDocumentLink kind="2.9 Proof of funding" storedPath={app.funding_proof_doc} />
                      <ApplicationDocumentLink
                        kind="2.7 Liabilities & expenditure"
                        storedPath={app.liabilities_breakdown_doc}
                      />
                    </div>
                  </section>
                </div>

                {/* Sidebar */}
                <div class="lg:col-span-4">
                  <div class="rounded-2xl bg-[#002b14] p-5 text-white shadow-xl sm:p-8">
                    <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
                      <span class="material-symbols-outlined text-secondary">gavel</span>
                      Official Decision
                    </h3>

                    {reviewerBody.value === "SRC" ? (
                      <>
                        {app && !srcCanEditApplication(app, approvals.value, primaryBodyCode.value) ? (
                          <div class="rounded-xl border border-white/15 bg-white/5 p-4 text-sm leading-relaxed">
                            <p class="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">
                              {srcReadOnlyExplanation(app, approvals.value, primaryBodyCode.value, primaryBodyLabel.value)
                                .title}
                            </p>
                            <p class="text-white/85">
                              {srcReadOnlyExplanation(app, approvals.value, primaryBodyCode.value, primaryBodyLabel.value)
                                .body}
                            </p>
                          </div>
                        ) : (
                          <div class="space-y-4 mb-8">
                            <label class="block">
                              <span class="text-[10px] font-bold tracking-widest text-secondary/80">REVIEWER ACTION</span>
                              <div class="grid grid-cols-1 gap-3 mt-2">
                                <button
                                  class={[
                                    "group flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                                    srcActionSelected.value === "approved"
                                      ? "border-primary-fixed-dim bg-primary-fixed/20"
                                      : "border-white/20 hover:bg-white/10",
                                  ].join(" ")}
                                  type="button"
                                  onClick$={() => {
                                    srcActionSelected.value = "approved";
                                  }}
                                >
                                  <div
                                    class={[
                                      "w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 transition-colors",
                                      srcActionSelected.value === "approved"
                                        ? "border-primary-fixed-dim bg-primary-fixed-dim"
                                        : "border-primary-fixed-dim",
                                    ].join(" ")}
                                  />
                                  <span class="text-sm font-bold">Approve</span>
                                </button>

                                <button
                                  class={[
                                    "group flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                                    srcActionSelected.value === "awaiting_information"
                                      ? "border-secondary bg-secondary/20"
                                      : "border-white/20 hover:bg-white/10",
                                  ].join(" ")}
                                  type="button"
                                  onClick$={() => {
                                    srcActionSelected.value = "awaiting_information";
                                  }}
                                >
                                  <div
                                    class={[
                                      "w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 transition-colors",
                                      srcActionSelected.value === "awaiting_information"
                                        ? "border-secondary bg-secondary"
                                        : "border-secondary",
                                    ].join(" ")}
                                  />
                                  <span class="text-sm font-bold">Request correction</span>
                                </button>

                                <button
                                  class={[
                                    "group flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                                    srcActionSelected.value === "rejected"
                                      ? "border-error bg-error/20"
                                      : "border-white/20 hover:bg-error/30",
                                  ].join(" ")}
                                  type="button"
                                  onClick$={() => {
                                    srcActionSelected.value = "rejected";
                                  }}
                                >
                                  <div
                                    class={[
                                      "w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 transition-colors",
                                      srcActionSelected.value === "rejected"
                                        ? "border-error bg-error"
                                        : "border-error",
                                    ].join(" ")}
                                  />
                                  <span class="text-sm font-bold text-on-tertiary-container">Reject</span>
                                </button>
                              </div>
                            </label>

                            <label class="block mt-6">
                              <span class="text-[10px] font-bold tracking-widest text-secondary/80">
                                COMMENTARY — APPROVE · REQUEST CORRECTION · REJECT
                              </span>
                              <textarea
                                class="mt-2 w-full bg-white/5 border border-white/10 rounded-xl text-sm p-4 focus:ring-secondary focus:border-secondary placeholder-white/20"
                                placeholder="Optional: reasons for Approve, Request correction, or Reject…"
                                rows={4}
                                value={decisionNote.value}
                                onInput$={(_, el) => {
                                  decisionNote.value = el.value;
                                }}
                              />
                            </label>
                          </div>
                        )}

                        {submitError.value ? (
                          <p class="mb-4 text-xs text-error bg-error/10 rounded-lg px-3 py-2" role="alert">
                            {submitError.value}
                          </p>
                        ) : null}

                        {app && srcCanEditApplication(app, approvals.value, primaryBodyCode.value) ? (
                          <button
                            class="w-full bg-secondary-container text-on-secondary-container py-4 rounded-xl font-extrabold tracking-tight hover:shadow-[0_0_20px_rgba(253,208,0,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            type="button"
                            disabled={srcActionSelected.value === null || submitting.value}
                            onClick$={async () => {
                              if (
                                !srcActionSelected.value ||
                                !app ||
                                !srcCanEditApplication(app, approvals.value, primaryBodyCode.value)
                              )
                                return;
                              const user = getCurrentUser();
                              submitting.value = true;
                              submitError.value = null;

                              const action = srcActionSelected.value;
                              const approvalStatus =
                                action === "awaiting_information"
                                  ? "information_requested"
                                  : action === "approved"
                                    ? "approved"
                                    : "rejected";

                              const approvalR = await createApproval({
                                application_id: id,
                                body: "SRC",
                                status: approvalStatus,
                                decided_at: new Date().toISOString(),
                                decided_by: user?.id ?? null,
                                decision_note: decisionNote.value.trim() || null,
                              });

                              if (!approvalR.ok) {
                                submitError.value = approvalR.error;
                                submitting.value = false;
                                return;
                              }

                              // Only update application status for final approve/reject on the approval row;
                              // information_requested is recorded on approvals only.
                              if (approvalStatus === "approved" || approvalStatus === "rejected") {
                                const patchStatus =
                                  approvalStatus === "approved" ? "approved" : "rejected";
                                const patchR = await patchApplication(id, { status: patchStatus });
                                if (!patchR.ok) {
                                  submitError.value = patchR.error;
                                  submitting.value = false;
                                  return;
                                }
                              }

                              // When SRC approves, generate the travel certificate (legacy immigration stage removed).
                              if (approvalStatus === "approved") {
                                const org = organisationName.value.trim();
                                if (!org || org === "—") {
                                  submitError.value =
                                    "SRC approval saved, but certificate could not be generated (missing organisation name).";
                                  submitting.value = false;
                                  return;
                                }
                                const uid = user?.id?.trim() ?? "";
                                if (!uid) {
                                  submitError.value =
                                    "SRC approval saved, but certificate could not be generated (missing reviewer user id).";
                                  submitting.value = false;
                                  return;
                                }
                                const certR = await createCertificate({
                                  application_id: id,
                                  org_name: org,
                                  user_id: uid,
                                });
                                if (!certR.ok) {
                                  submitError.value = `SRC approval saved, but certificate could not be generated: ${certR.error}`;
                                  submitting.value = false;
                                  return;
                                }
                              }

                              successToast.value = successMessageForSrcDecision(action);
                              window.setTimeout(() => {
                                window.location.assign("/approver/dashboard/");
                              }, 2200);
                            }}
                          >
                            {successToast.value
                              ? "Saved"
                              : submitting.value
                                ? "Submitting…"
                                : "SUBMIT OFFICIAL DECISION"}
                          </button>
                        ) : null}

                        {app && srcCanEditApplication(app, approvals.value, primaryBodyCode.value) ? (
                          <div class="mt-6 flex items-center gap-2 text-[10px] text-white/40 justify-center">
                            <span class="material-symbols-outlined text-xs">info</span>
                            This action will be logged under your SRC reviewer account
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <>
                        {app &&
                        (!primaryStageCanEditApplication(app) ||
                          !primaryReviewerMatchesApplication(reviewerBody.value, primaryBodyCode.value)) ? (
                          <div class="rounded-xl border border-white/15 bg-white/5 p-4 text-sm leading-relaxed">
                            <p class="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">
                              {primaryStageCanEditApplication(app) &&
                              !primaryReviewerMatchesApplication(reviewerBody.value, primaryBodyCode.value)
                                ? "Different reviewer body"
                                : primaryReadOnlyExplanation(app.status, primaryBodyLabel.value).title}
                            </p>
                            <p class="text-white/85">
                              {primaryStageCanEditApplication(app) &&
                              !primaryReviewerMatchesApplication(reviewerBody.value, primaryBodyCode.value)
                                ? `This dossier is queued for ${primaryBodyLabel.value} first-line review.`
                                : primaryReadOnlyExplanation(app.status, primaryBodyLabel.value).body}
                            </p>
                          </div>
                        ) : (
                          <div class="space-y-4 mb-8">
                            <div class="rounded-xl border border-secondary/30 bg-white/5 p-4 space-y-3">
                              <p class="text-[10px] font-bold uppercase tracking-widest text-secondary">
                                Documents for approval
                              </p>
                              <p class="text-xs text-white/70 leading-relaxed">
                                Attach the compliance declaration (2.1) before you approve. National association
                                clearance (2.4) may also be uploaded here when applicable.
                              </p>
                              <div class="grid gap-4 [&_.bg-surface-container-highest]:bg-white/10 [&_.text-on-surface]:text-white">
                                <AttachmentField
                                  title="Declaration of full compliance with statutory requirements (2.1)"
                                  description="Required before sport body approval."
                                  apiFieldHint="compliance_declaration (API)"
                                  file={complianceDeclarationFile}
                                />
                                <AttachmentField
                                  title="National Association clearance (2.4)"
                                  description="Optional — clearance from the relevant national association."
                                  apiFieldHint="national_assoc_clearance (API)"
                                  file={nationalAssocClearanceFile}
                                />
                              </div>
                            </div>

                            <label class="block">
                              <span class="text-[10px] font-bold tracking-widest text-secondary/80">REVIEWER ACTION</span>
                              <div class="grid grid-cols-1 gap-3 mt-2">
                                <button
                                  class={[
                                    "group flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                                    actionSelected.value === "approved"
                                      ? "border-primary-fixed-dim bg-primary-fixed/20"
                                      : "border-white/20 hover:bg-white/10",
                                  ].join(" ")}
                                  type="button"
                                  onClick$={() => {
                                    actionSelected.value = "approved";
                                  }}
                                >
                                  <div
                                    class={[
                                      "w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 transition-colors",
                                      actionSelected.value === "approved"
                                        ? "border-primary-fixed-dim bg-primary-fixed-dim"
                                        : "border-primary-fixed-dim",
                                    ].join(" ")}
                                  />
                                  <span class="text-sm font-bold">Approve</span>
                                </button>

                                <button
                                  class={[
                                    "group flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                                    actionSelected.value === "information_requested"
                                      ? "border-secondary bg-secondary/20"
                                      : "border-white/20 hover:bg-white/10",
                                  ].join(" ")}
                                  type="button"
                                  onClick$={() => {
                                    actionSelected.value = "information_requested";
                                  }}
                                >
                                  <div
                                    class={[
                                      "w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 transition-colors",
                                      actionSelected.value === "information_requested"
                                        ? "border-secondary bg-secondary"
                                        : "border-secondary",
                                    ].join(" ")}
                                  />
                                  <span class="text-sm font-bold">Request correction</span>
                                </button>

                                <button
                                  class={[
                                    "group flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                                    actionSelected.value === "rejected"
                                      ? "border-error bg-error/20"
                                      : "border-white/20 hover:bg-error/30",
                                  ].join(" ")}
                                  type="button"
                                  onClick$={() => {
                                    actionSelected.value = "rejected";
                                  }}
                                >
                                  <div
                                    class={[
                                      "w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 transition-colors",
                                      actionSelected.value === "rejected"
                                        ? "border-error bg-error"
                                        : "border-error",
                                    ].join(" ")}
                                  />
                                  <span class="text-sm font-bold text-on-tertiary-container">Reject</span>
                                </button>
                              </div>
                            </label>

                            <label class="block mt-6">
                              <span class="text-[10px] font-bold tracking-widest text-secondary/80">
                                COMMENTARY — APPROVE · REJECT · REQUEST CORRECTION
                              </span>
                              <textarea
                                class="mt-2 w-full bg-white/5 border border-white/10 rounded-xl text-sm p-4 focus:ring-secondary focus:border-secondary placeholder-white/20"
                                placeholder="Optional: reasons for Approve, Reject, or Request correction…"
                                rows={4}
                                value={decisionNote.value}
                                onInput$={(_, el) => {
                                  decisionNote.value = el.value;
                                }}
                              />
                            </label>
                          </div>
                        )}

                        {submitError.value ? (
                          <p class="mb-4 text-xs text-error bg-error/10 rounded-lg px-3 py-2" role="alert">
                            {submitError.value}
                          </p>
                        ) : null}

                        {app &&
                        primaryStageCanEditApplication(app) &&
                        primaryReviewerMatchesApplication(reviewerBody.value, primaryBodyCode.value) ? (
                          <button
                            class="w-full bg-secondary-container text-on-secondary-container py-4 rounded-xl font-extrabold tracking-tight hover:shadow-[0_0_20px_rgba(253,208,0,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            type="button"
                            disabled={
                              actionSelected.value === null ||
                              submitting.value ||
                              (actionSelected.value === "approved" && !complianceDeclarationFile.value)
                            }
                            onClick$={async () => {
                              if (
                                !actionSelected.value ||
                                !app ||
                                !primaryStageCanEditApplication(app) ||
                                !primaryReviewerMatchesApplication(reviewerBody.value, primaryBodyCode.value)
                              )
                                return;
                              const user = getCurrentUser();
                              submitting.value = true;
                              submitError.value = null;

                              // Mandatory doc upload before sports-body approval is recorded.
                              if (actionSelected.value === "approved") {
                                const file = complianceDeclarationFile.value;
                                if (!file) {
                                  submitError.value =
                                    "Attach the Declaration of full compliance with statutory requirements (2.1) before approving.";
                                  submitting.value = false;
                                  return;
                                }
                                const clearanceFile = nationalAssocClearanceFile.value;
                                const up = await uploadOutgoingTourComplianceDeclaration({
                                  compliance_declaration: file,
                                  national_assoc_clearance: clearanceFile,
                                });
                                if (!up.ok) {
                                  submitError.value = up.error;
                                  submitting.value = false;
                                  return;
                                }
                                const compliancePath = String(up.data?.compliance_declaration_doc ?? "").trim();
                                if (!compliancePath) {
                                  submitError.value =
                                    "Compliance declaration uploaded, but server did not return a document path.";
                                  submitting.value = false;
                                  return;
                                }
                                const patchBody: Record<string, unknown> = {
                                  compliance_declaration_doc: compliancePath,
                                  status: "awaiting_src",
                                };
                                const clearancePath = String(up.data?.national_assoc_clearance_doc ?? "").trim();
                                if (clearancePath) {
                                  patchBody.national_assoc_clearance_doc = clearancePath;
                                }
                                const patchR = await patchApplication(id, patchBody);
                                if (!patchR.ok) {
                                  submitError.value = patchR.error;
                                  submitting.value = false;
                                  return;
                                }
                              }

                              const approvalR = await createApproval({
                                application_id: id,
                                body: "SPORT_BODY",
                                body_code: primaryBodyCode.value,
                                sports_body:
                                  user?.sports_body ?? (user?.sport_body_id != null ? String(user.sport_body_id) : null),
                                status: actionSelected.value,
                                decided_at: new Date().toISOString(),
                                decided_by: user?.id ?? null,
                                decision_note: decisionNote.value.trim() || null,
                              });

                              if (!approvalR.ok) {
                                submitError.value = approvalR.error;
                                submitting.value = false;
                                return;
                              }

                              if (actionSelected.value === "approved") {
                                // Status was already advanced when we persisted the compliance doc.
                              } else if (actionSelected.value === "rejected") {
                                const patchR = await patchApplication(id, { status: "rejected" });
                                if (!patchR.ok) {
                                  submitError.value = patchR.error;
                                  submitting.value = false;
                                  return;
                                }
                              }

                              successToast.value = successMessageForDecision(actionSelected.value);
                              window.setTimeout(() => {
                                window.location.assign("/approver/dashboard/");
                              }, 2200);
                            }}
                          >
                            {successToast.value
                              ? "Saved"
                              : submitting.value
                                ? "Submitting…"
                                : "SUBMIT OFFICIAL DECISION"}
                          </button>
                        ) : null}

                        {app &&
                        primaryStageCanEditApplication(app) &&
                        primaryReviewerMatchesApplication(reviewerBody.value, primaryBodyCode.value) ? (
                          <div class="mt-6 flex items-center gap-2 text-[10px] text-white/40 justify-center">
                            <span class="material-symbols-outlined text-xs">info</span>
                            This action will be logged under your {primaryBodyLabel.value} reviewer account
                          </div>
                        ) : null}
                      </>
                    )}
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
                        href="/approver/dashboard/"
                      >
                        <span class="material-symbols-outlined text-sm">arrow_back</span> Back
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
  title: "Application Processing",
};
