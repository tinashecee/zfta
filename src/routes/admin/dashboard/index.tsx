import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AdminPortalNav } from "~/components/admin-portal-nav";

export default component$(() => {
  return (
    <div class="min-h-screen bg-background text-on-background">
      <AdminPortalNav activeItem="overview" />

      <main class="min-h-screen pt-20 lg:pl-64">
        <div class="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 lg:p-10">
          <header>
            <h1 class="font-headline text-3xl font-extrabold tracking-tight text-primary">Admin dashboard</h1>
            <p class="mt-2 max-w-2xl text-on-surface-variant">
              Manage system users, organisations, and hosting modules from the navigation.
            </p>
          </header>

          <section class="grid gap-4 sm:grid-cols-2">
            <a
              class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm hover:bg-surface-container-low"
              href="/admin/bidding-events/"
            >
              <p class="text-xs font-bold uppercase tracking-widest text-outline">Hosting</p>
              <p class="mt-2 text-lg font-bold text-on-surface">Hosting events</p>
              <p class="mt-1 text-sm text-on-surface-variant">Create, publish, and close bidding events.</p>
            </a>

            <a
              class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm hover:bg-surface-container-low"
              href="/admin/bids/"
            >
              <p class="text-xs font-bold uppercase tracking-widest text-outline">Hosting</p>
              <p class="mt-2 text-lg font-bold text-on-surface">Submitted bids</p>
              <p class="mt-1 text-sm text-on-surface-variant">Review bids, request info, and approve a winner.</p>
            </a>

            <a
              class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm hover:bg-surface-container-low"
              href="/admin/system-users/"
            >
              <p class="text-xs font-bold uppercase tracking-widest text-outline">Users</p>
              <p class="mt-2 text-lg font-bold text-on-surface">System users</p>
              <p class="mt-1 text-sm text-on-surface-variant">
                Create, edit, activate, and manage user roles.
              </p>
            </a>

            <a
              class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm hover:bg-surface-container-low"
              href="/admin/organisations/"
            >
              <p class="text-xs font-bold uppercase tracking-widest text-outline">Directory</p>
              <p class="mt-2 text-lg font-bold text-on-surface">Organisations</p>
              <p class="mt-1 text-sm text-on-surface-variant">Browse and review applicant organisations.</p>
            </a>

            <a
              class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm hover:bg-surface-container-low"
              href="/admin/sport-bodies/"
            >
              <p class="text-xs font-bold uppercase tracking-widest text-outline">Catalog</p>
              <p class="mt-2 text-lg font-bold text-on-surface">Sport bodies</p>
              <p class="mt-1 text-sm text-on-surface-variant">Maintain the sport bodies catalog used for approvers.</p>
            </a>

            <a
              class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm hover:bg-surface-container-low"
              href="/admin/accounts/"
            >
              <p class="text-xs font-bold uppercase tracking-widest text-outline">Accounts</p>
              <p class="mt-2 text-lg font-bold text-on-surface">Applicant accounts</p>
              <p class="mt-1 text-sm text-on-surface-variant">Organisation-level registration (coming soon).</p>
            </a>
          </section>
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Admin dashboard",
};

