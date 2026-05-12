import { component$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { ApproverPortalNav } from "~/components/approver-portal-nav";
import { listApplications } from "~/lib/applications-api";
import { listApprovals } from "~/lib/approvals-api";
import { getApiBaseUrl } from "~/lib/api";
import { isLatestPrimaryBodyApproved } from "~/lib/approver-approval-helpers";
import { getCurrentUser, normalizeApproverBody } from "~/lib/auth";
import { reviewerRoutingBodyFromSession } from "~/lib/users-api";
import { formatDateTime, labelEventType } from "~/lib/application-display";
import { getOrganisationRowLabelsByIds } from "~/lib/organisations-api";
import {
  resolvePrimaryBodyFromOrgSport,
  reviewerPrimaryCodesEqual,
  routingSportForApplication,
} from "~/lib/sport-routing";
import { listSportBodies } from "~/lib/sport-bodies-api";
import { listZimbabweSports } from "~/lib/zimbabwe-sports-api";

type DashboardStatus =
  | "awaitingReview"
  | "awaitingPsl"
  | "underReview"
  | "infoRequested"
  | "awaitingInformation"
  | "approved"
  | "rejected";
type StatusFilter = "all" | DashboardStatus | "historical" | "overdue";

type ApproverBody = string | null;

type ApplicationRecord = {
  id: string;
  ref: string;
  priority: "URGENT" | "NORMAL";
  organization: string;
  organizationType: string;
  /** Organisation `sport` when set. */
  organizationSport?: string;
  event: string;
  destination: string;
  ageGroup: string;
  queueEntry: string;
  status: DashboardStatus;
  /** When true, SRC reviewer may OPEN (primary sport body latest approved). Only meaningful for SRC users. */
  srcOpenEligible?: boolean;
  overdue?: boolean;
  assignee?: {
    initials: string;
    name: string;
    tone: "secondary" | "neutral";
  };
  /** Original `application.status` from the API (for labels like certificate vs approved). */
  apiStatusRaw?: string;
};

function apiStatusToDashboard(status: string | undefined): DashboardStatus {
  const s = (status ?? "").toLowerCase();
  if (s === "awaiting_psl" || s === "awaiting_affiliate") {
    return "awaitingPsl";
  }
  if (
    s === "awaiting_body" ||
    s === "awaiting_zifa" ||
    s === "awaiting_primary_body" ||
    s === "awaiting_sport_body" ||
    s === "submitted"
  ) {
    return "awaitingReview";
  }
  if (s === "awaiting_src" || s === "under_review") return "underReview";
  if (s === "information_requested") return "infoRequested";
  if (s === "awaiting_information") return "awaitingInformation";
  /** Legacy status: immigration stage removed — show with approved work queue. */
  if (s === "awaiting_immigration") return "approved";
  /** Final outcomes: same dashboard bucket / “Approved” filter. */
  if (s === "approved" || s === "certificate_issued") return "approved";
  if (s === "rejected") return "rejected";
  if (s) {
    console.warn("[approver-dashboard] unknown API status, mapping to Awaiting sport body until handled", {
      raw: status,
    });
  }
  return "awaitingReview";
}

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Status: All" },
  { value: "awaitingReview", label: "Awaiting sport body" },
  { value: "awaitingPsl", label: "Awaiting PSL" },
  { value: "underReview", label: "Awaiting SRC" },
  { value: "infoRequested", label: "Info Requested" },
  { value: "awaitingInformation", label: "Awaiting Information" },
  { value: "approved", label: "Status: APPROVED" },
  { value: "rejected", label: "Rejected" },
  { value: "historical", label: "Historical" },
  { value: "overdue", label: "Overdue" },
];

const HISTORICAL_STATUSES: DashboardStatus[] = ["approved", "rejected"];

/** Default queue filter when the URL has no `?status=` (or an invalid value). */
function defaultStatusFilterForReviewerBody(body: ApproverBody): StatusFilter {
  if (body === "SRC") return "underReview";
  if (body === "AFFILIATE") return "awaitingPsl";
  return "awaitingReview";
}

