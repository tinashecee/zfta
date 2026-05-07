import { $, component$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ApproverPortalNav } from "~/components/approver-portal-nav";
import { AttachmentField } from "~/components/application-form/attachment-field";
import { DeclarationSection } from "~/components/application-form/declaration-section";
import { IncomingTourDetailsSection } from "~/components/application-form/incoming-tour-details-section";
import { PersonnelSection } from "~/components/application-form/personnel-section";
import { SubmitBar } from "~/components/application-form/submit-bar";
import { APPLICATION_TYPES } from "~/lib/application-types";
import { getCurrentUser } from "~/lib/auth";
import { getOrganisation } from "~/lib/organisations-api";
import { submitTravelApplicationFlow } from "~/lib/submit-travel-application-flow";
import type { TravelPersonnelRow } from "~/lib/travel-personnel-types";

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

  const personnel = useStore<TravelPersonnelRow[]>([]);
  const statutoryComplianceFile = useSignal<File | null>(null);
  const fundingFile = useSignal<File | null>(null);
  const submitError = useSignal<string | null>(null);
  const submitBusy = useSignal(false);
  const submitProgressMessage = useSignal("");
  const submitProgressTone = useSignal<"info" | "success">("info");

  const typeDef = APPLICATION_TYPES.incoming_tour;

  const onSubmit$ = $(async (e: Event) => {
    e.preventDefault();
    submitError.value = null;
    submitProgressMessage.value = "";

    const resolved =
      e.currentTarget instanceof HTMLFormElement
        ? e.currentTarget
        : (e.target as Element | null)?.closest?.("form") ?? document.getElementById("incoming-tour-form");
    if (!(resolved instanceof HTMLFormElement)) {
      submitError.value = "Could not read the form.";
      return;
    }

    if (!statutoryComplianceFile.value) {
      submitError.value =
        "Please attach the Declaration of compliance with statutory requirements (1.1).";
      return;
    }
    if (!fundingFile.value) {
      submitError.value = "Please attach adequate proof of funding (1.8).";
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
    const organisationSport = String(orgR.data.sport ?? "").trim();
    if (!organisationSport) {
      submitError.value = "Organisation profile must include a sport.";
      return;
    }

    submitBusy.value = true;
    submitProgressMessage.value = "Submitting…";
    submitProgressTone.value = "info";

    const result = await submitTravelApplicationFlow({
      form: resolved,
      personnel,
      uploads: {
        statutory_compliance_declaration: statutoryComplianceFile.value,
        funding_proof: fundingFile.value,
      },
      organisationId: orgId,
      organisationSport,
      applicationType: "incoming_tour",
      minLeadDays: typeDef.minLeadDays,
    });

    submitBusy.value = false;
    if (!result.ok) {
      submitProgressMessage.value = "";
      submitError.value = result.error;
      return;
    }

    submitProgressTone.value = "success";
    submitProgressMessage.value = `Submitted. Reference: ${result.reference}. Redirecting…`;
    await new Promise<void>((r) => setTimeout(r, 1800));
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
            role={submitError.value ? "alert" : "status"}
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

        <form id="incoming-tour-form" class="space-y-12 mb-24" preventdefault:submit onSubmit$={onSubmit$}>
          <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-4 sticky top-24">
              <h2 class="text-2xl font-bold font-headline text-primary mb-2">Destination &amp; dates</h2>
              <p class="text-sm text-on-surface-variant leading-relaxed">
                Minimum <span class="font-semibold text-primary">{typeDef.minLeadDays} days</span> before arrival.
              </p>
            </div>
            <div class="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1.5 md:col-span-2">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Host country</label>
                  <input
                    name="host_country"
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body opacity-90"
                    value="Zimbabwe"
                    readOnly
                    required
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Arrival date</label>
                  <input
                    name="departure_date"
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                    type="date"
                    required
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Departure date</label>
                  <input
                    name="return_date"
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                    type="date"
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          <IncomingTourDetailsSection />
          <PersonnelSection personnel={personnel} mode="create" />

          <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-4 sticky top-24">
              <h2 class="text-2xl font-bold font-headline text-primary mb-2">Statutory compliance (1.1)</h2>
              <p class="text-sm text-on-surface-variant leading-relaxed">
                Upload your signed declaration of compliance with statutory requirements.
              </p>
            </div>
            <div class="lg:col-span-8">
              <AttachmentField
                title="Declaration of compliance with statutory requirements"
                description="Signed declaration or prescribed form as required by your sport body / regulations."
                apiFieldHint="statutory_compliance_declaration (API)"
                file={statutoryComplianceFile}
              />
            </div>
          </section>

          <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-4 sticky top-24">
              <h2 class="text-2xl font-bold font-headline text-primary mb-2">Funding (1.8)</h2>
              <p class="text-sm text-on-surface-variant">
                Uploaded as the support document slot until dedicated fields exist.
              </p>
            </div>
            <div class="lg:col-span-8">
              <AttachmentField
                title="Adequate proof of funding"
                apiFieldHint="funding_proof (API)"
                file={fundingFile}
              />
            </div>
          </section>

          <DeclarationSection label="I confirm the declaration document above is accurate, that I comply with statutory requirements (1.1), and that the information provided is true and complete." />
          <SubmitBar submitBusy={submitBusy} />
        </form>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: `${APPLICATION_TYPES.incoming_tour.label} | Approver`,
};
