import { $, component$, useSignal, useStore } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ApplicantPortalNav } from "~/components/applicant-portal-nav";
import { AttachmentField } from "~/components/application-form/attachment-field";
import { DeclarationSection } from "~/components/application-form/declaration-section";
import { PersonnelSection } from "~/components/application-form/personnel-section";
import { SubmitBar } from "~/components/application-form/submit-bar";
import { APPLICATION_TYPES } from "~/lib/application-types";
import { appPageTitle } from "~/lib/app-branding";
import { getCurrentUser } from "~/lib/auth";
import { getOrganisation } from "~/lib/organisations-api";
import { submitTravelApplicationFlow } from "~/lib/submit-travel-application-flow";
import type { TravelPersonnelRow } from "~/lib/travel-personnel-types";

function scrollSubmitFeedbackIntoView() {
  if (typeof document === "undefined") return;
  requestAnimationFrame(() => {
    document.getElementById("submit-feedback")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

export default component$(() => {
  const personnel = useStore<TravelPersonnelRow[]>([]);
  const invitationFile = useSignal<File | null>(null);
  const fundingFile = useSignal<File | null>(null);
  const liabilitiesFile = useSignal<File | null>(null);
  const submitError = useSignal<string | null>(null);
  const submitBusy = useSignal(false);
  const submitProgressMessage = useSignal("");
  const submitProgressTone = useSignal<"info" | "success">("info");

  const typeDef = APPLICATION_TYPES.outgoing_tour;

  const onSubmit$ = $(async (e: Event) => {
    e.preventDefault();
    if (submitBusy.value) return;
    submitError.value = null;
    submitProgressMessage.value = "";
    submitProgressTone.value = "info";

    const resolved =
      e.currentTarget instanceof HTMLFormElement
        ? e.currentTarget
        : (e.target as Element | null)?.closest?.("form") ?? document.getElementById("outgoing-tour-form");
    if (!(resolved instanceof HTMLFormElement)) {
      submitError.value = "Could not read the form. Please refresh.";
      scrollSubmitFeedbackIntoView();
      return;
    }

    if (!invitationFile.value) {
      submitError.value = "Please attach the original invitation letter from the hosting entity/country (2.3).";
      scrollSubmitFeedbackIntoView();
      return;
    }
    if (!fundingFile.value) {
      submitError.value = "Please attach adequate proof of funding (2.9).";
      scrollSubmitFeedbackIntoView();
      return;
    }
    if (!liabilitiesFile.value) {
      submitError.value =
        "Please attach details of amounts the touring party may become liable for and how they will be expended (2.7).";
      scrollSubmitFeedbackIntoView();
      return;
    }

    const user = getCurrentUser();
    if (!user?.id) {
      submitError.value = "You must be signed in to submit.";
      scrollSubmitFeedbackIntoView();
      return;
    }

    const orgId = String(user.organisation_id ?? "").trim();
    if (!orgId) {
      submitError.value = "Complete your organisation profile before submitting.";
      scrollSubmitFeedbackIntoView();
      return;
    }
    const orgR = await getOrganisation(orgId);
    if (!orgR.ok) {
      submitError.value = orgR.error;
      scrollSubmitFeedbackIntoView();
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
      submitError.value =
        "Your organisation profile must include a sport. Update your organisation profile, then try again.";
      scrollSubmitFeedbackIntoView();
      return;
    }

    submitBusy.value = true;
    submitProgressMessage.value = "Uploading primary documents…";
    scrollSubmitFeedbackIntoView();

    /** Queue is chosen in submit flow: football + PSL affiliate → awaiting_psl; else awaiting_sport_body. */
    const result = await submitTravelApplicationFlow({
      form: resolved,
      personnel,
      uploads: {
        invitation_letter: invitationFile.value,
        funding_proof: fundingFile.value,
        liabilities_breakdown: liabilitiesFile.value,
      },
      organisationId: orgId,
      organisationSport,
      pslAffiliate,
      applicationType: "outgoing_tour",
      minLeadDays: typeDef.minLeadDays,
    });

    submitBusy.value = false;

    if (!result.ok) {
      submitProgressMessage.value = "";
      submitError.value = result.error;
      scrollSubmitFeedbackIntoView();
      return;
    }

    submitProgressTone.value = "success";
    submitProgressMessage.value = `Application submitted. Reference: ${result.reference}. Redirecting…`;
    scrollSubmitFeedbackIntoView();
    await new Promise<void>((r) => setTimeout(r, 2200));
    window.location.assign("/applicant/dashboard/?submitted=1");
  });

  return (
    <div class="bg-background font-body text-on-background min-h-screen">
      <ApplicantPortalNav activeItem="applications" />

      <main class="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8 pt-28">
        <header class="mb-10">
          <nav class="text-sm text-on-surface-variant mb-4">
            <a class="text-primary font-semibold hover:underline" href="/applicant/new/">
              Application types
            </a>
            <span class="mx-2">/</span>
            <span class="text-on-surface">{typeDef.label}</span>
          </nav>
          <h1 class="text-4xl md:text-5xl font-extrabold font-headline tracking-tighter text-primary">{typeDef.label}</h1>
          <p class="text-on-surface-variant max-w-2xl mt-2">{typeDef.description}</p>
          <p class="mt-3 text-sm font-semibold text-secondary">
            Submit at least {typeDef.minLeadDays} days before departure.
          </p>
        </header>

        {submitError.value || submitProgressMessage.value ? (
          <div
            id="submit-feedback"
            class={
              submitError.value
                ? "mb-8 rounded-xl border-2 border-error/40 bg-error/5 p-4 text-sm text-error shadow-sm"
                : submitProgressTone.value === "success"
                  ? "mb-8 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm text-primary"
                  : "mb-8 rounded-xl border border-secondary/30 bg-secondary/5 p-4 text-sm text-on-surface"
            }
            role={submitError.value ? "alert" : "status"}
          >
            {submitError.value ? (
              <p class="font-medium">{submitError.value}</p>
            ) : (
              <p class="font-medium flex items-start gap-3">
                {submitBusy.value ? (
                  <span
                    class="mt-0.5 inline-block size-4 shrink-0 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
                    aria-hidden
                  />
                ) : null}
                <span>{submitProgressMessage.value}</span>
              </p>
            )}
          </div>
        ) : null}

        <div class="mb-6 rounded-xl border border-secondary/30 bg-secondary/5 p-4 text-sm text-on-surface">
          <strong class="text-primary">Documents at submit:</strong> invitation letter (2.3), proof of funding (2.9), and
          liabilities / expenditure (2.7). Compliance declaration (2.1) and national association clearance (2.4) are
          attached by your sport body during review.
        </div>

        <form id="outgoing-tour-form" class="space-y-12 mb-24" preventdefault:submit onSubmit$={onSubmit$}>
          <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-4 sticky top-24">
              <h2 class="text-2xl font-bold font-headline text-primary mb-2">Destination &amp; dates</h2>
              <p class="text-sm text-on-surface-variant leading-relaxed">
                Minimum <span class="font-semibold text-primary">{typeDef.minLeadDays} days</span> before departure.
              </p>
            </div>
            <div class="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1.5 md:col-span-2">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Host Country</label>
                  <input
                    name="host_country"
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                    placeholder="e.g. South Africa"
                    type="text"
                    required
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Departure Date</label>
                  <input
                    name="departure_date"
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                    type="date"
                    required
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Return Date</label>
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

          <PersonnelSection personnel={personnel} mode="create" />

          <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-4 sticky top-24">
              <h2 class="text-2xl font-bold font-headline text-primary mb-2">Applicant documents</h2>
              <p class="text-sm text-on-surface-variant leading-relaxed">
                Original invitation, proof of funding, and liabilities / expenditure breakdown. Compliance (2.1) and
                national association clearance (2.4) are supplied by your sport body when they approve the application.
              </p>
            </div>
            <div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <AttachmentField
                title="Original invitation letter (2.3)"
                description="From the hosting entity or country."
                apiFieldHint="invitation_letter (API)"
                file={invitationFile}
              />
              <AttachmentField
                title="Proof of funding (2.9)"
                description="Adequate proof of funding."
                apiFieldHint="funding_proof (API)"
                file={fundingFile}
              />
              <AttachmentField
                title="Liabilities & expenditure (2.7)"
                description="Amounts that may become payable and what they cover."
                apiFieldHint="liabilities_breakdown (API)"
                file={liabilitiesFile}
              />
            </div>
          </section>

          <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-4 sticky top-24">
              <h2 class="text-2xl font-bold font-headline text-primary mb-2">Purpose (2.8)</h2>
            </div>
            <div class="lg:col-span-8">
              <textarea
                name="event_description"
                class="w-full min-h-[120px] bg-surface-container-highest border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary/30 font-body"
                placeholder="Purpose or benefits realised through hosting the tour."
                required
              />
            </div>
          </section>

          <DeclarationSection />
          <SubmitBar submitBusy={submitBusy} showDraft />
        </form>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: appPageTitle(APPLICATION_TYPES.outgoing_tour.label),
};
