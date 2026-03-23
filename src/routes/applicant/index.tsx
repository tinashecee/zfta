import { $, component$, useSignal, useStore } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ApplicantPortalNav } from "~/components/applicant-portal-nav";
import { TravelPersonnelRoster } from "~/components/travel-personnel-roster";
import { createApplication, uploadApplicationAttachments } from "~/lib/applications-api";
import { buildApplicationRecordFromForm } from "~/lib/build-application-payload";
import { getCurrentUser } from "~/lib/auth";
import { getOrganisationForUser } from "~/lib/organisations-api";
import { validateApplicationPayload, validateNewApplicationFormData } from "~/lib/validate-application-form";
import { personnelRoleCountsForApplication, rowToPayload } from "~/lib/travel-personnel-types";
import type { TravelPersonnelRow } from "~/lib/travel-personnel-types";

function scrollSubmitFeedbackIntoView() {
  if (typeof document === "undefined") return;
  requestAnimationFrame(() => {
    document.getElementById("submit-feedback")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

type SubmitToast = { kind: "error" | "success" | "info"; text: string };

export default component$(() => {
  const personnel = useStore<TravelPersonnelRow[]>([]);
  const supportFile = useSignal<File | null>(null);
  const travelFile = useSignal<File | null>(null);
  const submitError = useSignal<string | null>(null);
  const submitBusy = useSignal(false);
  /** Visible progress (upload + submit); cleared on error or when starting over. */
  const submitProgressMessage = useSignal("");
  const submitProgressTone = useSignal<"info" | "success">("info");
  /** Fixed toast (short outcome); auto-dismiss for errors. */
  const submitToast = useSignal<SubmitToast | null>(null);
  const toastDismissTimerId = useSignal<number | null>(null);

  const dismissToast = $(() => {
    if (toastDismissTimerId.value) {
      clearTimeout(toastDismissTimerId.value);
      toastDismissTimerId.value = null;
    }
    submitToast.value = null;
  });

  const showToast = $((kind: SubmitToast["kind"], text: string, durationMs = 6500) => {
    if (toastDismissTimerId.value) {
      clearTimeout(toastDismissTimerId.value);
      toastDismissTimerId.value = null;
    }
    submitToast.value = { kind, text };
    if (typeof window === "undefined") return;
    toastDismissTimerId.value = window.setTimeout(() => {
      submitToast.value = null;
      toastDismissTimerId.value = null;
    }, durationMs);
  });

  const setSubmitErrorWithFeedback = $((message: string) => {
    submitError.value = message;
    scrollSubmitFeedbackIntoView();
    const short = message.length > 96 ? `${message.slice(0, 93)}…` : message;
    return showToast("error", short);
  });

  const onSubmitApplication$ = $(async (e: Event) => {
    e.preventDefault();
    submitError.value = null;
    submitProgressMessage.value = "";
    await dismissToast();

    const fromEvent =
      e.currentTarget instanceof HTMLFormElement
        ? e.currentTarget
        : e.target instanceof Element
          ? e.target.closest("form")
          : null;

    let resolved: HTMLFormElement | null =
      fromEvent instanceof HTMLFormElement ? fromEvent : null;

    if (!resolved && typeof document !== "undefined") {
      const byId = document.getElementById("applicant-application-form");
      if (byId instanceof HTMLFormElement) {
        console.warn("[submit-application] using #applicant-application-form (event did not resolve to a form)");
        resolved = byId;
      }
    }

    console.log("[submit-application] start", {
      currentTarget: e.currentTarget,
      currentTargetIsForm: e.currentTarget instanceof HTMLFormElement,
      target: e.target,
      resolvedTag: resolved?.tagName ?? null,
      resolvedId: resolved instanceof HTMLFormElement ? resolved.id : null,
    });

    if (!(resolved instanceof HTMLFormElement)) {
      console.error("[submit-application] could not resolve HTMLFormElement", {
        currentTarget: e.currentTarget,
        target: e.target,
      });
      await setSubmitErrorWithFeedback(
        "Could not read the form (browser event). Please refresh the page and try again.",
      );
      return;
    }

    let fd: FormData;
    try {
      fd = new FormData(resolved);
    } catch (err) {
      console.error("[submit-application] new FormData() failed", err);
      await setSubmitErrorWithFeedback("Could not read form data. Please try again.");
      return;
    }

    console.log("[submit-application] FormData keys", [...new Set([...fd.keys()])]);

    const formValidation = validateNewApplicationFormData(fd);
    if (formValidation) {
      await setSubmitErrorWithFeedback(formValidation);
      return;
    }

    if (fd.get("declaration_accepted") !== "on") {
      await setSubmitErrorWithFeedback("Please accept the declaration to submit.");
      return;
    }
    if (!supportFile.value && !travelFile.value) {
      await setSubmitErrorWithFeedback(
        "Please attach at least one document: invitation letter (support) and/or travel/identity document.",
      );
      return;
    }
    if (personnel.length === 0) {
      await setSubmitErrorWithFeedback("Add at least one traveller to the squad roster.");
      return;
    }
    const user = getCurrentUser();
    if (!user?.id) {
      await setSubmitErrorWithFeedback("You must be signed in to submit.");
      return;
    }

    let orgId: string;
    {
      const orgR = await getOrganisationForUser(user.id);
      if (!orgR.ok) {
        console.error("[submit-application] organisation fetch failed", orgR.error);
        await setSubmitErrorWithFeedback(orgR.error);
        return;
      }
      if (!orgR.organisation?.id) {
        await setSubmitErrorWithFeedback("Complete your organisation profile before submitting an application.");
        return;
      }
      orgId = String(orgR.organisation.id).trim();
      if (!orgId) {
        await setSubmitErrorWithFeedback("Organisation ID is missing. Please update your organisation profile.");
        return;
      }
    }

    submitBusy.value = true;
    submitProgressTone.value = "info";
    submitProgressMessage.value = "Uploading documents to the server…";
    scrollSubmitFeedbackIntoView();
    console.log("[submit-application] uploading attachments", {
      hasSupport: !!supportFile.value,
      hasTravel: !!travelFile.value,
    });
    const up = await uploadApplicationAttachments({
      support_document: supportFile.value,
      travel_document: travelFile.value,
    });
    if (!up.ok) {
      submitBusy.value = false;
      submitProgressMessage.value = "";
      console.error("[submit-application] upload failed", up.status, up.error);
      await setSubmitErrorWithFeedback(up.error);
      return;
    }
    const pathBits: string[] = [];
    if (up.data.support_documents != null) {
      pathBits.push(`Support: ${up.data.support_documents}`);
    }
    if (up.data.travel_documents != null) {
      pathBits.push(`Travel: ${up.data.travel_documents}`);
    }
    submitProgressTone.value = "success";
    submitProgressMessage.value =
      pathBits.length > 0
        ? `Documents uploaded successfully. ${pathBits.join(" · ")}`
        : "Documents uploaded successfully.";
    scrollSubmitFeedbackIntoView();
    console.log("[submit-application] upload ok", {
      support_documents: up.data.support_documents,
      travel_documents: up.data.travel_documents,
    });

    const application = buildApplicationRecordFromForm(fd, {
      organisation_id: orgId,
      support_documents: up.data.support_documents,
      travel_documents: up.data.travel_documents,
      status: "awaiting_zifa",
    });

    const roleCounts = personnelRoleCountsForApplication(personnel);
    application.player_count = roleCounts.player_count;
    application.officials_count = roleCounts.officials_count;

    const payloadCheck = validateApplicationPayload(application);
    if (payloadCheck) {
      submitBusy.value = false;
      submitProgressMessage.value = "";
      console.error("[submit-application] payload validation failed", payloadCheck, application);
      await setSubmitErrorWithFeedback(payloadCheck);
      return;
    }

    submitProgressTone.value = "info";
    submitProgressMessage.value = "Submitting your application and travel roster…";
    scrollSubmitFeedbackIntoView();

    const personnelPayload = personnel.map(rowToPayload);
    const body = { application, personnel: personnelPayload };
    console.log("[submit-application] POST /api/v1/applications", {
      applicationKeys: Object.keys(application),
      sample: {
        organisation_id: application.organisation_id,
        event_type: application.event_type,
        event_display_name: application.event_display_name,
        host_country: application.host_country,
        departure_date: application.departure_date,
        return_date: application.return_date,
        age_group: application.age_group,
        gender_category: application.gender_category,
        travel_mode: application.travel_mode,
      },
      personnelCount: personnelPayload.length,
    });

    const cr = await createApplication(body);
    if (!cr.ok) {
      submitBusy.value = false;
      submitProgressMessage.value = "";
      console.error("[submit-application] createApplication failed", cr.status, cr.error);
      await setSubmitErrorWithFeedback(cr.error);
      return;
    }
    const ref = cr.data?.reference_number ?? cr.data?.id ?? "";
    submitProgressTone.value = "success";
    submitProgressMessage.value = ref
      ? `Application submitted successfully. Reference: ${ref}. Redirecting to your dashboard…`
      : "Application submitted successfully. Redirecting to your dashboard…";
    await showToast(
      "success",
      ref ? `Application submitted. Reference: ${ref}` : "Application submitted successfully.",
      12000,
    );
    scrollSubmitFeedbackIntoView();
    console.log("[submit-application] success", { id: cr.data?.id, reference: cr.data?.reference_number });
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 2200);
    });
    window.location.assign("/applicant/dashboard/?submitted=1");
  });

  return (
    <div class="bg-background font-body text-on-background min-h-screen">
      <ApplicantPortalNav activeItem="applications" />

      <main class="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <header class="mb-12">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div class="space-y-2">
              <span class="text-secondary font-bold tracking-widest uppercase text-xs">Official Portal</span>
              <h1 class="text-4xl md:text-5xl font-extrabold font-headline tracking-tighter text-primary leading-tight">
                New Travel Authorization <br />
                Application
              </h1>
              <p class="text-on-surface-variant max-w-xl text-lg font-light leading-relaxed">
                Complete the form below to initiate the international travel clearance process for national delegations and football squads.
              </p>
            </div>

            <div class="flex items-center gap-3 bg-surface-container-high px-4 py-3 rounded-2xl">
              <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">
                info
              </span>
              <span class="text-sm font-medium text-primary">Applications require 14 days lead time.</span>
            </div>
          </div>
        </header>

        {submitError.value || submitProgressMessage.value || submitBusy.value ? (
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
            aria-live={submitError.value ? "assertive" : "polite"}
          >
            {submitError.value ? (
              <div class="flex items-start gap-3">
                <span class="material-symbols-outlined shrink-0 text-2xl text-error" style="font-variation-settings: 'FILL' 1;">
                  error
                </span>
                <p class="leading-relaxed font-medium">{submitError.value}</p>
              </div>
            ) : (
              <div class="flex items-start gap-3">
                <span
                  class={`material-symbols-outlined shrink-0 text-xl ${submitBusy.value && submitProgressTone.value === "info" ? "animate-spin" : ""}`}
                  style={submitProgressTone.value === "success" ? "font-variation-settings: 'FILL' 1;" : undefined}
                >
                  {submitProgressTone.value === "success" ? "check_circle" : "progress_activity"}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="leading-relaxed font-medium">{submitProgressMessage.value}</p>
                  {submitBusy.value ? (
                    <div
                      class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-outline-variant/25"
                      aria-hidden
                    >
                      <div class="h-full w-full rounded-full bg-primary/75 animate-pulse" />
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <form
          id="applicant-application-form"
          class="space-y-12 mb-24"
          preventdefault:submit
          onSubmit$={onSubmitApplication$}
        >
          {/* Section 1: Event Type Selection (Asymmetric Layout) */}
          <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-4 sticky top-24">
              <h2 class="text-2xl font-bold font-headline text-primary mb-2">Event Nature</h2>
              <p class="text-sm text-on-surface-variant leading-relaxed">
                Select the primary purpose of this international journey. This determines the required supporting documentation.
              </p>
            </div>

            <div class="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <label class="relative flex cursor-pointer rounded-xl border border-outline-variant p-4 hover:bg-surface-container-low transition-colors group has-[:checked]:border-secondary has-[:checked]:bg-secondary/5">
                  <input
                    class="sr-only peer"
                    name="event_type"
                    type="radio"
                    value="tournament"
                    defaultChecked
                  />
                  <div class="flex items-center gap-3">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary peer-checked:bg-secondary peer-checked:text-white transition-colors">
                      <span class="material-symbols-outlined">emoji_events</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-bold font-headline text-primary">Tournament</span>
                      <span class="text-xs text-on-surface-variant">Competitive championships</span>
                    </div>
                  </div>
                </label>

                <label class="relative flex cursor-pointer rounded-xl border border-outline-variant p-4 hover:bg-surface-container-low transition-colors group has-[:checked]:border-secondary has-[:checked]:bg-secondary/5">
                  <input class="sr-only peer" name="event_type" type="radio" value="friendly_match" />
                  <div class="flex items-center gap-3">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary transition-colors">
                      <span class="material-symbols-outlined">handshake</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-bold font-headline text-primary">Friendly Match</span>
                      <span class="text-xs text-on-surface-variant">Non-competitive fixtures</span>
                    </div>
                  </div>
                </label>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Tournament Category</label>
                  <select
                    name="tournament_name"
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                  >
                    <option value="COSAFA Cup">COSAFA Cup</option>
                    <option value="AFCON">AFCON</option>
                    <option value="AFCON Qualification">AFCON Qualification</option>
                    <option value="World Cup">World Cup</option>
                    <option value="World Cup Qualification">World Cup Qualification</option>
                    <option value="CAF Champions League">CAF Champions League</option>
                    <option value="CAF Confederation Cup">CAF Confederation Cup</option>
                    <option value="SADC Schools Games">SADC Schools Games</option>
                    <option value="FEASSSA Games">FEASSSA Games</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Host Country</label>
                  <input
                    name="host_country"
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                    placeholder="e.g. South Africa"
                    type="text"
                    required
                  />
                </div>

                <div class="md:col-span-2 space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Host City / Venue</label>
                  <input
                    name="host_city"
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                    placeholder="Specify city and stadium name"
                    type="text"
                  />
                </div>

                <div class="md:col-span-2 space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">
                    Tournament name (if &quot;Other&quot;)
                  </label>
                  <input
                    name="tournament_name_other"
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                    placeholder="Required when tournament is Other"
                    type="text"
                  />
                </div>

                <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="space-y-1.5">
                    <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Opponent (optional)</label>
                    <input
                      name="opponent_team_name"
                      class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                      placeholder="e.g. Kaizer Chiefs"
                      type="text"
                    />
                  </div>
                  <div class="space-y-1.5">
                    <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Opponent country (optional)</label>
                    <input
                      name="opponent_team_country"
                      class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                      placeholder="e.g. South Africa"
                      type="text"
                    />
                  </div>
                </div>

                <div class="md:col-span-2 space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">
                    Event title (optional override)
                  </label>
                  <input
                    name="event_display_name"
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                    placeholder="Defaults to tournament + host country"
                    type="text"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Logistics & Delegation */}
          <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-4 sticky top-24">
              <h2 class="text-2xl font-bold font-headline text-primary mb-2">Logistics &amp; Squad</h2>
              <p class="text-sm text-on-surface-variant leading-relaxed">
                Specify the travel timeline, squad size, and team demographics for clearance auditing.
              </p>
            </div>

            <div class="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Total Players</label>
                  <div class="relative">
                    <input
                      name="player_count"
                      class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                      type="number"
                      min="1"
                      max="100"
                      defaultValue="23"
                      required
                    />
                    <span class="absolute right-4 top-3 text-xs text-on-surface-variant">Athletes</span>
                  </div>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Officials/Staff</label>
                <div class="relative">
                  <input
                    name="officials_count"
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                    type="number"
                    min="0"
                    max="50"
                    defaultValue="7"
                    required
                  />
                  <span class="absolute right-4 top-3 text-xs text-on-surface-variant">Tech/Med</span>
                </div>
              </div>

              <p class="text-xs text-on-surface-variant mb-2">
                Submitted totals for players vs staff follow the squad roster (each row&apos;s role), not these numbers.
              </p>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-outline-variant/10">
                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Age Group</label>
                  <select
                    name="age_group"
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                  >
                    <option value="senior">Senior</option>
                    <option value="u23">U23</option>
                    <option value="u20">U20</option>
                    <option value="u18">U18</option>
                    <option value="u17">U17</option>
                    <option value="u15">U15</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Gender</label>
                  <select
                    name="gender_category"
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Mode of Travel</label>
                  <select
                    name="travel_mode"
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                  >
                    <option value="air">Air</option>
                    <option value="road">Road</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div class="md:col-span-3 space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Primary Port of Entry/Exit</label>
                  <input
                    name="port_of_entry"
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                    placeholder="e.g. Robert Gabriel Mugabe Intl / Beitbridge Border"
                    type="text"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Travelling personnel + documents */}
          <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-4 sticky top-24">
              <h2 class="text-2xl font-bold font-headline text-primary mb-2">Travelling personnel</h2>
              <p class="text-sm text-on-surface-variant leading-relaxed">
                Download the Excel template, fill one row per traveller, then upload. You can also add or remove people
                manually. This roster is submitted with your application.
              </p>
            </div>

            <div class="lg:col-span-8 space-y-8">
              <div class="bg-surface-container-lowest p-6 md:p-8 rounded-xl shadow-sm border border-outline-variant/15">
                <div class="mb-6">
                  <span class="inline-block px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider mb-2">
                    Required
                  </span>
                  <h3 class="font-headline font-bold text-xl text-primary">Squad roster</h3>
                  <p class="text-sm text-on-surface-variant mt-1">
                    Match the official delegation list. Passport and ID fields should match travel documents.
                  </p>
                </div>
                <TravelPersonnelRoster personnel={personnel} mode="create" />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-surface-container-highest p-6 rounded-2xl flex flex-col border border-outline-variant/30">
                  <div>
                    <span class="inline-block px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider mb-4">
                      support_document
                    </span>
                    <h3 class="font-headline font-bold text-lg mb-1 text-primary">Invitation / support</h3>
                    <p class="text-xs text-on-surface-variant">
                      Hosting confirmation (maps to multipart field <code class="text-[10px]">support_document</code>).
                    </p>
                  </div>
                  <label class="mt-4 flex cursor-pointer items-center justify-center gap-2 w-full py-3 bg-surface-container-lowest hover:bg-white rounded-xl transition-colors border border-outline-variant group">
                    <input
                      class="sr-only"
                      accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/*"
                      type="file"
                      onChange$={(e) => {
                        const f = (e.target as HTMLInputElement).files?.[0];
                        supportFile.value = f ?? null;
                      }}
                    />
                    <span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">attachment</span>
                    <span class="text-sm font-bold text-primary">Select file</span>
                  </label>
                  <p class="mt-2 text-[11px] text-on-surface-variant truncate" title={supportFile.value?.name}>
                    {supportFile.value ? supportFile.value.name : "No file selected"}
                  </p>
                </div>

                <div class="bg-surface-container-highest p-6 rounded-2xl flex flex-col border border-outline-variant/30">
                  <div>
                    <span class="inline-block px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider mb-4">
                      travel_document
                    </span>
                    <h3 class="font-headline font-bold text-lg mb-1 text-primary">Travel / identity</h3>
                    <p class="text-xs text-on-surface-variant">
                      Passport or ID pack (maps to <code class="text-[10px]">travel_document</code>).
                    </p>
                  </div>
                  <label class="mt-4 flex cursor-pointer items-center justify-center gap-2 w-full py-3 bg-surface-container-lowest hover:bg-white rounded-xl transition-colors border border-outline-variant group">
                    <input
                      class="sr-only"
                      accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/*"
                      type="file"
                      onChange$={(e) => {
                        const f = (e.target as HTMLInputElement).files?.[0];
                        travelFile.value = f ?? null;
                      }}
                    />
                    <span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">badge</span>
                    <span class="text-sm font-bold text-primary">Select file</span>
                  </label>
                  <p class="mt-2 text-[11px] text-on-surface-variant truncate" title={travelFile.value?.name}>
                    {travelFile.value ? travelFile.value.name : "No file selected"}
                  </p>
                </div>
              </div>
              <p class="text-xs text-on-surface-variant">
                On submit, files upload first to <code class="text-[10px]">POST /api/v1/applications/attachments</code> (at least one
                required). Returned paths are stored on the application as <code class="text-[10px]">support_documents</code> /{" "}
                <code class="text-[10px]">travel_documents</code>.
              </p>
            </div>
          </section>

          {/* Declaration + submit */}
          <div class="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6">
            <label class="flex cursor-pointer items-start gap-3">
              <input
                class="mt-1 rounded border-outline text-primary focus:ring-primary"
                name="declaration_accepted"
                type="checkbox"
              />
              <span class="text-sm text-on-surface-variant leading-relaxed">
                I declare that the information and documents provided are true and complete to the best of my knowledge,
                and I understand that false statements may result in rejection or withdrawal of authorization.
              </span>
            </label>
          </div>

          <footer class="flex flex-col md:flex-row items-center justify-end gap-4 py-12 border-t border-outline-variant/20">
            <button
              class="w-full md:w-auto px-8 py-3 bg-surface-container-highest text-primary font-headline font-bold rounded-xl hover:bg-surface-container-high transition-all active:scale-95 opacity-70"
              type="button"
              title="Draft flow can use the same attachment upload + application create with status draft when supported."
            >
              Save as Draft
            </button>
            <button
              class={
                submitBusy.value
                  ? "w-full md:w-auto px-12 py-3 bg-gradient-to-r from-primary to-primary-container text-white font-headline font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 cursor-wait ring-4 ring-primary/25 ring-offset-2 ring-offset-background opacity-95"
                  : "w-full md:w-auto px-12 py-3 bg-gradient-to-r from-primary to-primary-container text-white font-headline font-bold rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
              }
              disabled={submitBusy.value}
              type="submit"
              aria-busy={submitBusy.value}
            >
              {submitBusy.value ? (
                <>
                  <span
                    class="inline-block size-5 shrink-0 rounded-full border-2 border-white border-t-transparent motion-safe:animate-spin"
                    aria-hidden
                  />
                  <span>Submitting…</span>
                </>
              ) : (
                <>
                  Submit Application
                  <span class="material-symbols-outlined" aria-hidden>
                    send
                  </span>
                </>
              )}
            </button>
          </footer>
        </form>

        {submitToast.value ? (
          <div
            class={
              submitToast.value.kind === "error"
                ? "fixed bottom-6 left-1/2 z-[300] flex w-[min(100%-2rem,28rem)] -translate-x-1/2 items-start gap-3 rounded-2xl border border-error/35 bg-error/10 px-4 py-3 text-error shadow-2xl"
                : submitToast.value.kind === "success"
                  ? "fixed bottom-6 left-1/2 z-[300] flex w-[min(100%-2rem,28rem)] -translate-x-1/2 items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-primary shadow-2xl"
                  : "fixed bottom-6 left-1/2 z-[300] flex w-[min(100%-2rem,28rem)] -translate-x-1/2 items-start gap-3 rounded-2xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-on-surface shadow-2xl"
            }
            role="status"
          >
            <span
              class="material-symbols-outlined shrink-0 text-xl"
              style={
                submitToast.value.kind === "success"
                  ? "font-variation-settings: 'FILL' 1;"
                  : undefined
              }
            >
              {submitToast.value.kind === "error"
                ? "error"
                : submitToast.value.kind === "success"
                  ? "check_circle"
                  : "info"}
            </span>
            <p class="min-w-0 flex-1 text-sm font-medium leading-snug">{submitToast.value.text}</p>
            <button
              class="shrink-0 rounded-lg p-1 text-current opacity-70 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              type="button"
              aria-label="Dismiss notification"
                onClick$={dismissToast}
            >
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer class="bg-emerald-950 w-full py-12 px-8">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="text-lg font-bold text-white font-headline">
            Zimbabwe Football Travel Authority
          </div>
          <div class="flex flex-wrap justify-center gap-8 font-body text-sm antialiased">
            <a class="text-emerald-200/60 hover:text-amber-400 transition-colors" href="#">
              Privacy Policy
            </a>
            <a
              class="text-emerald-200/60 hover:text-amber-400 transition-colors"
              href="#"
            >
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
  title: "Travel Authorization Application",
};

