import { component$ } from "@builder.io/qwik";
import { TOURNAMENT_CLASSIFICATION_OPTIONS } from "~/lib/tournament-classification";

export const TournamentClassificationSelect = component$(() => {
  return (
    <div class="space-y-1.5">
      <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">
        Tournament classification
      </label>
      <select
        name="tournament_clasification"
        class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
      >
        <option value="">— Select (optional) —</option>
        {TOURNAMENT_CLASSIFICATION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
});
