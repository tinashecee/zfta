import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AdminPortalNav } from "~/components/admin-portal-nav";

export default component$(() => {
  return (
    <div class="min-h-screen bg-background text-on-background">
      <AdminPortalNav activeItem="accounts" />

      <main class="min-h-screen pt-20 lg:pl-64">
        <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:p-8">
          <div class="rounded-2xl bg-surface-container-lowest p-8 shadow-sm">
            <h1 class="font-headline text-2xl font-bold text-primary">Organisation detail</h1>
            <p class="mt-2 text-on-surface-variant">
              This view is not connected to an API yet. Use{" "}
              <a class="font-bold text-primary underline" href="/admin/system-users/">
                system users
              </a>{" "}
              to manage accounts.
            </p>
            <a
              class="mt-6 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white"
              href="/admin/accounts/"
            >
              Back to applicant organisations
            </a>
          </div>
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Organisation",
};
