import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { ApproverPortalNav } from "~/components/approver-portal-nav";

type DashboardStatus = "awaitingReview" | "underReview" | "infoRequested" | "approved" | "rejected";
type StatusFilter = "all" | DashboardStatus | "historical" | "overdue";
type VerificationTone = "pending" | "verified" | "queue" | "issue";
type AgingTone = "good" | "warning" | "error";

type ApplicationRecord = {
  ref: string;
  priority: "URGENT" | "NORMAL";
  organization: string;
  organizationType: string;
  event: string;
  destination: string;
  queueEntry: string;
  aging: string;
  agingTone: AgingTone;
  status: DashboardStatus;
  overdue?: boolean;
  assignee?: {
    initials: string;
    name: string;
    tone: "secondary" | "neutral";
  };
  verifications: Array<{
    label: string;
    widthClass: string;
    tone: VerificationTone;
    value: string;
  }>;
};

const APPLICATIONS: ApplicationRecord[] = [
  {
    ref: "ZTA-2025-0042",
    priority: "URGENT",
    organization: "Dynamos FC",
    organizationType: "Football Club",
    event: "AFCON Qualifiers",
    destination: "South Africa",
    queueEntry: "Oct 24, 2024",
    aging: "6d",
    agingTone: "error",
    status: "awaitingReview",
    overdue: true,
    verifications: [
      { label: "SRC", widthClass: "w-1/2", tone: "pending", value: "PENDING" },
      { label: "IMMIG.", widthClass: "w-full", tone: "verified", value: "VERIFIED" },
    ],
  },
  {
    ref: "ZTA-2025-0048",
    priority: "NORMAL",
    organization: "ZIFA Academy",
    organizationType: "Youth Institution",
    event: "U17 Regional Tour",
    destination: "Zambia",
    queueEntry: "Oct 28, 2024",
    aging: "2d",
    agingTone: "good",
    status: "underReview",
    assignee: { initials: "EM", name: "E. Munroe", tone: "secondary" },
    verifications: [
      { label: "SRC", widthClass: "w-full", tone: "verified", value: "VERIFIED" },
      { label: "IMMIG.", widthClass: "w-1/3", tone: "queue", value: "QUEUE" },
    ],
  },
  {
    ref: "ZTA-2025-0037",
    priority: "NORMAL",
    organization: "Ngezi Platinum Stars",
    organizationType: "Football Club",
    event: "CAF Confederation Cup",
    destination: "Tanzania",
    queueEntry: "Oct 25, 2024",
    aging: "3d",
    agingTone: "warning",
    status: "infoRequested",
    assignee: { initials: "TM", name: "T. Machingura", tone: "neutral" },
    verifications: [
      { label: "SRC", widthClass: "w-3/4", tone: "issue", value: "INFO NEEDED" },
      { label: "IMMIG.", widthClass: "w-2/3", tone: "pending", value: "PENDING" },
    ],
  },
  {
    ref: "ZTA-2025-0039",
    priority: "NORMAL",
    organization: "Highlanders FC",
    organizationType: "Football Club",
    event: "Club Friendly",
    destination: "Botswana",
    queueEntry: "Oct 26, 2024",
    aging: "4d",
    agingTone: "warning",
    status: "approved",
    assignee: { initials: "SM", name: "S. Moyo", tone: "neutral" },
    verifications: [
      { label: "SRC", widthClass: "w-full", tone: "verified", value: "VERIFIED" },
      { label: "IMMIG.", widthClass: "w-full", tone: "verified", value: "VERIFIED" },
    ],
  },
  {
    ref: "ZTA-2025-0033",
    priority: "NORMAL",
    organization: "Black Rhinos FC",
    organizationType: "Football Club",
    event: "Regional Invitational",
    destination: "Mozambique",
    queueEntry: "Oct 22, 2024",
    aging: "5d",
    agingTone: "warning",
    status: "rejected",
    assignee: { initials: "NK", name: "N. Kaseke", tone: "secondary" },
    verifications: [
      { label: "SRC", widthClass: "w-full", tone: "verified", value: "VERIFIED" },
      { label: "IMMIG.", widthClass: "w-1/4", tone: "issue", value: "REJECTED" },
    ],
  },
  {
    ref: "ZTA-2025-0051",
    priority: "NORMAL",
    organization: "Zimbabwe Women National Team",
    organizationType: "National Team",
    event: "World Cup Prep",
    destination: "Namibia",
    queueEntry: "Oct 29, 2024",
    aging: "1d",
    agingTone: "good",
    status: "approved",
    assignee: { initials: "RC", name: "R. Chari", tone: "secondary" },
    verifications: [
      { label: "SRC", widthClass: "w-full", tone: "verified", value: "VERIFIED" },
      { label: "IMMIG.", widthClass: "w-full", tone: "verified", value: "VERIFIED" },
    ],
  },
];

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Status: All" },
  { value: "awaitingReview", label: "Awaiting Review" },
  { value: "underReview", label: "Under Review" },
  { value: "infoRequested", label: "Info Requested" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "historical", label: "Historical" },
  { value: "overdue", label: "Overdue" },
];

