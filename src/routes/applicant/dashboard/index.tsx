import { component$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ApplicantPortalNav } from "~/components/applicant-portal-nav";
import { listApplications, type ApiApplication } from "~/lib/applications-api";
import { applicantFacingStatusLabel } from "~/lib/application-display";
import { getCurrentUser } from "~/lib/auth";
import { getOrganisationForUser } from "~/lib/organisations-api";

type ApplicationStatus = "pending" | "approved" | "rejected" | "draft";
type StatusFilter = "all" | ApplicationStatus;

type StakeholderStatus = {
  name: string;
  state: "approved" | "pending" | "rejected" | "draft";
};

type ApplicationRecord = {
  id: string;
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

function normalizeApplicationStatus(raw: string | undefined): ApplicationStatus {
  const s = (raw ?? "").toLowerCase().replace(/\s+/g, "_");
  if (s === "approved") return "approved";
  if (s === "rejected") return "rejected";
  if (s === "draft") return "draft";
  return "pending";
}

function applicationStatusLabelFromApi(a: ApiApplication): string {
  const s = (a.status ?? "").toLowerCase();
  if (s === "draft") return "Draft";
  if (s === "approved") return "Approved";
  if (s === "rejected") return "Not approved";
  return applicantFacingStatusLabel(a.status);
}

function formatTravelDates(dep?: string, ret?: string): string {
  const d = dep?.slice(0, 10) ?? "—";
  const r = ret?.slice(0, 10) ?? "—";
  return `${d} – ${r}`;
}

function formatSubmittedAt(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function apiApplicationToRecord(a: ApiApplication): ApplicationRecord {
  const status = normalizeApplicationStatus(a.status);
  const ref = String(a.reference_number ?? a.id).trim();
  return {
    id: a.id,
    ref,
    title: (a.event_display_name ?? "Travel application").trim() || "Travel application",
    country: (a.host_country ?? "—").trim() || "—",
    travelDates: formatTravelDates(a.departure_date, a.return_date),
    submitted: formatSubmittedAt(a.created_at),
    status,
    statusLabel: applicationStatusLabelFromApi(a),
    extraBadge: undefined,
    stakeholders: [],
  };
}

const FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "Total Records" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "draft", label: "Drafts" },
];