function resolveStatusFilterFromUrl(urlStatus: string | null, body: ApproverBody): StatusFilter {
  if (urlStatus === "awaitingAffiliate") return "awaitingPsl";
  if (urlStatus === "all") return "all";
  if (
    urlStatus === "awaitingReview" ||
    urlStatus === "awaitingPsl" ||
    urlStatus === "underReview" ||
    urlStatus === "infoRequested" ||
    urlStatus === "awaitingInformation" ||
    urlStatus === "approved" ||
    urlStatus === "rejected" ||
    urlStatus === "historical" ||
    urlStatus === "overdue"
  ) {
    return urlStatus;
  }
  return defaultStatusFilterForReviewerBody(body);
}

const getVisibleApplications = (list: ApplicationRecord[], status: StatusFilter) => {
  if (status === "all") {
    return list;
  }

  if (status === "historical") {
    return list.filter((application) => HISTORICAL_STATUSES.includes(application.status));
  }

  if (status === "overdue") {
    return list.filter((application) => application.overdue);
  }

  return list.filter((application) => application.status === status);
};

const countForFilter = (list: ApplicationRecord[], status: StatusFilter) =>
  getVisibleApplications(list, status).length;

const getFilterLabel = (status: StatusFilter) => {
  const match = STATUS_OPTIONS.find((option) => option.value === status);
  return match ? match.label.replace("Status: ", "") : "All";
};

const getActiveNavItem = (status: StatusFilter) => {
  if (status === "approved") {
    return "approved" as const;
  }

  if (status === "rejected" || status === "historical") {
    return "archived" as const;
  }

  return "pendingQueue" as const;
};

const getSummaryCardClasses = (selected: boolean, accent: string) =>
  selected
    ? `rounded-xl border px-5 py-5 text-left shadow-sm ring-2 ring-primary/20 bg-white ${accent}`
    : `rounded-xl border px-5 py-5 text-left bg-surface-container-low hover:bg-white transition-colors ${accent}`;

const getStatusPillClasses = (status: DashboardStatus) => {
  if (status === "approved") {
    return "bg-primary/10 text-primary";
  }
  if (status === "rejected") {
    return "bg-error-container text-on-error-container";
  }
  if (status === "infoRequested") {
    return "bg-secondary-fixed text-on-secondary-fixed-variant";
  }
  if (status === "awaitingInformation") {
    return "bg-tertiary/15 text-tertiary";
  }
  if (status === "underReview") {
    return "bg-surface-container-highest text-on-surface-variant";
  }
  if (status === "awaitingPsl") {
    return "bg-primary/10 text-primary";
  }
  return "bg-tertiary/10 text-tertiary";
};

const getStatusLabel = (status: DashboardStatus, rawApiStatus?: string) => {
  if (status === "awaitingReview") {
    return "Awaiting sport body";
  }
  if (status === "awaitingPsl") {
    return "Awaiting PSL";
  }
  if (status === "underReview") {
    return "Awaiting SRC";
  }
  if (status === "infoRequested") {
    return "Info requested";
  }
  if (status === "awaitingInformation") {
    return "Awaiting information";
  }
  if (status === "approved") {
    const r = (rawApiStatus ?? "").trim().toLowerCase();
    if (r === "certificate_issued") return "Certificate issued";
    if (r === "awaiting_immigration") return "Legacy: finalise on server";
    return "Approved";
  }
  return "Rejected";
};

const getActionHref = (application: ApplicationRecord) =>
  HISTORICAL_STATUSES.includes(application.status)
    ? `/approver/historical/?id=${application.id}&result=${application.status}`
    : `/approver/processing/?id=${application.id}`;

function rawApiStatusIsPslPhase(raw: string | undefined): boolean {
  const s = (raw ?? "").trim().toLowerCase();
  return s === "awaiting_psl" || s === "awaiting_affiliate";
}

function isApproverActionable(application: ApplicationRecord, body: ApproverBody): boolean {
  if (body === "SRC") {
    return application.status === "underReview" && application.srcOpenEligible === true;
  }
  if (body === "AFFILIATE") {
    return application.status === "awaitingPsl";
  }
  if (rawApiStatusIsPslPhase(application.apiStatusRaw)) return false;
  return application.status === "awaitingReview";
}

function getApproverActionLabel(application: ApplicationRecord, body: ApproverBody): "OPEN" | "VIEW" {
  if (HISTORICAL_STATUSES.includes(application.status)) return "VIEW";
  if (isApproverActionable(application, body)) return "OPEN";
  return "VIEW";
}

