import { component$, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ApproverPortalNav } from "~/components/approver-portal-nav";
import { listApplicationTypesForInitiator } from "~/lib/application-types";
import { getCurrentUser } from "~/lib/auth";

export default component$(() => {
  useVisibleTask$(() => {
    const u = getCurrentUser();
    const ab = (u?.approver_body ?? "").trim().toUpperCase();
    const legacy = (u?.body ?? "").trim().toUpperCase();
    const isSportBodyReviewer =
      ab === "SPORTS_BODY" || legacy === "SPORT_BODY" || legacy === "SPORTS_BODY";
    if (!u || u.role !== "reviewer" || !isSportBodyReviewer) {
      window.location.assign("/approver/dashboard/");
    }
  });

  const types = listApplicationTypesForInitiator("sport_body");

  return (
    <div class="flex flex-1 flex-col min-h-0 min-w-0 bg-background text-on-background">
      <ApproverPortalNav activeItem="createApplication" title="Create application — Sport body" />

      <main class="min-h-0 flex-1 min-w-0 w-full pt-28 px-4 sm:px-8 pb-12">
        <header class="max-w-4xl mb-10">
          <h1 class="text-3xl font-extrabold font-headline text-primary">New application</h1>
          <p class="text-on-surface-variant mt-2 max-w-xl">
            Incoming tours and hosting competitions are initiated by the sport body. You will need an organisation profile
            linked to your account.
          </p>
        </header>

        <div class="max-w-4xl grid gap-4">
          {types.map((t) => (
            <a
              key={t.key}
              class="block rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm transition-all hover:border-primary/40"
              href={
                t.key === "incoming_tour"
                  ? "/approver/applications/new/incoming-tour/"
                  : t.key === "hosting_competition"
                    ? "/approver/applications/new/hosting-competition/"
                    : "#"
              }
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h2 class="text-xl font-bold font-headline text-primary">{t.label}</h2>
                  <p class="mt-2 text-sm text-on-surface-variant">{t.description}</p>
                  <p class="mt-3 text-xs font-semibold text-outline">Lead time: {t.minLeadDays} days</p>
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
  title: "Create application | Approver",
};
