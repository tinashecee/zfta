import { $, component$, useComputed$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { ApproverPortalNav } from "~/components/approver-portal-nav";
import {
  approveHostingBid,
  bidStatusLabel,
  filterHostingEventsByBidWindowTab,
  getHostingEventBids,
  listHostingEvents,
  requestHostingBidInfo,
  type ApiBid,
  type ApiBiddingEvent,
} from "~/lib/bidding-api";
import { formatDateTime } from "~/lib/application-display";
import { getCurrentUser } from "~/lib/auth";
import { redirectPathIfNoHostingManageAccess } from "~/lib/hosting-access";

type BidWindowTab = "open" | "closed";

function parseBidWindowTab(raw: string | null | undefined): BidWindowTab {
  return raw?.trim().toLowerCase() === "closed" ? "closed" : "open";
}

function normalizeSearchQuery(raw: string): string {
  return raw.trim().toLowerCase();
}

function eventMatchesSearch(event: ApiBiddingEvent, query: string): boolean {
  if (!query) return true;
  const haystack = [event.title, event.sport, event.location, event.id]
    .map((v) => String(v ?? "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");
  return haystack.includes(query);
}

function bidMatchesSearch(bid: ApiBid, query: string): boolean {
  if (!query) return true;
  const haystack = [bid.organisation_name, bid.event_title, bid.id, bidStatusLabel(bid.status)]
    .map((v) => String(v ?? "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");
  return haystack.includes(query);
}

function toRfc3339FromLocalInput(v: string): string {
  const t = v.trim();
  if (!t) return "";
  if (t.endsWith("Z") || /[+-]\d\d:\d\d$/.test(t)) return t;
  const ms = Date.parse(t);
  if (!Number.isFinite(ms)) return t;
  return new Date(ms).toISOString();
}

async function reloadBidsForEvent(eventId: string, bids: ApiBid[]): Promise<string | null> {
  const br = await getHostingEventBids(eventId);
  if (!br.ok) return br.error;
  bids.length = 0;
  for (const b of br.data) bids.push(b);
  return null;
}

export default component$(() => {
  const location = useLocation();
  const events = useStore<ApiBiddingEvent[]>([]);
  const bids = useStore<ApiBid[]>([]);
  const selectedEventId = useSignal<string>("");
  const activeTab = useSignal<BidWindowTab>("open");
  const searchQuery = useSignal("");

  const loadingEvents = useSignal(true);
  const loadingBids = useSignal(false);
  const loadError = useSignal<string | null>(null);

  const infoBidId = useSignal<string | null>(null);
  const infoMessage = useSignal("");
  const infoDeadline = useSignal("");
  const actionBusy = useSignal(false);
  const actionError = useSignal<string | null>(null);

  const filteredEvents = useComputed$(() => {
    const q = normalizeSearchQuery(searchQuery.value);
    return filterHostingEventsByBidWindowTab(events, activeTab.value).filter((ev) => eventMatchesSearch(ev, q));
  });
  const filteredBids = useComputed$(() => {
    const q = normalizeSearchQuery(searchQuery.value);
    return bids.filter((b) => bidMatchesSearch(b, q));
  });
  const openEventCount = useComputed$(() => filterHostingEventsByBidWindowTab(events, "open").length);
  const closedEventCount = useComputed$(() => filterHostingEventsByBidWindowTab(events, "closed").length);

  const setTabInUrl$ = $((tab: BidWindowTab, eventId?: string, q?: string) => {
    const u = new URL(window.location.href);
    u.searchParams.set("tab", tab);
    if (eventId?.trim()) u.searchParams.set("event_id", eventId.trim());
    else u.searchParams.delete("event_id");
    const query = (q ?? searchQuery.value).trim();
    if (query) u.searchParams.set("q", query);
    else u.searchParams.delete("q");
    window.history.replaceState({}, "", u.pathname + (u.search ? `?${u.searchParams.toString()}` : ""));
  });

  useVisibleTask$(async ({ track }) => {
    track(() => location.url.search);
    const u = getCurrentUser();
    const denied = redirectPathIfNoHostingManageAccess(u);
    if (denied) {
      window.location.assign(denied);
      return;
    }

    activeTab.value = parseBidWindowTab(location.url.searchParams.get("tab"));
    searchQuery.value = location.url.searchParams.get("q")?.trim() ?? "";

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

    const tabEvents = filterHostingEventsByBidWindowTab(events, activeTab.value);
    const q = normalizeSearchQuery(searchQuery.value);
    const searchableTabEvents = q ? tabEvents.filter((ev) => eventMatchesSearch(ev, q)) : tabEvents;
    const requestedEventId = location.url.searchParams.get("event_id")?.trim() ?? "";
    const eventId = searchableTabEvents.some((e) => e.id === requestedEventId)
      ? requestedEventId
      : searchableTabEvents[0]?.id ?? tabEvents[0]?.id ?? "";

    selectedEventId.value = eventId;
    bids.length = 0;
    if (!eventId) return;

    loadingBids.value = true;
    const bidErr = await reloadBidsForEvent(eventId, bids);
    loadingBids.value = false;
    if (bidErr) loadError.value = bidErr;
  });

  const onSearchInput$ = $(async (value: string) => {
    searchQuery.value = value;
    await setTabInUrl$(activeTab.value, selectedEventId.value, value);
  });

  const onPickEvent$ = $(async (value: string) => {
    const v = value.trim();
    selectedEventId.value = v;
    await setTabInUrl$(activeTab.value, v);
    bids.length = 0;
    if (!v) return;

    loadingBids.value = true;
    loadError.value = null;
    const bidErr = await reloadBidsForEvent(v, bids);
    loadingBids.value = false;
    if (bidErr) loadError.value = bidErr;
  });

  const onSwitchTab$ = $(async (tab: BidWindowTab) => {
    if (activeTab.value === tab) return;
    activeTab.value = tab;
    infoBidId.value = null;
    actionError.value = null;
    loadError.value = null;

    const tabEvents = filterHostingEventsByBidWindowTab(events, tab);
    const q = normalizeSearchQuery(searchQuery.value);
    const searchableTabEvents = q ? tabEvents.filter((ev) => eventMatchesSearch(ev, q)) : tabEvents;
    const nextEventId =
      searchableTabEvents.some((e) => e.id === selectedEventId.value)
        ? selectedEventId.value
        : searchableTabEvents[0]?.id ?? tabEvents[0]?.id ?? "";

    selectedEventId.value = nextEventId;
    await setTabInUrl$(tab, nextEventId);
    bids.length = 0;
    if (!nextEventId) return;

    loadingBids.value = true;
    const bidErr = await reloadBidsForEvent(nextEventId, bids);
    loadingBids.value = false;
    if (bidErr) loadError.value = bidErr;
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
    const eid = selectedEventId.value.trim();
    if (!eid) return;
    loadingBids.value = true;
    const bidErr = await reloadBidsForEvent(eid, bids);
    loadingBids.value = false;
    if (bidErr) loadError.value = bidErr;
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
    const bidErr = await reloadBidsForEvent(eid, bids);
    loadingBids.value = false;
    if (bidErr) loadError.value = bidErr;
  });

  const tabBtnClass = (tab: BidWindowTab) =>
    tab === activeTab.value
      ? "rounded-t-xl border border-b-0 border-outline-variant/25 bg-surface-container-lowest px-5 py-3 text-sm font-bold text-primary"
      : "rounded-t-xl border border-transparent px-5 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low/80 hover:text-on-surface";

  return (
    <div class="flex flex-1 flex-col min-h-0 min-w-0 bg-background text-on-background">
      <ApproverPortalNav activeItem="submittedBids" title="Submitted bids · SRC" />

      <main class="min-h-0 flex-1 min-w-0 w-full pt-28 px-4 sm:px-8 pb-12">
        <div class="mx-auto flex max-w-6xl flex-col gap-6">
          <header>
            <h1 class="font-headline text-3xl font-extrabold tracking-tight text-primary">Submitted bids</h1>
            <p class="mt-2 text-on-surface-variant text-sm">
              Review bid applications from sport bodies. Open events are still accepting bids; closed events have
              finished bidding.
            </p>
          </header>

          <div class="relative w-full max-w-xl">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary/30"
              placeholder="Search organisation, event, sport, or status…"
              value={searchQuery.value}
              onInput$={(_, el) => onSearchInput$(el.value)}
            />
          </div>

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

          <div>
            <div class="flex flex-wrap gap-1 border-b border-outline-variant/25">
              <button type="button" class={tabBtnClass("open")} onClick$={() => onSwitchTab$("open")}>
                Open bids
                <span class="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  {openEventCount.value}
                </span>
              </button>
              <button type="button" class={tabBtnClass("closed")} onClick$={() => onSwitchTab$("closed")}>
                Closed bids
                <span class="ml-2 rounded-full bg-outline/10 px-2 py-0.5 text-xs font-bold text-on-surface-variant">
                  {closedEventCount.value}
                </span>
              </button>
            </div>

            <section class="rounded-b-xl rounded-tr-xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
              <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="eventPicker">
                {activeTab.value === "open" ? "Open event" : "Closed event"}
              </label>
              <select
                id="eventPicker"
                class="w-full rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                disabled={loadingEvents.value}
                value={selectedEventId.value}
                onChange$={(_, el) => onPickEvent$(el.value)}
              >
                {filteredEvents.value.length === 0 ? (
                  <option value="">
                    {normalizeSearchQuery(searchQuery.value)
                      ? "No events match your search"
                      : activeTab.value === "open"
                        ? "No open events"
                        : "No closed events"}
                  </option>
                ) : (
                  <>
                    <option value="">Select an event…</option>
                    {filteredEvents.value.map((e) => {
                      const bidCountSuffix =
                        e.bid_count != null ? ` (${e.bid_count} bid${e.bid_count === 1 ? "" : "s"})` : "";
                      return (
                        <option key={e.id} value={e.id}>
                          {`${e.title}${bidCountSuffix}`}
                        </option>
                      );
                    })}
                  </>
                )}
              </select>
              <p class="mt-2 text-xs text-on-surface-variant">
                {activeTab.value === "open"
                  ? "Events with status open for bids."
                  : "Events that are closed or awarded."}
              </p>
            </section>
          </div>

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
                ) : filteredEvents.value.length === 0 ? (
                  <tr>
                    <td class="px-4 py-10 text-center text-on-surface-variant" colSpan={5}>
                      {normalizeSearchQuery(searchQuery.value)
                        ? "No events match your search on this tab."
                        : activeTab.value === "open"
                          ? "No open hosting events yet."
                          : "No closed or awarded events yet."}
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
                ) : filteredBids.value.length === 0 ? (
                  <tr>
                    <td class="px-4 py-10 text-center text-on-surface-variant" colSpan={5}>
                      No bids match your search.
                    </td>
                  </tr>
                ) : (
                  filteredBids.value.map((b) => (
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
                            href={`/approver/submitted-bids/${encodeURIComponent(b.id)}/`}
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
                    Deadline
                  </label>
                  <input
                    id="infoDeadline"
                    type="datetime-local"
                    class="w-full rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                    value={infoDeadline.value}
                    onInput$={(_, el) => (infoDeadline.value = el.value)}
                  />
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
  title: "Submitted bids | Approver",
};
