import { $, component$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AdminPortalNav } from "~/components/admin-portal-nav";
import {
  biddingEventStatusLabel,
  listHostingEvents,
  patchHostingEvent,
  publishHostingEvent,
  type ApiBiddingEvent,
} from "~/lib/bidding-api";
import { formatDateTime } from "~/lib/application-display";
import { getCurrentUser } from "~/lib/auth";

export default component$(() => {
  const events = useStore<ApiBiddingEvent[]>([]);
  const loading = useSignal(true);
  const loadError = useSignal<string | null>(null);
  const actionBusy = useSignal<string | null>(null);
  const actionError = useSignal<string | null>(null);

  useVisibleTask$(async () => {
    const u = getCurrentUser();
    if (u?.role !== "system_admin") {
      window.location.assign("/sign-in/");
      return;
    }

    loading.value = true;
    loadError.value = null;
    const r = await listHostingEvents({ limit: 200, offset: 0 });
    loading.value = false;
    if (!r.ok) {
      loadError.value = r.error;
      return;
    }
    events.length = 0;
    for (const row of r.data) events.push(row);
  });

  const onPublish$ = $(
    async (id: string) => {
      actionError.value = null;
      actionBusy.value = id;
      const r = await publishHostingEvent(id);
      actionBusy.value = null;
      if (!r.ok) {
        actionError.value = r.error;
        return;
      }
      const idx = events.findIndex((e) => e.id === id);
      if (idx >= 0) events[idx] = r.data;
    },
  );

  const onClose$ = $(
    async (id: string) => {
      actionError.value = null;
      actionBusy.value = id;
      const r = await patchHostingEvent(id, { status: "closed" });
      actionBusy.value = null;
      if (!r.ok) {
        actionError.value = r.error;
        return;
      }
      const idx = events.findIndex((e) => e.id === id);
      if (idx >= 0) events[idx] = r.data;
    },
  );

  return (
    <div class="min-h-screen bg-background text-on-background">
      <AdminPortalNav activeItem="overview" />

      <main class="min-h-screen pt-20 lg:pl-64">
        <div class="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:p-10">
          <header class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 class="font-headline text-3xl font-extrabold tracking-tight text-primary">Hosting opportunities</h1>
              <p class="mt-2 text-on-surface-variant">
                Uses <code class="text-xs font-mono">/api/hosting/events</code>.
              </p>
            </div>
            <a
              class="inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-lg"
              href="/admin/bidding-events/new/"
            >
              Create event
            </a>
          </header>

          {actionError.value ? (
            <div class="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
              {actionError.value}
            </div>
          ) : null}

          <div class="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
            <table class="w-full min-w-[56rem] border-collapse text-left text-sm">
              <thead>
                <tr class="bg-surface-container-low">
                  <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline">Title</th>
                  <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline">Status</th>
                  <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline">Bid deadline</th>
                  <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline text-right">
                    Bids
                  </th>
                  <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-outline text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/10">
                {loading.value ? (
                  <tr>
                    <td class="px-4 py-10 text-center text-outline" colSpan={5}>
                      Loading…
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
                      No events yet.
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => {
                    const busy = actionBusy.value === ev.id;
                    const st = (ev.status ?? "").trim().toLowerCase();
                    const canPublish = st === "draft";
                    const canClose = st === "open_for_bids";
                    return (
                      <tr key={ev.id} class="hover:bg-surface-container-low/80">
                        <td class="px-4 py-3">
                          <div class="font-semibold text-on-surface break-words">{ev.title}</div>
                          <div class="mt-1 text-xs text-on-surface-variant">
                            <a class="text-primary underline" href={`/admin/bids/?event_id=${encodeURIComponent(ev.id)}`}>
                              View submitted bids
                            </a>
                          </div>
                        </td>
                        <td class="px-4 py-3">{biddingEventStatusLabel(ev.status)}</td>
                        <td class="px-4 py-3 text-outline whitespace-nowrap">
                          {ev.bid_deadline ? formatDateTime(ev.bid_deadline) : "—"}
                        </td>
                        <td class="px-4 py-3 text-right text-on-surface">{ev.bid_count ?? "—"}</td>
                        <td class="px-4 py-3 text-right">
                          <div class="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              disabled={!canPublish || busy}
                              class="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-on-primary disabled:opacity-50"
                              onClick$={() => onPublish$(ev.id)}
                            >
                              Publish
                            </button>
                            <button
                              type="button"
                              disabled={!canClose || busy}
                              class="rounded-lg border border-outline-variant/40 px-3 py-2 text-xs font-bold text-on-surface disabled:opacity-50"
                              onClick$={() => onClose$(ev.id)}
                            >
                              Close bidding
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Hosting opportunities | Admin",
};

