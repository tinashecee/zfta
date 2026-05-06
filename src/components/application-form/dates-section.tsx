import { component$ } from "@builder.io/qwik";

export type DatesSectionProps = {
  /** Shown next to the section title (e.g. “30 days before departure”). */
  leadHint?: string;
};

export const DatesSection = component$<DatesSectionProps>((props) => {
  return (
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div class="lg:col-span-4 sticky top-24">
        <h2 class="text-2xl font-bold font-headline text-primary mb-2">Logistics &amp; Squad</h2>
        <p class="text-sm text-on-surface-variant leading-relaxed">
          Specify the travel timeline, squad size, and team demographics for clearance auditing.
          {props.leadHint ? (
            <>
              {" "}
              <span class="font-semibold text-primary">{props.leadHint}</span>
            </>
          ) : null}
        </p>
      </div>

      <div class="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="space-y-1.5">
            <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Departure Date</label>
            <input
              name="departure_date"
              class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
              type="date"
              required
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Return Date</label>
            <input
              name="return_date"
              class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
              type="date"
              required
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Total Players</label>
            <div class="relative">
              <input
                name="player_count"
                class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                type="number"
                min="1"
                max="100"
                defaultValue="23"
                required
              />
              <span class="absolute right-4 top-3 text-xs text-on-surface-variant">Athletes</span>
            </div>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Officials/Staff</label>
          <div class="relative">
            <input
              name="officials_count"
              class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
              type="number"
              min="0"
              max="50"
              defaultValue="7"
              required
            />
            <span class="absolute right-4 top-3 text-xs text-on-surface-variant">Tech/Med</span>
          </div>
        </div>

        <p class="text-xs text-on-surface-variant mb-2 mt-4">
          Submitted totals for players vs staff follow the squad roster (each row&apos;s role), not these numbers.
        </p>
      </div>
    </section>
  );
});
