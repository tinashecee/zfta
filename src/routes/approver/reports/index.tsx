import { component$, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ApproverPortalNav } from "~/components/approver-portal-nav";
import { ReportsDashboard } from "~/components/reports/reports-dashboard";
import { appPageTitle } from "~/lib/app-branding";
import { getCurrentUser } from "~/lib/auth";
import { isSrcReviewerSession } from "~/lib/hosting-access";

export default component$(() => {
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const u = getCurrentUser();
    if (!isSrcReviewerSession(u)) {
      window.location.assign("/approver/dashboard/");
    }
  });

  return (
    <div class="flex flex-1 flex-col min-h-0 min-w-0 bg-background text-on-background">
      <ApproverPortalNav activeItem="reports" title="Reports & analytics" />

      <main class="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8 pt-28 w-full">
        <header class="mb-8">
          <h1 class="text-2xl font-bold font-headline text-primary">Reports &amp; analytics</h1>
          <p class="mt-2 text-sm text-on-surface-variant max-w-3xl">
            Track submissions, approval turnaround, sport-body performance, and the full approval audit trail.
          </p>
        </header>

        <ReportsDashboard portal="approver" />
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: appPageTitle("Reports | Approver"),
};
