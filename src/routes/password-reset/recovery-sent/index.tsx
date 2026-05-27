import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AppLogo } from "~/components/app-logo";
import { APP_NAME, appPageTitle } from "~/lib/app-branding";
export default component$(() => {
  const email = useSignal<string | null>(null);
  const sent = useSignal(false);

  useVisibleTask$(() => {
    try {
      const e = sessionStorage.getItem("zfta_recovery_email");
      email.value = e;
      sent.value = Boolean(e);
    } catch {
      sent.value = false;
    }
  });

  return (
    <div class="min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav class="bg-primary/95 dark:bg-[#001a0c] docked full-width top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.1)] no-border tonal-shift bg-opacity-95 backdrop-blur-md">
        <div class="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <div class="flex min-w-0 items-center gap-3">
            <AppLogo href="/" size="sm" />
            <div class="text-lg font-extrabold tracking-tighter text-white uppercase font-headline truncate">
              {APP_NAME}
            </div>
          </div>

          <div class="flex items-center gap-4">
            <a
              class="bg-secondary-container text-on-secondary-container px-6 py-2 rounded-lg font-bold text-sm tracking-tight scale-95 active:scale-90 transition-transform shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
              href="/sign-in/"
            >
              Sign In
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main class="flex-grow flex items-center justify-center px-6 py-24 relative overflow-hidden">
        {/* Background Pattern */}
        <div class="absolute inset-0 z-0 opacity-5 pointer-events-none">
          <div class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary via-transparent to-transparent" />
        </div>

        <div class="w-full max-w-xl z-10">
          <div class="bg-surface-container-lowest rounded-xl p-10 md:p-16 text-center shadow-[0_40px_80px_-15px_rgba(0,0,0,0.06)] relative">
            {/* Large Success Icon */}
            <div class="mb-8 flex justify-center">
              <div class="w-24 h-24 bg-secondary-fixed rounded-full flex items-center justify-center success-glow border-4 border-white">
                <span
                  class="material-symbols-outlined text-on-secondary-fixed-variant text-5xl"
                  style="font-variation-settings: 'FILL' 1;"
                >
                  verified_user
                </span>
              </div>
            </div>

            <h1 class="font-headline font-extrabold text-3xl md:text-4xl text-primary tracking-tight mb-6">
              Recovery Link Sent
            </h1>

            <p class="font-body text-on-surface-variant text-lg leading-relaxed mb-10 max-w-md mx-auto">
              If an account exists for that email, a recovery link has been dispatched to your official inbox. Please
              check your junk folder if it does not appear within 5 minutes.
              {sent.value && email.value ? (
                <>
                  <br />
                  <span class="text-sm text-on-surface-variant/90">For: {email.value}</span>
                </>
              ) : null}
            </p>

            <div class="flex flex-col gap-4">
              <a
                class="inline-block bg-primary text-white font-headline font-bold py-4 px-10 rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-[0.98]"
                href="/sign-in/"
              >
                Return to Sign In
              </a>

              <p class="text-xs text-outline font-medium tracking-wide uppercase mt-4">
                Did not receive the email?{" "}
                <a class="text-secondary font-bold hover:underline underline-offset-4 transition-all" href="#">
                  Contact Registrar
                </a>
              </p>
            </div>
          </div>

          {/* Asymmetric Accent Element */}
          <div class="mt-8 flex justify-end">
            <div class="bg-surface-container-high p-4 rounded-xl flex items-center gap-4 max-w-xs border-l-4 border-secondary">
              <span class="material-symbols-outlined text-secondary">info</span>
              <p class="text-xs font-medium text-on-surface-variant italic">
                All access recovery attempts are logged for diplomatic security protocols.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer class="bg-emerald-950 w-full py-12 px-8">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="flex flex-col items-center gap-3 md:flex-row md:items-center">
            <AppLogo href="/" size="lg" />
            <div class="text-lg font-bold text-white font-headline text-center md:text-left">
              {APP_NAME}
            </div>
          </div>
          <div class="flex flex-wrap justify-center gap-8 font-body text-sm antialiased">
            <a class="text-emerald-200/60 hover:text-amber-400 transition-colors" href="#">
              Privacy Policy
            </a>
            <a class="text-emerald-200/60 hover:text-amber-400 transition-colors" href="#">
              Terms of Service
            </a>
          </div>
          <div class="text-emerald-200/60 font-body text-sm antialiased opacity-80 hover:opacity-100 transition-opacity">
            © 2026 Soxfort Solutions
          </div>
        </div>
      </footer>
    </div>
  );
});

export const head: DocumentHead = {
  title: appPageTitle("Recovery link sent"),
};
