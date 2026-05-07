import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { AdminPortalNav } from "~/components/admin-portal-nav";
import { getOrganisation, organisationDisplayName, type ApiOrganisation } from "~/lib/organisations-api";

const NSA_TYPE = "national_sports_association";

function norm(v: string | null | undefined): string {
  return (v ?? "").trim();
}

function orgType(o: ApiOrganisation): string {
  return norm(o.org_type ?? o.organization_type);
}

export default component$(() => {
  const loc = useLocation();
  const id = loc.params.orgId;
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const org = useSignal<ApiOrganisation | null>(null);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    track(() => loc.params.orgId);
    if (!id) return;
    loading.value = true;
    error.value = null;
    org.value = null;
    const r = await getOrganisation(id);
    loading.value = false;
    if (!r.ok) {
      error.value = r.error;
      return;
    }
    org.value = r.data;
  });

  const o = org.value;
  const type = o ? orgType(o) : "";
  const editable = type === NSA_TYPE;

  return (
    <div class="min-h-screen bg-background text-on-background">
      <AdminPortalNav activeItem="organisations" />

      <main class="min-h-screen pt-20 lg:pl-64">
        <div class="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:p-8">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <a class="text-sm font-semibold text-primary hover:underline" href="/admin/organisations/">
                ← Back to organisations
              </a>
              <h1 class="mt-2 font-headline text-3xl font-extrabold tracking-tight text-primary">
                {o ? organisationDisplayName(o) || "Organisation" : "Organisation"}
              </h1>
              <p class="mt-1 text-sm text-on-surface-variant">
                {editable ? "This organisation can be edited on the Organisations list page." : "View-only organisation."}
              </p>
            </div>
            {editable ? (
              <a
                class="w-fit rounded-xl border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/15 transition-colors"
                href="/admin/organisations/"
              >
                Edit (NSA only)
              </a>
            ) : null}
          </div>

          {loading.value ? (
            <p class="text-on-surface-variant">Loading organisation…</p>
          ) : error.value ? (
            <div class="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error" role="alert">
              {error.value}
            </div>
          ) : o ? (
            <section class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
              <dl class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">ID</dt>
                  <dd class="mt-1 font-mono text-xs break-all">{o.id}</dd>
                </div>
                <div>
                  <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Type</dt>
                  <dd class="mt-1 text-on-surface-variant">{type || "—"}</dd>
                </div>
                <div>
                  <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Sport</dt>
                  <dd class="mt-1 text-on-surface-variant">{norm(o.sport) || "—"}</dd>
                </div>
                <div>
                  <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Status</dt>
                  <dd class="mt-1 text-on-surface-variant">{norm(o.status) || "—"}</dd>
                </div>
                <div class="sm:col-span-2">
                  <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Primary contact</dt>
                  <dd class="mt-1 text-on-surface-variant">
                    {[norm(o.primary_contact_name), norm(o.primary_contact_mobile ?? o.primary_mobile), norm(o.primary_contact_email ?? o.primary_email)]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </dd>
                </div>
                <div class="sm:col-span-2">
                  <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Website</dt>
                  <dd class="mt-1 text-on-surface-variant">{norm(o.website) || "—"}</dd>
                </div>
                <div class="sm:col-span-2">
                  <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Address</dt>
                  <dd class="mt-1 text-on-surface-variant">
                    {[norm(o.physical_address ?? o.street_address), norm(o.city)].filter(Boolean).join(" · ") ||
                      "—"}
                  </dd>
                </div>
                <div>
                  <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Created</dt>
                  <dd class="mt-1 text-on-surface-variant">{norm(o.created_at) || "—"}</dd>
                </div>
                <div>
                  <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Updated</dt>
                  <dd class="mt-1 text-on-surface-variant">{norm(o.updated_at) || "—"}</dd>
                </div>
              </dl>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Organisation | Admin",
};

