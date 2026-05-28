import { component$ } from "@builder.io/qwik";
import { ApplicationDocumentLink } from "~/components/application-document-link";
import { applicationDocumentDescriptors } from "~/lib/application-dossier-display";
import type { ApiApplication } from "~/lib/applications-api";

export const ApplicationDocumentsSection = component$((props: { app: ApiApplication }) => {
  const docs = applicationDocumentDescriptors(props.app);
  if (!docs.length) return null;

  return (
    <section class="rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
      <h2 class="text-xl font-bold text-primary mb-6 flex items-center gap-3">
        <span class="w-1 bg-secondary h-6 rounded-full" />
        <span class="material-symbols-outlined text-secondary text-xl">description</span>
        Documents
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {docs.map((d) => (
          <ApplicationDocumentLink key={d.label} kind={d.label} storedPath={d.path} />
        ))}
      </div>
    </section>
  );
});
