import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AdminPortalNav } from "~/components/admin-portal-nav";
import { listUsers, type ApiUser } from "~/lib/users-api";

function countByRole(users: ApiUser[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const u of users) {
    const k = u.role || "unknown";
    m[k] = (m[k] ?? 0) + 1;
  }
  return m;
}

function needsActivation(u: ApiUser): boolean {
  const s = (u.status ?? "").trim().toLowerCase();
  if (!s) return true;
  if (s === "active" || s === "activated") return false;
  return s === "pending_profile" || s === "pending_approval" || s === "inactive";
}

export default component$(() => {
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const users = useSignal<ApiUser[] | null>(null);

  useVisibleTask$(async () => {
    loading.value = true;
    error.value = null;
    const r = await listUsers({ limit: 500, offset: 0 });
    loading.value = false;
    if (!r.ok) {
      error.value = r.error;
      users.value = [];
      return;
    }
    users.value = r.data;
  });

  const byRole = () => (users.value ? countByRole(users.value) : {});
  const activationCount = () => (users.value ? users.value.filter(needsActivation).length : 0);

  return (
    <div class="min-h-screen bg-background text-on-background">
      <AdminPortalNav activeItem="overview" />

      <main class="min-h-screen pt-20 lg:pl-64">
        <div class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:p-8">
          <section class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 class="font-headline text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                Overview
              </h2>
              <p class="mt-1 text-sm text-on-surface-variant sm:text-base">
                Zimbabwe Sports Travel Authority — admin console
              </p>
            </div>
            <a
              class="w-fit rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
              href="/admin/system-users/"
            >
              Manage users
            </a>
          </section>

          {loading.value ? (
            <p class="text-on-surface-variant">Loading summary…</p>
          ) : error.value ? (
            <div class="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
              {error.value}
            </div>
          ) : (
            <>
              <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Total users</p>
                  <p class="mt-2 font-headline text-4xl font-extrabold text-primary">{users.value?.length ?? 0}</p>
                  <p class="mt-1 text-xs text-on-surface-variant">From GET /api/v1/users (limit 500)</p>
                </div>
                <a
                  class="rounded-xl bg-surface-container-low p-6 shadow-sm transition-all hover:bg-surface-container-highest"
                  href="/admin/system-users/"
                >
                  <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Needs activation</p>
                  <p class="mt-2 font-headline text-3xl font-extrabold text-primary">{activationCount()}</p>
                  <p class="mt-1 text-xs text-on-surface-variant">pending_profile · pending_approval · inactive</p>
                </a>
                {Object.entries(byRole()).map(([role, count]) => (
                  <div key={role} class="rounded-xl bg-surface-container-low p-6 shadow-sm">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-outline">{role}</p>
                    <p class="mt-2 font-headline text-3xl font-extrabold text-primary">{count}</p>
                  </div>
                ))}
              </section>

              <section class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <a
                  class="group flex items-center justify-between rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm transition-all hover:border-primary/30"
                  href="/admin/system-users/"
                >
                  <div>
                    <span class="material-symbols-outlined mb-2 block text-3xl text-primary">group</span>
                    <h3 class="font-headline text-lg font-bold text-primary">System users</h3>
                    <p class="text-sm text-on-surface-variant">List, create, update, and soft-delete accounts</p>
                  </div>
                  <span class="material-symbols-outlined text-outline transition-transform group-hover:translate-x-1">
                    arrow_forward_ios
                  </span>
                </a>

                <a
                  class="group flex items-center justify-between rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm transition-all hover:border-primary/30"
                  href="/admin/accounts/"
                >
                  <div>
                    <span class="material-symbols-outlined mb-2 block text-3xl text-primary">domain</span>
                    <h3 class="font-headline text-lg font-bold text-primary">Applicant organisations</h3>
                    <p class="text-sm text-on-surface-variant">Organisation onboarding (when API is connected)</p>
                  </div>
                  <span class="material-symbols-outlined text-outline transition-transform group-hover:translate-x-1">
                    arrow_forward_ios
                  </span>
                </a>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "ZSTA Admin Console | Overview",
};
