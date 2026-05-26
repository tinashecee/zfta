import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { ApproverPortalNav } from "~/components/approver-portal-nav";
import {
  approveHostingBid,
  bidStatusLabel,
  loadBidWorkspaceContext,
  requestHostingBidInfo,
  type ApiBid,
  type ApiBidDocument,
} from "~/lib/bidding-api";
import { formatDateTime } from "~/lib/application-display";
import { getCurrentUser } from "~/lib/auth";
import { redirectPathIfNoHostingManageAccess } from "~/lib/hosting-access";

function toRfc3339FromLocalInput(v: string): string {
  const t = v.trim();
  if (!t) return "";
  if (t.endsWith("Z") || /[+-]\d\d:\d\d$/.test(t)) return t;
  const ms = Date.parse(t);
  if (!Number.isFinite(ms)) return t;
  return new Date(ms).toISOString();
}

export default component$(() => {
  const location = useLocation();
  const loading = useSignal(true);
  const loadError = useSignal<string | null>(null);

  const bidId = useSignal("");
  const bid = useSignal<ApiBid | null>(null);
  const eventTitle = useSignal<string>("");
  const docs = useSignal<ApiBidDocument[]>([]);

  const actionBusy = useSignal(false);
  const actionError = useSignal<string | null>(null);

  const infoMessage = useSignal("");
  const infoDeadline = useSignal("");

  useVisibleTask$(async ({ track }) => {
    track(() => location.params.bidId);
    const u = getCurrentUser();
    const denied = redirectPathIfNoHostingManageAccess(u);
    if (denied) {
      window.location.assign(denied);
      return;
    }

    const id = location.params.bidId?.trim() ?? "";
    bidId.value = id;
    if (!id) {
      loading.value = false;
      loadError.value = "Missing bid id.";
      return;
    }

    loading.value = true;
    loadError.value = null;
    const r = await loadBidWorkspaceContext(id);
    loading.value = false;
    if (!r.ok) {
      loadError.value = r.error;
      return;
    }

    bid.value = r.data.bid;
    docs.value = r.data.documents;
    eventTitle.value = r.data.event?.title?.trim() || r.data.bid.event_title?.trim() || "Bid";
  });

  const refresh$ = $(async () => {
    if (!bidId.value) return;
    const r = await loadBidWorkspaceContext(bidId.value);
    if (r.ok) {
      bid.value = r.data.bid;
      docs.value = r.data.documents;
      eventTitle.value = r.data.event?.title?.trim() || r.data.bid.event_title?.trim() || "Bid";
    }
  });

  const onApprove$ = $(async () => {
    if (!bidId.value) return;
    actionError.value = null;
    actionBusy.value = true;
    const r = await approveHostingBid(bidId.value);
    actionBusy.value = false;
    if (!r.ok) {
      actionError.value = r.error;
      return;
    }
    await refresh$();
  });

  const onRequestInfo$ = $(async () => {
    if (!bidId.value) return;
    actionError.value = null;
    actionBusy.value = true;
    const r = await requestHostingBidInfo(bidId.value, {
      message: infoMessage.value.trim(),
      deadline: toRfc3339FromLocalInput(infoDeadline.value),
    });
    actionBusy.value = false;
    if (!r.ok) {
      actionError.value = r.error;
      return;
    }
    infoMessage.value = "";
    infoDeadline.value = "";
    await refresh$();
  });

  const b = bid.value;

  return (
    <div class="flex flex-1 flex-col min-h-0 min-w-0 bg-background text-on-background">
      <ApproverPortalNav activeItem="submittedBids" title={eventTitle.value || "Submitted bid"} />

      <main class="min-h-0 flex-1 min-w-0 w-full pt-28 px-4 sm:px-8 pb-12">
        <div class="mx-auto flex max-w-4xl flex-col gap-6">
          <nav class="text-sm text-on-surface-variant">
            <a class="font-semibold text-primary hover:underline" href="/approver/submitted-bids/">
              Submitted bids
            </a>
            <span class="mx-2">/</span>
            <span class="text-on-surface">View</span>
          </nav>

          {loading.value ? (
            <p class="text-on-surface-variant">Loading bid…</p>
          ) : loadError.value ? (
            <div class="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{loadError.value}</div>
          ) : !b ? (
            <p class="text-on-surface-variant">No bid.</p>
          ) : (
            <>
              <header class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-widest text-outline">Hosting bid</p>
                <h1 class="mt-2 text-2xl font-extrabold font-headline text-primary">{eventTitle.value}</h1>
                <div class="mt-4 flex flex-wrap gap-3 text-sm">
                  <span class="rounded-full bg-surface-container-high px-3 py-1 font-semibold text-on-surface">
                    Status: {bidStatusLabel(b.status)}
                  </span>
                  <span class="rounded-full bg-surface-container-high px-3 py-1 text-on-surface-variant">
                    Docs: {b.document_count ?? docs.value.length ?? "—"}
                  </span>
                </div>
                <dl class="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Organisation</dt>
                    <dd class="font-semibold text-on-surface">{b.organisation_name?.trim() || "—"}</dd>
                  </div>
                  <div>
                    <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Submitted</dt>
                    <dd class="text-on-surface">{b.submitted_at ? formatDateTime(b.submitted_at) : "—"}</dd>
                  </div>
                </dl>
              </header>

              <section class="rounded-2xl border border-outline-variant/15 bg-white p-6 shadow-sm">
                <h2 class="text-lg font-bold text-primary">Uploaded documents</h2>
                {docs.value.length === 0 ? (
                  <p class="mt-3 text-sm text-on-surface-variant">No documents uploaded yet.</p>
                ) : (
                  <ul class="mt-4 space-y-3">
                    {docs.value.map((d) => (
                      <li key={d.id} class="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                          <span class="font-mono text-sm font-semibold">{d.document_type}</span>
                          {d.file_url ? (
                            <a class="text-primary font-semibold underline" href={d.file_url} target="_blank" rel="noreferrer">
                              Download
                            </a>
                          ) : null}
                        </div>
                        <p class="mt-2 text-xs text-on-surface-variant">
                          {d.file_name?.trim() || d.id}
                          {d.uploaded_at ? ` · ${formatDateTime(d.uploaded_at)}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {actionError.value ? (
                <div class="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{actionError.value}</div>
              ) : null}

              <section class="rounded-2xl border border-outline-variant/15 bg-white p-6 shadow-sm">
                <h2 class="text-lg font-bold text-primary">SRC actions</h2>
                <div class="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={actionBusy.value}
                    class="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-lg disabled:opacity-50"
                    onClick$={onApprove$}
                  >
                    {actionBusy.value ? "Working…" : "Approve (winner)"}
                  </button>
                </div>

                <div class="mt-6 border-t border-outline-variant/20 pt-6">
                  <h3 class="text-sm font-bold text-on-surface">Request more information</h3>
                  <div class="mt-4 space-y-4">
                    <div>
                      <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="infoMessageSrc">
                        Message
                      </label>
                      <textarea
                        id="infoMessageSrc"
                        class="w-full min-h-[6rem] rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                        value={infoMessage.value}
                        onInput$={(_, el) => (infoMessage.value = el.value)}
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="infoDeadlineSrc">
                        Deadline
                      </label>
                      <input
                        id="infoDeadlineSrc"
                        type="datetime-local"
                        class="w-full rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                        value={infoDeadline.value}
                        onInput$={(_, el) => (infoDeadline.value = el.value)}
                      />
                    </div>
                  </div>
                  <div class="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={actionBusy.value}
                      class="rounded-xl border border-outline-variant/40 px-6 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-low disabled:opacity-50"
                      onClick$={onRequestInfo$}
                    >
                      {actionBusy.value ? "Working…" : "Send request"}
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "View submitted bid | Approver",
};
