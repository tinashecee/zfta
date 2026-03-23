import { $, component$, useSignal, useTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { getCurrentUser, requestPasswordReset, type AuthUser } from "~/lib/auth";

export default component$(() => {
  const currentUser = useSignal<AuthUser | null>(null);

  const email = useSignal("");
  const error = useSignal<string | null>(null);
  const busy = useSignal(false);

  useTask$(() => {
    currentUser.value = getCurrentUser();
  });

  const onSubmit$ = $(async () => {
    error.value = null;
    busy.value = true;

    const res = await requestPasswordReset(email.value);

    busy.value = false;

    if (!res.ok) {
      error.value = res.error;
      return;
    }

    try {
      sessionStorage.setItem("zfta_recovery_email", email.value.trim().toLowerCase());
    } catch {
      /* ignore */
    }

    window.location.assign("/password-reset/recovery-sent/");
  });

  return (
    <div class="min-h-screen flex flex-col">
      {/* TopNavBar Shell (style matches your other auth pages) */}
      <header class="fixed top-0 w-full z-50 bg-emerald-950/70 backdrop-blur-xl shadow-2xl shadow-emerald-950/20">
        <nav class="flex justify-between items-center px-8 py-4 max-w-full">
          <div class="text-xl font-bold text-white tracking-tighter font-headline">
            Zimbabwe Football Travel Authority
          </div>

          <div class="flex items-center gap-4">
            <a
              class="text-amber-400 font-semibold border-b-2 border-amber-500 pb-1 font-headline tracking-tight scale-95 active:scale-90 transition-transform"
              href="/sign-in/"
            >
              Sign In
            </a>
            <a
              class="bg-secondary-container text-on-secondary-container px-5 py-2 rounded-md font-semibold hover:bg-white/10 transition-all duration-300 scale-95 active:scale-90 font-headline tracking-tight"
              href="/sign-up/"
            >
              Register
            </a>
          </div>
        </nav>
      </header>

      <main class="flex-grow flex items-center justify-center px-6 pt-24 pb-12 relative overflow-hidden bg-surface-container-low">
        {/* Decorative Background */}
        <div class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div class="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] rounded-full bg-secondary/5 blur-[120px]" />

        <div class="max-w-2xl w-full relative z-10 bg-surface-container-lowest rounded-xl p-8 md:p-12 premium-shadow">
          <div class="mb-8">
            <h1 class="text-3xl font-headline font-extrabold tracking-tighter">
              Password Recovery
            </h1>
            <p class="text-on-surface-variant mt-2 font-body">
              Enter your email and we will send a recovery link if the account exists.
            </p>
          </div>

          <form preventdefault:submit onSubmit$={onSubmit$} class="space-y-6">
            <div>
              <label class="block text-sm font-semibold font-label text-on-surface-variant mb-2" for="email">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                class="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl focus:ring-1 focus:ring-primary/30 focus:bg-surface-container-lowest transition-all duration-300 outline-none text-on-surface font-body"
                placeholder="official@delegation.gov.zw"
                type="email"
                value={email.value}
                onInput$={(e) => {
                  email.value = (e.target as HTMLInputElement).value;
                }}
                required
                autoComplete="email"
              />
            </div>

            {error.value ? (
              <p class="text-sm text-error" role="alert">
                {error.value}
              </p>
            ) : null}

            <button
              type="submit"
              class="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white font-headline font-bold rounded-xl shadow-lg shadow-primary/20 hover:translate-y-[-2px] active:scale-95 transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-3"
              disabled={busy.value}
            >
              {busy.value ? "Sending..." : "Send Recovery Link"}
              <span class="material-symbols-outlined text-lg" aria-hidden="true">
                arrow_forward
              </span>
            </button>

            <div class="text-center text-sm">
              <a class="font-bold text-secondary hover:underline" href="/sign-in/">
                Return to Sign In
              </a>
            </div>
          </form>
        </div>
      </main>

      <footer class="bg-emerald-950 w-full py-12 px-8">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="text-lg font-bold text-white font-headline">
            Zimbabwe Football Travel Authority
          </div>
          <div class="flex flex-wrap justify-center gap-8 font-body text-sm antialiased">
            <a class="text-emerald-200/60 hover:text-amber-400 transition-colors" href="#">
              Privacy Policy
            </a>
            <a
              class="text-emerald-200/60 hover:text-amber-400 transition-colors"
              href="#"
            >
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
  title: "Password Recovery",
};

