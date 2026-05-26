import { component$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ApproverPortalNav } from "~/components/approver-portal-nav";
import {
  biddingEventStatusLabel,
  filterHostingEventsForSportBodyReviewer,
  listBiddingEvents,
  type ApiBiddingEvent,
} from "~/lib/bidding-api";
import { formatDateTime } from "~/lib/application-display";
import { getCurrentUser } from "~/lib/auth";
import { isSrcReviewerSession, isSportBodyReviewerSession, redirectPathIfNoHostingBidAccess } from "~/lib/hosting-access";
import { resolveCurrentReviewerSportBodyContext } from "~/lib/reviewer-sport-body";
import { reviewerPortalAffiliationLabel } from "~/lib/users-api";
import { listSportBodies } from "~/lib/sport-bodies-api";

export default component$(() => {
  const events = useStore<ApiBiddingEvent[]>([]);
  const loading = useSignal(true);
  const loadError = useSignal<string | null>(null);
  const portalTitle = useSignal("Bidding events");
  const filterHint = useSignal<string | null>(null);

  useVisibleTask$(async () => {
    const u = getCurrentUser();
    if (isSrcReviewerSession(u)) {
      window.location.assign("/approver/hosting-events/");
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
    portalTitle.value = aff ? `Bidding events · ${aff}` : u.role === "system_admin" ? "Bidding events · Admin" : "Bidding events";

    loading.value = true;
    loadError.value = null;
    filterHint.value = null;

    const r = await listBiddingEvents({ limit: 100, offset: 0 });
    loading.value = false;
    if (!r.ok) {
      loadError.value = r.error;
      return;
    }

    events.length = 0;
    if (u.role === "system_admin") {
      for (const row of r.data) events.push(row);
      return;
    }

    if (isSportBodyReviewerSession(u)) {
      const ctx = await resolveCurrentReviewerSportBodyContext();
      if (!ctx.ok) {
        loadError.value = ctx.error;
        return;
      }

      const { filtered } = filterHostingEventsForSportBodyReviewer(r.data, ctx.sportKey);
      filterHint.value =
        "Showing opportunities for your sport with a future bid deadline (extra browser filter; the API still decides access).";
      for (const row of filtered) events.push(row);
    }
  });

  return (
    <div class="flex flex-1 flex-col min-h-0 min-w-0 bg-background text-on-background">
      <ApproverPortalNav activeItem="biddingEvents" title={portalTitle.value} />

      <main class="min-h-0 flex-1 min-w-0 w-full pt-28 px-4 sm:px-8 pb-12">
        <header class="max-w-5xl mb-8">
          <h1 class="text-3xl font-extrabold font-headline text-primary">Bidding events</h1>
          <p class="text-on-surface-variant mt-2 max-w-2xl text-sm">
            Select an opportunity to read requirements and start a bid. Open listings come from{" "}
            <code class="text-xs font-mono">GET /api/hosting/events</code>.
          </p>
          {filterHint.value ? (
            <p class="mt-2 max-w-2xl rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-on-surface">
              {filterHint.value}
            </p>
          ) : null}
        </header>

        <div class="max-w-5xl overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
          <table class="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr class="bg-surface-container-low">
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline">Title</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline">Sport</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline">Status</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline">Bid deadline</th>
                <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline text-right">Pack</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/10">
              {loading.value ? (
                <tr>
                  <td class="px-4 py-10 text-center text-outline" colSpan={5}>
                    Loading events…
                  </td>
                </tr>
              ) : loadError.value ? (
                <tr>
                  <td class="px-4 py-10 text-center text-error" colSpan={5}>
                    {loadError.value}
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td class="px-4 py-10 text-center text-on-surface-variant" colSpan={5}>
                    {filterHint.value
                      ? "No matching open opportunities."
                      : "No published events yet."}
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} class="hover:bg-surface-container-low/80">
                    <td class="px-4 py-3">
                      <a
                        class="font-semibold text-primary hover:underline break-words"
                        href={`/approver/bidding-events/${encodeURIComponent(ev.id)}/`}
                      >
                        {ev.title}
                      </a>
                    </td>
                    <td class="px-4 py-3 text-on-surface-variant break-words">{ev.sport?.trim() || "—"}</td>
                    <td class="px-4 py-3 text-on-surface">{biddingEventStatusLabel(ev.status)}</td>
                    <td class="px-4 py-3 text-outline whitespace-nowrap">
                      {ev.bid_deadline ? formatDateTime(ev.bid_deadline) : "—"}
                    </td>
                    <td class="px-4 py-3 text-right">
                      {ev.bid_pack_url ? (
                        <a
                          class="text-primary font-semibold hover:underline"
                          href={ev.bid_pack_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick$={(e) => e.stopPropagation()}
                        >
                          Download
                        </a>
                      ) : (
                        <span class="text-outline">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Bidding events | Approver",
};
