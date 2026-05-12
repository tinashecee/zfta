import { $, component$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { ApproverPortalNav } from "~/components/approver-portal-nav";
import {
  bidHasAllRequiredDocuments,
  bidStatusLabel,
  biddingEventStatusLabel,
  filterHostingEventsForSportBodyReviewer,
  isHostingBidDeadlineOpen,
  listBiddingEvents,
  loadBidWorkspaceContext,
  patchHostingBid,
  submitHostingBid,
  uploadHostingBidDocument,
  uploadedBidDocumentTypes,
  userCanBrowseApproverHostingPages,
  type ApiBidDocument,
  type BidWorkspacePayload,
} from "~/lib/bidding-api";
import { formatDateTime } from "~/lib/application-display";
import { getCurrentUser } from "~/lib/auth";
import { resolveCurrentReviewerSportBodyContext } from "~/lib/reviewer-sport-body";

export default component$(() => {
  const location = useLocation();
  const workspace = useSignal<BidWorkspacePayload | null>(null);
  const loading = useSignal(true);
  const loadError = useSignal<string | null>(null);
  const uploadBusy = useSignal(false);
  const uploadError = useSignal<string | null>(null);
  const submitBusy = useSignal(false);
  const submitError = useSignal<string | null>(null);
  const missingSlugs = useSignal<string[]>([]);

  const narrative = useStore({
    event_objectives: "",
    expected_benefits: "",
    infrastructure_plan: "",
    competition_plan: "",
    volunteer_plan: "",
    transport_plan: "",
    security_plan: "",
    accommodation_plan: "",
    catering_plan: "",
    marketing_plan: "",
    risk_management_plan: "",
    communication_strategy: "",
    total_budget: "",
    government_funding_pct: "",
    income_breakdown: "",
    expenditure_breakdown: "",
    legacy_plan: "",
  });
  const narrativeBusy = useSignal(false);
  const narrativeError = useSignal<string | null>(null);
  const narrativeSaved = useSignal(false);

  const reloadWorkspace = $(async (bidId: string) => {
    const ws = await loadBidWorkspaceContext(bidId);
    if (!ws.ok) {
      loadError.value = ws.error;
      workspace.value = null;
      return;
    }
    loadError.value = null;
    workspace.value = ws.data;
  });

  useVisibleTask$(async ({ track }) => {
    track(() => location.params.bidId);
    const bidId = location.params.bidId?.trim() ?? "";
    loading.value = true;
    loadError.value = null;
    workspace.value = null;

    const u = getCurrentUser();
    if (!userCanBrowseApproverHostingPages(u)) {
      window.location.assign(u?.role === "system_admin" ? "/admin/dashboard/" : "/approver/dashboard/");
      return;
    }
    if (!bidId) {
      loading.value = false;
      loadError.value = "Missing bid id.";
      return;
    }

    const ws = await loadBidWorkspaceContext(bidId);
    loading.value = false;
    if (!ws.ok) {
      loadError.value = ws.error;
      return;
    }

    if (u?.role !== "system_admin") {
      const ab = (u?.approver_body ?? "").trim().toUpperCase();
      const legacy = (u?.body ?? "").trim().toUpperCase();
      const isSportBody =
        u?.role === "reviewer" &&
        (ab === "SPORTS_BODY" || legacy === "SPORT_BODY" || legacy === "SPORTS_BODY");
      if (isSportBody) {
        const ctx = await resolveCurrentReviewerSportBodyContext();
        if (!ctx.ok) {
          loadError.value = ctx.error;
          return;
        }
        const er = await listBiddingEvents({ limit: 100, offset: 0 });
        if (!er.ok) {
          loadError.value = er.error;
          return;
        }
        const { allowedEventIds } = filterHostingEventsForSportBodyReviewer(er.data, ctx.sportKey);
        const eid = String(ws.data.bid.event_id ?? "").trim();
        if (!eid || !allowedEventIds.has(eid)) {
          window.location.assign("/approver/dashboard/");
          return;
        }
      }
    }

    workspace.value = ws.data;
  });

  // Keep narrative form in sync with the current bid row.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => workspace.value?.bid?.id);
    const b = workspace.value?.bid;
    if (!b) return;
    narrative.event_objectives = (b.event_objectives ?? "").trim();
    narrative.expected_benefits = (b.expected_benefits ?? "").trim();
    narrative.infrastructure_plan = (b.infrastructure_plan ?? "").trim();
    narrative.competition_plan = (b.competition_plan ?? "").trim();
    narrative.volunteer_plan = (b.volunteer_plan ?? "").trim();
    narrative.transport_plan = (b.transport_plan ?? "").trim();
    narrative.security_plan = (b.security_plan ?? "").trim();
    narrative.accommodation_plan = (b.accommodation_plan ?? "").trim();
    narrative.catering_plan = (b.catering_plan ?? "").trim();
    narrative.marketing_plan = (b.marketing_plan ?? "").trim();
    narrative.risk_management_plan = (b.risk_management_plan ?? "").trim();
    narrative.communication_strategy = (b.communication_strategy ?? "").trim();
    narrative.total_budget = b.total_budget == null ? "" : String(b.total_budget).trim();
    narrative.government_funding_pct = b.government_funding_pct == null ? "" : String(b.government_funding_pct).trim();
    narrative.income_breakdown = (b.income_breakdown ?? "").trim();
    narrative.expenditure_breakdown = (b.expenditure_breakdown ?? "").trim();
    narrative.legacy_plan = (b.legacy_plan ?? "").trim();
  });

  const onUpload$ = $(async (bidId: string, document_type: string, fileList: FileList | null) => {
    uploadError.value = null;
    narrativeSaved.value = false;
    const file = fileList?.item(0);
    if (!file) {
      uploadError.value = "Choose a file.";
      return;
    }
    uploadBusy.value = true;
    const r = await uploadHostingBidDocument(bidId, { document_type, file });
    uploadBusy.value = false;
    if (!r.ok) {
      uploadError.value = r.error;
      return;
    }
    // Upload returns the updated bid + documents; keep any event we already loaded.
    const prevEvent = workspace.value?.event ?? null;
    workspace.value = { ...r.data, event: prevEvent };
    missingSlugs.value = [];
    // Some deployments return a minimal bid payload; refresh to ensure required docs + status are current.
    await reloadWorkspace(bidId);
  });

  const onSubmit$ = $(async (bidId: string) => {
    submitError.value = null;
    missingSlugs.value = [];
    submitBusy.value = true;
    const r = await submitHostingBid(bidId);
    submitBusy.value = false;
    if (!r.ok) {
      submitError.value = r.error;
      missingSlugs.value = Array.isArray(r.missing) ? r.missing : [];
      return;
    }
    window.location.assign("/approver/my-bids/");
  });

  const onSaveNarrative$ = $(async (bidId: string) => {
    narrativeError.value = null;
    narrativeSaved.value = false;
    narrativeBusy.value = true;
    const r = await patchHostingBid(bidId, {
      event_objectives: narrative.event_objectives || undefined,
      expected_benefits: narrative.expected_benefits || undefined,
      infrastructure_plan: narrative.infrastructure_plan || undefined,
      competition_plan: narrative.competition_plan || undefined,
      volunteer_plan: narrative.volunteer_plan || undefined,
      transport_plan: narrative.transport_plan || undefined,
      security_plan: narrative.security_plan || undefined,
      accommodation_plan: narrative.accommodation_plan || undefined,
      catering_plan: narrative.catering_plan || undefined,
      marketing_plan: narrative.marketing_plan || undefined,
      risk_management_plan: narrative.risk_management_plan || undefined,
      communication_strategy: narrative.communication_strategy || undefined,
      total_budget: narrative.total_budget || undefined,
      government_funding_pct: narrative.government_funding_pct || undefined,
      income_breakdown: narrative.income_breakdown || undefined,
      expenditure_breakdown: narrative.expenditure_breakdown || undefined,
      legacy_plan: narrative.legacy_plan || undefined,
    });
    narrativeBusy.value = false;
    if (!r.ok) {
      narrativeError.value = r.error;
      return;
    }
    const prevEvent = workspace.value?.event ?? null;
    workspace.value = { ...r.data, event: prevEvent };
    narrativeSaved.value = true;
  });

  const ws = workspace.value;
  const bid = ws?.bid ?? null;
  const ev = ws?.event ?? null;
  const docs = ws?.documents ?? [];

  const required =
    ev?.required_documents?.length && Array.isArray(ev.required_documents)
      ? ev.required_documents.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      : [];

  const uploadedTypes = uploadedBidDocumentTypes(docs);
  const statusLower = (bid?.status ?? "").trim().toLowerCase().replace(/-/g, "_");
  const isDraft = statusLower === "draft" || statusLower === "";
  const isEditable = isDraft || statusLower === "info_requested";
  const deadlineOpen = isHostingBidDeadlineOpen(ev?.bid_deadline ?? bid?.event_bid_deadline ?? null);
  const missingFromApi = bid?.has_missing_docs === true;
  const missingRequiredUploads =
    required.length > 0 ? !bidHasAllRequiredDocuments(required, docs) : false;
  const cannotSubmitMissing = missingFromApi || missingRequiredUploads;

  return (
    <div class="flex flex-1 flex-col min-h-0 min-w-0 bg-background text-on-background">
      <ApproverPortalNav activeItem="myBids" title={ev?.title?.trim() || bid?.event_title?.trim() || "Bid"} />

      <main class="min-h-0 flex-1 min-w-0 w-full pt-28 px-4 sm:px-8 pb-16">
        <nav class="max-w-3xl mb-6 text-sm text-on-surface-variant">
          <a class="font-semibold text-primary hover:underline" href="/approver/my-bids/">
            My bids
          </a>
          <span class="mx-2">/</span>
          <span class="text-on-surface">Documents & submit</span>
        </nav>

        {loading.value ? (
          <p class="text-on-surface-variant">Loading bid…</p>
        ) : loadError.value ? (
          <div class="max-w-3xl rounded-xl border border-error/30 bg-error/5 p-4 text-error">{loadError.value}</div>
        ) : !bid ? (
          <p class="text-on-surface-variant">No bid.</p>
        ) : (
          <div class="mx-auto flex max-w-3xl flex-col gap-8">
            <header class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
              <p class="text-[11px] font-bold uppercase tracking-widest text-outline">Hosting bid</p>
              <h1 class="mt-2 text-2xl font-extrabold font-headline text-primary">
                {ev?.title?.trim() || bid.event_title?.trim() || "Opportunity"}
              </h1>
              <div class="mt-4 flex flex-wrap gap-3 text-sm">
                <span class="rounded-full bg-surface-container-high px-3 py-1 font-semibold text-on-surface">
                  Bid status: {bidStatusLabel(bid.status)}
                </span>
                {ev ? (
                  <span class="rounded-full bg-surface-container-high px-3 py-1 text-on-surface-variant">
                    Event: {biddingEventStatusLabel(ev.status)}
                  </span>
                ) : null}
              </div>
              <dl class="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Organisation</dt>
                  <dd class="font-semibold text-on-surface">{bid.organisation_name?.trim() || "—"}</dd>
                </div>
                <div>
                  <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Bid deadline</dt>
                  <dd class="text-on-surface">
                    {(ev?.bid_deadline ?? bid.event_bid_deadline)
                      ? formatDateTime(ev?.bid_deadline ?? bid.event_bid_deadline ?? "")
                      : "—"}
                    {!deadlineOpen && (ev?.bid_deadline ?? bid.event_bid_deadline) ? (
                      <span class="ml-2 text-xs font-bold text-error">(closed)</span>
                    ) : null}
                  </dd>
                </div>
              </dl>
              {bid.event_id ? (
                <p class="mt-4 text-sm">
                  <a
                    class="font-semibold text-primary underline"
                    href={`/approver/bidding-events/${encodeURIComponent(String(bid.event_id))}/`}
                  >
                    View event details & bid pack
                  </a>
                </p>
              ) : null}
            </header>

            <section class="rounded-2xl border border-outline-variant/15 bg-white p-6 shadow-sm">
              <h2 class="text-lg font-bold text-primary">Required documents</h2>
              <p class="mt-2 text-sm text-on-surface-variant">
                Upload each required type (matches <code class="text-xs font-mono">events.required_documents</code>
                ). Replace by uploading again for the same type.
              </p>

              {required.length === 0 ? (
                <p class="mt-4 text-sm text-on-surface-variant">
                  No document types are listed for this event. You may still be able to submit if the server allows it.
                </p>
              ) : (
                <ul class="mt-6 space-y-6">
                  {required.map((docType) => {
                    const uploaded = docs.filter((d) => d.document_type.trim() === docType.trim());
                    const latest = uploaded[uploaded.length - 1];
                    const isMissingFromSubmit = missingSlugs.value.includes(docType.trim());
                    return (
                      <li
                        key={docType}
                        class={
                          "rounded-xl border bg-surface-container-lowest p-4 " +
                          (isMissingFromSubmit ? "border-error/40" : "border-outline-variant/20")
                        }
                      >
                        <div class="flex flex-wrap items-center justify-between gap-2">
                          <span class="font-mono text-sm font-semibold text-on-surface">{docType}</span>
                          {uploadedTypes.has(docType.trim()) ? (
                            <span class="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                              Uploaded
                            </span>
                          ) : (
                            <span class="rounded-full bg-error/10 px-2 py-0.5 text-xs font-bold text-error">
                              Missing
                            </span>
                          )}
                        </div>
                        {isMissingFromSubmit ? (
                          <p class="mt-2 text-xs font-semibold text-error">Required for submission.</p>
                        ) : null}
                        {latest ? (
                          <p class="mt-2 text-xs text-on-surface-variant">
                            Latest: {latest.file_name?.trim() || latest.id}
                            {latest.uploaded_at ? ` · ${formatDateTime(latest.uploaded_at)}` : ""}
                          </p>
                        ) : null}
                        <div class="mt-3 flex flex-wrap items-center gap-3">
                          <input
                            type="file"
                            class="max-w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-on-primary"
                            disabled={uploadBusy.value || !isEditable}
                            onChange$={(_, el) => {
                              void onUpload$(bid.id, docType, el.files);
                            }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {uploadError.value ? (
                <p class="mt-4 text-sm text-error" role="alert">
                  {uploadError.value}
                </p>
              ) : null}
            </section>

            {docs.length > 0 && required.length === 0 ? (
              <section class="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4 text-sm text-on-surface-variant">
                <p class="font-semibold text-on-surface">Uploaded files ({docs.length})</p>
                <ul class="mt-2 list-disc space-y-1 pl-5">
                  {docs.map((d: ApiBidDocument) => (
                    <li key={d.id}>
                      <span class="font-mono text-xs">{d.document_type}</span>
                      {d.file_name ? ` — ${d.file_name}` : ""}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section class="rounded-2xl border border-outline-variant/15 bg-white p-6 shadow-sm">
              <h2 class="text-lg font-bold text-primary">Bid details (optional)</h2>
              <p class="mt-2 text-sm text-on-surface-variant">
                Narrative fields saved to{" "}
                <code class="text-xs font-mono">PATCH /api/hosting/bids/{"{id}"}</code>. Editable in{" "}
                <strong>draft</strong> or <strong>info requested</strong> status.
              </p>

              {!isEditable ? (
                <p class="mt-4 text-sm font-semibold text-on-surface">
                  This bid cannot be edited in its current status ({bidStatusLabel(bid.status)}).
                </p>
              ) : null}

              <div class="mt-6 grid gap-6">
                <div>
                  <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="event_objectives">
                    Event objectives
                  </label>
                  <textarea
                    id="event_objectives"
                    class="w-full min-h-[6rem] rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={!isEditable || narrativeBusy.value}
                    value={narrative.event_objectives}
                    onInput$={(_, el) => (narrative.event_objectives = el.value)}
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="expected_benefits">
                    Expected benefits
                  </label>
                  <textarea
                    id="expected_benefits"
                    class="w-full min-h-[6rem] rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={!isEditable || narrativeBusy.value}
                    value={narrative.expected_benefits}
                    onInput$={(_, el) => (narrative.expected_benefits = el.value)}
                  />
                </div>

                <div class="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="total_budget">
                      Total budget
                    </label>
                    <input
                      id="total_budget"
                      class="w-full rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                      disabled={!isEditable || narrativeBusy.value}
                      value={narrative.total_budget}
                      onInput$={(_, el) => (narrative.total_budget = el.value)}
                      placeholder="e.g. USD 850,000"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="government_funding_pct">
                      Government funding %
                    </label>
                    <input
                      id="government_funding_pct"
                      class="w-full rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                      disabled={!isEditable || narrativeBusy.value}
                      value={narrative.government_funding_pct}
                      onInput$={(_, el) => (narrative.government_funding_pct = el.value)}
                      placeholder="e.g. 30"
                    />
                  </div>
                </div>

                <div class="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="income_breakdown">
                      Income breakdown
                    </label>
                    <textarea
                      id="income_breakdown"
                      class="w-full min-h-[5rem] rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                      disabled={!isEditable || narrativeBusy.value}
                      value={narrative.income_breakdown}
                      onInput$={(_, el) => (narrative.income_breakdown = el.value)}
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="expenditure_breakdown">
                      Expenditure breakdown
                    </label>
                    <textarea
                      id="expenditure_breakdown"
                      class="w-full min-h-[5rem] rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                      disabled={!isEditable || narrativeBusy.value}
                      value={narrative.expenditure_breakdown}
                      onInput$={(_, el) => (narrative.expenditure_breakdown = el.value)}
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="infrastructure_plan">
                    Infrastructure plan
                  </label>
                  <textarea
                    id="infrastructure_plan"
                    class="w-full min-h-[6rem] rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={!isEditable || narrativeBusy.value}
                    value={narrative.infrastructure_plan}
                    onInput$={(_, el) => (narrative.infrastructure_plan = el.value)}
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="competition_plan">
                    Competition plan
                  </label>
                  <textarea
                    id="competition_plan"
                    class="w-full min-h-[6rem] rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={!isEditable || narrativeBusy.value}
                    value={narrative.competition_plan}
                    onInput$={(_, el) => (narrative.competition_plan = el.value)}
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="risk_management_plan">
                    Risk management plan
                  </label>
                  <textarea
                    id="risk_management_plan"
                    class="w-full min-h-[6rem] rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={!isEditable || narrativeBusy.value}
                    value={narrative.risk_management_plan}
                    onInput$={(_, el) => (narrative.risk_management_plan = el.value)}
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="legacy_plan">
                    Legacy plan
                  </label>
                  <textarea
                    id="legacy_plan"
                    class="w-full min-h-[6rem] rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={!isEditable || narrativeBusy.value}
                    value={narrative.legacy_plan}
                    onInput$={(_, el) => (narrative.legacy_plan = el.value)}
                  />
                </div>
              </div>

              {narrativeError.value ? (
                <p class="mt-4 text-sm text-error" role="alert">
                  {narrativeError.value}
                </p>
              ) : null}
              {narrativeSaved.value ? (
                <p class="mt-4 text-sm font-semibold text-primary">Saved.</p>
              ) : null}

              <div class="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!isEditable || narrativeBusy.value || uploadBusy.value}
                  class="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-lg disabled:opacity-50"
                  onClick$={() => onSaveNarrative$(bid.id)}
                >
                  {narrativeBusy.value ? "Saving…" : "Save bid details"}
                </button>
              </div>
            </section>

            <section class="rounded-2xl border border-emerald-900/15 bg-emerald-950/5 p-6 shadow-sm">
              <h2 class="text-lg font-bold text-emerald-950">Submit bid</h2>
              <p class="mt-2 text-sm text-on-surface-variant">
                Calls <code class="rounded bg-surface-container-high px-1 text-xs">POST /api/hosting/bids/{"{id}"}/submit</code>
                . Ensure every required document type is uploaded first.
              </p>

              {!isDraft ? (
                <p class="mt-4 text-sm font-semibold text-on-surface">
                  This bid is no longer in draft ({bidStatusLabel(bid.status)}).
                </p>
              ) : null}
              {!deadlineOpen ? (
                <p class="mt-4 text-sm font-semibold text-error">The bid deadline has passed.</p>
              ) : null}
              {cannotSubmitMissing && isDraft && deadlineOpen ? (
                <p class="mt-4 text-sm text-error">
                  Complete all required uploads before submitting
                  {missingFromApi ? " (server reports missing documents)." : "."}
                </p>
              ) : null}

              {submitError.value ? (
                <p class="mt-4 text-sm text-error" role="alert">
                  {submitError.value}
                </p>
              ) : null}

              <div class="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={
                    submitBusy.value ||
                    !isDraft ||
                    !deadlineOpen ||
                    uploadBusy.value
                  }
                  class="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-lg disabled:opacity-50"
                  onClick$={() => onSubmit$(bid.id)}
                >
                  {submitBusy.value ? "Submitting…" : "Submit bid"}
                </button>
                <a
                  class="rounded-xl border border-outline-variant/40 px-6 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-low"
                  href="/approver/my-bids/"
                >
                  Back to list
                </a>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Bid workspace | Approver",
};
