import { component$ } from "@builder.io/qwik";
import { TravelPersonnelRoster } from "~/components/travel-personnel-roster";
import type { PersonnelRosterVariant, TravelPersonnelRow } from "~/lib/travel-personnel-types";

export type PersonnelSectionProps = {
  personnel: TravelPersonnelRow[];
  mode?: "create" | "edit" | "view";
  variant?: PersonnelRosterVariant;
};

export const PersonnelSection = component$<PersonnelSectionProps>((props) => {
  const mode = props.mode ?? "create";
  const variant = props.variant ?? "full";
  const isDelegation = variant === "incoming_delegation";

  return (
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div class="lg:col-span-4 sticky top-24">
        {isDelegation ? (
          <>
            <h2 class="text-2xl font-bold font-headline text-primary mb-2">Squad roster</h2>
            <p class="text-sm text-on-surface-variant leading-relaxed">
              Match the official delegation list. Passport and ID fields should match travel documents. A full nominal
              list of the person(s) taking part in the tour and where known, their country/countries of origin, passport
              number(s) and expiry date.
            </p>
          </>
        ) : (
          <>
            <h2 class="text-2xl font-bold font-headline text-primary mb-2">Travelling personnel</h2>
            <p class="text-sm text-on-surface-variant leading-relaxed">
              Download the Excel template, fill one row per traveller, then upload. You can also add or remove people
              manually. This roster is submitted with your application.
            </p>
          </>
        )}
      </div>

      <div class="lg:col-span-8 space-y-8">
        <div class="bg-surface-container-lowest p-6 md:p-8 rounded-xl shadow-sm border border-outline-variant/15">
          {isDelegation ? (
            <div class="mb-6">
              <span class="inline-block px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider mb-2">
                Required
              </span>
            </div>
          ) : (
            <div class="mb-6">
              <span class="inline-block px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider mb-2">
                Required
              </span>
              <h3 class="font-headline font-bold text-xl text-primary">Squad roster</h3>
              <p class="text-sm text-on-surface-variant mt-1">
                Match the official delegation list. Passport and ID fields should match travel documents.
              </p>
            </div>
          )}
          <TravelPersonnelRoster personnel={props.personnel} mode={mode} variant={variant} />
        </div>
      </div>
    </section>
  );
});
