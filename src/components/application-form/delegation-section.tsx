import { component$ } from "@builder.io/qwik";

/** Alias of dates-section logistics grid when used without the date row (hosting may use dates-only elsewhere). */
export const DelegationSection = component$(() => {
  return (
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div class="lg:col-span-4 sticky top-24">
        <h2 class="text-2xl font-bold font-headline text-primary mb-2">Delegation</h2>
        <p class="text-sm text-on-surface-variant leading-relaxed">Age group, gender category, travel mode, and ports.</p>
      </div>

      <div class="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="space-y-1.5">
            <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Age Group</label>
            <select
              name="age_group"
              class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
            >
              <option value="senior">Senior</option>
              <option value="u23">U23</option>
              <option value="u20">U20</option>
              <option value="u18">U18</option>
              <option value="u17">U17</option>
              <option value="u15">U15</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Gender</label>
            <select
              name="gender_category"
              class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Mode of Travel</label>
            <select
              name="travel_mode"
              class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
            >
              <option value="air">Air</option>
              <option value="road">Road</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div class="md:col-span-3 space-y-1.5">
            <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Primary Port of Entry/Exit</label>
            <input
              name="port_of_entry"
              class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
              placeholder="e.g. Robert Gabriel Mugabe Intl / Beitbridge Border"
              type="text"
            />
          </div>
        </div>
      </div>
    </section>
  );
});
