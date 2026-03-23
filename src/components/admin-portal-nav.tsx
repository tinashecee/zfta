import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { getCurrentUser, signOut } from "~/lib/auth";

type AdminNavItemKey = "overview" | "accounts" | "systemUsers" | "applications" | "settings";

function roleLabel(role: string): string {
  switch (role) {
    case "system_admin":
      return "System admin";
    case "applicant":
      return "Applicant";
    case "reviewer":
      return "Reviewer";
    case "supervisor":
      return "Supervisor";
    default:
      return role.replace(/_/g, " ");
  }
}

function initialsFromUser(fullName: string, email: string): string {
  const n = fullName.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 1).toUpperCase();
    }
  }
  const e = email.trim();
  if (e.length >= 2) return e.slice(0, 2).toUpperCase();
  return "?";
}

const onLogout$ = $(async () => {
  await signOut();
  window.location.assign("/sign-in/");
});

type AdminPortalNavProps = {
  activeItem: AdminNavItemKey;
};

const NAV_ITEMS: Array<{
  key: AdminNavItemKey;
  label: string;
  icon: string;
  href: string;
  filled?: boolean;
}> = [
  { key: "overview", label: "Overview", icon: "dashboard", href: "/admin/dashboard/", filled: true },
  { key: "accounts", label: "Accounts", icon: "group", href: "/admin/accounts/" },
  { key: "systemUsers", label: "System Users", icon: "manage_accounts", href: "/admin/system-users/" },
  { key: "applications", label: "Applications", icon: "fact_check", href: "#" },
  { key: "settings", label: "System Settings", icon: "settings", href: "#" },
];

