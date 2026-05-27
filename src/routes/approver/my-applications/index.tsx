import { component$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ApproverPortalNav } from "~/components/approver-portal-nav";
import { listApplications, type ApiApplication } from "~/lib/applications-api";
import { applicantFacingStatusLabel } from "~/lib/application-display";
import { getCurrentUser } from "~/lib/auth";
import { getOrganisationRowLabelsByIds } from "~/lib/organisations-api";

type ApplicationStatus = "pending" | "approved" | "rejected" | "draft";
type StatusFilter = "all" | ApplicationStatus;

type ApplicationRecord = {
  id: string;
  ref: string;
  title: string;
  country: string;
  travelDates: string;
  submitted: string;
  status: ApplicationStatus;
  statusLabel: string;
};

function normalizeApplicationStatus(raw: string | undefined): ApplicationStatus {
  const s = (raw ?? "").toLowerCase().replace(/\s+/g, "_");
  if (s === "approved" || s === "certificate_issued") return "approved";
  if (s === "rejected") return "rejected";
  if (s === "draft") return "draft";
  return "pending";
}

function applicationStatusLabelFromApi(a: ApiApplication): string {
  const s = (a.status ?? "").toLowerCase();
  if (s === "draft") return "Draft";
  if (s === "approved") return "Approved";
  if (s === "certificate_issued") return "Certificate issued";
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
  };
}

const FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "draft", label: "Drafts" },
];

export default component$(() => {
  const selectedStatus = useSignal<StatusFilter>("all");
  const applications = useStore<ApplicationRecord[]>([]);
  const listLoading = useSignal(true);
  const listError = useSignal<string | null>(null);
  const organisationName = useSignal<string>("—");

  useVisibleTask$(async () => {
    const u = getCurrentUser();
    const orgId = String(u?.organisation_id ?? "").trim();
    if (!u?.id) {
      listLoading.value = false;
      listError.value = "You must be signed in.";
      return;
    }
    if (!orgId) {
      listLoading.value = false;
      listError.value = "No organisation is linked to your account.";
      return;
    }

    const lr = await listApplications({ limit: 200, offset: 0 });
    listLoading.value = false;
    if (!lr.ok) {
      listError.value = lr.error;
      return;
    }

    const orgRows = await getOrganisationRowLabelsByIds([orgId]);
    organisationName.value = orgRows.get(orgId)?.name ?? "—";

    applications.length = 0;
    for (const row of lr.data) {
      if (String(row.organisation_id ?? "").trim() !== orgId) continue;
      applications.push(apiApplicationToRecord(row));
    }
  });

  const visibleApplications =
    selectedStatus.value === "all"
      ? applications
      : applications.filter((app) => app.status === selectedStatus.value);

  return (
    <div class="min-h-screen flex flex-col bg-surface font-body text-on-surface">
      <ApproverPortalNav activeItem="myApplications" title="My applications" />
      <main class="min-h-screen pt-20 lg:pl-64">
        <div class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:p-8">
          <section class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 class="font-headline text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                My applications
              </h2>
              <p class="mt-1 text-sm text-on-surface-variant">
                Applications created under <span class="font-semibold text-on-surface">{organisationName.value}</span>
              </p>
            </div>
            <a
              class="w-fit rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
              href="/approver/applications/new/"
            >
              Create application
            </a>
          </section>

          <section class="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                class={
                  selectedStatus.value === f.key
                    ? "rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white"
                    : "rounded-xl bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest"
                }
                onClick$={() => {
                  selectedStatus.value = f.key;
                }}
              >
                {f.label}
              </button>
            ))}
          </section>

          {listLoading.value ? (
            <p class="text-on-surface-variant">Loading…</p>
          ) : listError.value ? (
            <div class="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
              {listError.value}
            </div>
          ) : visibleApplications.length === 0 ? (
            <div class="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-6 py-10 text-center">
              <p class="text-on-surface-variant">No applications found.</p>
            </div>
          ) : (
            <section class="overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
              <div class="grid grid-cols-12 gap-4 border-b border-outline-variant/15 bg-surface-container-low px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-outline">
                <div class="col-span-2">Ref</div>
                <div class="col-span-4">Event</div>
                <div class="col-span-2">Country</div>
                <div class="col-span-2">Dates</div>
                <div class="col-span-2">Status</div>
              </div>
              <div class="divide-y divide-outline-variant/10">
                {visibleApplications.map((a) => (
                  <a
                    key={a.id}
                    class="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors"
                    href={`/approver/processing/?id=${a.id}`}
                  >
                    <div class="col-span-2 font-mono text-xs text-on-surface">{a.ref}</div>
                    <div class="col-span-4 font-semibold text-primary">{a.title}</div>
                    <div class="col-span-2 text-sm text-on-surface-variant">{a.country}</div>
                    <div class="col-span-2 text-sm text-on-surface-variant">{a.travelDates}</div>
                    <div class="col-span-2 text-sm font-semibold text-on-surface">{a.statusLabel}</div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "My applications | Approver",
};

