import { component$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ApproverPortalNav } from "~/components/approver-portal-nav";
import {
  bidStatusLabel,
  filterHostingBidsForSportBodyReviewer,
  filterHostingEventsForSportBodyReviewer,
  listBiddingEvents,
  listMyBids,
  type ApiBid,
} from "~/lib/bidding-api";
import { formatDateTime } from "~/lib/application-display";
import { getCurrentUser } from "~/lib/auth";
import { isSrcReviewerSession, isSportBodyReviewerSession, redirectPathIfNoHostingBidAccess } from "~/lib/hosting-access";
import { resolveCurrentReviewerSportBodyContext } from "~/lib/reviewer-sport-body";
import { reviewerPortalAffiliationLabel } from "~/lib/users-api";
import { listSportBodies } from "~/lib/sport-bodies-api";

function bidSortKey(b: ApiBid): number {
  const raw = b.submitted_at ?? b.updated_at ?? b.created_at ?? "";
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

function sortBidsLatestFirst(rows: ApiBid[]): ApiBid[] {
  return [...rows].sort((a, b) => bidSortKey(b) - bidSortKey(a));
}

export default component$(() => {
  const bids = useStore<ApiBid[]>([]);
  const loading = useSignal(true);
  const loadError = useSignal<string | null>(null);
  const portalTitle = useSignal("My bids");
  const filterHint = useSignal<string | null>(null);

  useVisibleTask$(async () => {
    const u = getCurrentUser();
    if (isSrcReviewerSession(u)) {
      window.location.assign("/approver/submitted-bids/");
      return;
    }
    const denied = redirectPathIfNoHostingBidAccess(u);
    if (denied) {
      window.location.assign(denied);
      return;
    }
    if (!u) return;

    const sbR = await listSportBodies({ limit: 200, offset: 0 });
    const sb = sbR.ok ? sbR.data : [];
    const aff = u.role === "system_admin" ? null : reviewerPortalAffiliationLabel(u, sb);
    portalTitle.value = aff ? `My bids · ${aff}` : u.role === "system_admin" ? "My bids · Admin" : "My bids";

    loading.value = true;
    loadError.value = null;
    filterHint.value = null;

    const br = await listMyBids({ limit: 200, offset: 0 });
    loading.value = false;
    if (!br.ok) {
      loadError.value = br.error;
      return;
    }

    let rows = br.data;

    if (u.role !== "system_admin") {
      const isSportBody = u.role === "reviewer" && isSportBodyReviewerSession(u);
      if (isSportBody) {
        const ctx = await resolveCurrentReviewerSportBodyContext();
        if (!ctx.ok) {
          loadError.value = ctx.error;
          bids.length = 0;
          return;
        }

        const er = await listBiddingEvents({ limit: 100, offset: 0 });
        if (!er.ok) {
          loadError.value = er.error;
          bids.length = 0;
          return;
        }

        const { allowedEventIds } = filterHostingEventsForSportBodyReviewer(er.data, ctx.sportKey);
        filterHint.value =
          "Showing bids that match your sport and still have a future bid deadline (same filter as Bidding events).";
        rows = filterHostingBidsForSportBodyReviewer(br.data, allowedEventIds);
      }
    }

    const sorted = sortBidsLatestFirst(rows);
    bids.length = 0;
    for (const row of sorted) bids.push(row);
  });

  return (
    <div class="flex flex-1 flex-col min-h-0 min-w-0 bg-background text-on-background">
      <ApproverPortalNav activeItem="myBids" title={portalTitle.value} />

      <main class="min-h-0 flex-1 min-w-0 w-full pt-28 px-4 sm:px-8 pb-12">
        <header class="max-w-5xl mb-8">
          <h1 class="text-3xl font-extrabold font-headline text-primary">My bids</h1>
          <p class="text-on-surface-variant mt-2 max-w-2xl text-sm">
            Hosting bids you have started or submitted, from{" "}
            <code class="text-xs font-mono">GET /api/hosting/bids</code>.
          </p>
          {filterHint.value ? (
            <p class="mt-2 max-w-2xl rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-on-surface">
              {filterHint.value}
            </p>
          ) : null}
        </header>

        <div class="max-w-5xl overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
          <table class="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr class="bg-surface-container-low">
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline">Event</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline">Organisation</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline">Status</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline">Submitted</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline">Bid deadline</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/10">
              {loading.value ? (
                <tr>
                  <td class="px-4 py-10 text-center text-outline" colSpan={5}>
                    Loading bids…
                  </td>
                </tr>
              ) : loadError.value ? (
                <tr>
                  <td class="px-4 py-10 text-center text-error" colSpan={5}>
                    {loadError.value}
                  </td>
                </tr>
              ) : bids.length === 0 ? (
                <tr>
                  <td class="px-4 py-10 text-center text-on-surface-variant" colSpan={5}>
                    No bids yet. Start one from{" "}
                    <a class="font-semibold text-primary underline" href="/approver/bidding-events/">
                      Bidding events
                    </a>
                    .
                  </td>
                </tr>
              ) : (
                bids.map((b) => {
                  const eid = String(b.event_id ?? "").trim();
                  const title = (b.event_title ?? "").trim() || "—";
                  const missing = b.has_missing_docs === true;
                  return (
                    <tr key={b.id} class="hover:bg-surface-container-low/80">
                      <td class="px-4 py-3">
                        <div class="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center">
                          <a
                            class="font-semibold text-primary hover:underline break-words"
                            href={`/approver/my-bids/${encodeURIComponent(b.id)}/`}
                          >
                            {title}
                          </a>
                          {eid ? (
                            <span class="text-xs text-on-surface-variant sm:before:content-['·'] sm:before:mr-2">
                              <a class="text-primary/90 underline" href={`/approver/bidding-events/${encodeURIComponent(eid)}/`}>
                                View event
                              </a>
                            </span>
                          ) : null}
                        </div>
                        {missing ? (
                          <span class="mt-1 inline-block rounded bg-error/15 px-2 py-0.5 text-[11px] font-semibold text-error">
                            Missing docs
                          </span>
                        ) : null}
                      </td>
                      <td class="px-4 py-3 text-on-surface-variant break-words">
                        {b.organisation_name?.trim() || "—"}
                      </td>
                      <td class="px-4 py-3 text-on-surface">{bidStatusLabel(b.status)}</td>
                      <td class="px-4 py-3 text-outline whitespace-nowrap">
                        {b.submitted_at ? formatDateTime(b.submitted_at) : "—"}
                      </td>
                      <td class="px-4 py-3 text-outline whitespace-nowrap">
                        {b.event_bid_deadline ? formatDateTime(b.event_bid_deadline) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "My bids | Approver",
};
