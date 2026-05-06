import { $, component$, useSignal, useTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { resolveApplicantPostLoginPath } from "~/lib/applicant-redirect";
import { getCurrentUser, signIn, type AuthUser } from "~/lib/auth";

export default component$(() => {
  const location = useLocation();
  const currentUser = useSignal<AuthUser | null>(null);
  const email = useSignal("");
  const password = useSignal("");
  const error = useSignal<string | null>(null);
  const busy = useSignal(false);

  useTask$(() => {
    currentUser.value = getCurrentUser();
    if (location.url.searchParams.get("error") === "approver") {
      error.value =
        "Approver profile is missing a valid body (sport body code or SRC). Please contact support.";
    }
  });

  const onSubmit$ = $(async () => {
    error.value = null;
    busy.value = true;

    const res = await signIn({
      email: email.value,
      password: password.value,
    });

    busy.value = false;

    if (!res.ok) {
      error.value = res.error;
      return;
    }

    const u = getCurrentUser();
    if (u) {
      const path = await resolveApplicantPostLoginPath(u);
      window.location.assign(path);
    }
  });

  return (
    <div class="min-h-screen flex flex-col">
      {/* TopNavBar Shell (from your provided HTML) */}
      <header class="fixed top-0 w-full z-50 bg-emerald-950/70 backdrop-blur-xl shadow-2xl shadow-emerald-950/20">
        <nav class="flex justify-between items-center px-8 py-4 max-w-full">
          <div class="text-xl font-bold text-white tracking-tighter font-headline">
            Zimbabwe Sports Travel Authority
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

      {/* Main Content: Login Portal (from your HTML) */}
      <main class="flex-1 flex items-center justify-center pt-24 pb-12 px-6 relative overflow-hidden bg-surface-container-low">
        {/* Decorative Background Element */}
        <div class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div class="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] rounded-full bg-secondary/5 blur-[120px]" />

        <div class="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-0 bg-surface-container-lowest rounded-xl overflow-hidden premium-shadow relative z-10">
          {/* Left Side: Editorial Branding */}
          <div class="lg:col-span-5 bg-primary p-12 flex flex-col justify-between text-white relative">
            <div class="absolute inset-0 opacity-10" data-alt="Subtle geometric pattern inspired by Great Zimbabwe ruins">
              <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern height="40" id="grid" patternUnits="userSpaceOnUse" width="40">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-width="1" />
                  </pattern>
                </defs>
                <rect fill="url(#grid)" height="100%" width="100%" />
              </svg>
            </div>

            <div class="relative z-10">
              <span class="text-secondary-fixed font-headline font-bold tracking-widest text-xs uppercase mb-6 block">
                Official Portal
              </span>
              <h1 class="text-4xl lg:text-5xl font-headline font-extrabold tracking-tighter leading-none mb-6">
                The Diplomatic Pitch.
              </h1>
              <p class="text-emerald-50/70 font-body text-lg leading-relaxed max-w-xs">
                Secure access for international delegations, athletic personnel, and accredited media.
              </p>
            </div>

            <div class="relative z-10 mt-12">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                  <span class="material-symbols-outlined text-primary-fixed" style="font-variation-settings: 'FILL' 1;">
                    verified_user
                  </span>
                </div>
                <div>
                  <p class="text-sm font-bold font-headline">Authorized Entry Only</p>
                  <p class="text-xs text-emerald-50/50 font-body">Tier-1 Encryption Enabled</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div class="lg:col-span-7 p-8 md:p-16 flex flex-col justify-center bg-surface-container-lowest">
            <div class="mb-10">
              <h2 class="text-3xl font-headline font-bold text-on-background tracking-tight">
                Authority Sign In
              </h2>
              <p class="text-on-surface-variant mt-2 font-body">
                Enter your credentials to access the travel ecosystem.
              </p>
            </div>

            {location.url.searchParams.get("registered") === "1" ? (
              <div class="mb-6 rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm text-on-surface-variant">
                Registration submitted successfully. You can sign in while your account awaits admin review if
                required.
              </div>
            ) : null}

            {location.url.searchParams.get("reset") === "1" ? (
              <div class="mb-6 rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm text-on-surface-variant">
                Password reset successful. Sign in with your new password.
              </div>
            ) : null}

            {currentUser.value ? (
              <section class="rounded-xl bg-surface-container-highest p-5">
                <p class="text-sm text-on-surface-variant">Signed in as</p>
                <p class="mt-1 font-bold">{currentUser.value.email}</p>
                <a class="mt-4 inline-block text-primary font-bold hover:underline" href="/">
                  Go to home
                </a>
              </section>
            ) : (
              <form class="space-y-6" preventdefault:submit onSubmit$={onSubmit$}>
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

                <div class="relative">
                  <div class="flex justify-between items-center mb-2">
                    <label class="block text-sm font-semibold font-label text-on-surface-variant" for="password">
                      Access Key
                    </label>
                    <a
                      class="text-xs font-semibold text-secondary hover:text-on-secondary-fixed-variant transition-colors font-label"
                      href="/password-reset/"
                    >
                      Forgot Access Key?
                    </a>
                  </div>
                  <input
                    id="password"
                    name="password"
                    class="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl focus:ring-1 focus:ring-primary/30 focus:bg-surface-container-lowest transition-all duration-300 outline-none text-on-surface font-body"
                    placeholder="••••••••••••"
                    type="password"
                    value={password.value}
                    onInput$={(e) => {
                      password.value = (e.target as HTMLInputElement).value;
                    }}
                    required
                    autoComplete="current-password"
                  />
                </div>

                {error.value ? <p class="text-sm text-error mt-2">{error.value}</p> : null}

                <div class="pt-2">
                  <button
                    class="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white font-headline font-bold rounded-xl shadow-lg shadow-primary/20 hover:translate-y-[-2px] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-60"
                    type="submit"
                    disabled={busy.value}
                  >
                    {busy.value ? "Signing in..." : "Sign in to Authority"}
                    <span class="material-symbols-outlined text-lg" aria-hidden="true">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </form>
            )}

            <div class="mt-12 pt-10 border-t border-outline-variant/30 text-center">
              <p class="text-on-surface-variant text-sm font-body mb-4">New to the Federation?</p>
              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  class="px-6 py-3 border border-outline-variant rounded-full text-sm font-bold font-headline text-on-surface hover:bg-surface-container-high transition-colors"
                  href="/sign-up/"
                >
                  Apply for Accreditation
                </a>
                <a
                  class="px-6 py-3 bg-secondary-container text-on-secondary-container rounded-full text-sm font-bold font-headline hover:shadow-md transition-all"
                  href="/sign-up/"
                >
                  Register Organization
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Shell */}
      <footer class="mt-auto bg-emerald-950 w-full shrink-0 py-12 px-8">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="text-lg font-bold text-white font-headline">
            Zimbabwe Sports Travel Authority
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
  title: "Sign In",
};

