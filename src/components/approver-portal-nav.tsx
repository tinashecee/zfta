import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { getCurrentUser, signOut } from "~/lib/auth";
import { isSportBodyReviewerSession, isSrcReviewerSession } from "~/lib/hosting-access";
import { resolveSportBodyRowForReviewerUser, reviewerPortalAffiliationLabel } from "~/lib/users-api";
import { listSportBodies, sportBodyApprovalCode } from "~/lib/sport-bodies-api";

type ApproverNavItemKey =
  | "dashboard"
  | "myApplications"
  | "hostingEventsManage"
  | "submittedBids"
  | "createApplication"
  | "pendingQueue"
  | "approved"
  | "archived"
  | "biddingEvents"
  | "myBids"
  | "systemLogs"
  | "account";

type ApproverPortalNavProps = {
  activeItem: ApproverNavItemKey;
  title: string;
};

const NAV_ITEMS: Array<{
  key: ApproverNavItemKey;
  label: string;
  icon: string;
  href: string;
  filled?: boolean;
}> = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard", href: "/approver/dashboard/" },
  { key: "myApplications", label: "My applications", icon: "folder_shared", href: "/approver/my-applications/" },
  { key: "createApplication", label: "Create application", icon: "add_circle", href: "/approver/applications/new/", filled: true },
  { key: "pendingQueue", label: "Pending Queue", icon: "pending_actions", href: "/approver/dashboard/" },
  { key: "approved", label: "Approved", icon: "verified_user", href: "/approver/dashboard/?status=approved", filled: true },
  { key: "archived", label: "Archived", icon: "archive", href: "/approver/dashboard/?status=historical" },
  { key: "hostingEventsManage", label: "Hosting events", icon: "emoji_events", href: "/approver/hosting-events/" },
  { key: "submittedBids", label: "Submitted bids", icon: "assignment", href: "/approver/submitted-bids/" },
  { key: "biddingEvents", label: "Bidding events", icon: "emoji_events", href: "/approver/bidding-events/" },
  { key: "myBids", label: "My bids", icon: "assignment_turned_in", href: "/approver/my-bids/" },
  { key: "systemLogs", label: "System Logs", icon: "settings_suggest", href: "#" },
  { key: "account", label: "My account", icon: "manage_accounts", href: "/approver/account/" },
];

