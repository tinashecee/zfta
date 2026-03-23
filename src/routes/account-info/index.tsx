import { $, component$, useSignal, useTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  clearPendingAccountInfoMock,
  getCurrentUser,
  getPendingAccountInfoMock,
  signOut,
  type AuthUser,
} from "~/lib/auth";

export default component$(() => {
  const currentUser = useSignal<AuthUser | null>(null);
  const pending = useSignal(false);

  useTask$(() => {
    currentUser.value = getCurrentUser();
    pending.value = getPendingAccountInfoMock();
  });

  const onContinue$ = $(() => {
    // For now, forward to the organization profile screen.
    clearPendingAccountInfoMock();
    window.location.assign("/applicant/organization-profile/");
  });

  return (
    <div class="mx-auto max-w-xl px-4 py-16">
      <h1 class="text-3xl font-headline font-extrabold tracking-tighter">
        Account Setup
      </h1>

      {!pending.value ? (
        <section class="mt-6 rounded-xl bg-surface-container-lowest p-6">
          <p class="text-on-surface-variant">
            There is no account setup prompt at the moment.
          </p>
          <a class="mt-4 inline-block text-primary hover:underline" href="/applicant/organization-profile/">
            Go to Organization Profile
          </a>
        </section>
      ) : !currentUser.value ? (
        <section class="mt-6 rounded-xl bg-surface-container-lowest p-6">
          <p class="text-on-surface-variant">Please sign in again.</p>
          <a class="mt-4 inline-block text-primary hover:underline" href="/sign-in/">
            Go to Sign In
          </a>
        </section>
      ) : (
        <section class="mt-6 rounded-xl bg-surface-container-lowest p-6 shadow-[0_40px_60px_-15px_rgba(25,28,27,0.06)]">
          <p class="text-sm text-on-surface-variant">
            Signed in as <span class="font-bold">{currentUser.value.email}</span>
          </p>

          <h2 class="mt-4 text-2xl font-headline font-bold text-primary">
            Next: Enter Account Info
          </h2>

          <p class="mt-2 text-on-surface-variant">
            We will add the real account info form later. For now, this step confirms your sign-up succeeded.
          </p>

          <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              class="rounded-xl bg-primary px-5 py-3 text-white font-bold hover:bg-primary-container"
              onClick$={onContinue$}
            >
              Continue (placeholder)
            </button>

            <button
              type="button"
              class="rounded-xl bg-surface-container-high px-5 py-3 text-primary font-bold hover:bg-surface-container-lowest"
              onClick$={$(async () => {
                await signOut();
                window.location.assign("/sign-in/");
              })}
            >
              Sign out
            </button>
          </div>
        </section>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Account Setup",
};

