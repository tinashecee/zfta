import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ApplicantPortalNav } from "~/components/applicant-portal-nav";

type ApplicationStatus = "pending" | "approved" | "rejected" | "draft";
type StatusFilter = "all" | ApplicationStatus;

type StakeholderStatus = {
  name: string;
  state: "approved" | "pending" | "rejected" | "draft";
};

type ApplicationRecord = {
  ref: string;
  title: string;
  country: string;
  travelDates: string;
  submitted: string;
  status: ApplicationStatus;
  statusLabel: string;
  extraBadge?: string;
  stakeholders: StakeholderStatus[];
};

const APPLICATIONS: ApplicationRecord[] = [
  {
    ref: "ZTA-2025-0042",
    title: "Dynamos FC • AFCON Qualification",
    country: "South Africa",
    travelDates: "12 Mar - 20 Mar 2025",
    submitted: "10 Feb",
    status: "pending",
    statusLabel: "Under Review",
    stakeholders: [
      { name: "ZIFA", state: "approved" },
      { name: "SRC", state: "pending" },
      { name: "Immigration", state: "pending" },
    ],
  },
  {
    ref: "ZTA-2025-0038",
    title: "Dynamos FC • Friendly Match",
    country: "Botswana",
    travelDates: "05 Mar - 08 Mar 2025",
    submitted: "01 Feb",
    status: "approved",
    statusLabel: "Approved",
    extraBadge: "Certificate Ready",
    stakeholders: [
      { name: "ZIFA", state: "approved" },
      { name: "SRC", state: "approved" },
      { name: "Immigration", state: "approved" },
    ],
  },
  {
    ref: "ZTA-2025-0031",
    title: "Dynamos FC • Regional Playoffs",
    country: "Zambia",
    travelDates: "22 Feb - 27 Feb 2025",
    submitted: "29 Jan",
    status: "rejected",
    statusLabel: "Rejected",
    stakeholders: [
      { name: "ZIFA", state: "approved" },
      { name: "SRC", state: "rejected" },
      { name: "Immigration", state: "draft" },
    ],
  },
  {
    ref: "ZTA-2025-0050",
    title: "Dynamos FC • Youth Invitational",
    country: "Namibia",
    travelDates: "03 Apr - 09 Apr 2025",
    submitted: "Draft",
    status: "draft",
    statusLabel: "Draft",
    stakeholders: [
      { name: "ZIFA", state: "draft" },
      { name: "SRC", state: "draft" },
      { name: "Immigration", state: "draft" },
    ],
  },
];

const FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "Total Records" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "draft", label: "Drafts" },
];

function countByStatus(status: StatusFilter) {
  if (status === "all") return APPLICATIONS.length;
  return APPLICATIONS.filter((app) => app.status === status).length;
}

function getFilterButtonClasses(filter: StatusFilter, active: StatusFilter) {
  const isActive = filter === active;
  const base =
    "flex flex-col items-start p-6 rounded-2xl transition-all text-left border ";

  if (filter === "all") {
    return isActive
      ? `${base}bg-[#002b14] text-white border-[#002b14] shadow-2xl scale-[1.02]`
      : `${base}bg-surface-container-lowest text-primary border-outline-variant/20 hover:bg-primary/5`;
  }

  if (filter === "pending") {
    return isActive
      ? `${base}bg-secondary-fixed text-on-secondary-fixed-variant border-secondary-fixed shadow-lg`
      : `${base}bg-surface-container-lowest text-secondary border-outline-variant/20 hover:bg-secondary-fixed-dim/10`;
  }

  if (filter === "approved") {
    return isActive
      ? `${base}bg-primary-fixed text-on-primary-fixed-variant border-primary-fixed shadow-lg`
      : `${base}bg-surface-container-lowest text-on-primary-fixed-variant border-outline-variant/20 hover:bg-primary-fixed/20`;
  }

  if (filter === "rejected") {
    return isActive
      ? `${base}bg-error-container text-on-error-container border-error-container shadow-lg`
      : `${base}bg-surface-container-lowest text-error border-outline-variant/20 hover:bg-error-container/20`;
  }

  return isActive
    ? `${base}bg-surface-container-high text-on-surface border-outline-variant shadow-lg`
    : `${base}bg-surface-container-lowest text-outline border-outline-variant/20 hover:bg-surface-container-high`;
}

