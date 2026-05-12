import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AppLogo } from "~/components/app-logo";
import { useLocation } from "@builder.io/qwik-city";
import { resetPasswordWithToken } from "~/lib/auth";

export default component$(() => {
  const location = useLocation();
  const token = useSignal("");
  const password = useSignal("");
  const confirm = useSignal("");
  const error = useSignal<string | null>(null);
  const busy = useSignal(false);

  useVisibleTask$(() => {
    const t = location.url.searchParams.get("token")?.trim() ?? "";
    token.value = t;
    if (!t) {
      error.value = "Invalid or missing reset token. Use the link from your email.";
    }
  });

  const onSubmit$ = $(async () => {
    error.value = null;
    if (!token.value) {
      error.value = "Missing reset token.";
      return;
    }
    if (password.value.length < 8) {
      error.value = "Password must be at least 8 characters.";
      return;
    }
    if (password.value !== confirm.value) {
      error.value = "Passwords do not match.";
      return;
    }

    busy.value = true;
    const res = await resetPasswordWithToken({
      token: token.value,
      password: password.value,
    });
    busy.value = false;

    if (!res.ok) {
      error.value = res.error;
      return;
    }

    window.location.assign("/sign-in/?reset=1");
  });

  return (
    <div class="min-h-screen flex flex-col">
      <header class="fixed top-0 w-full z-50 bg-emerald-950/70 backdrop-blur-xl shadow-2xl shadow-emerald-950/20">
        <nav class="flex justify-between items-center px-8 py-4 max-w-full">
          <div class="flex min-w-0 items-center gap-3">
            <AppLogo href="/" size="sm" />
            <div class="text-xl font-bold text-white tracking-tighter font-headline truncate">
              Zimbabwe Sports Travel Authority
            </div>
          </div>
          <a
            class="text-amber-400 font-semibold border-b-2 border-amber-500 pb-1 font-headline tracking-tight"
            href="/sign-in/"
          >
            Sign In
          </a>
        </nav>
      </header>

      <main class="flex-grow flex items-center justify-center px-6 pt-24 pb-12 relative overflow-hidden bg-surface-container-low">
        <div class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div class="max-w-lg w-full relative z-10 bg-surface-container-lowest rounded-xl p-8 md:p-12 premium-shadow">
          <h1 class="text-3xl font-headline font-extrabold tracking-tighter">Set new password</h1>
          <p class="text-on-surface-variant mt-2 font-body">
            Choose a new password (at least 8 characters).
          </p>

          <form preventdefault:submit onSubmit$={onSubmit$} class="space-y-6 mt-8">
            <div>
              <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="password">
                New password
              </label>
              <input
                id="password"
                class="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl focus:ring-1 focus:ring-primary/30 outline-none"
                type="password"
                autoComplete="new-password"
                value={password.value}
                onInput$={(e) => {
                  password.value = (e.target as HTMLInputElement).value;
                }}
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-on-surface-variant mb-2" for="confirm">
                Confirm password
              </label>
              <input
                id="confirm"
                class="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl focus:ring-1 focus:ring-primary/30 outline-none"
                type="password"
                autoComplete="new-password"
                value={confirm.value}
                onInput$={(e) => {
                  confirm.value = (e.target as HTMLInputElement).value;
                }}
              />
            </div>

            {error.value ? (
              <p class="text-sm text-error" role="alert">
                {error.value}
              </p>
            ) : null}

            <button
              type="submit"
              class="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white font-headline font-bold rounded-xl shadow-lg disabled:opacity-60"
              disabled={busy.value || !token.value}
            >
              {busy.value ? "Saving…" : "Update password"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Reset password",
};
