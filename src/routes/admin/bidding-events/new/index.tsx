import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AdminPortalNav } from "~/components/admin-portal-nav";
import { createHostingEvent, publishHostingEvent } from "~/lib/bidding-api";
import { CATALOG_SPORT_KEYS } from "~/lib/catalog-sports";
import { getCurrentUser } from "~/lib/auth";

function splitDocTypes(raw: string): string[] {
  return raw
    .split(/[,\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

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
  const title = useSignal("");
  const sport = useSignal("");
  const location = useSignal("");
  const eventStart = useSignal("");
  const eventEnd = useSignal("");
  const bidDeadlineLocal = useSignal("");
  const maxBids = useSignal<string>("");
  const bidPackUrl = useSignal("");
  const requiredDocs = useSignal("hosting_plan\nbudget\nfunding_proof\nroll_out_plan\norganising_committee_composition");
  const openNow = useSignal(true);

  const busy = useSignal(false);
  const error = useSignal<string | null>(null);

  useVisibleTask$(() => {
    const u = getCurrentUser();
    if (u?.role !== "system_admin") {
      window.location.assign("/sign-in/");
    }
  });

  const onSubmit$ = $(async () => {
    error.value = null;
    busy.value = true;

    const required_documents = splitDocTypes(requiredDocs.value);
    const max_bids = maxBids.value.trim() ? Number(maxBids.value.trim()) : null;

    const r = await createHostingEvent({
      title: title.value.trim(),
      sport: sport.value.trim() || null,
      location: location.value.trim() || null,
      event_start_date: eventStart.value.trim() || null,
      event_end_date: eventEnd.value.trim() || null,
      bid_deadline: toRfc3339FromLocalInput(bidDeadlineLocal.value) || null,
      max_bids: Number.isFinite(max_bids as number) ? (max_bids as number) : null,
      required_documents: required_documents.length ? required_documents : null,
      bid_pack_url: bidPackUrl.value.trim() || null,
    });

    if (!r.ok) {
      busy.value = false;
      error.value = r.error;
      return;
    }

    if (openNow.value) {
      const pub = await publishHostingEvent(r.data.id);
      if (!pub.ok) {
        busy.value = false;
        error.value = pub.error;
        return;
      }
    }

    busy.value = false;
    window.location.assign("/admin/bidding-events/");
  });

  return (
    <div class="min-h-screen bg-background text-on-background">
      <AdminPortalNav activeItem="overview" />

      <main class="min-h-screen pt-20 lg:pl-64">
        <div class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:p-10">
          <header>
            <h1 class="font-headline text-3xl font-extrabold tracking-tight text-primary">Create hosting opportunity</h1>
            <p class="mt-2 text-on-surface-variant">
              Creates <code class="text-xs font-mono">POST /api/hosting/events</code> (no status in JSON). Optionally
              opens immediately by calling <code class="text-xs font-mono">POST /api/hosting/events/{"{id}"}/publish</code>.
            </p>
          </header>

          {error.value ? (
            <div class="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{error.value}</div>
          ) : null}

          <form preventdefault:submit onSubmit$={onSubmit$} class="space-y-5">
            <div>
              <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="title">
                Title <span class="text-primary">*</span>
              </label>
              <input
                id="title"
                class="w-full rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                value={title.value}
                onInput$={(_, el) => (title.value = el.value)}
                required
              />
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="sport">
                  Sport
                </label>
                <select
                  id="sport"
                  class="w-full rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                  value={sport.value}
                  onChange$={(_, el) => (sport.value = el.value)}
                >
                  <option value="">Select a sport…</option>
                  {CATALOG_SPORT_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="location">
                  Location
                </label>
                <input
                  id="location"
                  class="w-full rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                  value={location.value}
                  onInput$={(_, el) => (location.value = el.value)}
                />
              </div>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="event_start_date">
                  Event start date
                </label>
                <input
                  id="event_start_date"
                  type="date"
                  class="w-full rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                  value={eventStart.value}
                  onInput$={(_, el) => (eventStart.value = el.value)}
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="event_end_date">
                  Event end date
                </label>
                <input
                  id="event_end_date"
                  type="date"
                  class="w-full rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                  value={eventEnd.value}
                  onInput$={(_, el) => (eventEnd.value = el.value)}
                />
              </div>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="bid_deadline">
                  Bid deadline (RFC3339)
                </label>
                <input
                  id="bid_deadline"
                  type="datetime-local"
                  class="w-full rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                  value={bidDeadlineLocal.value}
                  onInput$={(_, el) => (bidDeadlineLocal.value = el.value)}
                />
                <p class="mt-1 text-xs text-on-surface-variant">
                  We will send this to the backend as RFC3339:
                  <span class="ml-2 font-mono text-[11px] text-on-surface">
                    {bidDeadlineLocal.value.trim() ? toRfc3339FromLocalInput(bidDeadlineLocal.value) : "—"}
                  </span>
                </p>
              </div>
              <div>
                <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="max_bids">
                  Max bids
                </label>
                <input
                  id="max_bids"
                  inputMode="numeric"
                  class="w-full rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                  value={maxBids.value}
                  onInput$={(_, el) => (maxBids.value = el.value)}
                  placeholder="5"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="bid_pack_url">
                Bid pack URL
              </label>
              <input
                id="bid_pack_url"
                class="w-full rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                value={bidPackUrl.value}
                onInput$={(_, el) => (bidPackUrl.value = el.value)}
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="required_documents">
                Required documents (one per line or comma-separated)
              </label>
              <textarea
                id="required_documents"
                class="w-full min-h-[10rem] rounded-xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 font-mono text-sm"
                value={requiredDocs.value}
                onInput$={(_, el) => (requiredDocs.value = el.value)}
              />
            </div>

            <label class="flex items-start gap-3">
              <input
                type="checkbox"
                class="mt-1 rounded border-outline text-primary"
                checked={openNow.value}
                onChange$={(_, el) => (openNow.value = el.checked)}
              />
              <span class="text-sm text-on-surface">
                Open for bids immediately (publish after create)
              </span>
            </label>

            <div class="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={busy.value}
                class="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-lg disabled:opacity-50"
              >
                {busy.value ? "Creating…" : "Create event"}
              </button>
              <a
                class="rounded-xl border border-outline-variant/40 px-6 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-low"
                href="/admin/bidding-events/"
              >
                Cancel
              </a>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Create hosting opportunity | Admin",
};