function getStatusPillClasses(status: ApplicationStatus) {
  if (status === "approved") {
    return "bg-primary-fixed text-on-primary-fixed-variant";
  }
  if (status === "rejected") {
    return "bg-error-container text-on-error-container";
  }
  if (status === "draft") {
    return "bg-surface-container-high text-on-surface-variant";
  }
  return "bg-secondary-fixed text-on-secondary-fixed-variant";
}

function getStakeholderBadgeClasses(state: StakeholderStatus["state"]) {
  if (state === "approved") {
    return "bg-primary-fixed text-on-primary-fixed-variant";
  }
  if (state === "rejected") {
    return "bg-error-container text-on-error-container";
  }
  if (state === "draft") {
    return "bg-surface-container-high text-on-surface-variant";
  }
  return "bg-secondary-fixed text-on-secondary-fixed-variant";
}

function getStakeholderLabel(state: StakeholderStatus["state"]) {
  if (state === "approved") return "Approved";
  if (state === "rejected") return "Rejected";
  if (state === "draft") return "Draft";
  return "Pending";
}

export default component$(() => {
  const selectedStatus = useSignal<StatusFilter>("all");
  const visibleApplications =
    selectedStatus.value === "all"
      ? APPLICATIONS
      : APPLICATIONS.filter((app) => app.status === selectedStatus.value);

  return (
    <div class="bg-surface font-body text-on-surface min-h-screen great-enclosure-texture">
      <ApplicantPortalNav activeItem="dashboard" />

      <div class="max-w-7xl mx-auto p-10">
        {/* Main Content Canvas */}
        <main class="space-y-10">
          {/* Welcome Editorial */}
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/15 pb-8">
            <div>
              <h1 class="font-headline text-5xl font-extrabold tracking-tighter text-primary">Travel Dashboard</h1>
              <p class="text-on-surface-variant text-lg mt-2 font-medium">Manage and track official football delegation clearances.</p>
            </div>

            <div class="flex gap-2">
              <div class="px-5 py-2.5 bg-surface-container-high rounded-full flex items-center gap-3 shadow-sm">
                <span class="material-symbols-outlined text-lg">schedule</span>
                <span class="text-xs font-bold uppercase tracking-wider">Next Window: Mar 2025</span>
              </div>
            </div>
          </div>

          {/* Summary Filter Bento */}
          <div class="grid grid-cols-2 md:grid-cols-5 gap-6">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                class={getFilterButtonClasses(filter.key, selectedStatus.value)}
                type="button"
                onClick$={() => {
                  selectedStatus.value = filter.key;
                }}
              >
                <span class="text-4xl font-headline font-extrabold">{countByStatus(filter.key)}</span>
                <span class="text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-80">
                  {filter.label}
                </span>
              </button>
            ))}
          </div>

          {/* Applications Canvas */}
          <div id="applications" class="space-y-6 scroll-mt-28">
            <div class="flex justify-between items-center mb-6">
              <h2 class="font-headline text-3xl font-extrabold text-primary tracking-tight">Recent Applications</h2>
              <div class="flex gap-4">
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                  <input
                    class="pl-12 pr-6 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 w-72 transition-all"
                    placeholder="Search by Ref or Team..."
                    type="text"
                  />
                </div>
                <button class="material-symbols-outlined bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 hover:bg-surface-container-high transition-colors" type="button">
                  filter_list
                </button>
              </div>
            </div>

            {visibleApplications.map((app) => (
              <div
                key={app.ref}
                class="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/20 hover:shadow-xl hover:border-primary/20 transition-all group"
              >
                <div class="flex flex-col xl:flex-row gap-8">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-4 flex-wrap">
                      <span class="text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 bg-surface-container-high text-on-surface-variant rounded-md">
                        Ref: {app.ref}
                      </span>

                      <div
                        class={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${getStatusPillClasses(
                          app.status,
                        )}`}
                      >
                        {app.status === "pending" ? <span class="w-2 h-2 rounded-full bg-secondary animate-pulse" /> : null}
                        {app.status === "approved" ? (
                          <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">
                            check_circle
                          </span>
                        ) : null}
                        {app.statusLabel}
                      </div>

                      {app.extraBadge ? (
                        <div class="bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-white/20">
                          {app.extraBadge}
                        </div>
                      ) : null}
                    </div>

                    <h3 class="font-headline text-2xl font-extrabold text-primary mb-5">{app.title}</h3>

                    <div class="flex flex-wrap gap-8">
                      <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-secondary text-xl">location_on</span>
                        <span class="text-sm font-semibold text-on-surface">{app.country}</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-secondary text-xl">calendar_today</span>
                        <span class="text-sm font-semibold text-on-surface">{app.travelDates}</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-outline text-xl">history</span>
                        <span class="text-sm text-on-surface-variant italic font-medium">Submitted: {app.submitted}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    class={`xl:w-80 flex flex-col justify-center gap-4 p-6 rounded-2xl border ${
                      app.status === "approved"
                        ? "bg-primary-fixed/10 border-primary-fixed/20"
                        : "bg-surface-container-low/50 border-outline-variant/10"
                    }`}
                  >
                    <span class="text-[10px] font-black text-outline uppercase tracking-[0.2em]">
                      Stakeholder Clearance
                    </span>
                    <div class="space-y-3">
                      {app.stakeholders.map((stakeholder) => (
                        <div key={stakeholder.name} class="flex justify-between items-center text-xs">
                          <span
                            class={
                              app.status === "approved"
                                ? "font-bold text-on-primary-fixed-variant"
                                : "font-bold text-on-surface-variant"
                            }
                          >
                            {stakeholder.name}
                          </span>
                          <span
                            class={`px-3 py-1 rounded font-black text-[10px] uppercase ${getStakeholderBadgeClasses(
                              stakeholder.state,
                            )}`}
                          >
                            {getStakeholderLabel(stakeholder.state)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div class="flex items-center gap-6">
                    {app.status === "approved" ? (
                      <button
                        class="bg-primary text-white w-14 h-14 rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-primary/20"
                        type="button"
                      >
                        <span class="material-symbols-outlined text-2xl">download</span>
                      </button>
                    ) : null}

                    <a
                      class="material-symbols-outlined text-outline group-hover:text-primary group-hover:translate-x-2 transition-all duration-300 text-3xl"
                      href="/applicant/timeline/"
                    >
                      chevron_right
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {visibleApplications.length === 0 ? (
              <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-10 text-center">
                <p class="text-lg font-headline font-bold text-primary">No applications match this status.</p>
                <p class="mt-2 text-sm text-on-surface-variant">
                  Select a different filter to view more application records.
                </p>
              </div>
            ) : null}
          </div>

          {/* Empty State / More Section (Optional for depth) */}
          <div class="mt-12 flex justify-center">
            <button class="text-sm font-black text-on-surface-variant hover:text-primary transition-all uppercase tracking-widest border-b-2 border-transparent hover:border-primary pb-2 flex items-center gap-2" type="button">
              View All Travel History
              <span class="material-symbols-outlined text-sm">trending_flat</span>
            </button>
          </div>
        </main>
      </div>

      {/* Floating Action for Mobile/Context */}
      <div class="fixed bottom-10 right-10 flex flex-col gap-4">
        <button
          class="bg-[#fdd000] text-[#6e5900] w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group overflow-hidden border-4 border-white"
          type="button"
        >
          <span class="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform">add</span>
        </button>
      </div>

      {/* Footer Identity */}
      <footer class="mt-20 py-16 px-10 border-t border-outline-variant/15 flex flex-col md:flex-row justify-between items-center gap-10 opacity-60 grayscale hover:grayscale-0 transition-all duration-500 bg-surface-container-lowest">
        <div class="flex items-center gap-4">
          <span class="text-primary font-black uppercase tracking-[0.3em] text-xs">Official Portal</span>
          <div class="h-0.5 w-12 bg-secondary" />
        </div>
        <div class="flex flex-wrap justify-center gap-12 text-[10px] font-black uppercase tracking-widest">
          <a class="hover:text-primary transition-colors" href="#">
            Privacy Policy
          </a>
          <a class="hover:text-primary transition-colors" href="#">
            Terms of Service
          </a>
          <a class="hover:text-primary transition-colors" href="#">
            Digital Signature Verification
          </a>
        </div>
        <p class="text-[10px] font-bold text-on-surface-variant tracking-wider">
          © 2025 Zimbabwe Football Travel Authority. All rights reserved.
        </p>
      </footer>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Applicant Dashboard",
};

