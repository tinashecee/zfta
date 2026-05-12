import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AppLogo } from "~/components/app-logo";
import { useLocation } from "@builder.io/qwik-city";

export default component$(() => {
  const location = useLocation();
  const sp = location.url.searchParams;
  const isSuccess = sp.get("success") === "1" || sp.get("registered") === "1";
  const email = sp.get("email")?.trim() ?? "";
  const errorMessage = sp.get("error")?.trim() ?? "";

  const hasResult = isSuccess || Boolean(errorMessage);

  return (
    <div class="flex min-h-screen flex-col">
      <header class="fixed top-0 z-50 w-full bg-emerald-950/70 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
        <nav class="flex max-w-full justify-between items-center px-8 py-4">
          <div class="flex min-w-0 items-center gap-3">
            <AppLogo href="/" size="sm" />
            <div class="text-xl font-bold tracking-tighter text-white font-headline truncate">
              Zimbabwe Sports Travel Authority
            </div>
          </div>

          <div class="flex items-center gap-4">
            <a
              class="scale-95 border-b-2 border-amber-500 pb-1 font-headline font-semibold tracking-tight text-amber-400 transition-transform active:scale-90"
              href="/sign-in/"
            >
              Sign In
            </a>
            <a
              class="scale-95 rounded-md bg-secondary-container px-5 py-2 font-headline font-semibold text-on-secondary-container transition-all duration-300 hover:bg-white/10 active:scale-90"
              href="/sign-up/"
            >
              Register
            </a>
          </div>
        </nav>
      </header>

      <main class="relative flex flex-grow items-center justify-center overflow-hidden bg-surface-container-low px-6 pb-12 pt-24">
        <div class="absolute top-0 right-0 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/4 rounded-full bg-primary/5 blur-[120px]" />
        <div class="absolute bottom-0 left-0 h-[600px] w-[600px] translate-y-1/2 -translate-x-1/4 rounded-full bg-secondary/5 blur-[120px]" />

        <div class="relative z-10 w-full max-w-2xl rounded-xl bg-surface-container-lowest p-8 shadow-xl md:p-12 premium-shadow">
          {!hasResult ? (
            <>
              <h1 class="text-3xl font-headline font-extrabold tracking-tighter text-primary">Registration status</h1>
              <p class="mt-4 text-on-surface-variant font-body">
                This page is shown after you submit registration. If you opened this link directly, start from the
                registration form.
              </p>
              <div class="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  class="inline-flex justify-center rounded-xl bg-primary px-6 py-3 font-headline font-bold text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                  href="/sign-up/"
                >
                  Go to registration
                </a>
                <a
                  class="inline-flex justify-center rounded-xl border border-outline-variant px-6 py-3 font-headline font-bold text-primary transition-colors hover:bg-surface-container-high"
                  href="/sign-in/"
                >
                  Sign in
                </a>
              </div>
            </>
          ) : isSuccess ? (
            <>
              <div class="mb-6 flex justify-center">
                <div class="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-secondary-fixed shadow-lg">
                  <span
                    class="material-symbols-outlined text-4xl text-on-secondary-fixed-variant"
                    style="font-variation-settings: 'FILL' 1;"
                  >
                    mark_email_read
                  </span>
                </div>
              </div>
              <h1 class="text-center text-3xl font-headline font-extrabold tracking-tighter text-primary">
                Registration successful
              </h1>
              <p class="mt-4 text-center text-on-surface-variant font-body leading-relaxed">
                Your account has been created.{" "}
                <span class="font-semibold text-on-surface">
                  A verification email has been sent
                  {email ? (
                    <>
                      {" "}
                      to <span class="break-all text-primary">{email}</span>
                    </>
                  ) : null}
                </span>
                . Please open that message and verify your email address before signing in. Check your spam folder if
                you do not see it within a few minutes.
              </p>
              <div class="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                  class="inline-flex justify-center rounded-xl bg-primary px-8 py-4 font-headline font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
                  href="/sign-in/"
                >
                  Continue to sign in
                </a>
              </div>
            </>
          ) : (
            <>
              <div class="mb-6 flex justify-center">
                <div class="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-error-container/30">
                  <span class="material-symbols-outlined text-4xl text-error">error</span>
                </div>
              </div>
              <h1 class="text-center text-3xl font-headline font-extrabold tracking-tighter text-primary">
                Registration could not be completed
              </h1>
              <p class="mt-2 text-center text-sm text-on-surface-variant font-body">
                Something went wrong while creating your account.
              </p>
              <div
                class="mt-6 rounded-xl border border-error/20 bg-error-container/15 px-4 py-3 text-center text-sm text-error"
                role="alert"
              >
                {errorMessage || "An unknown error occurred."}
              </div>
              <div class="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                  class="inline-flex justify-center rounded-xl bg-primary px-8 py-4 font-headline font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
                  href="/sign-up/"
                >
                  Back to registration
                </a>
                <a
                  class="inline-flex justify-center rounded-xl border border-outline-variant px-8 py-4 font-headline font-bold text-primary transition-colors hover:bg-surface-container-high"
                  href="/sign-in/"
                >
                  Sign in
                </a>
              </div>
            </>
          )}
        </div>
      </main>

      <footer class="w-full bg-emerald-950 py-12 px-8">
        <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div class="flex flex-col items-center gap-3 md:flex-row md:items-center">
            <AppLogo href="/" size="lg" />
            <div class="text-lg font-bold text-white font-headline text-center md:text-left">
              Zimbabwe Sports Travel Authority
            </div>
          </div>
          <div class="flex flex-wrap justify-center gap-8 font-body text-sm antialiased">
            <a class="text-emerald-200/60 transition-colors hover:text-amber-400" href="#">
              Privacy Policy
            </a>
            <a class="text-emerald-200/60 transition-colors hover:text-amber-400" href="#">
              Terms of Service
            </a>
          </div>
          <div class="font-body text-sm text-emerald-200/60 opacity-80 transition-opacity hover:opacity-100">
            © 2026 Soxfort Solutions
          </div>
        </div>
      </footer>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Registration status",
};
