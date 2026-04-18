import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ApplicantPortalNav } from "~/components/applicant-portal-nav";
import { getStoredTheme, setTheme, type ThemePreference } from "~/lib/theme";

export default component$(() => {
  const darkEnabled = useSignal(false);

  useVisibleTask$(() => {
    const stored = getStoredTheme();
    if (stored === "dark" || stored === "light") {
      darkEnabled.value = stored === "dark";
      return;
    }
    darkEnabled.value = document.documentElement.classList.contains("dark");
  });

  const onToggleDark$ = $(() => {
    const next: ThemePreference = darkEnabled.value ? "light" : "dark";
    darkEnabled.value = next === "dark";
    setTheme(next);
  });

  return (
    <div class="min-h-screen flex flex-col bg-background text-on-background font-body">
      <ApplicantPortalNav activeItem="settings" />

      <main class="flex-grow pt-24 pb-20 px-4 md:px-8">
        <div class="max-w-2xl mx-auto">
          <h1 class="text-4xl md:text-5xl font-extrabold font-headline text-primary tracking-tight mb-2">Settings</h1>
          <p class="text-on-surface-variant text-lg mb-10">
            Appearance and preferences for your portal session.
          </p>

          <section class="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 md:p-8 shadow-sm">
            <h2 class="font-headline text-lg font-bold text-primary mb-6">Appearance</h2>

            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p class="font-semibold text-on-surface">Dark mode</p>
                <p class="text-sm text-on-surface-variant mt-1">
                  Use a dark background and light text across the app. Your choice is saved on this device.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={darkEnabled.value}
                aria-label="Toggle dark mode"
                class={`relative inline-flex h-9 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  darkEnabled.value ? "bg-primary" : "bg-surface-container-highest"
                }`}
                onClick$={onToggleDark$}
              >
                <span
                  class={`pointer-events-none inline-block h-8 w-8 transform rounded-full bg-white shadow ring-0 transition ${
                    darkEnabled.value ? "translate-x-7" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Settings | Zimbabwe Sports Travel Authority",
};
