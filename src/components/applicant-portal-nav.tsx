import { $, component$, useSignal } from "@builder.io/qwik";
import { AppLogo } from "~/components/app-logo";
import { signOut } from "~/lib/auth";
import { APP_NAME, APP_NAME_SHORT, APP_PORTAL_TITLE } from "~/lib/app-branding";

type NavItemKey = "dashboard" | "applications" | "calendar" | "organization" | "settings";

type ApplicantPortalNavProps = {
  activeItem: NavItemKey;
};

const NAV_ITEMS: Array<{
  key: NavItemKey;
  label: string;
  icon: string;
  href: string;
}> = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard", href: "/applicant/dashboard/" },
  {
    key: "applications",
    label: "Applications",
    icon: "description",
    href: "/applicant/dashboard/#applications",
  },
  { key: "calendar", label: "Calendar", icon: "calendar_today", href: "/applicant/calendar/" },
  {
    key: "organization",
    label: "Organization",
    icon: "corporate_fare",
    href: "/applicant/organization-profile/",
  },
  { key: "settings", label: "Settings", icon: "settings", href: "/applicant/settings/" },
];

export const ApplicantPortalNav = component$<ApplicantPortalNavProps>(({ activeItem }) => {
  const menuOpen = useSignal(false);

  const toggleMenu$ = $(() => {
    const next = !menuOpen.value;
    console.log("[applicant portal nav] toggle", {
      current: menuOpen.value,
      next,
      width: typeof window !== "undefined" ? window.innerWidth : null,
    });
    menuOpen.value = next;
  });

  const closeMenu$ = $(() => {
    console.log("[applicant portal nav] close", {
      current: menuOpen.value,
      width: typeof window !== "undefined" ? window.innerWidth : null,
    });
    menuOpen.value = false;
  });

  const onSignOut$ = $(async () => {
    await signOut();
    window.location.assign("/sign-in/");
  });

  return (
    <>
      <header class="h-20 flex justify-between items-center px-6 md:px-10 sticky top-0 bg-emerald-950/70 backdrop-blur-xl z-50 tonal-shift shadow-2xl shadow-emerald-950/20">
        <div class="flex items-center gap-4 md:gap-8">
          <button
            class="material-symbols-outlined text-emerald-100/80 hover:bg-emerald-900/50 p-2 rounded-full transition-all scale-95 active:scale-90"
            type="button"
            aria-label="Open menu"
            onClick$={toggleMenu$}
          >
            menu
          </button>

          <div class="flex min-w-0 items-center gap-3">
            <AppLogo class="shrink-0" href="/applicant/dashboard/" size="sm" />
            <span class="text-lg font-bold tracking-tighter text-emerald-50 uppercase font-headline hidden md:inline truncate">
              {APP_NAME}
            </span>
            <span class="text-lg font-bold tracking-tighter text-emerald-50 uppercase font-headline md:hidden">{APP_NAME_SHORT}</span>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <button
            class="material-symbols-outlined text-emerald-100/80 hover:bg-emerald-900/50 p-2 rounded-full transition-all scale-95 active:scale-90"
            type="button"
          >
            notifications
          </button>
          <button
            class="material-symbols-outlined text-emerald-100/80 hover:bg-emerald-900/50 p-2 rounded-full transition-all scale-95 active:scale-90"
            type="button"
          >
            help
          </button>

          <div class="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border-2 border-secondary cursor-pointer">
            <img
              alt="User profile avatar"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDy5OuihJolLGCixR9lfYzOgKpiaBizwqMoFOLQE7_3UmaVXq1kJC8azhISkTjXsJgyJMe-bqquauV9BghdQifK5fEBswEvmbN8tUtE06BwKErfqGLt0gj5zzMWD9vA-J50p6oHQrERDdFVBC5rwQWisNJ0SEvJvGlQem3spcDX_NsFQ2iL4ALp_7q_kR5V2RECm-xzrqfccOjtF2rrNZ2PIr_vq4FLPjFEYiE4iXpAWHfhaekgaD9M43RMyds0Kh2O64CVtppsmok"
              width={40}
              height={40}
            />
          </div>
        </div>
      </header>

      <div
        class={`fixed inset-0 z-[60] transition-opacity duration-200 ${
          menuOpen.value ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        onClick$={closeMenu$}
      >
        <div class="absolute inset-0 bg-black/40" />

        <aside
          class={`absolute inset-y-0 left-0 w-72 lg:w-80 bg-emerald-950 border-r border-white/10 transform transition-transform duration-300 ${
            menuOpen.value ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick$={(event) => {
            event.stopPropagation();
          }}
        >
          <nav class="w-full h-full min-h-screen bg-emerald-950 p-6 flex flex-col space-y-8 text-emerald-50 overflow-y-auto font-manrope">
            <div class="flex items-center justify-end">
              <button
                class="material-symbols-outlined text-white/70 hover:bg-white/10 p-2 rounded-lg"
                type="button"
                aria-label="Close menu"
                onClick$={closeMenu$}
              >
                close
              </button>
            </div>

            <div class="flex flex-col gap-3">
              <AppLogo href="/applicant/dashboard/" size="md" />
              <div>
                <span class="text-lg font-black text-emerald-50 uppercase tracking-widest">{APP_PORTAL_TITLE}</span>
                <span class="text-emerald-100/60 text-xs font-bold mt-1 block">Diplomatic Pitch</span>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.key}
                  class={
                    item.key === activeItem
                      ? "flex items-center gap-4 bg-[#725c00] text-white rounded-lg px-4 py-3 shadow-lg shadow-emerald-900/20"
                      : "flex items-center gap-4 text-emerald-100/60 hover:text-emerald-50 px-4 py-3 rounded-lg hover:bg-white/5 transition-all duration-300 hover:translate-x-1"
                  }
                  href={item.href}
                  onClick$={closeMenu$}
                >
                  <span class="material-symbols-outlined">{item.icon}</span>
                  <span class="font-medium">{item.label}</span>
                </a>
              ))}
            </div>

            <div class="pt-4">
              <button
                class="w-full bg-[#fdd000] text-[#6e5900] py-4 px-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all"
                type="button"
                onClick$={() => window.location.assign("/applicant/new/")}
              >
                <span class="material-symbols-outlined">add_circle</span>
                New Application
              </button>
            </div>

            <div class="mt-auto pt-8 border-t border-white/10">
              <div class="flex flex-col gap-1">
                <a
                  class="flex items-center gap-3 text-emerald-100/40 hover:text-emerald-50 py-2 px-2 text-xs font-medium transition-colors"
                  href="#"
                >
                  <span class="material-symbols-outlined text-lg">contact_support</span>
                  Help Center
                </a>
                <button
                  class="flex w-full items-center gap-3 text-emerald-100/40 hover:text-error py-2 px-2 text-xs font-medium transition-colors text-left"
                  type="button"
                  onClick$={onSignOut$}
                >
                  <span class="material-symbols-outlined text-lg">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          </nav>
        </aside>
      </div>
    </>
  );
});
