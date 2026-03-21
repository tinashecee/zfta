import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AdminPortalNav } from "~/components/admin-portal-nav";
import {
  ADMIN_APPLICANT_ACCOUNTS,
  ORGANISATION_TYPES,
  PROVINCES,
  formatAdminDate,
  getApplicantAccountStatusClasses,
  getApplicantAccountStatusLabel,
  type ApplicantAccountRecord,
  type ApplicantAccountStatus,
  type ApplicantOrganisationType,
  type ApplicantProvince,
} from "~/lib/admin-applicant-accounts";

type StatusFilter = "all" | ApplicantAccountStatus;
type DateMode = "registered" | "submitted";
type SortOption = "daysWaiting" | "organisationName" | "registeredAt";

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "pendingProfile", label: "Pending Profile" },
  { value: "pendingApproval", label: "Pending Approval" },
  { value: "active", label: "Active" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

const getAccountActions = (_account: ApplicantAccountRecord) => ["View Details"] as const;

const getActionClasses = (action: string) => {
  if (action === "View Details") {
    return "bg-primary text-white";
  }

  return "bg-primary text-white";
};

const matchesDateRange = (value: string | undefined, fromDate: string, toDate: string) => {
  if (!fromDate && !toDate) {
    return true;
  }

  if (!value) {
    return false;
  }

  if (fromDate && value < fromDate) {
    return false;
  }

  if (toDate && value > toDate) {
    return false;
  }

  return true;
};

const sortAccounts = (accounts: ApplicantAccountRecord[], sortBy: SortOption) => {
  const items = [...accounts];

  items.sort((left, right) => {
    if (sortBy === "daysWaiting") {
      return (right.daysWaiting ?? -1) - (left.daysWaiting ?? -1);
    }

    if (sortBy === "organisationName") {
      return left.organisationName.localeCompare(right.organisationName);
    }

    return right.registeredAt.localeCompare(left.registeredAt);
  });

  return items;
};

const getVisibleAccounts = (
  status: StatusFilter,
  organisationType: ApplicantOrganisationType | "all",
  province: ApplicantProvince | "all",
  dateMode: DateMode,
  fromDate: string,
  toDate: string,
  searchTerm: string,
  sortBy: SortOption,
) => {
  const query = searchTerm.trim().toLowerCase();

  const filtered = ADMIN_APPLICANT_ACCOUNTS.filter((account) => {
    if (status !== "all" && account.status !== status) {
      return false;
    }

    if (organisationType !== "all" && account.organisationType !== organisationType) {
      return false;
    }

    if (province !== "all" && account.province !== province) {
      return false;
    }

    const dateValue = dateMode === "registered" ? account.registeredAt : account.profileSubmittedAt;
    if (!matchesDateRange(dateValue, fromDate, toDate)) {
      return false;
    }

    if (!query) {
      return true;
    }

    return (
      account.organisationName.toLowerCase().includes(query) ||
      account.primaryContact.email.toLowerCase().includes(query) ||
      account.zifaAffiliationNumber.toLowerCase().includes(query)
    );
  });

  return sortAccounts(filtered, sortBy);
};

export default component$(() => {
  const selectedStatus = useSignal<StatusFilter>("pendingApproval");
  const selectedOrganisationType = useSignal<ApplicantOrganisationType | "all">("all");
  const selectedProvince = useSignal<ApplicantProvince | "all">("all");
  const selectedDateMode = useSignal<DateMode>("submitted");
  const fromDate = useSignal("");
  const toDate = useSignal("");
  const searchTerm = useSignal("");
  const selectedSort = useSignal<SortOption>("daysWaiting");

  const visibleAccounts = getVisibleAccounts(
    selectedStatus.value,
    selectedOrganisationType.value,
    selectedProvince.value,
    selectedDateMode.value,
    fromDate.value,
    toDate.value,
    searchTerm.value,
    selectedSort.value,
  );

  return (
    <div class="min-h-screen bg-background text-on-background">
      <AdminPortalNav activeItem="accounts" />

      <main class="min-h-screen pt-20 lg:pl-64">
        <div class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:p-8">
          <section class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 class="font-headline text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                Applicant Accounts
              </h2>
              <p class="mt-1 max-w-3xl text-sm text-on-surface-variant sm:text-base">
                Review new organisation registrations, verify submitted profiles, and decide whether each
                applicant account should be approved, rejected, or suspended.
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <button
                class="rounded-xl bg-surface-container-highest px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-dim"
                type="button"
              >
                Export Accounts
              </button>
              <button
                class="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                type="button"
                onClick$={() => {
                  selectedStatus.value = "pendingApproval";
                  selectedOrganisationType.value = "all";
                  selectedProvince.value = "all";
                  selectedDateMode.value = "submitted";
                  fromDate.value = "";
                  toDate.value = "";
                  searchTerm.value = "";
                  selectedSort.value = "daysWaiting";
                }}
              >
                Reset View
              </button>
            </div>
          </section>

          <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {STATUS_FILTERS.slice(1).map((filter) => {
              const count = ADMIN_APPLICANT_ACCOUNTS.filter((account) => account.status === filter.value).length;
              const selected = selectedStatus.value === filter.value;

              return (
                <button
                  key={filter.value}
                  class={`rounded-xl border px-5 py-4 text-left shadow-sm transition-colors ${
                    selected
                      ? "border-primary bg-white ring-2 ring-primary/15"
                      : "border-outline-variant/20 bg-surface-container-low hover:bg-white"
                  }`}
                  type="button"
                  onClick$={() => {
                    selectedStatus.value = filter.value;
                  }}
                >
                  <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-outline">{filter.label}</p>
                  <div class="flex items-end justify-between gap-3">
                    <p class="font-headline text-3xl font-extrabold text-primary">{count}</p>
                    <span
                      class={`rounded-full px-2 py-1 text-[10px] font-bold ${getApplicantAccountStatusClasses(filter.value)}`}
                    >
                      {getApplicantAccountStatusLabel(filter.value)}
                    </span>
                  </div>
                </button>
              );
            })}
          </section>

          <section class="rounded-2xl bg-surface-container-lowest shadow-sm">
            <div class="border-b border-outline-variant/15 bg-white p-4 sm:p-6">
              <div class="grid grid-cols-1 gap-4 xl:grid-cols-7">
                <div class="xl:col-span-2">
                  <label class="mb-2 block text-[10px] font-bold uppercase tracking-widest text-outline">
                    Search
                  </label>
                  <input
                    class="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-1 focus:ring-primary"
                    placeholder="Organisation, email, or ZIFA number"
                    type="text"
                    value={searchTerm.value}
                    onInput$={(_, element) => {
                      searchTerm.value = element.value;
                    }}
                  />
                </div>

                <div>
                  <label class="mb-2 block text-[10px] font-bold uppercase tracking-widest text-outline">
                    Status
                  </label>
                  <select
                    class="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-1 focus:ring-primary"
                    value={selectedStatus.value}
                    onChange$={(_, element) => {
                      selectedStatus.value = element.value as StatusFilter;
                    }}
                  >
                    {STATUS_FILTERS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="mb-2 block text-[10px] font-bold uppercase tracking-widest text-outline">
                    Organisation Type
                  </label>
                  <select
                    class="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-1 focus:ring-primary"
                    value={selectedOrganisationType.value}
                    onChange$={(_, element) => {
                      selectedOrganisationType.value = element.value as ApplicantOrganisationType | "all";
                    }}
                  >
                    <option value="all">All types</option>
                    {ORGANISATION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="mb-2 block text-[10px] font-bold uppercase tracking-widest text-outline">
                    Province
                  </label>
                  <select
                    class="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-1 focus:ring-primary"
                    value={selectedProvince.value}
                    onChange$={(_, element) => {
                      selectedProvince.value = element.value as ApplicantProvince | "all";
                    }}
                  >
                    <option value="all">All provinces</option>
                    {PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="mb-2 block text-[10px] font-bold uppercase tracking-widest text-outline">
                    Date Mode
                  </label>
                  <select
                    class="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-1 focus:ring-primary"
                    value={selectedDateMode.value}
                    onChange$={(_, element) => {
                      selectedDateMode.value = element.value as DateMode;
                    }}
                  >
                    <option value="submitted">Profile submitted</option>
                    <option value="registered">Date registered</option>
                  </select>
                </div>

                <div>
                  <label class="mb-2 block text-[10px] font-bold uppercase tracking-widest text-outline">
                    Sort By
                  </label>
                  <select
                    class="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-1 focus:ring-primary"
                    value={selectedSort.value}
                    onChange$={(_, element) => {
                      selectedSort.value = element.value as SortOption;
                    }}
                  >
                    <option value="daysWaiting">Days waiting</option>
                    <option value="organisationName">Organisation name</option>
                    <option value="registeredAt">Date registered</option>
                  </select>
                </div>
              </div>

              <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:w-[28rem]">
                <div>
                  <label class="mb-2 block text-[10px] font-bold uppercase tracking-widest text-outline">
                    From Date
                  </label>
                  <input
                    class="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-1 focus:ring-primary"
                    type="date"
                    value={fromDate.value}
                    onInput$={(_, element) => {
                      fromDate.value = element.value;
                    }}
                  />
                </div>
                <div>
                  <label class="mb-2 block text-[10px] font-bold uppercase tracking-widest text-outline">
                    To Date
                  </label>
                  <input
                    class="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-1 focus:ring-primary"
                    type="date"
                    value={toDate.value}
                    onInput$={(_, element) => {
                      toDate.value = element.value;
                    }}
                  />
                </div>
              </div>
            </div>

            <div class="hidden overflow-x-auto lg:block">
              <table class="min-w-[1200px] w-full border-collapse text-left">
                <thead>
                  <tr class="bg-surface-container-low">
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                      Organisation Name
                    </th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                      Organisation Type
                    </th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                      Primary Contact
                    </th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                      Date Registered
                    </th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                      Profile Submitted
                    </th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                      Account Status
                    </th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">
                      Days Waiting
                    </th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/10">
                  {visibleAccounts.map((account) => (
                    <tr key={account.id} class="group transition-colors hover:bg-surface-container-low">
                      <td class="px-6 py-5">
                        <div class="flex flex-col">
                          <a
                            class="text-sm font-bold text-primary hover:underline"
                            href={`/admin/accounts/${account.id}/`}
                          >
                            {account.organisationName}
                          </a>
                          <span class="text-xs text-outline">{account.zifaAffiliationNumber}</span>
                        </div>
                      </td>
                      <td class="px-6 py-5 text-sm">{account.organisationType}</td>
                      <td class="px-6 py-5">
                        <div class="flex flex-col">
                          <span class="text-sm font-semibold">{account.primaryContact.name}</span>
                          <span class="text-xs text-outline">{account.primaryContact.email}</span>
                        </div>
                      </td>
                      <td class="px-6 py-5 text-sm text-on-surface-variant">{formatAdminDate(account.registeredAt)}</td>
                      <td class="px-6 py-5 text-sm text-on-surface-variant">
                        {formatAdminDate(account.profileSubmittedAt)}
                      </td>
                      <td class="px-6 py-5">
                        <span
                          class={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${getApplicantAccountStatusClasses(account.status)}`}
                        >
                          {getApplicantAccountStatusLabel(account.status)}
                        </span>
                      </td>
                      <td class="px-6 py-5 text-center">
                        {typeof account.daysWaiting === "number" ? (
                          <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary-fixed text-xs font-bold text-on-secondary-fixed-variant">
                            {account.daysWaiting}
                          </span>
                        ) : (
                          <span class="text-xs text-outline">-</span>
                        )}
                      </td>
                      <td class="px-6 py-5">
                        <div class="flex flex-wrap gap-2">
                          {getAccountActions(account).map((action) =>
                            action === "View Details" ? (
                              <a
                                key={action}
                                class={`rounded-lg px-3 py-1.5 text-[11px] font-bold ${getActionClasses(action)}`}
                                href={`/admin/accounts/${account.id}/`}
                              >
                                {action}
                              </a>
                            ) : (
                              <button
                                key={action}
                                class={`rounded-lg px-3 py-1.5 text-[11px] font-bold ${getActionClasses(action)}`}
                                type="button"
                              >
                                {action}
                              </button>
                            ),
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div class="space-y-4 p-4 lg:hidden">
              {visibleAccounts.map((account) => (
                <article key={account.id} class="rounded-xl border border-outline-variant/20 bg-white p-4 shadow-sm">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <a class="text-base font-bold text-primary hover:underline" href={`/admin/accounts/${account.id}/`}>
                        {account.organisationName}
                      </a>
                      <p class="text-xs text-outline">{account.organisationType}</p>
                    </div>
                    <span
                      class={`rounded-full px-3 py-1 text-[10px] font-bold ${getApplicantAccountStatusClasses(account.status)}`}
                    >
                      {getApplicantAccountStatusLabel(account.status)}
                    </span>
                  </div>

                  <div class="mt-4 grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Primary Contact</p>
                      <p class="font-semibold">{account.primaryContact.name}</p>
                      <p class="text-xs text-outline">{account.primaryContact.email}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Registered</p>
                        <p>{formatAdminDate(account.registeredAt)}</p>
                      </div>
                      <div>
                        <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Submitted</p>
                        <p>{formatAdminDate(account.profileSubmittedAt)}</p>
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Province</p>
                        <p>{account.province}</p>
                      </div>
                      <div>
                        <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Days Waiting</p>
                        <p>{typeof account.daysWaiting === "number" ? `${account.daysWaiting} days` : "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div class="mt-4 flex flex-wrap gap-2">
                    {getAccountActions(account).map((action) =>
                      action === "View Details" ? (
                        <a
                          key={action}
                          class={`rounded-lg px-3 py-2 text-[11px] font-bold ${getActionClasses(action)}`}
                          href={`/admin/accounts/${account.id}/`}
                        >
                          {action}
                        </a>
                      ) : (
                        <button
                          key={action}
                          class={`rounded-lg px-3 py-2 text-[11px] font-bold ${getActionClasses(action)}`}
                          type="button"
                        >
                          {action}
                        </button>
                      ),
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div class="flex flex-col gap-3 border-t border-outline-variant/15 bg-surface-container-low px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span class="font-medium text-outline">
                Showing {visibleAccounts.length} of {ADMIN_APPLICANT_ACCOUNTS.length} applicant accounts
              </span>
              <span class="text-xs text-outline">
                Default review order prioritises pending approvals with the oldest waiting profiles first.
              </span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Applicant Accounts",
};
