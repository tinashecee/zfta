import { $, component$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ApproverPortalNav } from "~/components/approver-portal-nav";
import { AttachmentField } from "~/components/application-form/attachment-field";
import { DeclarationSection } from "~/components/application-form/declaration-section";
import { HostingEventBasicsSection } from "~/components/application-form/hosting-event-basics-section";
import { SubmitBar } from "~/components/application-form/submit-bar";
import { APPLICATION_TYPES } from "~/lib/application-types";
import { getCurrentUser } from "~/lib/auth";
import { getOrganisation } from "~/lib/organisations-api";
import { submitTravelApplicationFlow } from "~/lib/submit-travel-application-flow";

export default component$(() => {
  useVisibleTask$(() => {
    const u = getCurrentUser();
    const ab = (u?.approver_body ?? "").trim().toUpperCase();
    const legacy = (u?.body ?? "").trim().toUpperCase();
    const isSportBodyReviewer =
      ab === "SPORTS_BODY" || legacy === "SPORT_BODY" || legacy === "SPORTS_BODY";
    if (!u || u.role !== "reviewer" || !isSportBodyReviewer) {
      window.location.assign("/approver/dashboard/");
    }
  });

  const hostingPlan = useSignal<File | null>(null);
  const budget = useSignal<File | null>(null);
  const funding = useSignal<File | null>(null);
  const rollOut = useSignal<File | null>(null);
  const committee = useSignal<File | null>(null);
  const submitError = useSignal<string | null>(null);
  const submitBusy = useSignal(false);
  const submitProgressMessage = useSignal("");

  const typeDef = APPLICATION_TYPES.hosting_competition;

  const onSubmit$ = $(async (e: Event) => {
    e.preventDefault();
    submitError.value = null;
    submitProgressMessage.value = "";

    const resolved =
      e.currentTarget instanceof HTMLFormElement
        ? e.currentTarget
        : (e.target as Element | null)?.closest?.("form") ?? document.getElementById("hosting-competition-form");
    if (!(resolved instanceof HTMLFormElement)) {
      submitError.value = "Could not read the form.";
      return;
    }

    if (!hostingPlan.value || !budget.value || !funding.value || !rollOut.value || !committee.value) {
      submitError.value = "Please attach all five documents required under 3.1 (hosting plan, budget, funding, roll-out, committee).";
      return;
    }

    const user = getCurrentUser();
    if (!user?.id) {
      submitError.value = "You must be signed in.";
      return;
    }

    const orgId = String(user.organisation_id ?? "").trim();
    if (!orgId) {
      submitError.value = "No organisation profile found for your account.";
      return;
    }
    const orgR = await getOrganisation(orgId);
    if (!orgR.ok) {
      submitError.value = orgR.error;
      return;
    }
    const pslAffiliate = Boolean(
      (orgR.data as unknown as { psl_affiliate?: unknown; pslAffiliate?: unknown; PslAffiliate?: unknown })
        .psl_affiliate ??
        (orgR.data as unknown as { pslAffiliate?: unknown }).pslAffiliate ??
        (orgR.data as unknown as { PslAffiliate?: unknown }).PslAffiliate,
    );
    const organisationSport = String(orgR.data.sport ?? "").trim();
    if (!organisationSport) {
      submitError.value = "Organisation profile must include a sport.";
      return;
    }

    submitBusy.value = true;
    submitProgressMessage.value = "Uploading documents…";

    const result = await submitTravelApplicationFlow({
      form: resolved,
      personnel: [],
      uploads: {
        hosting_plan: hostingPlan.value,
        budget: budget.value,
        funding_proof: funding.value,
        roll_out_plan: rollOut.value,
        organising_committee_composition: committee.value,
      },
      organisationId: orgId,
      organisationSport,
      pslAffiliate,
      applicationType: "hosting_competition",
      minLeadDays: typeDef.minLeadDays,
    });

    submitBusy.value = false;
    if (!result.ok) {
      submitProgressMessage.value = "";
      submitError.value = result.error;
      return;
    }

    submitProgressMessage.value = `Submitted. Reference: ${result.reference}. Redirecting…`;
    await new Promise<void>((r) => setTimeout(r, 2500));
    window.location.assign("/approver/dashboard/?submitted=1");
  });

  return (
    <div class="flex flex-1 flex-col min-h-0 min-w-0 bg-background text-on-background">
      <ApproverPortalNav activeItem="createApplication" title={typeDef.label} />

      <main class="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8 pt-28 w-full">
        <nav class="text-sm text-on-surface-variant mb-4">
          <a class="text-primary font-semibold hover:underline" href="/approver/applications/new/">
            Application types
          </a>
          <span class="mx-2">/</span>
          <span>{typeDef.label}</span>
        </nav>

        {submitError.value || submitProgressMessage.value ? (
          <div
            class={
              submitError.value
                ? "mb-6 rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error"
                : "mb-6 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm text-primary"
            }
          >
            <div class="flex items-start gap-3">
              {submitBusy.value && !submitError.value ? (
                <span
                  class="mt-0.5 inline-block size-4 shrink-0 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
                  aria-hidden
                />
              ) : null}
              <span>{submitError.value ?? submitProgressMessage.value}</span>
            </div>
          </div>
        ) : null}

        <div class="mb-6 rounded-xl border border-secondary/30 bg-secondary/5 p-4 text-sm">
          All 5 hosting pack documents upload and are stored on the server.
        </div>

        <form id="hosting-competition-form" class="space-y-12 mb-24" preventdefault:submit onSubmit$={onSubmit$}>
          <HostingEventBasicsSection />
          <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-4 sticky top-24">
              <h2 class="text-2xl font-bold font-headline text-primary mb-2">Event dates</h2>
              <p class="text-sm text-on-surface-variant leading-relaxed">
                Minimum <span class="font-semibold text-primary">{typeDef.minLeadDays} days</span> before the event.
              </p>
            </div>
            <div class="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">
                    Start date <span class="text-primary">(required)</span>
                  </label>
                  <input
                    name="start_date"
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                    type="date"
                    required
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">
                    End date <span class="text-primary">(required)</span>
                  </label>
                  <input
                    name="end_date"
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                    type="date"
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-4 sticky top-24">
              <h2 class="text-2xl font-bold font-headline text-primary mb-2">Hosting pack (3.1)</h2>
              <p class="text-sm text-on-surface-variant leading-relaxed">All five documents are required.</p>
            </div>
            <div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <AttachmentField title="Hosting plan" apiFieldHint="hosting_plan (API)" file={hostingPlan} />
              <AttachmentField title="Budget" apiFieldHint="budget (API)" file={budget} />
              <AttachmentField title="Adequate proof of funding" apiFieldHint="funding_proof (API)" file={funding} />
              <AttachmentField title="Roll-out plan" apiFieldHint="roll_out_plan (API)" file={rollOut} />
              <AttachmentField
                title="Organising committee composition"
                apiFieldHint="organising_committee_composition (API)"
                file={committee}
              />
            </div>
          </section>

          <DeclarationSection />
          <SubmitBar submitBusy={submitBusy} />
        </form>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: `${APPLICATION_TYPES.hosting_competition.label} | Approver`,
};
