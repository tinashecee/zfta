import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AdminPortalNav } from "~/components/admin-portal-nav";

const QUICK_ACTIONS = [
  {
    title: "Review Pending",
    description: "Applicant account verification",
    icon: "how_to_reg",
    href: "#",
    classes: "bg-secondary-container text-on-secondary-container shadow-xl shadow-secondary/5",
    filled: true,
  },
  {
    title: "Invite Approver",
    description: "ZIFA, SRC, or Immigration",
    icon: "person_add",
    href: "#",
    classes: "bg-primary text-white shadow-xl shadow-primary/10",
  },
  {
    title: "All Invitations",
    description: "View status of sent invites",
    icon: "mail",
    href: "#",
    classes: "bg-surface-container-lowest text-primary shadow-xl shadow-black/5",
  },
] as const;

const HEALTH_CARDS = [
  {
    label: "Total Applicants",
    value: "1,284",
    detail: "12%",
    detailIcon: "trending_up",
    detailClasses: "bg-primary-fixed text-on-primary-fixed-variant",
  },
  {
    label: "This Month's Apps",
    value: "452",
    note: "Cross-border clearances",
  },
  {
    label: "Avg. Turnaround",
    value: "4.2",
    suffix: "Days",
    note: "Target: < 3.0 Days",
  },
  {
    label: "System Uptime",
    value: "99.9%",
    note: "Status: Stable",
    noteClasses: "text-on-primary-fixed-variant",
  },
] as const;

const APPROVER_BREAKDOWN = [
  { body: "ZIFA", count: "12", width: "85%", barClass: "bg-primary" },
  { body: "SRC", count: "06", width: "45%", barClass: "bg-secondary" },
  { body: "Immigration", count: "09", width: "65%", barClass: "bg-emerald-600" },
] as const;

