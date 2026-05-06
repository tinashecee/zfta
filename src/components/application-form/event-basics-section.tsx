import { component$ } from "@builder.io/qwik";

/** Shared “Event nature” fields — same `name` attributes as the legacy travel form for API compatibility. */
export const EventBasicsSection = component$(() => {
  return (
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div class="lg:col-span-4 sticky top-24">
        <h2 class="text-2xl font-bold font-headline text-primary mb-2">Event Nature</h2>
        <p class="text-sm text-on-surface-variant leading-relaxed">
          Select the primary purpose of this international journey. This determines the required supporting documentation.
        </p>
      </div>

      <div class="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <label class="relative flex cursor-pointer rounded-xl border border-outline-variant p-4 hover:bg-surface-container-low transition-colors group has-[:checked]:border-secondary has-[:checked]:bg-secondary/5">
            <input class="sr-only peer" name="event_type" type="radio" value="tournament" defaultChecked />
            <div class="flex items-center gap-3">
              <div class="flex-shrink-0 w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary peer-checked:bg-secondary peer-checked:text-white transition-colors">
                <span class="material-symbols-outlined">emoji_events</span>
              </div>
              <div class="flex flex-col">
                <span class="font-bold font-headline text-primary">Tournament</span>
                <span class="text-xs text-on-surface-variant">Competitive championships</span>
              </div>
            </div>
          </label>

          <label class="relative flex cursor-pointer rounded-xl border border-outline-variant p-4 hover:bg-surface-container-low transition-colors group has-[:checked]:border-secondary has-[:checked]:bg-secondary/5">
            <input class="sr-only peer" name="event_type" type="radio" value="friendly_match" />
            <div class="flex items-center gap-3">
              <div class="flex-shrink-0 w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary transition-colors">
                <span class="material-symbols-outlined">handshake</span>
              </div>
              <div class="flex flex-col">
                <span class="font-bold font-headline text-primary">Friendly Match</span>
                <span class="text-xs text-on-surface-variant">Non-competitive fixtures</span>
              </div>
            </div>
          </label>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-1.5">
            <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Tournament Category</label>
            <select
              name="tournament_name"
              class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
            >
              <option value="COSAFA Cup">COSAFA Cup</option>
              <option value="AFCON">AFCON</option>
              <option value="AFCON Qualification">AFCON Qualification</option>
              <option value="World Cup">World Cup</option>
              <option value="World Cup Qualification">World Cup Qualification</option>
              <option value="CAF Champions League">CAF Champions League</option>
              <option value="CAF Confederation Cup">CAF Confederation Cup</option>
              <option value="SADC Schools Games">SADC Schools Games</option>
              <option value="FEASSSA Games">FEASSSA Games</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Host Country</label>
            <input
              name="host_country"
              class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
              placeholder="e.g. South Africa"
              type="text"
              required
            />
          </div>

          <div class="md:col-span-2 space-y-1.5">
            <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Host City / Venue</label>
            <input
              name="host_city"
              class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
              placeholder="Specify city and stadium name"
              type="text"
            />
          </div>

          <div class="md:col-span-2 space-y-1.5">
            <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Tournament name (if &quot;Other&quot;)</label>
            <input
              name="tournament_name_other"
              class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
              placeholder="Required when tournament is Other"
              type="text"
            />
          </div>

          <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Opponent (optional)</label>
              <input
                name="opponent_team_name"
                class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                placeholder="e.g. Kaizer Chiefs"
                type="text"
              />
            </div>
            <div class="space-y-1.5">
              <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Opponent country (optional)</label>
              <input
                name="opponent_team_country"
                class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                placeholder="e.g. South Africa"
                type="text"
              />
            </div>
          </div>

          <div class="md:col-span-2 space-y-1.5">
            <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Event title (optional override)</label>
            <input
              name="event_display_name"
              class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
              placeholder="Defaults to tournament + host country"
              type="text"
            />
          </div>
        </div>
      </div>
    </section>
  );
});
