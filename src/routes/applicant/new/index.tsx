import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ApplicantPortalNav } from "~/components/applicant-portal-nav";
import { appPageTitle } from "~/lib/app-branding";
import { listApplicationTypesForInitiator } from "~/lib/application-types";

export default component$(() => {
  const types = listApplicationTypesForInitiator("applicant");

  return (
    <div class="bg-background font-body text-on-background min-h-screen">
      <ApplicantPortalNav activeItem="applications" />

      <main class="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8 pt-28">
        <header class="mb-10">
          <span class="text-secondary font-bold tracking-widest uppercase text-xs">Start an application</span>
          <h1 class="text-3xl md:text-4xl font-extrabold font-headline tracking-tight text-primary mt-2">
            Choose application type
          </h1>
          <p class="text-on-surface-variant mt-2 max-w-xl">
            Select the kind of travel authorization you need. Your organisation profile must include a sport.
          </p>
        </header>

        <div class="grid gap-4 sm:grid-cols-1">
          {types.map((t) => (
            <a
              key={t.key}
              class="block rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              href={t.key === "outgoing_tour" ? "/applicant/new/outgoing-tour/" : "#"}
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h2 class="text-xl font-bold font-headline text-primary">{t.label}</h2>
                  <p class="mt-2 text-sm text-on-surface-variant leading-relaxed">{t.description}</p>
                  <p class="mt-3 text-xs font-semibold text-outline">
                    Submit at least {t.minLeadDays} days before travel
                  </p>
                </div>
                <span class="material-symbols-outlined text-primary shrink-0">chevron_right</span>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: appPageTitle("New application"),
};
