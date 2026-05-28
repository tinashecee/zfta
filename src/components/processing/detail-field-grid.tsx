import { component$ } from "@builder.io/qwik";
import type { DossierField } from "~/lib/application-dossier-display";

export type DetailFieldGridProps = {
  title: string;
  icon?: string;
  fields: DossierField[];
};

export const DetailFieldGrid = component$<DetailFieldGridProps>((props) => {
  if (!props.fields.length) return null;

  return (
    <section class="rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
      <h2 class="text-xl font-bold text-primary mb-6 flex items-center gap-3">
        <span class="w-1 bg-secondary h-6 rounded-full" />
        {props.icon ? (
          <span class="material-symbols-outlined text-secondary text-xl">{props.icon}</span>
        ) : null}
        {props.title}
      </h2>
      <dl class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        {props.fields.map((f) => (
          <div key={f.label} class="min-w-0">
            <dt class="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">{f.label}</dt>
            <dd class="font-medium text-on-surface break-words whitespace-pre-wrap">{f.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
});
