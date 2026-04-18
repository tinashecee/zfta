import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ApproverPortalNav } from "~/components/approver-portal-nav";
import {
  apiFetchJson,
  coerceSportsBodyToString,
  getCurrentUser,
  persistStoredSessionUser,
  redirectPathIfWrongRole,
  type AuthUser,
} from "~/lib/auth";
import { getSportBody, listSportBodies } from "~/lib/sport-bodies-api";
import {
  formatUserApproverSummary,
  meResponseToAuthUser,
  resolveSportBodyRowForReviewerUser,
  type ApiUser,
} from "~/lib/users-api";

function reviewerRoleLabel(role: string): string {
  const r = role.trim().toLowerCase();
  if (r === "reviewer") return "Approver (reviewer)";
  return role || "—";
}

function displayMobileNumber(value: string | number | null | undefined): string {
  if (value == null) return "—";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  const s = String(value).trim();
  return s || "—";
}

export default component$(() => {
  const user = useSignal<AuthUser | null>(null);
  const approverSummary = useSignal<string | null>(null);
  const loadError = useSignal<string | null>(null);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    const u = getCurrentUser();
    const redirect = redirectPathIfWrongRole(u, "reviewer");
    if (redirect) {
      window.location.assign(redirect);
      return;
    }
    if (!u?.id) {
      window.location.assign("/sign-in/");
      return;
    }
    loadError.value = null;

    const meR = await apiFetchJson<unknown>("/api/v1/me", { method: "GET" });
    let merged = u;
    if (meR.ok) {
      merged = meResponseToAuthUser(meR.data);
      persistStoredSessionUser(merged);
      console.log("[approver/account] GET /api/v1/me raw JSON", meR.data);
      console.log("[approver/account] session user after /me + persist", merged);
    } else {
      console.warn("[approver/account] GET /api/v1/me failed (using JWT user only)", meR.status, meR.error);
    }
    user.value = merged;

    const sportsBodyStr = coerceSportsBodyToString(merged.sports_body);
    const sportsBodyInt =
      sportsBodyStr && /^\d+$/.test(sportsBodyStr) ? Number(sportsBodyStr) : null;

    const r = await listSportBodies({ limit: 200, offset: 0 });
    if (!r.ok) {
      loadError.value = r.error ?? "Could not load sport bodies.";
    }
    const sb = r.ok ? r.data : [];

    let row = resolveSportBodyRowForReviewerUser(merged, sb);

    if (!row && merged.sport_body_id != null && merged.sport_body_id > 0) {
      const idNum = Number(merged.sport_body_id);
      const one = await getSportBody(idNum);
      if (one.ok) {
        row = one.data;
        console.log("[approver/account] sport_body row from GET /api/v1/sport-bodies/" + idNum, one.data);
      } else {
        console.warn("[approver/account] GET /api/v1/sport-bodies/" + idNum, one.status, one.error);
      }
    }
    if (!row && sportsBodyInt != null) {
      const one = await getSportBody(sportsBodyInt);
      if (one.ok) {
        row = one.data;
        console.log("[approver/account] sport_body row from GET /api/v1/sport-bodies/" + sportsBodyInt, one.data);
      } else {
        console.warn("[approver/account] GET /api/v1/sport-bodies/" + sportsBodyInt, one.status, one.error);
      }
    }
    const sbForSummary =
      row && !sb.some((x) => Number(x.id) === Number(row.id)) ? [...sb, row] : sb;
    approverSummary.value = formatUserApproverSummary(merged as unknown as ApiUser, sbForSummary);
    if (row) {
      console.log("[approver/account] resolved sport_body row (object)", row);
    }
  });

  const u = user.value;

  return (
    <div class="flex min-h-screen flex-col bg-background text-on-background">
      <ApproverPortalNav activeItem="account" title="My account" />

      <main class="flex-1 px-4 pb-16 pt-28 sm:px-8">
        <div class="mx-auto max-w-2xl">
          <h1 class="font-headline text-3xl font-extrabold tracking-tight text-primary md:text-4xl">Account details</h1>
          <p class="mt-2 text-on-surface-variant">
            Information from your signed-in session. Contact an administrator to change approver assignment.
          </p>

          {loadError.value ? (
            <div class="mt-6 rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error" role="alert">
              {loadError.value}
            </div>
          ) : null}

          {u ? (
            <section class="mt-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm md:p-8">
              <dl class="space-y-5 text-sm">
                <div class="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                  <dt class="font-bold text-on-surface-variant shrink-0">Full name</dt>
                  <dd class="text-on-surface text-right sm:text-left break-words">{u.full_name || "—"}</dd>
                </div>
                <div class="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                  <dt class="font-bold text-on-surface-variant shrink-0">Email</dt>
                  <dd class="text-on-surface text-right sm:text-left break-all">{u.email || "—"}</dd>
                </div>
                <div class="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                  <dt class="font-bold text-on-surface-variant shrink-0">Mobile number</dt>
                  <dd class="text-on-surface text-right sm:text-left break-words">
                    {displayMobileNumber(u.mobile_number)}
                  </dd>
                </div>
                <div class="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                  <dt class="font-bold text-on-surface-variant shrink-0">Role</dt>
                  <dd class="text-on-surface text-right sm:text-left">{reviewerRoleLabel(u.role)}</dd>
                </div>
                <div class="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                  <dt class="font-bold text-on-surface-variant shrink-0">Account status</dt>
                  <dd class="text-on-surface text-right sm:text-left capitalize">{u.status || "—"}</dd>
                </div>
                <div class="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                  <dt class="font-bold text-on-surface-variant shrink-0">Email verified</dt>
                  <dd class="text-on-surface text-right sm:text-left">{u.email_verified ? "Yes" : "No"}</dd>
                </div>
                <div class="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                  <dt class="font-bold text-on-surface-variant shrink-0">Approver assignment</dt>
                  <dd class="text-on-surface text-right sm:text-left break-words">
                    {approverSummary.value ?? "—"}
                  </dd>
                </div>
                <div class="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                  <dt class="font-bold text-on-surface-variant shrink-0">User field `sports_body`</dt>
                  <dd class="text-on-surface text-right sm:text-left break-all font-mono text-xs">
                    {coerceSportsBodyToString(u.sports_body) || "—"}
                    {coerceSportsBodyToString(u.sports_body) && /^\d+$/.test(coerceSportsBodyToString(u.sports_body)) ? (
                      <span class="block text-on-surface-variant font-sans text-[11px] mt-1">
                        (stored id matches sport_body row when numeric)
                      </span>
                    ) : null}
                  </dd>
                </div>
                <div class="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                  <dt class="font-bold text-on-surface-variant shrink-0">sport_body_id</dt>
                  <dd class="text-on-surface text-right sm:text-left font-mono text-xs">
                    {u.sport_body_id != null && u.sport_body_id > 0 ? String(u.sport_body_id) : "—"}
                  </dd>
                </div>
              </dl>

              <p class="mt-8 text-xs text-on-surface-variant">
                To change your password, use{" "}
                <a class="text-primary font-semibold hover:underline" href="/password-reset/">
                  password recovery
                </a>
                .
              </p>
            </section>
          ) : (
            <p class="mt-8 text-on-surface-variant">Loading…</p>
          )}
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "My account | Approver",
};