const HISTORICAL_STATUSES: DashboardStatus[] = ["approved", "rejected"];

const getInitialStatusFilter = (value: string | null): StatusFilter => {
  if (
    value === "awaitingReview" ||
    value === "underReview" ||
    value === "infoRequested" ||
    value === "approved" ||
    value === "rejected" ||
    value === "historical" ||
    value === "overdue"
  ) {
    return value;
  }

  return "all";
};

const getVisibleApplications = (status: StatusFilter) => {
  if (status === "all") {
    return APPLICATIONS;
  }

  if (status === "historical") {
    return APPLICATIONS.filter((application) => HISTORICAL_STATUSES.includes(application.status));
  }

  if (status === "overdue") {
    return APPLICATIONS.filter((application) => application.overdue);
  }

  return APPLICATIONS.filter((application) => application.status === status);
};

const countForFilter = (status: StatusFilter) => getVisibleApplications(status).length;

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

const getAgingClasses = (tone: AgingTone) => {
  if (tone === "error") {
    return "bg-error/10 text-error";
  }

  if (tone === "warning") {
    return "bg-yellow-100 text-yellow-800";
  }

  return "bg-emerald-100 text-emerald-700";
};

const getVerificationClasses = (tone: VerificationTone) => {
  if (tone === "verified") {
    return { bar: "bg-emerald-600", text: "text-emerald-600" };
  }

  if (tone === "queue") {
    return { bar: "bg-yellow-500", text: "text-yellow-600" };
  }

  if (tone === "issue") {
    return { bar: "bg-error", text: "text-error" };
  }

  return { bar: "bg-yellow-500", text: "text-yellow-600" };
};

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

  if (status === "underReview") {
    return "bg-surface-container-highest text-on-surface-variant";
  }

  return "bg-tertiary/10 text-tertiary";
};

const getStatusLabel = (status: DashboardStatus) => {
  if (status === "awaitingReview") {
    return "Awaiting Review";
  }

  if (status === "underReview") {
    return "Under Review";
  }

  if (status === "infoRequested") {
    return "Info Requested";
  }

  if (status === "approved") {
    return "Approved";
  }

  return "Rejected";
};

const getActionHref = (application: ApplicationRecord) =>
  HISTORICAL_STATUSES.includes(application.status)
    ? `/approver/historical/?ref=${application.ref}&result=${application.status}`
    : `/approver/processing/?ref=${application.ref}`;

const getActionLabel = (application: ApplicationRecord) =>
  HISTORICAL_STATUSES.includes(application.status) ? "VIEW" : "OPEN";

