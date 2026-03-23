import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AdminPortalNav } from "~/components/admin-portal-nav";

export default component$(() => {
  return (
    <div class="min-h-screen bg-background text-on-background">
      <AdminPortalNav activeItem="accounts" />

      <main class="min-h-screen pt-20 lg:pl-64">
        <div class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:p-10">
          <h1 class="font-headline text-3xl font-extrabold tracking-tight text-primary">Applicant organisations</h1>
          <p class="text-on-surface-variant">
            Organisation-level registration and review will appear here when that API is available. User accounts are
            managed under System Users.
          </p>
          <a
            class="inline-flex w-fit rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-lg"
            href="/admin/system-users/"
          >
            Go to system users
          </a>
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Applicant Accounts",
};
