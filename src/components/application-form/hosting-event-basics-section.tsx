import { component$ } from "@builder.io/qwik";

/** Minimal event fields for hosting applications (API still requires event_type, tournament, host country). */
export const HostingEventBasicsSection = component$(() => {
  return (
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div class="lg:col-span-4 sticky top-24">
        <h2 class="text-2xl font-bold font-headline text-primary mb-2">Competition</h2>
        <p class="text-sm text-on-surface-variant leading-relaxed">Name the competition and where it will be hosted in Zimbabwe.</p>
      </div>

      <div class="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15 space-y-4">
        <input type="hidden" name="event_type" value="other" />
        <input type="hidden" name="tournament_name" value="Other" />
        <div class="space-y-1.5">
          <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Competition / event name</label>
          <input
            name="tournament_name_other"
            class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
            placeholder="e.g. COSAFA Senior Challenge"
            type="text"
            required
          />
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Host country</label>
          <input
            name="host_country"
            class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
            defaultValue="Zimbabwe"
            type="text"
            required
          />
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Host city / venue</label>
          <input
            name="host_city"
            class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
            placeholder="City and main venue"
            type="text"
          />
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Event title (optional override)</label>
          <input
            name="event_display_name"
            class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
            placeholder="Defaults to competition name + host country"
            type="text"
          />
        </div>
      </div>
    </section>
  );
});