export const AdminPortalNav = component$<AdminPortalNavProps>(({ activeItem }) => {
  const menuOpen = useSignal(false);
  const userRoleLabel = useSignal("");
  const userDisplayName = useSignal("");
  const userEmail = useSignal("");
  const userInitials = useSignal("");

  useVisibleTask$(() => {
    const u = getCurrentUser();
    if (!u) return;
    userRoleLabel.value = roleLabel(u.role);
    userDisplayName.value = u.full_name?.trim() || u.email;
    userEmail.value = u.email;
    userInitials.value = initialsFromUser(u.full_name ?? "", u.email);
  });

  const toggleMenu$ = $(() => {
    menuOpen.value = !menuOpen.value;
  });

  const closeMenu$ = $(() => {
    menuOpen.value = false;
  });

  return (
    <>
      <aside class="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r-0 bg-emerald-950 py-6 font-manrope tracking-tight shadow-2xl shadow-emerald-950/50 lg:flex">
        <div class="mb-8 flex items-center gap-3 px-6">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-container">
            <span class="material-symbols-outlined text-on-secondary-container" style="font-variation-settings: 'FILL' 1;">
              security
            </span>
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tighter text-yellow-500">ZFTA Admin</h1>
            <p class="text-[10px] uppercase tracking-widest text-emerald-100/50">Government Authority</p>
          </div>
        </div>

        <nav class="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              class={
                item.key === activeItem
                  ? "mx-2 flex items-center gap-3 rounded-lg bg-emerald-900/80 px-4 py-3 font-bold text-yellow-500 transition-transform active:scale-90"
                  : "mx-2 flex items-center gap-3 rounded-lg px-4 py-3 text-emerald-100/70 transition-colors duration-200 hover:bg-emerald-800/50 hover:text-white"
              }
              href={item.href}
            >
              <span
                class="material-symbols-outlined"
                style={item.filled ? "font-variation-settings: 'FILL' 1;" : undefined}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div class="mb-6 px-6">
          <button
            class="w-full rounded-xl bg-secondary-container py-3 text-sm font-bold text-on-secondary-container shadow-lg shadow-yellow-900/20 transition-all hover:scale-[1.02] active:scale-95"
            type="button"
          >
            New Authorization
          </button>
        </div>

        <div class="space-y-1 border-t border-emerald-900/50 pt-6">
          <a
            class="flex items-center gap-3 px-6 py-3 text-emerald-100/70 transition-colors duration-200 hover:text-white"
            href="#"
          >
            <span class="material-symbols-outlined">help</span>
            <span>Support</span>
          </a>
          <button
            class="flex w-full items-center gap-3 px-6 py-3 text-left text-emerald-100/70 transition-colors duration-200 hover:text-white"
            type="button"
            onClick$={onLogout$}
          >
            <span class="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <header class="fixed top-0 right-0 left-0 z-30 flex h-16 items-center justify-between bg-white/80 px-4 backdrop-blur-xl lg:left-64 lg:px-8">
        <div class="flex flex-1 items-center gap-3 lg:max-w-xl">
          <button
            class="material-symbols-outlined rounded-full p-2 text-emerald-950 transition-colors hover:bg-surface-container-high lg:hidden"
            type="button"
            aria-label="Open admin menu"
            onClick$={toggleMenu$}
          >
            menu
          </button>

          <div class="relative w-full focus-within:ring-2 focus-within:ring-yellow-500/20 rounded-lg">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-emerald-900/40">
              search
            </span>
            <input
              class="w-full rounded-lg border-none bg-surface-container-high/50 py-2 pl-10 pr-4 text-sm text-emerald-900 placeholder:text-emerald-900/40 focus:ring-0"
              placeholder="Search accounts, applications, or logs..."
              type="text"
            />
          </div>
        </div>

        <div class="ml-4 flex items-center gap-3 sm:gap-6">
          <div class="hidden items-center gap-4 text-emerald-900 sm:flex">
            <button class="relative p-1 transition-all hover:text-secondary" type="button">
              <span class="material-symbols-outlined">notifications</span>
              <span class="absolute top-0 right-0 h-2 w-2 rounded-full bg-error" />
            </button>
            <button class="p-1 transition-all hover:text-secondary" type="button">
              <span class="material-symbols-outlined">history</span>
            </button>
          </div>

          <div class="hidden h-8 w-px bg-emerald-900/10 sm:block" />

          <div class="flex min-w-0 max-w-[14rem] items-center gap-2 sm:max-w-none sm:gap-3">
            <div class="min-w-0 flex-1 text-right">
              <p class="truncate text-[10px] font-bold uppercase leading-none tracking-wider text-emerald-900">
                {userRoleLabel.value || "Administrator"}
              </p>
              <p class="truncate text-xs font-semibold text-emerald-800">{userDisplayName.value || "—"}</p>
              {userEmail.value ? (
                <p class="truncate text-[11px] text-emerald-700/70">{userEmail.value}</p>
              ) : null}
            </div>
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
              title={userDisplayName.value || undefined}
              aria-label={userDisplayName.value ? `Signed in as ${userDisplayName.value}` : "User menu"}
            >
              {userInitials.value || "—"}
            </div>
          </div>
        </div>
      </header>

      <div
        class={`fixed inset-0 z-50 transition-opacity duration-200 lg:hidden ${
          menuOpen.value ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        onClick$={closeMenu$}
      >
        <div class="absolute inset-0 bg-black/40" />

        <aside
          class={`absolute inset-y-0 left-0 w-[min(18rem,85vw)] bg-emerald-950 py-6 shadow-2xl transition-transform duration-300 ${
            menuOpen.value ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick$={(event) => {
            event.stopPropagation();
          }}
        >
          <div class="mb-8 flex items-center justify-between px-6">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-container">
                <span class="material-symbols-outlined text-on-secondary-container" style="font-variation-settings: 'FILL' 1;">
                  security
                </span>
              </div>
              <div>
                <h1 class="text-xl font-bold tracking-tighter text-yellow-500">ZFTA Admin</h1>
                <p class="text-[10px] uppercase tracking-widest text-emerald-100/50">Government Authority</p>
              </div>
            </div>
            <button
              class="material-symbols-outlined rounded-full p-2 text-emerald-100/70 transition-all hover:bg-emerald-800/50"
              type="button"
              aria-label="Close admin menu"
              onClick$={closeMenu$}
            >
              close
            </button>
          </div>

          <nav class="space-y-1 px-2">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.key}
                class={
                  item.key === activeItem
                    ? "flex items-center gap-3 rounded-lg bg-emerald-900/80 px-4 py-3 font-bold text-yellow-500"
                    : "flex items-center gap-3 rounded-lg px-4 py-3 text-emerald-100/70 transition-colors duration-200 hover:bg-emerald-800/50 hover:text-white"
                }
                href={item.href}
                onClick$={closeMenu$}
              >
                <span
                  class="material-symbols-outlined"
                  style={item.filled ? "font-variation-settings: 'FILL' 1;" : undefined}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          <div class="mt-6 flex items-center gap-3 border-t border-emerald-900/50 px-6 pt-6">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
              aria-hidden="true"
            >
              {userInitials.value || "—"}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-bold text-yellow-500">{userRoleLabel.value || "Administrator"}</p>
              <p class="truncate text-sm font-semibold text-white">{userDisplayName.value || "—"}</p>
              {userEmail.value ? <p class="truncate text-[11px] text-emerald-100/60">{userEmail.value}</p> : null}
            </div>
          </div>

          <div class="mt-6 px-6">
            <button
              class="w-full rounded-xl bg-secondary-container py-3 text-sm font-bold text-on-secondary-container shadow-lg shadow-yellow-900/20 transition-all hover:scale-[1.02] active:scale-95"
              type="button"
            >
              New Authorization
            </button>
          </div>

          <div class="mt-8 space-y-1 border-t border-emerald-900/50 pt-6">
            <a
              class="flex items-center gap-3 px-6 py-3 text-emerald-100/70 transition-colors duration-200 hover:text-white"
              href="#"
            >
              <span class="material-symbols-outlined">help</span>
              <span>Support</span>
            </a>
            <button
              class="flex w-full items-center gap-3 px-6 py-3 text-left text-emerald-100/70 transition-colors duration-200 hover:text-white"
              type="button"
              onClick$={onLogout$}
            >
              <span class="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
});
