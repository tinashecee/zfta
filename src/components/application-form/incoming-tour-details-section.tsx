import { component$ } from "@builder.io/qwik";

/** Incoming tour: country/org (1.3), accommodation (1.7), purpose (1.6) — maps to existing API columns. */
export const IncomingTourDetailsSection = component$(() => {
  return (
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div class="lg:col-span-4 sticky top-24">
        <h2 class="text-2xl font-bold font-headline text-primary mb-2">Incoming tour details</h2>
        <p class="text-sm text-on-surface-variant leading-relaxed">
          Country represented by the touring party, accommodation establishment in Zimbabwe, and optional purpose/benefits.
        </p>
      </div>

      <div class="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15 space-y-6">
        <div class="space-y-1.5">
          <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">
            Country represented (optional)
          </label>
          <input
            name="represented_country"
            class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
            placeholder="e.g. South Africa"
            type="text"
          />
        </div>

        <div class="space-y-1.5">
          <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">
            Accommodation establishment in Zimbabwe (1.7)
          </label>
          <input
            name="training_facility_name"
            class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
            placeholder="Hotel / facility where touring party will stay"
            type="text"
            required
          />
        </div>

        <div class="space-y-1.5">
          <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">
            Purpose or benefits of hosting the tour (optional)
          </label>
          <textarea
            name="event_description"
            class="w-full min-h-[120px] bg-surface-container-highest border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary/30 transition-all font-body"
            placeholder="Describe the purpose and expected benefits."
          />
        </div>
      </div>
    </section>
  );
});
