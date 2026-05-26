import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { ApproverPortalNav } from "~/components/approver-portal-nav";
import {
  bidStatusLabel,
  biddingEventStatusLabel,
  createHostingBid,
  getHostingEvent,
  hostingEventSportMatchesCatalogKey,
  isHostingBidDeadlineOpen,
  type ApiBid,
  type ApiBiddingEvent,
} from "~/lib/bidding-api";
import { formatDateTime, formatIsoDate } from "~/lib/application-display";
import { getCurrentUser } from "~/lib/auth";
import {
  isSportBodyReviewerSession,
  isSrcReviewerSession,
  redirectPathIfNoHostingBidAccess,
} from "~/lib/hosting-access";
import { getOrganisation, organisationDisplayName } from "~/lib/organisations-api";
import { resolveCurrentReviewerSportBodyContext } from "~/lib/reviewer-sport-body";

export default component$(() => {
  const location = useLocation();
  const loading = useSignal(true);
  const loadError = useSignal<string | null>(null);
  const event = useSignal<ApiBiddingEvent | null>(null);
  const existingBid = useSignal<ApiBid | null>(null);
  const reviewerSportKey = useSignal<string | null>(null);

  const orgNameInput = useSignal("");
  const acceptedRules = useSignal(false);
  const submitBusy = useSignal(false);
  const submitError = useSignal<string | null>(null);
  const sessionRole = useSignal<string | null>(null);

  useVisibleTask$(async ({ track }) => {
    track(() => location.params.eventId);
    const eventId = location.params.eventId?.trim() ?? "";
    const u = getCurrentUser();
    sessionRole.value = u?.role ?? null;
    if (isSrcReviewerSession(u)) {
      window.location.assign("/approver/hosting-events/");
      return;
    }
    const denied = redirectPathIfNoHostingBidAccess(u);
    if (denied) {
      window.location.assign(denied);
      return;
    }
    if (!eventId) {
      loading.value = false;
      loadError.value = "Missing event.";
      return;
    }

    loading.value = true;
    loadError.value = null;
    submitError.value = null;
    event.value = null;
    existingBid.value = null;
    reviewerSportKey.value = null;

    if (u?.role !== "system_admin" && isSportBodyReviewerSession(u)) {
      const ctx = await resolveCurrentReviewerSportBodyContext();
      if (!ctx.ok) {
        loading.value = false;
        loadError.value = ctx.error;
        return;
      }
      reviewerSportKey.value = ctx.sportKey;
    }

    const gr = await getHostingEvent(eventId);
    loading.value = false;
    if (!gr.ok) {
      loadError.value = gr.error;
      return;
    }
    event.value = gr.data.event;
    existingBid.value = gr.data.bid ?? null;

    const orgId = String(u?.organisation_id ?? "").trim();
    if (orgId) {
      const orgR = await getOrganisation(orgId);
      if (orgR.ok) {
        orgNameInput.value = organisationDisplayName(orgR.data).trim();
      }
    }
  });

  const apply$ = $(async () => {
    submitError.value = null;
    const ev = event.value;
    const eventId = location.params.eventId?.trim() ?? "";
    const u = getCurrentUser();
    if (!ev || !eventId || !u?.id) {
      submitError.value = "Missing event or session.";
      return;
    }
    if (u.role === "system_admin") {
      submitError.value = "Bids must be started from a sport-body reviewer account.";
      return;
    }
    if (!acceptedRules.value) {
      submitError.value = "Confirm that you have read the requirements and bid pack.";
      return;
    }
    const organisation_name = orgNameInput.value.trim();
    if (!organisation_name) {
      submitError.value = "Organisation name is required.";
      return;
    }

    submitBusy.value = true;
    const r = await createHostingBid(eventId, { organisation_name });
    submitBusy.value = false;
    if (!r.ok) {
      submitError.value = r.error;
      return;
    }
    window.location.assign("/approver/my-bids/");
  });

  const ev = event.value;
  const st = (ev?.status ?? "").trim().toLowerCase();
  const deadlineOpen = ev ? isHostingBidDeadlineOpen(ev.bid_deadline) : false;
  const sportOk =
    reviewerSportKey.value == null || !ev
      ? true
      : hostingEventSportMatchesCatalogKey(ev.sport, reviewerSportKey.value);

  const canStartBid =
    Boolean(ev) &&
    st === "open_for_bids" &&
    deadlineOpen &&
    sportOk &&
    !existingBid.value &&
    sessionRole.value !== "system_admin";

  const docs = ev?.required_documents?.length ? ev.required_documents : [];

  return (
    <div class="flex flex-1 flex-col min-h-0 min-w-0 bg-background text-on-background">
      <ApproverPortalNav activeItem="biddingEvents" title={ev?.title ?? "Opportunity"} />

      <main class="min-h-0 flex-1 min-w-0 w-full pt-28 px-4 sm:px-8 pb-16">
        <nav class="max-w-3xl mb-6 text-sm text-on-surface-variant">
          <a class="font-semibold text-primary hover:underline" href="/approver/bidding-events/">
            Bidding events
          </a>
          <span class="mx-2">/</span>
          <span class="text-on-surface">Details</span>
        </nav>

        {loading.value ? (
          <p class="text-on-surface-variant">Loading…</p>
        ) : loadError.value ? (
          <div class="max-w-3xl rounded-xl border border-error/30 bg-error/5 p-4 text-error">{loadError.value}</div>
        ) : !ev ? (
          <p class="text-on-surface-variant">No event.</p>
        ) : (
          <div class="mx-auto flex max-w-3xl flex-col gap-8">
            <header class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
              <p class="text-[11px] font-bold uppercase tracking-widest text-outline">Hosting opportunity</p>
              <h1 class="mt-2 text-2xl font-extrabold font-headline text-primary sm:text-3xl">{ev.title}</h1>
              <div class="mt-4 flex flex-wrap gap-3 text-sm">
                <span class="rounded-full bg-surface-container-high px-3 py-1 font-semibold text-on-surface">
                  Sport: {ev.sport ?? "—"}
                </span>
                <span class="rounded-full bg-surface-container-high px-3 py-1 font-semibold text-on-surface">
                  {biddingEventStatusLabel(ev.status)}
                </span>
                {ev.max_bids != null ? (
                  <span class="rounded-full bg-surface-container-high px-3 py-1 text-on-surface-variant">
                    Max bids: {ev.max_bids}
                  </span>
                ) : null}
                {ev.bid_count != null ? (
                  <span class="rounded-full bg-surface-container-high px-3 py-1 text-on-surface-variant">
                    Received: {ev.bid_count}
                  </span>
                ) : null}
              </div>
              <dl class="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Bid deadline</dt>
                  <dd class="font-semibold text-on-surface">
                    {ev.bid_deadline ? formatDateTime(ev.bid_deadline) : "—"}
                    {!deadlineOpen && ev.bid_deadline ? (
                      <span class="ml-2 text-xs font-bold text-error">(closed)</span>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Event dates</dt>
                  <dd class="text-on-surface">
                    {formatIsoDate(ev.event_start_date)} — {formatIsoDate(ev.event_end_date)}
                  </dd>
                </div>
                {ev.location?.trim() ? (
                  <div class="sm:col-span-2">
                    <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Location</dt>
                    <dd>{ev.location}</dd>
                  </div>
                ) : null}
              </dl>
            </header>

            {ev.description?.trim() ? (
              <section class="rounded-2xl border border-outline-variant/15 bg-white p-6 shadow-sm">
                <h2 class="text-lg font-bold text-primary">Overview</h2>
                <p class="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-on-surface">{ev.description}</p>
              </section>
            ) : null}

            <section class="rounded-2xl border border-outline-variant/15 bg-white p-6 shadow-sm">
              <h2 class="text-lg font-bold text-primary">Requirements & documents</h2>
              <p class="mt-2 text-sm text-on-surface-variant">
                You must upload each required document type before you can submit your bid (see{" "}
                <code class="rounded bg-surface-container-high px-1 text-xs">POST /api/hosting/bids/{"{id}"}/submit</code>
                ).
              </p>
              {docs.length ? (
                <ul class="mt-4 list-disc space-y-2 pl-5 text-sm font-medium text-on-surface">
                  {docs.map((d) => (
                    <li key={d} class="font-mono text-xs sm:text-sm">
                      {d}
                    </li>
                  ))}
                </ul>
              ) : (
                <p class="mt-4 text-sm text-on-surface-variant">No required document types listed for this event.</p>
              )}
              {ev.bid_pack_url?.trim() ? (
                <p class="mt-6">
                  <a
                    class="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-md"
                    href={ev.bid_pack_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span class="material-symbols-outlined text-xl">download</span>
                    Download bid pack
                  </a>
                </p>
              ) : null}
            </section>

            {!sportOk && reviewerSportKey.value ? (
              <div class="rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                This opportunity is for another sport. Your sport body is linked to{" "}
                <strong>{reviewerSportKey.value}</strong>.
              </div>
            ) : null}

            {existingBid.value ? (
              <div class="rounded-xl border border-primary/25 bg-primary/5 p-5">
                <p class="font-bold text-primary">You already have a bid for this event</p>
                <p class="mt-2 text-sm text-on-surface">
                  Status: <strong>{bidStatusLabel(existingBid.value.status)}</strong>. Open your bid workspace to upload
                  required documents and submit before the deadline.
                </p>
                <div class="mt-4 flex flex-wrap gap-3">
                  <a
                    class="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-md"
                    href={`/approver/my-bids/${encodeURIComponent(existingBid.value.id)}/`}
                  >
                    Upload documents &amp; submit
                  </a>
                  <a
                    class="inline-flex items-center justify-center rounded-xl border border-outline-variant/40 px-5 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-low"
                    href="/approver/my-bids/"
                  >
                    My bids list
                  </a>
                </div>
              </div>
            ) : null}

            {sessionRole.value === "system_admin" ? (
              <p class="rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
                Signed in as system admin — browse only. Publish and manage opportunities in the admin console; sport
                bodies start bids from an NSA reviewer account.
              </p>
            ) : null}

            {canStartBid ? (
              <section class="rounded-2xl border border-emerald-900/15 bg-emerald-950/5 p-6 shadow-sm">
                <h2 class="text-lg font-bold text-emerald-950">Start your bid</h2>
                <p class="mt-2 text-sm text-on-surface-variant">
                  This creates your bid record (<code class="text-xs">POST /api/hosting/events/{"{id}"}/bids</code>) using
                  your organisation name. You can then attach files and submit from My bids.
                </p>

                <label class="mt-6 flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    class="mt-1 rounded border-outline text-primary"
                    checked={acceptedRules.value}
                    onChange$={(_, el) => {
                      acceptedRules.value = el.checked;
                    }}
                  />
                  <span class="text-sm leading-snug text-on-surface">
                    I have read the overview, required documents, and any bid pack materials. I accept that my bid must
                    meet these requirements before submission.
                  </span>
                </label>

                <div class="mt-6 space-y-1.5">
                  <label class="block text-sm font-semibold text-on-surface-variant" for="org-name-bid">
                    Organisation name <span class="text-primary">*</span>
                  </label>
                  <input
                    id="org-name-bid"
                    class="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 font-body focus:ring-2 focus:ring-primary/30"
                    value={orgNameInput.value}
                    onInput$={(_, el) => {
                      orgNameInput.value = el.value;
                    }}
                  />
                </div>

                {submitError.value ? (
                  <div class="mt-4 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
                    {submitError.value}
                  </div>
                ) : null}

                <div class="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={submitBusy.value}
                    class="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-lg disabled:opacity-50"
                    onClick$={apply$}
                  >
                    {submitBusy.value ? "Starting…" : "Start bid application"}
                  </button>
                  <a
                    class="rounded-xl border border-outline-variant/40 px-6 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-low"
                    href="/approver/bidding-events/"
                  >
                    Back to list
                  </a>
                </div>
              </section>
            ) : null}

            {!canStartBid && !existingBid.value && sessionRole.value !== "system_admin" && sportOk ? (
              <div class="rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
                {st !== "open_for_bids"
                  ? "This opportunity is not open for new bids."
                  : !deadlineOpen
                    ? "The bid deadline has passed."
                    : null}
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Hosting opportunity | Approver",
};