function countByStatus(list: ApplicationRecord[], status: StatusFilter) {
  if (status === "all") return list.length;
  return list.filter((app) => app.status === status).length;
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
  const submittedFlash = useSignal(false);
  const applications = useStore<ApplicationRecord[]>([]);
  const listLoading = useSignal(true);
  const listError = useSignal<string | null>(null);

  useVisibleTask$(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("submitted") === "1") {
      submittedFlash.value = true;
      sp.delete("submitted");
      const qs = sp.toString();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash,
      );
    }
  });

  useVisibleTask$(async () => {
    const u = getCurrentUser();
    if (!u?.id) {
      listLoading.value = false;
      return;
    }
    const orgR = await getOrganisationForUser(u.id);
    if (orgR.ok && !orgR.organisation) {
      window.location.assign("/applicant/organization-profile/?onboarding=1");
      return;
    }
    const lr = await listApplications({ limit: 50, offset: 0 });
    listLoading.value = false;
    if (!lr.ok) {
      listError.value = lr.error;
      return;
    }
    applications.length = 0;
    for (const row of lr.data) {
      applications.push(apiApplicationToRecord(row));
    }
  });

  const visibleApplications =
    selectedStatus.value === "all"
      ? applications
      : applications.filter((app) => app.status === selectedStatus.value);

  const hasApplications = applications.length > 0;

  return (
    <div class="min-h-screen flex flex-col bg-surface font-body text-on-surface great-enclosure-texture">
      <ApplicantPortalNav activeItem="dashboard" />

      <div class="max-w-7xl mx-auto p-10 w-full flex-1">
        {/* Main Content Canvas */}
        <main class="space-y-10">
          {submittedFlash.value ? (
            <div
              class="rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm text-primary"
              role="status"
              aria-live="polite"
            >
              <div class="flex items-start gap-3">
                <span class="material-symbols-outlined shrink-0 text-xl" style="font-variation-settings: 'FILL' 1;">
                  check_circle
                </span>
                <p class="leading-relaxed font-medium">
                  Your application was submitted successfully. It should appear in Recent Applications below.
                </p>
              </div>
            </div>
          ) : null}

          {/* Welcome Editorial */}
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/15 pb-8">
            <div>
              <h1 class="font-headline text-5xl font-extrabold tracking-tighter text-primary">Travel Dashboard</h1>
              <p class="text-on-surface-variant text-lg mt-2 font-medium">Manage and track official football delegation clearances.</p>
            </div>

            <a
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-container-high rounded-full shadow-sm hover:bg-surface-container-highest transition-colors text-sm font-bold text-primary"
              href="/applicant/"
            >
              <span class="material-symbols-outlined text-lg">add_circle</span>
              <span class="text-xs font-bold uppercase tracking-wider">New application</span>
            </a>
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
                <span class="text-4xl font-headline font-extrabold">{countByStatus(applications, filter.key)}</span>
                <span class="text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-80">
                  {filter.label}
                </span>
              </button>
            ))}
          </div>

          {/* Applications Canvas */}
          <div id="applications" class="space-y-6 scroll-mt-28">
            <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h2 class="font-headline text-3xl font-extrabold text-primary tracking-tight">Recent Applications</h2>
            </div>

            {listError.value ? (
              <div class="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error" role="alert">
                {listError.value}
              </div>
            ) : null}

            {listLoading.value ? (
              <p class="text-on-surface-variant">Loading applications…</p>
            ) : null}

            {!listLoading.value && !listError.value && hasApplications
              ? visibleApplications.map((app) => (
                  <div
                    key={app.id}
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

                      {app.stakeholders.length > 0 ? (
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
                      ) : null}

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
                          href={`/applicant/application/${app.id}/`}
                          aria-label="View or edit application"
                        >
                          chevron_right
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              : null}

            {!listLoading.value && !listError.value && visibleApplications.length === 0 ? (
              <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-10 text-center">
                <p class="text-lg font-headline font-bold text-primary">
                  {hasApplications ? "No applications match this status." : "No applications yet."}
                </p>
                <p class="mt-2 text-sm text-on-surface-variant max-w-md mx-auto">
                  {hasApplications
                    ? "Select a different filter to view more records."
                    : "When you submit travel authorization requests, they will appear here. Start a new application to begin."}
                </p>
                {!hasApplications ? (
                  <a
                    class="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/20 hover:opacity-95"
                    href="/applicant/"
                  >
                    <span class="material-symbols-outlined text-base">edit_document</span>
                    Start an application
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </main>
      </div>

      {/* Floating action — new application */}
      <div class="fixed bottom-10 right-10 flex flex-col gap-4 z-40">
        <a
          class="bg-[#fdd000] text-[#6e5900] w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group overflow-hidden border-4 border-white"
          href="/applicant/"
          aria-label="New application"
        >
          <span class="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform">add</span>
        </a>
      </div>

      <footer class="mt-auto bg-emerald-950 w-full shrink-0 py-12 px-8">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="text-lg font-bold text-white font-headline">
            Zimbabwe Sports Travel Authority
          </div>
          <div class="flex flex-wrap justify-center gap-8 font-body text-sm antialiased">
            <a class="text-emerald-200/60 hover:text-amber-400 transition-colors" href="#">
              Privacy Policy
            </a>
            <a class="text-emerald-200/60 hover:text-amber-400 transition-colors" href="#">
              Terms of Service
            </a>
          </div>
          <div class="text-emerald-200/60 font-body text-sm antialiased opacity-80 hover:opacity-100 transition-opacity">
            © 2026 Soxfort Solutions
          </div>
        </div>
      </footer>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Applicant Dashboard",
};
