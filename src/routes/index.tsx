import { $, component$, useSignal, useTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { resolveApplicantPostLoginPath } from "~/lib/applicant-redirect";
import { getCurrentUser, signIn, signOut, type AuthUser } from "~/lib/auth";

export default component$(() => {
  const currentUser = useSignal<AuthUser | null>(null);

  const email = useSignal("");
  const accessKey = useSignal("");
  const error = useSignal<string | null>(null);
  const busy = useSignal(false);

  useTask$(() => {
    currentUser.value = getCurrentUser();
  });

  const onSignIn$ = $(async () => {
    error.value = null;
    busy.value = true;

    const res = await signIn({
      email: email.value,
      password: accessKey.value,
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
    <>
      <nav class="fixed top-0 w-full z-50 bg-surface/70 backdrop-blur-xl shadow-[0_40px_60px_-15px_rgba(25,28,27,0.06)] h-20">
        <div class="flex justify-between items-center max-w-7xl mx-auto px-8 h-full">
          <div class="flex items-center gap-8">
            <span class="text-2xl font-black tracking-tighter text-emerald-950 font-headline">
              <span class="md:hidden">ZFT</span>
              <span class="hidden md:inline">Zim Sports Travel</span>
            </span>
          </div>

          <div class="flex items-center gap-4">
            {currentUser.value ? (
              <>
                <a
                  class="px-6 py-2.5 rounded-xl font-medium text-emerald-800/70 hover:bg-emerald-50/50 transition-all"
                  href="/"
                >
                  Dashboard
                </a>
                <button
                  type="button"
                  class="px-6 py-2.5 rounded-xl font-medium text-emerald-800/70 hover:bg-emerald-50/50 transition-all"
                  onClick$={$(async () => {
                    await signOut();
                    window.location.assign("/");
                  })}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <a
                  class="px-6 py-2.5 rounded-xl font-medium text-emerald-800/70 hover:bg-emerald-50/50 transition-all"
                  href="/sign-in/"
                >
                  Sign In
                </a>
                <a
                  class="px-6 py-2.5 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
                  href="/sign-up/"
                >
                  Sign Up
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      <main class="pt-20">
        {/* Hero Section */}
        <section class="relative min-h-[870px] flex items-center overflow-hidden bg-primary">
          <div class="absolute inset-0 z-0">
            <img
              alt="Majestic Zimbabwean landscape at sunset"
              class="w-full h-full object-cover opacity-40"
              data-alt="Golden sunset over a Zimbabwean savanna landscape"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMHmzNJYhpamwt9zMwMn5_SZWlLZUObRVByfF7OrijLznY2RLmGp3JpbpncpIbbA5WeNuFsKWIGj5sImWjVUL1bNb8aW6ZZJ944l3sCiPPhmSJ08NoxhJB4TG_dZDZJzju9F89q1epEcfEQ3GPPU31nOfvd3E8F9y8_tZb_iEmD6bl8Kvey5yILzbdFGSnfdjxfk0HQH9MhFaktrgSbcVPTd5rPrBpue6yrKY-yXCgC8RKV_2yEq52vRETLLwyQ5_JL_OEjOStzN8"
            />
            <div class="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent" />
          </div>

          <div class="relative z-10 max-w-7xl mx-auto px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div class="space-y-8">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/20 border border-secondary-container/30 text-secondary-fixed text-sm font-semibold tracking-wider uppercase">
                <span class="material-symbols-outlined text-sm" data-icon="verified">
                  verified
                </span>
                Official Diplomatic Channel
              </div>

              <h1 class="text-6xl md:text-8xl font-black text-white font-headline leading-[0.95] tracking-tighter">
                The Diplomatic <span class="text-secondary-fixed">Pitch.</span>
              </h1>

              <p class="text-xl text-primary-fixed/80 max-w-lg leading-relaxed">
                Streamlining international travel authorizations for football delegations, elite athletes, and accredited
                media representing the spirit of Zimbabwe.
              </p>

              <div class="flex flex-wrap gap-4">
                <a
                  class="px-8 py-4 rounded-xl bg-secondary-container text-on-secondary-container font-extrabold text-lg shadow-xl shadow-secondary/20 hover:scale-105 transition-transform"
                  href="#"
                >
                  Start Authorization
                </a>
                <a
                  class="px-8 py-4 rounded-xl bg-white/10 backdrop-blur-md text-white font-bold border border-white/20 hover:bg-white/20 transition-all"
                  href="#"
                >
                  View Protocols
                </a>
              </div>
            </div>

            {/* Auth State Simulation Section */}
            <div class="lg:justify-self-end w-full max-w-md">
              {!currentUser.value ? (
                <div class="p-8 rounded-2xl bg-surface-container-lowest shadow-[0_40px_60px_-15px_rgba(25,28,27,0.12)] space-y-6">
                  <div class="space-y-2">
                    <h3 class="text-2xl font-black font-headline text-primary">
                      Secure Portal
                    </h3>
                    <p class="text-on-surface-variant">
                      Sign in to manage your diplomatic travel dossier and track authorization status.
                    </p>
                  </div>

                  <form
                    preventdefault:submit
                    onSubmit$={onSignIn$}
                    class="space-y-4"
                  >
                    <div class="space-y-1.5">
                      <label class="text-xs font-bold uppercase tracking-widest text-outline">
                        Email Address
                      </label>
                      <input
                        class="w-full px-4 py-3 rounded-xl bg-surface-container-highest border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all"
                        placeholder="envoy@football.gov.zw"
                        type="email"
                        value={email.value}
                        onInput$={(e) => {
                          email.value = (e.target as HTMLInputElement).value;
                        }}
                        autoComplete="email"
                      />
                    </div>

                    <div class="space-y-1.5">
                      <label class="text-xs font-bold uppercase tracking-widest text-outline">
                        Access Key
                      </label>
                      <input
                        class="w-full px-4 py-3 rounded-xl bg-surface-container-highest border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all"
                        placeholder="••••••••"
                        type="password"
                        value={accessKey.value}
                        onInput$={(e) => {
                          accessKey.value = (e.target as HTMLInputElement).value;
                        }}
                        autoComplete="current-password"
                      />
                    </div>

                    {error.value ? (
                      <p class="text-sm text-error-container text-error">{error.value}</p>
                    ) : null}

                    <div class="flex flex-col gap-3">
                      <button
                        type="submit"
                        class="w-full py-4 rounded-xl bg-primary text-white font-bold hover:shadow-lg transition-all disabled:opacity-60"
                        disabled={busy.value}
                      >
                        {busy.value ? "Signing in..." : "Sign in to Authority"}
                      </button>

                      <div class="relative py-2 text-center">
                        <div class="absolute inset-0 flex items-center">
                          <div class="w-full border-t border-outline-variant/30" />
                        </div>
                        <span class="relative px-4 text-xs font-bold uppercase tracking-widest text-outline bg-surface-container-lowest">
                          Or
                        </span>
                      </div>

                      <a
                        class="w-full py-4 rounded-xl border border-primary text-primary font-bold hover:bg-primary/5 transition-all text-center"
                        href="/sign-up/"
                      >
                        Apply for Accreditation
                      </a>
                    </div>
                  </form>
                </div>
              ) : (
                <div class="p-8 rounded-2xl bg-surface-container-lowest shadow-[0_40px_60px_-15px_rgba(25,28,27,0.12)] space-y-4">
                  <div class="space-y-2">
                    <h3 class="text-2xl font-black font-headline text-primary">
                      Portal Access Granted
                    </h3>
                    <p class="text-on-surface-variant">
                      Signed in as <span class="font-bold">{currentUser.value.email}</span>.
                    </p>
                  </div>

                  <a
                    class="w-full block py-4 rounded-xl bg-primary text-white font-bold hover:shadow-lg transition-all text-center"
                    href="/sign-in/"
                  >
                    Go to Manage Dossier
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Signature Bento Grid */}
        <section id="features" class="py-24 max-w-7xl mx-auto px-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-2 p-12 rounded-[2rem] bg-surface-container-low flex flex-col justify-between relative overflow-hidden group">
              <div class="relative z-10">
                <span class="text-tertiary font-black text-6xl opacity-10 absolute -top-4 -left-4">
                  01
                </span>
                <h3 class="text-4xl font-black font-headline text-primary mb-4">
                  Elite Athlete Visa Waiver
                </h3>
                <p class="text-lg text-on-surface-variant max-w-md">
                  Priority processing for National Team members and FIFA-accredited personnel with guaranteed 24-hour turnaround.
                </p>
              </div>
              <div class="mt-12 flex items-center gap-4 relative z-10">
                <div class="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white">
                  <span class="material-symbols-outlined" data-icon="bolt">
                    bolt
                  </span>
                </div>
                <span class="font-bold text-primary">Express Lane Active</span>
              </div>
              <div class="absolute -bottom-12 -right-12 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
            </div>

            <div class="p-8 rounded-[2rem] bg-primary text-white flex flex-col justify-between hover:bg-primary-container transition-colors cursor-pointer">
              <span
                class="material-symbols-outlined text-4xl text-secondary-fixed"
                data-icon="stadium"
                data-weight="fill"
                style="font-variation-settings: 'FILL' 1;"
              >
                stadium
              </span>
              <div>
                <h4 class="text-2xl font-bold font-headline mb-2">Venue Logistics</h4>
                <p class="text-primary-fixed/70 text-sm">
                  Automated transport sync with National Sports Stadium and major regional hubs.
                </p>
              </div>
            </div>

            <div class="p-8 rounded-[2rem] bg-tertiary text-white flex flex-col justify-between hover:scale-[0.98] transition-transform cursor-pointer">
              <span
                class="material-symbols-outlined text-4xl text-secondary-fixed"
                data-icon="policy"
                data-weight="fill"
                style="font-variation-settings: 'FILL' 1;"
              >
                policy
              </span>
              <div>
                <h4 class="text-2xl font-bold font-headline mb-2">FIFA Compliance</h4>
                <p class="text-white/70 text-sm">Fully integrated with global football governance travel standards.</p>
              </div>
            </div>

            <div class="md:col-span-2 p-8 rounded-[2rem] bg-surface-container-highest flex flex-col md:flex-row items-center gap-8">
              <div class="w-full md:w-1/2 h-64 rounded-2xl overflow-hidden">
                <img
                  alt="Professional football training session"
                  class="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFvIQOfNL0egNR_r4j1ILjFH4tvCIJFZTTFUTE-Cz50FbiU5suX5yT9R37gW1ZRULSYVsW6cIND2idl-JUP7NtyUxIhf-CPdAPnzCXzDX9Lh7kHYhifTkdI3zmFJuChSKwFneeRcq66JBPetkZ-jeQlJ6WI81Piak1haC-sjHcTsyBZbnDBbqjWAO82n7LmN8Gdo0p7NKk_qGSNVBAVwz8CFn5Pu8n_tfQqBHEnJ9_odwxpwL43cKe8oHbEuauv2pZWuYe8fKL_Xk"
                />
              </div>
              <div class="w-full md:w-1/2 space-y-4">
                <div class="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full w-fit uppercase">
                  News & Updates
                </div>
                <h4 class="text-2xl font-bold font-headline text-primary">
                  Diplomatic Status Updates for AFCON Qualifiers
                </h4>
                <p class="text-on-surface-variant text-sm leading-relaxed">
                  Enhanced clearance protocols now active for the upcoming delegation movements across the continent.
                </p>
                <a class="inline-flex items-center gap-2 text-primary font-bold group" href="#">
                  Read Briefing{" "}
                  <span
                    class="material-symbols-outlined group-hover:translate-x-1 transition-transform"
                    data-icon="arrow_forward"
                  >
                    arrow_forward
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Signed In State Mockup (Secondary View) */}
        {currentUser.value ? (
          <section class="py-24 bg-surface-container-low/50">
            <div class="max-w-4xl mx-auto px-8">
              <div class="text-center mb-12">
                <h2 class="text-4xl font-black font-headline text-primary mb-4">
                  Your Diplomatic Dashboard
                </h2>
                <p class="text-on-surface-variant">Manage active authorizations and verified identity credentials.</p>
              </div>

              <div class="p-8 rounded-3xl bg-surface-container-lowest shadow-xl border border-outline-variant/15 flex flex-col md:flex-row items-center gap-8">
                <div class="relative">
                  <div class="w-32 h-32 rounded-full overflow-hidden border-4 border-secondary-container">
                    <img
                      alt="Official profile portrait"
                      class="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSk-JkpjCfWb0Tygfe7dKWpUAybmU-mK509gRxTXCAMIvPDsQeNpIiiV53j8U9GmFY34o63WPf_JY_y2ggtpPK0nhoRHGs43uCkCkRWKOjBJZPc2i6jb1Ss3DgkZZX7Jk4aoFz1NSYXViakPoLed-KibXUo64j2HVKCA6LAFafsUQ69Mc7JgCmjD6FFqGGbmthd9bfHzU8b3Xgt0ML13GtcHjVgSl9C06QBeRcmw8FEAh0pPXcAruPHqcIYpZl5UFl2VS-tsQl2vU"
                    />
                  </div>
                  <div class="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white border-2 border-surface-container-lowest">
                    <span
                      class="material-symbols-outlined text-sm"
                      data-icon="verified"
                      data-weight="fill"
                      style="font-variation-settings: 'FILL' 1;"
                    >
                      verified
                    </span>
                  </div>
                </div>

                <div class="flex-1 text-center md:text-left space-y-2">
                  <div class="text-xs font-bold text-outline uppercase tracking-[0.2em]">
                    Signed in as
                  </div>
                  <h3 class="text-2xl font-black font-headline text-primary">
                    {currentUser.value.email}
                  </h3>

                  <div class="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                    <span class="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold uppercase tracking-wider">
                      Active Credentials
                    </span>
                    <span class="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-bold uppercase tracking-wider">
                      Gold Status
                    </span>
                  </div>
                </div>

                <div class="flex flex-col gap-2 w-full md:w-auto">
                  <a
                    class="px-6 py-3 rounded-xl bg-surface-container-high text-primary font-bold hover:bg-surface-container-highest transition-colors text-center"
                    href="#"
                  >
                    Access Vault
                  </a>
                  <button
                    type="button"
                    class="px-6 py-3 rounded-xl text-error font-bold hover:bg-error/5 transition-colors"
                    onClick$={$(async () => {
                      await signOut();
                      window.location.assign("/");
                    })}
                  >
                    Terminate Session
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Final CTA */}
        <section class="py-32 bg-primary relative overflow-hidden">
          <div class="absolute inset-0 opacity-10">
            <div class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent scale-150" />
          </div>
          <div class="relative z-10 max-w-4xl mx-auto px-8 text-center space-y-8">
            <h2 class="text-5xl md:text-6xl font-black font-headline text-white tracking-tighter">
              Ready for Departure?
            </h2>
            <p class="text-xl text-primary-fixed/70 max-w-2xl mx-auto">
              Join the official framework for elite football logistics in Zimbabwe. Secure, rapid, and authoritative.
            </p>
            <div class="flex justify-center gap-4">
              <a
                class="px-12 py-5 rounded-xl bg-secondary-container text-on-secondary-container font-black text-xl hover:shadow-2xl hover:shadow-secondary/30 transition-all active:scale-95"
                href="/sign-up/"
              >
                Apply for Access Now
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer class="bg-emerald-950 dark:bg-black w-full box-border py-12 px-[clamp(1rem,4vw,2rem)] pb-[max(3rem,env(safe-area-inset-bottom,0px))]">
        <div class="mx-auto flex w-full max-w-7xl min-w-0 flex-col items-center gap-6 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-6 md:gap-y-4">
          <div class="w-full min-w-0 max-w-full text-center text-[clamp(0.65rem,2.8vw,0.875rem)] font-bold uppercase leading-snug tracking-wide text-amber-500 font-['Inter'] md:w-auto md:text-left md:text-sm">
            ZIMBABWE FOOTBALL TRAVEL AUTHORITY
          </div>
          <nav
            aria-label="Footer"
            class="flex w-full min-w-0 max-w-full flex-wrap justify-center gap-x-[clamp(0.75rem,3vw,2rem)] gap-y-2 md:flex-1 md:justify-center"
          >
            <a
              class="shrink-0 text-emerald-200/50 hover:text-white font-['Inter'] text-[clamp(0.65rem,2.5vw,0.875rem)] tracking-wide uppercase hover:underline decoration-amber-500 underline-offset-4 transition-opacity duration-200 md:text-sm"
              href="#"
            >
              Privacy Policy
            </a>
            <a
              class="shrink-0 text-emerald-200/50 hover:text-white font-['Inter'] text-[clamp(0.65rem,2.5vw,0.875rem)] tracking-wide uppercase hover:underline decoration-amber-500 underline-offset-4 transition-opacity duration-200 md:text-sm"
              href="#"
            >
              Terms of Service
            </a>
            <a
              class="shrink-0 text-emerald-200/50 hover:text-white font-['Inter'] text-[clamp(0.65rem,2.5vw,0.875rem)] tracking-wide uppercase hover:underline decoration-amber-500 underline-offset-4 transition-opacity duration-200 md:text-sm"
              href="#"
            >
              Consular Services
            </a>
            <a
              class="shrink-0 text-emerald-200/50 hover:text-white font-['Inter'] text-[clamp(0.65rem,2.5vw,0.875rem)] tracking-wide uppercase hover:underline decoration-amber-500 underline-offset-4 transition-opacity duration-200 md:text-sm"
              href="#"
            >
              FIFA Compliance
            </a>
          </nav>
          <div class="w-full min-w-0 text-center text-[clamp(0.6rem,2.2vw,0.75rem)] uppercase tracking-wide text-emerald-200/50 font-['Inter'] md:w-auto md:text-right md:text-xs">
            © 2026 Soxfort Solutions
          </div>
        </div>
      </footer>
    </>
  );
});

export const head: DocumentHead = {
  title: "Zimbabwe Sports Travel Authority",
  meta: [
    {
      name: "description",
      content: "The Diplomatic Pitch - premium travel authorization experience.",
    },
  ],
};
