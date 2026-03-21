import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { AdminPortalNav } from "~/components/admin-portal-nav";
import {
  COMMON_INFO_REQUESTS,
  REJECTION_REASONS,
  formatAdminDate,
  getApplicantAccountById,
  getApplicantAccountStatusClasses,
  getApplicantAccountStatusLabel,
} from "~/lib/admin-applicant-accounts";

const VERIFICATION_CHECKLIST = [
  "Does the organisation name match the affiliation number?",
  "Is the contact email from a legitimate domain for the claimed organisation?",
  "Is the establishment date plausible for the organisation type and league level?",
  "Are the contact details complete and internally consistent?",
  "Is there any duplicate account with similar details?",
] as const;

const getDuplicateFlagClasses = (severity: "high" | "medium") =>
  severity === "high"
    ? "border-error/30 bg-error-container/50 text-on-error-container"
    : "border-secondary/30 bg-secondary-fixed/30 text-on-secondary-fixed-variant";

export default component$(() => {
  const location = useLocation();
  const accountId = location.params.accountId;
  const account = getApplicantAccountById(accountId);
  const selectedApplicantRole = useSignal("");

  if (!account) {
    return (
      <div class="min-h-screen bg-background text-on-background">
        <AdminPortalNav activeItem="accounts" />

        <main class="min-h-screen pt-20 lg:pl-64">
          <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:p-8">
            <div class="rounded-2xl bg-surface-container-lowest p-8 shadow-sm">
              <h1 class="font-headline text-2xl font-bold text-primary">Applicant account not found</h1>
              <p class="mt-2 text-on-surface-variant">
                The requested review record could not be located. Return to the accounts list and try another
                applicant profile.
              </p>
              <a class="mt-6 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white" href="/admin/accounts/">
                Back to Applicant Accounts
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-background text-on-background">
      <AdminPortalNav activeItem="accounts" />

      <main class="min-h-screen pt-20 lg:pl-64">
        <div class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:p-8">
          <section class="flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <a class="text-xs font-bold uppercase tracking-widest text-secondary hover:underline" href="/admin/accounts/">
                  Back to Applicant Accounts
                </a>
                <h1 class="mt-2 font-headline text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                  {account.organisationName}
                </h1>
                <p class="mt-1 text-sm text-on-surface-variant">
                  View the submitted organisation profile before approving the account and assigning the review
                  body.
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <span
                  class={`rounded-full px-3 py-1 text-[11px] font-bold ${getApplicantAccountStatusClasses(account.status)}`}
                >
                  {getApplicantAccountStatusLabel(account.status)}
                </span>
                <span class="rounded-full bg-surface-container px-3 py-1 text-[11px] font-bold text-on-surface-variant">
                  {account.organisationType}
                </span>
                {typeof account.daysWaiting === "number" ? (
                  <span class="rounded-full bg-secondary-fixed px-3 py-1 text-[11px] font-bold text-on-secondary-fixed-variant">
                    {account.daysWaiting} days waiting
                  </span>
                ) : null}
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div class="rounded-xl bg-surface-container-low p-4">
                <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Date Registered</p>
                <p class="mt-2 text-sm font-semibold">{formatAdminDate(account.registeredAt)}</p>
              </div>
              <div class="rounded-xl bg-surface-container-low p-4">
                <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Profile Submitted</p>
                <p class="mt-2 text-sm font-semibold">{formatAdminDate(account.profileSubmittedAt)}</p>
              </div>
              <div class="rounded-xl bg-surface-container-low p-4">
                <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Province</p>
                <p class="mt-2 text-sm font-semibold">{account.province}</p>
              </div>
              <div class="rounded-xl bg-surface-container-low p-4">
                <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Affiliation Number</p>
                <p class="mt-2 text-sm font-semibold">{account.zifaAffiliationNumber}</p>
              </div>
            </div>
          </section>

          <div class="grid grid-cols-1 gap-8 xl:grid-cols-12">
            <div class="space-y-8 xl:col-span-8">
              <section class="rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
                <h2 class="font-headline text-xl font-bold text-primary">Organisation Details</h2>
                <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Organisation Name</p>
                    <p class="mt-1 text-sm font-semibold">{account.organisationName}</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Organisation Type</p>
                    <p class="mt-1 text-sm font-semibold">{account.organisationType}</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Division / League</p>
                    <p class="mt-1 text-sm font-semibold">{account.divisionOrLeague}</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Establishment Date</p>
                    <p class="mt-1 text-sm font-semibold">{formatAdminDate(account.establishmentDate)}</p>
                  </div>
                  <div class="sm:col-span-2">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-outline">
                      ZIFA Affiliation / Registration Number
                    </p>
                    <p class="mt-1 text-sm font-semibold">{account.zifaAffiliationNumber}</p>
                    <p class="mt-1 text-xs text-secondary">
                      Verify this number externally with ZIFA records if the account details do not fully align.
                    </p>
                  </div>
                  <div class="sm:col-span-2">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Physical Address</p>
                    <p class="mt-1 text-sm font-semibold">{account.physicalAddress}</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Province</p>
                    <p class="mt-1 text-sm font-semibold">{account.province}</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Website</p>
                    <p class="mt-1 text-sm font-semibold">{account.website ?? "Not provided"}</p>
                  </div>
                </div>
              </section>

              <section class="rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
                <h2 class="font-headline text-xl font-bold text-primary">Contact Details</h2>
                <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div class="rounded-xl bg-surface-container-low p-5">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Primary Contact</p>
                    <div class="mt-3 space-y-2 text-sm">
                      <p>
                        <span class="font-bold">Name:</span> {account.primaryContact.name}
                      </p>
                      <p>
                        <span class="font-bold">Role:</span> {account.primaryContact.role}
                      </p>
                      <p>
                        <span class="font-bold">Mobile:</span> {account.primaryContact.mobile}
                      </p>
                      <p>
                        <span class="font-bold">Email:</span> {account.primaryContact.email}
                      </p>
                    </div>
                  </div>

                  <div class="rounded-xl bg-surface-container-low p-5">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Secondary Contact</p>
                    <div class="mt-3 space-y-2 text-sm">
                      <p>
                        <span class="font-bold">Name:</span> {account.secondaryContact?.name ?? "Not provided"}
                      </p>
                      <p>
                        <span class="font-bold">Mobile:</span> {account.secondaryContact?.mobile ?? "Not provided"}
                      </p>
                      <p>
                        <span class="font-bold">Principal / Headmaster:</span> {account.principalName ?? "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section class="rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
                <h2 class="font-headline text-xl font-bold text-primary">Account Details</h2>
                <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Registration Email</p>
                    <p class="mt-1 text-sm font-semibold">{account.registrationEmail}</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Date Account Created</p>
                    <p class="mt-1 text-sm font-semibold">{formatAdminDate(account.registeredAt)}</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Date Profile Submitted</p>
                    <p class="mt-1 text-sm font-semibold">{formatAdminDate(account.profileSubmittedAt)}</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold uppercase tracking-widest text-outline">IP Address</p>
                    <p class="mt-1 text-sm font-semibold">{account.registrationIpAddress}</p>
                  </div>
                  <div class="sm:col-span-2">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Device / Browser</p>
                    <p class="mt-1 text-sm font-semibold">{account.deviceInfo ?? "Not captured"}</p>
                  </div>
                </div>
              </section>

              <section class="rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 class="font-headline text-xl font-bold text-primary">Duplicate Detection</h2>
                  <span class="rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Automatic system checks
                  </span>
                </div>

                <div class="mt-6 space-y-4">
                  {account.duplicateFlags.length > 0 ? (
                    account.duplicateFlags.map((flag) => (
                      <div
                        key={flag.title}
                        class={`rounded-xl border p-4 ${getDuplicateFlagClasses(flag.severity)}`}
                      >
                        <div class="flex items-start gap-3">
                          <span class="material-symbols-outlined">
                            {flag.severity === "high" ? "warning" : "info"}
                          </span>
                          <div>
                            <p class="text-sm font-bold">{flag.title}</p>
                            <p class="mt-1 text-sm">{flag.description}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div class="rounded-xl border border-primary/10 bg-primary/5 p-4 text-sm text-on-surface-variant">
                      No duplicate email, mobile, affiliation number, or close organisation-name conflicts detected.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div class="space-y-8 xl:col-span-4">
              <section class="rounded-2xl bg-[#002b14] p-5 text-white shadow-xl sm:p-8">
                <h2 class="font-headline text-xl font-bold">Verification Checklist</h2>
                <p class="mt-2 text-sm text-emerald-100/70">
                  Use this checklist to guide the review. These prompts are advisory and do not block the system.
                </p>

                <div class="mt-6 space-y-3">
                  {VERIFICATION_CHECKLIST.map((item) => (
                    <label key={item} class="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                      <input class="mt-1 rounded border-white/20 bg-white/5 text-secondary focus:ring-secondary" type="checkbox" />
                      <span class="text-sm">{item}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section class="rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
                <h2 class="font-headline text-xl font-bold text-primary">Approval Assignment</h2>
                <p class="mt-2 text-sm text-on-surface-variant">
                  After reviewing the profile, approve the applicant for system access and assign the correct role.
                </p>

                <div class="mt-6 grid grid-cols-1 gap-4">
                  <div>
                    <label class="mb-2 block text-[10px] font-bold uppercase tracking-widest text-outline">
                      Applicant Role
                    </label>
                    <select
                      class="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-1 focus:ring-primary"
                      value={selectedApplicantRole.value}
                      onChange$={(_, element) => {
                        selectedApplicantRole.value = element.value;
                      }}
                    >
                      <option value="">Select applicant role</option>
                      <option value="Applicant">Applicant</option>
                      <option value="ZIFA">ZIFA</option>
                      <option value="SRC">SRC</option>
                      <option value="Immigration">Immigration</option>
                    </select>
                  </div>
                </div>

                {selectedApplicantRole.value ? (
                  <div class="mt-4 rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm text-on-surface-variant">
                    <p class="font-bold text-primary">Approval Summary</p>
                    <p class="mt-2">
                      Assigned role:
                      <span class="ml-1 font-semibold text-on-surface">
                        {selectedApplicantRole.value || "Not selected"}
                      </span>
                    </p>
                  </div>
                ) : null}

                <textarea
                  class="mt-4 w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-1 focus:ring-primary"
                  placeholder="Add internal notes before approving this applicant..."
                  rows={4}
                />

                <div class="mt-4 grid grid-cols-1 gap-3">
                  <button
                    class="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!selectedApplicantRole.value}
                    type="button"
                  >
                    Approve Applicant And Assign Role
                  </button>
                  <p class="text-xs text-on-surface-variant">
                    Approval activates the account and assigns the selected role.
                  </p>
                </div>
              </section>

              <section class="rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
                <h2 class="font-headline text-xl font-bold text-primary">Other Admin Actions</h2>
                <div class="mt-6 space-y-4">
                  <div class="rounded-xl border border-error/20 bg-error-container/30 p-4">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-on-error-container">Reject Account</p>
                    <div class="mt-4 space-y-4">
                      <select class="w-full rounded-xl border-none bg-white px-4 py-3 text-sm focus:ring-1 focus:ring-error">
                        <option selected disabled>
                          Select rejection reason
                        </option>
                        {REJECTION_REASONS.map((reason) => (
                          <option key={reason}>{reason}</option>
                        ))}
                      </select>
                      <textarea
                        class="w-full rounded-xl border-none bg-white px-4 py-3 text-sm focus:ring-1 focus:ring-error"
                        placeholder="Explain why this registration is being rejected..."
                        rows={3}
                      />
                      <button
                        class="w-full rounded-xl bg-error px-4 py-3 text-sm font-bold text-white"
                        type="button"
                      >
                        Reject Account
                      </button>
                    </div>
                  </div>

                  <div class="rounded-xl border border-secondary/20 bg-secondary-fixed/20 p-4">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-on-secondary-fixed-variant">
                      Request More Information
                    </p>
                    <div class="mt-4 space-y-3">
                      {COMMON_INFO_REQUESTS.map((request) => (
                        <label
                          key={request}
                          class="flex items-start gap-3 rounded-xl bg-white px-4 py-3 text-sm"
                        >
                          <input class="mt-1 rounded text-secondary focus:ring-secondary" type="checkbox" />
                          <span>{request}</span>
                        </label>
                      ))}
                      <textarea
                        class="w-full rounded-xl border-none bg-white px-4 py-3 text-sm focus:ring-1 focus:ring-primary"
                        placeholder="Add custom information requests or clarification notes..."
                        rows={3}
                      />
                      <button
                        class="w-full rounded-xl bg-secondary-container px-4 py-3 text-sm font-bold text-on-secondary-container"
                        type="button"
                      >
                        Send Information Request
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Applicant Account Review",
};