export default component$(() => {
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
                Diplomatic Travel &amp; Football Logistics Management
              </p>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row">
              <button
                class="rounded-xl bg-surface-container-highest px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-dim"
                type="button"
              >
                Export Report
              </button>
              <button
                class="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                type="button"
              >
                Refresh Data
              </button>
            </div>
          </section>

          <section class="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {QUICK_ACTIONS.map((action) => (
              <a
                key={action.title}
                class={`group flex items-center justify-between rounded-xl p-5 text-left transition-all hover:scale-[1.02] sm:p-6 ${action.classes}`}
                href={action.href}
              >
                <div>
                  <span
                    class="material-symbols-outlined mb-2 block text-3xl"
                    style={action.filled ? "font-variation-settings: 'FILL' 1;" : undefined}
                  >
                    {action.icon}
                  </span>
                  <h3 class="font-headline text-lg font-bold">{action.title}</h3>
                  <p class="text-xs opacity-80">{action.description}</p>
                </div>
                <span class="material-symbols-outlined transition-transform group-hover:translate-x-1">
                  arrow_forward_ios
                </span>
              </a>
            ))}
          </section>

          <section class="space-y-6">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 class="flex items-center gap-2 font-headline text-xl font-bold text-primary">
                <span class="material-symbols-outlined text-error" style="font-variation-settings: 'FILL' 1;">
                  error
                </span>
                Pending Actions
              </h3>
              <span class="w-fit rounded-full bg-error-container px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-error-container">
                Priority Required
              </span>
            </div>

            <div class="grid grid-cols-12 gap-4 lg:gap-6">
              <div class="col-span-12 flex flex-col justify-between rounded-xl border-l-4 border-secondary bg-surface-container-lowest p-5 shadow-sm sm:p-8 md:col-span-8">
                <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 class="font-headline text-2xl font-bold text-primary">Applicant Accounts</h4>
                    <p class="text-sm text-on-surface-variant">
                      Awaiting initial authority verification and background check
                    </p>
                  </div>
                  <div class="text-left sm:text-right">
                    <span class="font-headline text-4xl font-extrabold text-secondary sm:text-5xl">42</span>
                    <p class="text-xs font-bold uppercase text-secondary/60">New Requests</p>
                  </div>
                </div>

                <div class="flex flex-col gap-3 sm:flex-row">
                  <button
                    class="flex-1 rounded-lg bg-secondary px-4 py-3 font-bold text-white transition-all hover:bg-secondary/90"
                    type="button"
                  >
                    Begin Review Process
                  </button>
                  <button
                    class="rounded-lg border border-outline-variant px-6 py-3 transition-colors hover:bg-surface-container"
                    type="button"
                  >
                    View All
                  </button>
                </div>
              </div>

              <div class="col-span-12 relative overflow-hidden rounded-xl bg-tertiary p-5 text-white shadow-xl shadow-tertiary/20 sm:p-8 md:col-span-4">
                <div class="relative z-10">
                  <span class="material-symbols-outlined mb-4 text-4xl" style="font-variation-settings: 'FILL' 1;">
                    timer_3
                  </span>
                  <h4 class="mb-1 font-headline text-xl font-bold">Expiring Soon</h4>
                  <p class="mb-6 text-sm text-tertiary-fixed opacity-80">
                    Invitations sent but not accepted within 24hr window
                  </p>
                  <div class="font-headline text-4xl font-extrabold">09</div>
                  <p class="mt-1 text-[10px] uppercase tracking-widest opacity-60">High Urgency</p>
                </div>
                <div class="absolute -right-10 -bottom-10 opacity-10">
                  <span class="material-symbols-outlined text-[160px]">hourglass_empty</span>
                </div>
              </div>

              <div class="col-span-12 flex items-center gap-4 rounded-xl bg-surface-container-highest p-5 sm:gap-6 sm:p-6 md:col-span-6">
                <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-error-container sm:h-16 sm:w-16">
                  <span class="material-symbols-outlined text-3xl text-on-error-container">flag</span>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-lg font-bold text-primary">Accounts Flagged</h4>
                  <p class="text-sm text-on-surface-variant">
                    Suspended or disputed profiles needing intervention
                  </p>
                </div>
                <div class="text-right">
                  <div class="text-3xl font-bold text-error">15</div>
                  <button class="text-xs font-bold uppercase text-secondary hover:underline" type="button">
                    Resolve
                  </button>
                </div>
              </div>

              <div class="col-span-12 flex items-center gap-4 rounded-xl bg-surface-container-high p-5 sm:gap-6 sm:p-6 md:col-span-6">
                <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-container sm:h-16 sm:w-16">
                  <span class="material-symbols-outlined text-3xl text-on-primary-container">assignment_ind</span>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-lg font-bold text-primary">Orphaned Apps</h4>
                  <p class="text-sm text-on-surface-variant">Active applications with no assigned reviewer</p>
                </div>
                <div class="text-right">
                  <div class="text-3xl font-bold text-primary">04</div>
                  <button class="text-xs font-bold uppercase text-secondary hover:underline" type="button">
                    Assign
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section class="space-y-6">
            <h3 class="font-headline text-xl font-bold text-primary">System Health Indicators</h3>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
              {HEALTH_CARDS.map((card) => (
                <div key={card.label} class="rounded-xl bg-surface-container-low p-5 sm:p-6">
                  <p class="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    {card.label}
                  </p>
                  <div class="flex items-end gap-2">
                    <span class="text-3xl font-extrabold text-primary">{card.value}</span>
                    {card.suffix ? <span class="mb-1 ml-1 text-sm font-medium">{card.suffix}</span> : null}
                    {card.detail ? (
                      <span
                        class={`mb-1 flex items-center rounded px-1.5 py-0.5 text-xs ${card.detailClasses ?? "bg-primary-fixed text-on-primary-fixed-variant"}`}
                      >
                        <span class="material-symbols-outlined text-[14px]">{card.detailIcon}</span>
                        {card.detail}
                      </span>
                    ) : null}
                  </div>
                  {card.note ? (
                    <p class={`mt-1 text-[10px] ${card.noteClasses ?? "text-on-surface-variant"}`}>{card.note}</p>
                  ) : null}
                </div>
              ))}
            </div>

            <div class="rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
              <h4 class="mb-6 font-headline font-bold text-primary">Active Approver Accounts per Body</h4>
              <div class="space-y-4">
                {APPROVER_BREAKDOWN.map((item) => (
                  <div key={item.body} class="flex items-center gap-4">
                    <span class="w-20 shrink-0 text-sm font-bold text-primary sm:w-24">{item.body}</span>
                    <div class="h-3 flex-1 overflow-hidden rounded-full bg-surface-container">
                      <div class={`h-full rounded-full ${item.barClass}`} style={`width: ${item.width}`} />
                    </div>
                    <span class="w-10 shrink-0 text-right text-sm font-bold sm:w-12">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section class="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            <div class="rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-6 lg:col-span-2">
              <h3 class="mb-6 flex items-center gap-2 font-headline font-bold text-primary">
                <span class="material-symbols-outlined text-primary">analytics</span>
                Review Capacity Metrics
              </h3>
              <div class="flex h-48 items-end justify-between gap-3 px-2 sm:gap-4 sm:px-4">
                {[
                  { day: "MON", height: "h-32", fill: "h-3/4" },
                  { day: "TUE", height: "h-28", fill: "h-1/2" },
                  { day: "WED", height: "h-40", fill: "h-full" },
                  { day: "THU", height: "h-36", fill: "h-4/5" },
                  { day: "FRI", height: "h-24", fill: "h-1/4" },
                ].map((bar) => (
                  <div key={bar.day} class="flex w-full flex-col items-center gap-2">
                    <div class={`relative w-full rounded-t-md bg-primary/10 ${bar.height}`}>
                      <div class={`absolute bottom-0 w-full rounded-t-md bg-primary/40 ${bar.fill}`} />
                    </div>
                    <span class="text-[10px] font-bold text-outline">{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div class="relative flex flex-col justify-between overflow-hidden rounded-xl bg-primary p-6 text-white sm:p-8">
              <div class="absolute -top-4 -right-4 h-32 w-32 rounded-full bg-emerald-900/50 blur-3xl" />
              <div class="relative">
                <span class="text-[10px] font-black tracking-[0.2em] opacity-60">SYSTEM STATUS</span>
                <h4 class="mt-2 font-headline text-2xl font-bold">All Nodes Verified</h4>
                <p class="mt-2 text-sm leading-relaxed text-emerald-100/60">
                  External connections to Interpol and Immigration databases are active. Real-time screening
                  enabled.
                </p>
              </div>

              <div class="relative mt-8">
                <div class="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
                  <div class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div class="flex flex-col">
                    <span class="text-xs font-bold">API Response Time</span>
                    <span class="text-[10px] opacity-60">124ms - Stable</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "ZFTA Admin Console | Overview",
};