export const ApproverPortalNav = component$<ApproverPortalNavProps>(({ activeItem, title }) => {
  const menuOpen = useSignal(false);
  const affiliationPrimary = useSignal<string | null>(null);
  const affiliationSecondary = useSignal<string | null>(null);
  const showSportBodyCreate = useSignal(false);
  const showMyApplications = useSignal(false);
  const showSrcHosting = useSignal(false);
  const showSportBodyBidding = useSignal(false);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    const u = getCurrentUser();
    const r = await listSportBodies({ limit: 200, offset: 0 });
    const sb = r.ok ? r.data : [];
    affiliationPrimary.value = reviewerPortalAffiliationLabel(u, sb);
    const row = resolveSportBodyRowForReviewerUser(u, sb);

    // Sports-body reviewers may be represented via:
    // - `approver_body: "SPORTS_BODY"` (new API),
    // - legacy `body: "SPORT_BODY" | "SPORTS_BODY"`,
    // - or a catalog-mapped sport-body row/code.
    const approverKind = (u?.approver_body ?? "").trim().toUpperCase();
    const legacyBody = (u?.body ?? "").trim().toUpperCase();
    showSportBodyCreate.value =
      u?.role === "reviewer" &&
      (approverKind === "SPORTS_BODY" ||
        legacyBody === "SPORT_BODY" ||
        legacyBody === "SPORTS_BODY" ||
        Boolean(row));

    showMyApplications.value = u?.role === "reviewer" && Boolean(String(u.organisation_id ?? "").trim());

    showSrcHosting.value = isSrcReviewerSession(u);
    showSportBodyBidding.value = isSportBodyReviewerSession(u);

    if (row) {
      const code = sportBodyApprovalCode(row);
      const name = (row.name ?? "").trim();
      if (name && code.toUpperCase() !== name.toUpperCase()) {
        affiliationSecondary.value = code;
      } else {
        affiliationSecondary.value = null;
      }
    } else {
      affiliationSecondary.value = null;
    }
  });

  const toggleMenu$ = $(() => {
    menuOpen.value = !menuOpen.value;
  });

  const closeMenu$ = $(() => {
    menuOpen.value = false;
  });

  const onSignOut$ = $(async () => {
    await signOut();
    window.location.assign("/sign-in/");
  });

  return (
    <>
      <header class="fixed top-0 right-0 left-0 z-50 flex h-20 items-center justify-between bg-emerald-950/70 px-4 shadow-[0_40px_60px_-15px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:px-6 md:px-8">
        <div class="flex min-w-0 items-center gap-3 sm:gap-4">
          <button
            class="material-symbols-outlined text-emerald-100/80 hover:bg-emerald-800/50 p-2 rounded-full transition-all duration-300"
            type="button"
            aria-label="Open approver menu"
            onClick$={toggleMenu$}
          >
            menu
          </button>
          <div class="flex min-w-0 max-w-[11rem] flex-col sm:max-w-[18rem] lg:max-w-none">
            {affiliationPrimary.value ? (
              <span class="font-manrope text-[10px] font-bold uppercase tracking-widest text-amber-400 leading-tight">
                {affiliationPrimary.value}
                {affiliationSecondary.value ? (
                  <span class="block normal-case tracking-normal text-emerald-200/70 font-semibold mt-0.5">
                    {affiliationSecondary.value}
                  </span>
                ) : null}
              </span>
            ) : null}
            <h2 class="truncate font-manrope text-sm font-bold tracking-tighter text-white sm:text-base lg:text-xl">
              {title}
            </h2>
          </div>
        </div>

        <div class="flex items-center gap-3 sm:gap-6">
          <div class="relative hidden sm:block">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-emerald-100/50">
              search
            </span>
            <input
              class="bg-emerald-900/40 border-none rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-emerald-100/30 focus:ring-1 focus:ring-yellow-500 w-64"
              placeholder="Search Ref or Org..."
              type="text"
            />
          </div>

          <div class="flex items-center gap-2 sm:gap-4 text-emerald-100/70">
            <button
              class="material-symbols-outlined hover:bg-emerald-800/50 p-2 rounded-full cursor-pointer transition-all duration-300"
              type="button"
            >
              notifications
            </button>
            <a
              class="flex items-center gap-2 rounded-full p-1 pr-2 transition-all duration-300 hover:bg-emerald-800/50 sm:pr-3"
              href="/approver/account/"
            >
              <span class="material-symbols-outlined">account_circle</span>
              <span class="hidden text-sm font-medium sm:inline">My account</span>
            </a>
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
          class={`absolute inset-y-0 left-0 w-[min(18rem,85vw)] bg-emerald-950 shadow-2xl transform transition-transform duration-300 ${
            menuOpen.value ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick$={(event) => {
            event.stopPropagation();
          }}
        >
          <nav class="w-full h-full min-h-screen bg-emerald-950 py-8 px-6 flex flex-col text-white overflow-hidden">
            <div class="flex items-center justify-between mb-10">
              <div>
                <h1 class="text-lg font-black text-white uppercase tracking-tighter">Travel Authority</h1>
                <p class="font-manrope uppercase tracking-widest text-[11px] text-amber-400/90">
                  {affiliationPrimary.value ? `${affiliationPrimary.value} · ` : ""}
                  Approver
                </p>
                <p class="font-manrope uppercase tracking-widest text-[11px] text-emerald-100/50">
                  Official Approver Portal
                </p>
              </div>
              <button
                class="material-symbols-outlined text-emerald-100/70 hover:bg-emerald-800/50 p-2 rounded-full transition-all"
                type="button"
                aria-label="Close approver menu"
                onClick$={closeMenu$}
              >
                close
              </button>
            </div>

            <div class="flex-1 space-y-2 overflow-y-auto pr-1">
              {NAV_ITEMS.filter((i) => {
                if (i.key === "createApplication") return showSportBodyCreate.value;
                if (i.key === "myApplications") return showMyApplications.value;
                if (i.key === "hostingEventsManage" || i.key === "submittedBids") return showSrcHosting.value;
                if (i.key === "biddingEvents" || i.key === "myBids") return showSportBodyBidding.value;
                return true;
              }).map((item) => (
                <a
                  key={item.key}
                  class={
                    item.key === activeItem
                      ? "flex items-center gap-3 px-4 py-3 rounded-lg text-yellow-500 border-r-4 border-yellow-600 bg-emerald-900/30 font-manrope uppercase tracking-widest text-[11px] translate-x-1 transition-transform"
                      : "flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-100/50 font-manrope uppercase tracking-widest text-[11px] hover:text-white hover:bg-emerald-900/20 translate-x-1 transition-transform"
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
            </div>

            <div class="mt-auto pt-6 border-t border-emerald-900/30">
              <div class="space-y-2">
                <a
                  class="flex items-center gap-3 px-4 py-2 text-emerald-100/50 font-manrope uppercase tracking-widest text-[11px] hover:text-white transition-all"
                  href="#"
                >
                  <span class="material-symbols-outlined">help_outline</span>
                  <span>Support</span>
                </a>
                <button
                  class="flex w-full items-center gap-3 px-4 py-2 text-left text-emerald-100/50 font-manrope uppercase tracking-widest text-[11px] hover:text-white transition-all"
                  type="button"
                  onClick$={onSignOut$}
                >
                  <span class="material-symbols-outlined">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </nav>
        </aside>
      </div>
    </>
  );
});