export default component$(() => {
  const location = useLocation();
  const selectedStatus = useSignal<StatusFilter>(getInitialStatusFilter(location.url.searchParams.get("status")));
  const visibleApplications = getVisibleApplications(selectedStatus.value);
  const activeItem = getActiveNavItem(selectedStatus.value);

  return (
    <div class="bg-background text-on-background min-h-screen">
      <ApproverPortalNav activeItem={activeItem} title="Official Approver Portal - ZIFA Queue" />

      <main class="min-h-screen">
        <div class="pt-28 px-8 pb-12">
          <section class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <button
              class={getSummaryCardClasses(selectedStatus.value === "all", "border-b-2 border-emerald-900/10")}
              type="button"
              onClick$={() => {
                selectedStatus.value = "all";
              }}
            >
              <p class="text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Total Assigned</p>
              <p class="text-3xl font-headline font-extrabold text-primary">{APPLICATIONS.length}</p>
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
              <p class="text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Awaiting Review</p>
              <div class="flex items-baseline gap-2">
                <p class="text-3xl font-headline font-extrabold text-primary">{countForFilter("awaitingReview")}</p>
                <span class="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                  NEW
                </span>
              </div>
            </button>
            <button
              class={getSummaryCardClasses(selectedStatus.value === "underReview", "border-b-2 border-emerald-900/10")}
              type="button"
              onClick$={() => {
                selectedStatus.value = "underReview";
              }}
            >
              <p class="text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Under Review</p>
              <p class="text-3xl font-headline font-extrabold text-primary">{countForFilter("underReview")}</p>
            </button>
            <button
              class={getSummaryCardClasses(selectedStatus.value === "approved", "border-b-2 border-emerald-900/10")}
              type="button"
              onClick$={() => {
                selectedStatus.value = "approved";
              }}
            >
              <p class="text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Approved</p>
              <p class="text-3xl font-headline font-extrabold text-emerald-700">{countForFilter("approved")}</p>
            </button>
            <button
              class={getSummaryCardClasses(selectedStatus.value === "rejected", "border-b-2 border-emerald-900/10")}
              type="button"
              onClick$={() => {
                selectedStatus.value = "rejected";
              }}
            >
              <p class="text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Rejected</p>
              <p class="text-3xl font-headline font-extrabold text-tertiary">{countForFilter("rejected")}</p>
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
              <p class="text-3xl font-headline font-extrabold text-secondary">{countForFilter("infoRequested")}</p>
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
                <p class="text-3xl font-headline font-extrabold text-error">{countForFilter("overdue")}</p>
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
                <select class="bg-surface-container-low border-none rounded-lg text-sm font-medium px-4 py-2 focus:ring-1 focus:ring-primary min-w-[140px]">
                  <option>Event: All</option>
                  <option>AFCON Qualifiers</option>
                  <option>World Cup Prep</option>
                  <option>Local League</option>
                </select>
                <select class="bg-surface-container-low border-none rounded-lg text-sm font-medium px-4 py-2 focus:ring-1 focus:ring-primary min-w-[140px]">
                  <option>Org: All Types</option>
                  <option>Football Club</option>
                  <option>National Team</option>
                  <option>NGO / Sponsor</option>
                </select>
              </div>
              <div class="flex items-center gap-2">
                <button class="p-2 text-outline hover:bg-surface-container-high rounded-lg transition-colors" type="button">
                  <span class="material-symbols-outlined">filter_list</span>
                </button>
                <button class="p-2 text-outline hover:bg-surface-container-high rounded-lg transition-colors" type="button">
                  <span class="material-symbols-outlined">download</span>
                </button>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-surface-container-low">
                    <th class="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-outline">Ref Number</th>
                    <th class="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-outline">Organization</th>
                    <th class="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-outline">Event / Dest</th>
                    <th class="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-outline">Queue Entry</th>
                    <th class="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-outline text-center">Aging</th>
                    <th class="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-outline">
                      Verification Status
                    </th>
                    <th class="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-outline">Assignee</th>
                    <th class="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-outline">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/10">
                  {visibleApplications.map((application) => (
                    <tr key={application.ref} class="hover:bg-surface-container-low transition-colors group">
                      <td class="px-6 py-5">
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-mono font-bold text-primary">{application.ref}</span>
                          <span
                            class={
                              application.priority === "URGENT"
                                ? "bg-tertiary/10 text-tertiary text-[9px] font-black px-1.5 py-0.5 rounded"
                                : "bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded"
                            }
                          >
                            {application.priority}
                          </span>
                          <span class={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getStatusPillClasses(application.status)}`}>
                            {getStatusLabel(application.status)}
                          </span>
                        </div>
                      </td>
                      <td class="px-6 py-5">
                        <div class="flex flex-col">
                          <span class="font-bold text-on-surface text-sm">{application.organization}</span>
                          <span class="text-xs text-outline">{application.organizationType}</span>
                        </div>
                      </td>
                      <td class="px-6 py-5">
                        <div class="flex flex-col">
                          <span class="text-sm font-medium">{application.event}</span>
                          <div class="flex items-center gap-1 text-xs text-outline">
                            <span class="material-symbols-outlined text-xs">location_on</span>
                            {application.destination}
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-5 text-sm text-outline">{application.queueEntry}</td>
                      <td class="px-6 py-5 text-center">
                        <div
                          class={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${getAgingClasses(
                            application.agingTone,
                          )}`}
                        >
                          {application.aging}
                        </div>
                      </td>
                      <td class="px-6 py-5">
                        <div class="space-y-1.5">
                          {application.verifications.map((verification) => {
                            const styles = getVerificationClasses(verification.tone);

                            return (
                              <div key={verification.label} class="flex items-center gap-2">
                                <span class="text-[10px] font-bold text-outline w-16">{verification.label}</span>
                                <div class="h-1.5 w-16 bg-surface-container-highest rounded-full overflow-hidden">
                                  <div class={`h-full ${styles.bar} ${verification.widthClass}`} />
                                </div>
                                <span class={`text-[9px] font-bold ${styles.text}`}>{verification.value}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td class="px-6 py-5">
                        {application.assignee ? (
                          <div class="flex items-center gap-2">
                            <div
                              class={
                                application.assignee.tone === "secondary"
                                  ? "w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-[10px] font-bold"
                                  : "w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold"
                              }
                            >
                              {application.assignee.initials}
                            </div>
                            <span class="text-xs font-medium">{application.assignee.name}</span>
                          </div>
                        ) : (
                          <button class="text-xs font-bold text-primary flex items-center gap-1 hover:underline" type="button">
                            <span class="material-symbols-outlined text-sm">person_add</span>
                            Assign to Me
                          </button>
                        )}
                      </td>
                      <td class="px-6 py-5">
                        <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a class="bg-primary text-white text-[11px] font-bold px-3 py-1.5 rounded-md" href={getActionHref(application)}>
                            {getActionLabel(application)}
                          </a>
                          <button class="bg-surface-container-highest text-outline p-1.5 rounded-md" type="button">
                            <span class="material-symbols-outlined text-sm">more_vert</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visibleApplications.length === 0 ? (
                    <tr>
                      <td class="px-6 py-12 text-center text-sm text-outline" colSpan={8}>
                        No applications match the selected status filter.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div class="p-6 bg-surface-container-low flex items-center justify-between">
              <span class="text-xs text-outline font-medium">
                Showing {visibleApplications.length} of {APPLICATIONS.length} applications for {getFilterLabel(selectedStatus.value)}
              </span>
              <div class="flex items-center gap-2">
                <button
                  class="p-2 border border-outline-variant/30 rounded-md hover:bg-white transition-colors disabled:opacity-50"
                  disabled
                  type="button"
                >
                  <span class="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button class="w-8 h-8 flex items-center justify-center bg-primary text-white text-xs font-bold rounded-md" type="button">
                  1
                </button>
                <button class="w-8 h-8 flex items-center justify-center text-xs font-bold rounded-md hover:bg-white" type="button">
                  2
                </button>
                <button class="w-8 h-8 flex items-center justify-center text-xs font-bold rounded-md hover:bg-white" type="button">
                  3
                </button>
                <button
                  class="p-2 border border-outline-variant/30 rounded-md hover:bg-white transition-colors"
                  type="button"
                >
                  <span class="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div class="lg:col-span-2 bg-surface-container-lowest p-6 rounded-xl shadow-sm">
              <h3 class="font-headline font-bold text-primary mb-6 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">analytics</span>
                Review Capacity Metrics
              </h3>
              <div class="h-48 flex items-end justify-between gap-4 px-4">
                {[
                  { day: "MON", height: "h-32", fill: "h-3/4" },
                  { day: "TUE", height: "h-28", fill: "h-1/2" },
                  { day: "WED", height: "h-40", fill: "h-full" },
                  { day: "THU", height: "h-36", fill: "h-4/5" },
                  { day: "FRI", height: "h-24", fill: "h-1/4" },
                ].map((bar) => (
                  <div key={bar.day} class="flex flex-col items-center gap-2 w-full">
                    <div class={`w-full bg-primary/10 rounded-t-md ${bar.height} relative group`}>
                      <div class={`absolute bottom-0 w-full bg-primary/40 rounded-t-md ${bar.fill}`} />
                    </div>
                    <span class="text-[10px] font-bold text-outline">{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div class="bg-primary text-white p-8 rounded-xl relative overflow-hidden flex flex-col justify-between">
              <div class="absolute -right-4 -top-4 w-32 h-32 bg-emerald-900/50 rounded-full blur-3xl" />
              <div>
                <span class="text-[10px] font-black tracking-[0.2em] opacity-60">SYSTEM STATUS</span>
                <h4 class="text-2xl font-headline font-bold mt-2">All Nodes Verified</h4>
                <p class="text-emerald-100/60 text-sm mt-2 leading-relaxed">
                  External connections to Interpol and Immigration databases are active. Real-time screening
                  enabled.
                </p>
              </div>
              <div class="mt-8">
                <div class="flex items-center gap-3 bg-white/5 p-4 rounded-lg border border-white/10">
                  <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div class="flex flex-col">
                    <span class="text-xs font-bold">API Response Time</span>
                    <span class="text-[10px] opacity-60">124ms - Stable</span>
                  </div>
                </div>
              </div>
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
