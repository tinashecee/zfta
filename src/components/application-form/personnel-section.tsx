import { component$ } from "@builder.io/qwik";
import { TravelPersonnelRoster } from "~/components/travel-personnel-roster";
import type { TravelPersonnelRow } from "~/lib/travel-personnel-types";

export type PersonnelSectionProps = {
  personnel: TravelPersonnelRow[];
  mode?: "create" | "edit" | "view";
};

export const PersonnelSection = component$<PersonnelSectionProps>((props) => {
  const mode = props.mode ?? "create";
  return (
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div class="lg:col-span-4 sticky top-24">
        <h2 class="text-2xl font-bold font-headline text-primary mb-2">Travelling personnel</h2>
        <p class="text-sm text-on-surface-variant leading-relaxed">
          Download the Excel template, fill one row per traveller, then upload. You can also add or remove people manually.
          This roster is submitted with your application.
        </p>
      </div>

      <div class="lg:col-span-8 space-y-8">
        <div class="bg-surface-container-lowest p-6 md:p-8 rounded-xl shadow-sm border border-outline-variant/15">
          <div class="mb-6">
            <span class="inline-block px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider mb-2">
              Required
            </span>
            <h3 class="font-headline font-bold text-xl text-primary">Squad roster</h3>
            <p class="text-sm text-on-surface-variant mt-1">
              Match the official delegation list. Passport and ID fields should match travel documents.
            </p>
          </div>
          <TravelPersonnelRoster personnel={props.personnel} mode={mode} />
        </div>
      </div>
    </section>
  );
});
