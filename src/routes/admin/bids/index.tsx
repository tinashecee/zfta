import { $, component$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { AdminPortalNav } from "~/components/admin-portal-nav";
import {
  approveHostingBid,
  bidStatusLabel,
  getHostingEventBids,
  listHostingEvents,
  requestHostingBidInfo,
  type ApiBid,
  type ApiBiddingEvent,
} from "~/lib/bidding-api";
import { formatDateTime } from "~/lib/application-display";
import { getCurrentUser } from "~/lib/auth";

function toRfc3339FromLocalInput(v: string): string {
  // Accept either RFC3339 already, or `YYYY-MM-DDTHH:mm` from <input type="datetime-local">.
  const t = v.trim();
  if (!t) return "";
  if (t.endsWith("Z") || /[+-]\d\d:\d\d$/.test(t)) return t;
  const ms = Date.parse(t);
  if (!Number.isFinite(ms)) return t;
  return new Date(ms).toISOString();
}

export default component$(() => {
  const location = useLocation();
  const events = useStore<ApiBiddingEvent[]>([]);
  const bids = useStore<ApiBid[]>([]);
  const selectedEventId = useSignal<string>("");

  const loadingEvents = useSignal(true);
  const loadingBids = useSignal(false);
  const loadError = useSignal<string | null>(null);

  const infoBidId = useSignal<string | null>(null);
  const infoMessage = useSignal("");
  const infoDeadline = useSignal("");
  const actionBusy = useSignal(false);
  const actionError = useSignal<string | null>(null);

  useVisibleTask$(async ({ track }) => {
    track(() => location.url.search);
    const u = getCurrentUser();
    if (u?.role !== "system_admin") {
      window.location.assign("/sign-in/");
      return;
    }

    // Load events for picker.
    loadingEvents.value = true;
    loadError.value = null;
    const er = await listHostingEvents({ limit: 200, offset: 0 });
    loadingEvents.value = false;
    if (!er.ok) {
      loadError.value = er.error;
      return;
    }
    events.length = 0;
    for (const e of er.data) events.push(e);

    const q = location.url.searchParams.get("event_id")?.trim() ?? "";
    selectedEventId.value = q;
    bids.length = 0;
    if (!q) return;

    loadingBids.value = true;
    const br = await getHostingEventBids(q);
    loadingBids.value = false;
    if (!br.ok) {
      loadError.value = br.error;
      return;
    }
    for (const b of br.data) bids.push(b);
  });

  const onPickEvent$ = $((value: string) => {
    const v = value.trim();
    selectedEventId.value = v;
    const u = new URL(window.location.href);
    if (v) u.searchParams.set("event_id", v);
    else u.searchParams.delete("event_id");
    window.location.assign(u.pathname + (u.search ? `?${u.searchParams.toString()}` : ""));
  });

  const onApprove$ = $(async (bidId: string) => {
    actionError.value = null;
    actionBusy.value = true;
    const r = await approveHostingBid(bidId);
    actionBusy.value = false;
    if (!r.ok) {
      actionError.value = r.error;
      return;
    }
    // Refresh bids for current event.
    const eid = selectedEventId.value.trim();
    if (!eid) return;
    loadingBids.value = true;
    const br = await getHostingEventBids(eid);
    loadingBids.value = false;
    if (!br.ok) {
      loadError.value = br.error;
      return;
    }
    bids.length = 0;
    for (const b of br.data) bids.push(b);
  });

  const openRequestInfo$ = $((bidId: string) => {
    infoBidId.value = bidId;
    infoMessage.value = "";
    infoDeadline.value = "";
    actionError.value = null;
  });

  const onSendRequestInfo$ = $(async () => {
    const bidId = infoBidId.value;
    if (!bidId) return;
    actionError.value = null;
    actionBusy.value = true;
    const r = await requestHostingBidInfo(bidId, {
      message: infoMessage.value.trim(),
      deadline: toRfc3339FromLocalInput(infoDeadline.value),
    });
    actionBusy.value = false;
    if (!r.ok) {
      actionError.value = r.error;
      return;
    }
    infoBidId.value = null;

    const eid = selectedEventId.value.trim();
    if (!eid) return;
    loadingBids.value = true;
    const br = await getHostingEventBids(eid);
    loadingBids.value = false;
    if (!br.ok) {
      loadError.value = br.error;
      return;
    }
    bids.length = 0;
    for (const b of br.data) bids.push(b);
  });

  return (
    <div class="min-h-screen bg-background text-on-background">
      <AdminPortalNav activeItem="overview" />

      <main class="min-h-screen pt-20 lg:pl-64">
        <div class="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:p-10">
          <header>
            <h1 class="font-headline text-3xl font-extrabold tracking-tight text-primary">Submitted bids</h1>
            <p class="mt-2 text-on-surface-variant">
              Pick an event to load <code class="text-xs font-mono">GET /api/hosting/events/{"{id}"}/bids</code>.
            </p>
          </header>

          {actionError.value ? (
            <div class="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
              {actionError.value}
            </div>
          ) : null}
          {loadError.value ? (
            <div class="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
              {loadError.value}
            </div>
          ) : null}

          <section class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
            <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="eventPicker">
              Event
            </label>
            <select
              id="eventPicker"
              class="w-full rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loadingEvents.value}
              value={selectedEventId.value}
              onChange$={(_, el) => onPickEvent$(el.value)}
            >
              <option value="">Select an event…</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </section>

          <div class="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
            <table class="w-full min-w-[60rem] border-collapse text-left text-sm">
              <thead>
                <tr class="bg-surface-container-low">
                  <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline">Organisation</th>
                  <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline">Status</th>
                  <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline">Docs</th>
                  <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline">Submitted</th>
                  <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/10">
                {loadingBids.value ? (
                  <tr>
                    <td class="px-4 py-10 text-center text-outline" colSpan={5}>
                      Loading bids…
                    </td>
                  </tr>
                ) : !selectedEventId.value ? (
                  <tr>
                    <td class="px-4 py-10 text-center text-on-surface-variant" colSpan={5}>
                      Pick an event to view bids.
                    </td>
                  </tr>
                ) : bids.length === 0 ? (
                  <tr>
                    <td class="px-4 py-10 text-center text-on-surface-variant" colSpan={5}>
                      No bids for this event.
                    </td>
                  </tr>
                ) : (
                  bids.map((b) => (
                    <tr key={b.id} class="hover:bg-surface-container-low/80">
                      <td class="px-4 py-3 font-semibold text-on-surface break-words">
                        {b.organisation_name?.trim() || "—"}
                      </td>
                      <td class="px-4 py-3">{bidStatusLabel(b.status)}</td>
                      <td class="px-4 py-3 text-on-surface-variant">
                        {b.document_count != null ? b.document_count : "—"}
                      </td>
                      <td class="px-4 py-3 text-outline whitespace-nowrap">
                        {b.submitted_at ? formatDateTime(b.submitted_at) : "—"}
                      </td>
                      <td class="px-4 py-3 text-right">
                        <div class="flex flex-wrap justify-end gap-2">
                          <a
                            class="rounded-lg border border-outline-variant/40 px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-low"
                            href={`/admin/bids/${encodeURIComponent(b.id)}/`}
                          >
                            View
                          </a>
                          <button
                            type="button"
                            disabled={actionBusy.value}
                            class="rounded-lg border border-outline-variant/40 px-3 py-2 text-xs font-bold text-on-surface disabled:opacity-50"
                            onClick$={() => openRequestInfo$(b.id)}
                          >
                            Request info
                          </button>
                          <button
                            type="button"
                            disabled={actionBusy.value}
                            class="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-on-primary disabled:opacity-50"
                            onClick$={() => onApprove$(b.id)}
                          >
                            Approve (winner)
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {infoBidId.value ? (
            <section class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
              <h2 class="text-lg font-bold text-primary">Request more information</h2>
              <p class="mt-2 text-sm text-on-surface-variant">
                Sends <code class="text-xs font-mono">POST /api/hosting/bids/{"{id}"}/request-info</code>.
              </p>

              <div class="mt-4 space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="infoMessage">
                    Message
                  </label>
                  <textarea
                    id="infoMessage"
                    class="w-full min-h-[6rem] rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                    value={infoMessage.value}
                    onInput$={(_, el) => (infoMessage.value = el.value)}
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="infoDeadline">
                    Deadline (RFC3339)
                  </label>
                  <input
                    id="infoDeadline"
                    type="datetime-local"
                    class="w-full rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                    value={infoDeadline.value}
                    onInput$={(_, el) => (infoDeadline.value = el.value)}
                  />
                  <p class="mt-1 text-xs text-on-surface-variant">
                    Converted to RFC3339 before sending.
                  </p>
                </div>
              </div>

              <div class="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={actionBusy.value}
                  class="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-lg disabled:opacity-50"
                  onClick$={onSendRequestInfo$}
                >
                  {actionBusy.value ? "Sending…" : "Send request"}
                </button>
                <button
                  type="button"
                  class="rounded-xl border border-outline-variant/40 px-6 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-low"
                  onClick$={() => (infoBidId.value = null)}
                >
                  Cancel
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Submitted bids | Admin",
};