function approverPortalTitle(body: ApproverBody): string {
  if (body === "SRC") return "Official Approver Portal - SRC Queue";
  if (body) return `Official Approver Portal - ${body} Queue`;
  return "Official Approver Portal";
}

export default component$(() => {
  const location = useLocation();
  const initialReviewerBody = normalizeApproverBody(getCurrentUser()?.body) as ApproverBody;
  const selectedStatus = useSignal<StatusFilter>(
    resolveStatusFilterFromUrl(location.url.searchParams.get("status"), initialReviewerBody),
  );
  const applications = useStore<ApplicationRecord[]>([]);
  const loadingApps = useSignal(true);
  const loadError = useSignal<string | null>(null);
  const approverBody = useSignal<ApproverBody>(null);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    const u = getCurrentUser();
    if (!u?.id) {
      loadingApps.value = false;
      return;
    }
    const limit = 100;
    const offset = 0;
    const listUrl = `${getApiBaseUrl()}/api/v1/applications?limit=${limit}&offset=${offset}`;
    console.info("[approver-dashboard] list all applications (attempt)", {
      method: "GET",
      url: listUrl,
      limit,
      offset,
    });
    loadingApps.value = true;
    loadError.value = null;
    const r = await listApplications({ limit, offset });
    loadingApps.value = false;
    if (!r.ok) {
      console.warn("[approver-dashboard] list all applications (failed)", {
        httpStatus: r.status,
        error: r.error,
      });
      loadError.value = r.error;
      return;
    }
    console.info("[approver-dashboard] list all applications (success)", {
      count: r.data.length,
    });
    const fetchDebugRows = r.data.map((a) => {
      const raw = a.status ?? "";
      return {
        id: a.id,
        reference_number: a.reference_number ?? "",
        api_status: raw,
        dashboard_status: apiStatusToDashboard(a.status),
      };
    });
    console.info("[approver-dashboard] fetched rows: raw API status vs mapped dashboard bucket", fetchDebugRows);
    if (typeof console.table === "function") {
      console.table(fetchDebugRows);
    }
    const orgRows = await getOrganisationRowLabelsByIds(r.data.map((a) => a.organisation_id));
    const [zsR, sbR] = await Promise.all([
      listZimbabweSports({ limit: 200, offset: 0 }),
      listSportBodies({ limit: 200, offset: 0 }),
    ]);
    const zs = zsR.ok ? zsR.data : [];
    const sb = sbR.ok ? sbR.data : [];
    approverBody.value = reviewerRoutingBodyFromSession(u, sb) as ApproverBody;
    selectedStatus.value = resolveStatusFilterFromUrl(location.url.searchParams.get("status"), approverBody.value);
    const body = approverBody.value;
    const srcEligibility = new Map<string, boolean>();
    if (body === "SRC") {
      const underReview = r.data.filter((a) => {
        const st = (a.status ?? "").trim().toLowerCase();
        return st === "awaiting_src" || st === "under_review";
      });
      const batchSize = 8;
      for (let i = 0; i < underReview.length; i += batchSize) {
        const batch = underReview.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (app) => {
            const appr = await listApprovals({ application_id: app.id, limit: 50, offset: 0 });
            const orgId = app.organisation_id?.trim();
            const orgRow = orgId ? orgRows.get(orgId) : undefined;
            const primary = resolvePrimaryBodyFromOrgSport(
              routingSportForApplication(app.sport, orgRow?.sport),
              zs,
              sb,
            );
            srcEligibility.set(app.id, appr.ok && isLatestPrimaryBodyApproved(appr.data, primary.code));
          }),
        );
      }
    }

    applications.length = 0;
    for (const app of r.data) {
      const orgId = app.organisation_id?.trim();
      const orgRow = orgId ? orgRows.get(orgId) : undefined;
      const routeSport = routingSportForApplication(app.sport, orgRow?.sport);
      if (body && body !== "SRC") {
        if (body === "AFFILIATE") {
          const raw = (app.status ?? "").trim().toLowerCase();
          if (raw !== "awaiting_psl" && raw !== "awaiting_affiliate") continue;
        } else {
          const rawAssigned = (app.status ?? "").trim().toLowerCase();
          if (rawAssigned === "awaiting_psl" || rawAssigned === "awaiting_affiliate") continue;
          const primary = resolvePrimaryBodyFromOrgSport(routeSport, zs, sb);
          if (!reviewerPrimaryCodesEqual(primary.code, body)) continue;
        }
      }
      const st = apiStatusToDashboard(app.status);
      applications.push({
        id: app.id,
        ref: app.reference_number ?? app.id.slice(0, 8),
        priority: (app.priority ?? "normal").toLowerCase() === "urgent" ? "URGENT" : "NORMAL",
        organization: orgId ? (orgRow?.name ?? "—") : "—",
        organizationType: orgId ? (orgRow?.orgType ?? "—") : "—",
        organizationSport: orgId && routeSport ? routeSport : undefined,
        event: app.event_display_name ?? labelEventType(app.event_type) ?? "—",
        destination: app.host_country ?? "—",
        ageGroup: app.age_group != null && String(app.age_group).trim() !== "" ? String(app.age_group).trim() : "—",
        queueEntry: formatDateTime(app.created_at) || "—",
        status: st,
        apiStatusRaw: app.status ?? undefined,
        srcOpenEligible:
          body === "SRC" && st === "underReview" ? (srcEligibility.get(app.id) ?? false) : undefined,
      });
    }
  });

  const visibleApplications = getVisibleApplications(applications, selectedStatus.value);
  const activeItem = getActiveNavItem(selectedStatus.value);
  const hasApplications = applications.length > 0;

  return (
    <div class="flex flex-1 flex-col min-h-0 min-w-0 bg-background text-on-background">
      <ApproverPortalNav activeItem={activeItem} title={approverPortalTitle(approverBody.value)} />

      <main class="min-h-0 flex-1 min-w-0 w-full">
        <div class="pt-28 px-4 sm:px-8 pb-8 sm:pb-12">
          <section class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <button
              class={getSummaryCardClasses(selectedStatus.value === "all", "border-b-2 border-emerald-900/10")}
              type="button"
              onClick$={() => {
                selectedStatus.value = "all";
              }}
            >
              <p class="text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Total Assigned</p>
              <p class="text-3xl font-headline font-extrabold text-primary">{applications.length}</p>
            </button>
            <button
              class={getSummaryCardClasses(
                selectedStatus.value === "awaitingReview",
                "border-b-2 border-emerald-900/10",
              )}
              type="button"
              onClick$={() => {
                selectedStatus.value = "awaitingReview";
              }}
            >
              <p class="text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Awaiting sport body</p>
              <div class="flex items-baseline gap-2">
                <p class="text-3xl font-headline font-extrabold text-primary">{countForFilter(applications, "awaitingReview")}</p>
                {countForFilter(applications, "awaitingReview") > 0 ? (
                  <span class="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                    NEW
                  </span>
                ) : null}
              </div>
            </button>
            <button
              class={getSummaryCardClasses(
                selectedStatus.value === "awaitingPsl",
                "border-b-2 border-emerald-900/10",
              )}
              type="button"
              onClick$={() => {
                selectedStatus.value = "awaitingPsl";
              }}
            >
              <p class="text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Awaiting affiliate</p>
              <div class="flex items-baseline gap-2">
                <p class="text-3xl font-headline font-extrabold text-primary">{countForFilter(applications, "awaitingPsl")}</p>
                {countForFilter(applications, "awaitingPsl") > 0 ? (
                  <span class="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                    NEW
                  </span>
                ) : null}
              </div>
            </button>
            <button
              class={getSummaryCardClasses(selectedStatus.value === "underReview", "border-b-2 border-emerald-900/10")}
              type="button"
              onClick$={() => {
                selectedStatus.value = "underReview";
              }}
            >
              <p class="text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Awaiting SRC</p>
              <p class="text-3xl font-headline font-extrabold text-primary">{countForFilter(applications, "underReview")}</p>
            </button>
            <button
              class={getSummaryCardClasses(selectedStatus.value === "approved", "border-b-2 border-emerald-900/10")}
              type="button"
              onClick$={() => {
                selectedStatus.value = "approved";
              }}
            >
              <p class="text-[10px] uppercase tracking-widest font-bold text-outline mb-1">APPROVED</p>
              <p class="text-3xl font-headline font-extrabold text-emerald-700">{countForFilter(applications, "approved")}</p>
            </button>
            <button
              class={getSummaryCardClasses(selectedStatus.value === "rejected", "border-b-2 border-emerald-900/10")}
              type="button"
              onClick$={() => {
                selectedStatus.value = "rejected";
              }}
            >
              <p class="text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Rejected</p>
              <p class="text-3xl font-headline font-extrabold text-tertiary">{countForFilter(applications, "rejected")}</p>
            </button>
            <button
              class={getSummaryCardClasses(
                selectedStatus.value === "infoRequested",
                "border-b-2 border-emerald-900/10",
              )}
              type="button"
              onClick$={() => {
                selectedStatus.value = "infoRequested";
              }}
            >
              <p class="text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Info Requested</p>
              <p class="text-3xl font-headline font-extrabold text-secondary">{countForFilter(applications, "infoRequested")}</p>
            </button>
            <button
              class={getSummaryCardClasses(selectedStatus.value === "overdue", "border-l-4 border-error")}
              type="button"
              onClick$={() => {
                selectedStatus.value = "overdue";
              }}
            >
              <p class="text-[10px] uppercase tracking-widest font-bold text-error mb-1">Overdue (&gt;5 Days)</p>
              <div class="flex items-center justify-between">
                <p class="text-3xl font-headline font-extrabold text-error">{countForFilter(applications, "overdue")}</p>
                <span class="material-symbols-outlined text-error" style="font-variation-settings: 'FILL' 1;">
                  warning
                </span>
              </div>
            </button>
          </section>

          <div class="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div class="p-6 border-b border-outline-variant/15 flex flex-wrap items-center justify-between gap-4 bg-white">
              <div class="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0">
                <select
                  class="bg-surface-container-low border-none rounded-lg text-sm font-medium px-4 py-2 focus:ring-1 focus:ring-primary min-w-[160px]"
                  value={selectedStatus.value}
                  onChange$={(_, element) => {
                    selectedStatus.value = element.value as StatusFilter;
                  }}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full min-w-0 border-collapse text-left text-sm">
                <thead>
                  <tr class="bg-surface-container-low">
                    <th class="align-top px-3 py-3 text-[10px] sm:text-[11px] uppercase tracking-widest font-bold text-outline max-w-[7rem] sm:max-w-none">
                      Ref number
                    </th>
                    <th class="align-top px-3 py-3 text-[10px] sm:text-[11px] uppercase tracking-widest font-bold text-outline min-w-[6rem]">
                      Organization
                    </th>
                    <th class="align-top px-3 py-3 text-[10px] sm:text-[11px] uppercase tracking-widest font-bold text-outline min-w-[7rem]">
                      Event / dest
                    </th>
                    <th class="align-top px-3 py-3 text-[10px] sm:text-[11px] uppercase tracking-widest font-bold text-outline">
                      Age group
                    </th>
                    <th class="align-top px-3 py-3 text-[10px] sm:text-[11px] uppercase tracking-widest font-bold text-outline">
                      Queue entry
                    </th>
                    <th class="align-top px-3 py-3 text-[10px] sm:text-[11px] uppercase tracking-widest font-bold text-outline">
                      Status
                    </th>
                    <th class="align-top px-3 py-3 text-[10px] sm:text-[11px] uppercase tracking-widest font-bold text-outline">
                      Assignee
                    </th>
                    <th class="align-top px-3 py-3 text-[10px] sm:text-[11px] uppercase tracking-widest font-bold text-outline text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/10">
                  {loadingApps.value ? (
                    <tr>
                      <td class="px-4 py-10 text-center text-sm text-outline align-middle" colSpan={8}>
                        Loading applications…
                      </td>
                    </tr>
                  ) : loadError.value ? (
                    <tr>
                      <td class="px-4 py-10 text-center text-sm text-error align-middle" colSpan={8}>
                        {loadError.value}
                      </td>
                    </tr>
                  ) : hasApplications
                    ? visibleApplications.map((application) => (
                        <tr key={application.id} class="hover:bg-surface-container-low transition-colors group">
                          <td class="align-top px-3 py-3">
                            <div class="flex flex-wrap items-start gap-2 break-words">
                              <span class="text-xs font-mono font-bold text-primary break-all">{application.ref}</span>
                              <span
                                class={
                                  application.priority === "URGENT"
                                    ? "bg-tertiary/10 text-tertiary text-[9px] font-black px-1.5 py-0.5 rounded shrink-0"
                                    : "bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                                }
                              >
                                {application.priority}
                              </span>
                            </div>
                          </td>
                          <td class="align-top px-3 py-3 max-w-[11rem] sm:max-w-none">
                            <div class="flex min-w-0 flex-col gap-0.5 break-words whitespace-normal">
                              <span class="font-bold text-on-surface text-sm leading-snug">{application.organization}</span>
                              <span class="text-xs text-outline leading-snug">{application.organizationType}</span>
                              {application.organizationSport ? (
                                <span class="text-xs text-on-surface-variant leading-snug">
                                  Sport: {application.organizationSport}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td class="align-top px-3 py-3 max-w-[12rem] sm:max-w-none">
                            <div class="flex min-w-0 flex-col gap-1 break-words whitespace-normal">
                              <span class="text-sm font-medium leading-snug">{application.event}</span>
                              <div class="flex items-start gap-1 text-xs text-outline leading-snug">
                                <span class="material-symbols-outlined shrink-0 text-xs mt-0.5">location_on</span>
                                <span>{application.destination}</span>
                              </div>
                            </div>
                          </td>
                          <td class="align-top px-3 py-3 text-sm text-on-surface break-words whitespace-normal leading-snug">
                            {application.ageGroup}
                          </td>
                          <td class="align-top px-3 py-3 text-sm text-outline break-words whitespace-normal leading-snug">
                            {application.queueEntry}
                          </td>
                          <td class="align-top px-3 py-3">
                            <span
                              class={`inline-block max-w-full break-words whitespace-normal text-left text-[10px] font-bold px-2 py-1 rounded leading-snug ${getStatusPillClasses(
                                application.status,
                              )}`}
                            >
                              {getStatusLabel(application.status, application.apiStatusRaw)}
                            </span>
                          </td>
                          <td class="align-top px-3 py-3">
                            {application.assignee ? (
                              <div class="flex items-start gap-2 min-w-0 break-words">
                                <div
                                  class={
                                    application.assignee.tone === "secondary"
                                      ? "w-6 h-6 shrink-0 rounded-full bg-secondary-container flex items-center justify-center text-[10px] font-bold"
                                      : "w-6 h-6 shrink-0 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold"
                                  }
                                >
                                  {application.assignee.initials}
                                </div>
                                <span class="text-xs font-medium leading-snug">{application.assignee.name}</span>
                              </div>
                            ) : (
                              <button class="text-xs font-bold text-primary flex items-center gap-1 hover:underline text-left" type="button">
                                <span class="material-symbols-outlined text-sm shrink-0">person_add</span>
                                Assign to Me
                              </button>
                            )}
                          </td>
                          <td class="align-top px-3 py-3 text-right">
                            <div class="flex flex-wrap items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              {isApproverActionable(application, approverBody.value) ? (
                                <a class="bg-primary text-white text-[11px] font-bold px-3 py-1.5 rounded-md" href={getActionHref(application)}>
                                  OPEN
                                </a>
                              ) : (
                                <a
                                  class="bg-surface-container text-on-surface-variant text-[11px] font-bold px-3 py-1.5 rounded-md"
                                  href={getActionHref(application)}
                                >
                                  {getApproverActionLabel(application, approverBody.value)}
                                </a>
                              )}
                              <button class="bg-surface-container-highest text-outline p-1.5 rounded-md" type="button">
                                <span class="material-symbols-outlined text-sm">more_vert</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    : null}
                  {!loadingApps.value && !loadError.value && visibleApplications.length === 0 ? (
                    <tr>
                      <td class="px-4 py-12 text-center text-sm text-outline align-middle" colSpan={8}>
                        <p class="font-headline font-bold text-primary text-base">
                          {hasApplications ? "No applications match the selected status filter." : "No applications in the queue yet."}
                        </p>
                        {!hasApplications ? (
                          <p class="mt-2 text-on-surface-variant font-normal max-w-md mx-auto">
                            When travel authorization requests are assigned for review, they will appear here.
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div class="p-6 bg-surface-container-low flex items-center justify-between flex-wrap gap-4">
              <span class="text-xs text-outline font-medium">
                {loadingApps.value
                ? "Loading applications…"
                : loadError.value
                  ? `Error: ${loadError.value}`
                  : `Showing ${visibleApplications.length} of ${applications.length} applications for ${getFilterLabel(selectedStatus.value)}`
              }
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Approver Dashboard",
};
