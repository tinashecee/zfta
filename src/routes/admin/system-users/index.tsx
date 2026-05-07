import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AdminPortalNav } from "~/components/admin-portal-nav";
import {
  ACCOUNT_STATUSES,
  APPROVER_BODY_KINDS,
  createUser,
  deleteUser,
  displayApproverBodyKind,
  formatUserApproverSummary,
  formatUserDate,
  getUser,
  inferApproverFormFromUser,
  listUsers,
  normalizeAccountStatusForForm,
  normalizeUserRoleForForm,
  patchUser,
  roleBadgeClass,
  statusBadgeClass,
  type ApiUser,
  USER_ROLES,
} from "~/lib/users-api";
import { coerceSportsBodyToString } from "~/lib/auth";
import { listSportBodies, sportBodyApprovalCode, sportBodyUserPayloadId, type ApiSportBody } from "~/lib/sport-bodies-api";
import { getOrganisation, listOrganisations, organisationDisplayName, type ApiOrganisation } from "~/lib/organisations-api";

export default component$(() => {
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const users = useSignal<ApiUser[]>([]);
  const loadKey = useSignal(0);

  const searchTerm = useSignal("");
  const roleFilter = useSignal<string>("all");
  const statusFilter = useSignal<string>("all");

  const formError = useSignal<string | null>(null);
  const saving = useSignal(false);
  const showModal = useSignal(false);
  const editId = useSignal<string | null>(null);
  /** True while fetching `GET /users/{id}` to fill the edit form (list rows may omit approver fields). */
  const editFormLoading = useSignal(false);

  const showViewModal = useSignal(false);
  const viewLoading = useSignal(false);
  const viewUser = useSignal<ApiUser | null>(null);
  const viewError = useSignal<string | null>(null);
  const viewOrganisation = useSignal<ApiOrganisation | null>(null);
  const viewOrganisationError = useSignal<string | null>(null);

  const email = useSignal("");
  const password = useSignal("");
  const fullName = useSignal("");
  const mobile = useSignal("");
  const approverBodyKind = useSignal("");
  /** Selected sport-body row id as string (matches `sports_body` in API) */
  const sportsBodyCode = useSignal("");
  const role = useSignal<string>("applicant");
  const status = useSignal("pending_profile");
  const statusReason = useSignal("");
  const emailVerified = useSignal(false);
  const sportBodies = useSignal<ApiSportBody[]>([]);
  const organisations = useSignal<ApiOrganisation[]>([]);
  const organisationId = useSignal("");

  useVisibleTask$(async () => {
    const r = await listSportBodies({ limit: 500, offset: 0 });
    if (r.ok) sportBodies.value = r.data;

    const or = await listOrganisations({ limit: 500, offset: 0 });
    if (or.ok) organisations.value = or.data;
  });

  useVisibleTask$(async ({ track }) => {
    track(() => loadKey.value);
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

  const openCreate$ = $(() => {
    editFormLoading.value = false;
    editId.value = null;
    formError.value = null;
    email.value = "";
    password.value = "";
    fullName.value = "";
    mobile.value = "";
    organisationId.value = "";
    approverBodyKind.value = "";
    sportsBodyCode.value = "";
    role.value = "applicant";
    status.value = "pending_profile";
    statusReason.value = "";
    emailVerified.value = false;
    showModal.value = true;
  });

  const beginEdit$ = $(async (id: string) => {
    formError.value = null;
    editId.value = id;
    editFormLoading.value = true;
    showModal.value = true;
    email.value = "";
    password.value = "";
    fullName.value = "";
    mobile.value = "";
    approverBodyKind.value = "";
    sportsBodyCode.value = "";
    role.value = "applicant";
    status.value = "pending_profile";
    statusReason.value = "";
    emailVerified.value = false;
    organisationId.value = "";

    const r = await getUser(id);
    editFormLoading.value = false;
    if (!r.ok) {
      formError.value = r.error;
      showModal.value = false;
      editId.value = null;
      return;
    }

    const u = r.data;
    email.value = u.email;
    password.value = "";
    fullName.value = u.full_name;
    mobile.value = u.mobile_number ?? "";
    organisationId.value = String(u.organisation_id ?? "").trim();
    const inf = inferApproverFormFromUser(u, sportBodies.value);
    approverBodyKind.value = inf.kind;
    sportsBodyCode.value = inf.sportsBodyCode;
    role.value = normalizeUserRoleForForm(u.role);
    status.value = normalizeAccountStatusForForm(u.status);
    statusReason.value = u.status_reason ?? "";
    emailVerified.value = u.email_verified;
  });

  const openView$ = $(async (id: string) => {
    showViewModal.value = true;
    viewLoading.value = true;
    viewError.value = null;
    viewUser.value = null;
    viewOrganisation.value = null;
    viewOrganisationError.value = null;
    const r = await getUser(id);
    viewLoading.value = false;
    if (!r.ok) {
      viewError.value = r.error;
      return;
    }
    viewUser.value = r.data;

    const oid = String(r.data.organisation_id ?? "").trim();
    if (oid) {
      const or = await getOrganisation(oid);
      if (or.ok) {
        viewOrganisation.value = or.data;
      } else {
        viewOrganisationError.value = or.error;
      }
    }
  });

  const closeView$ = $(() => {
    showViewModal.value = false;
    viewUser.value = null;
    viewError.value = null;
    viewOrganisation.value = null;
    viewOrganisationError.value = null;
  });

  const editFromView$ = $(() => {
    const id = viewUser.value?.id;
    if (!id) return;
    showViewModal.value = false;
    beginEdit$(id);
  });

  const setAccountStatus$ = $(async (nextStatus: string) => {
    const id = viewUser.value?.id;
    if (!id) return;
    viewError.value = null;
    viewLoading.value = true;
    const r = await patchUser(id, { status: nextStatus });
    if (!r.ok) {
      viewLoading.value = false;
      viewError.value = r.error;
      return;
    }
    const refreshed = await getUser(id);
    viewLoading.value = false;
    if (!refreshed.ok) {
      viewError.value = refreshed.error;
      return;
    }
    viewUser.value = refreshed.data;
    loadKey.value++;
  });

  const closeModal$ = $(() => {
    showModal.value = false;
    editFormLoading.value = false;
  });

  const submitModal$ = $(async () => {
    if (editFormLoading.value) return;
    formError.value = null;
    saving.value = true;

    const kind = approverBodyKind.value.trim().toUpperCase();

    if (role.value === "reviewer") {
      if (!kind || !(APPROVER_BODY_KINDS as readonly string[]).includes(kind)) {
        saving.value = false;
        formError.value = "Select an approver body type for reviewers.";
        return;
      }
      if (kind === "SPORTS_BODY") {
        if (!sportsBodyCode.value.trim()) {
          saving.value = false;
          formError.value = "Select a sport body.";
          return;
        }
      }
    }

    if (editId.value) {
      const patch: Record<string, unknown> = {
        email: email.value.trim(),
        full_name: fullName.value.trim(),
        mobile_number: mobile.value.trim() || undefined,
        organisation_id: organisationId.value.trim() || null,
        role: role.value,
        status: status.value,
        status_reason: statusReason.value.trim() || undefined,
        email_verified: emailVerified.value,
      };
      if (role.value === "reviewer") {
        patch.approver_body = kind;
        patch.sports_body = kind === "SPORTS_BODY" ? sportsBodyCode.value.trim() : null;
      } else {
        patch.approver_body = null;
        patch.sports_body = null;
      }
      if (password.value.trim()) {
        patch.password = password.value;
      }
      const logPayload = { ...patch };
      if (typeof logPayload.password === "string") {
        logPayload.password = "[redacted]";
      }
      console.info("[admin/system-users] PATCH /api/v1/users/{id}", {
        userId: editId.value,
        body: logPayload,
      });
      const r = await patchUser(editId.value, patch);
      saving.value = false;
      if (!r.ok) {
        formError.value = r.error;
        return;
      }
    } else {
      if (!email.value.trim() || !password.value || !fullName.value.trim()) {
        saving.value = false;
        formError.value = "Email, password, and full name are required.";
        return;
      }
      const createPayload: Parameters<typeof createUser>[0] = {
        email: email.value.trim().toLowerCase(),
        password: password.value,
        full_name: fullName.value.trim(),
        mobile_number: mobile.value.trim() || undefined,
        organisation_id: organisationId.value.trim() || null,
        role: role.value,
        status: status.value,
        status_reason: statusReason.value.trim() || undefined,
        email_verified: emailVerified.value,
      };
      if (role.value === "reviewer") {
        createPayload.approver_body = kind;
        createPayload.sports_body = kind === "SPORTS_BODY" ? sportsBodyCode.value.trim() : null;
      }
      const r = await createUser(createPayload);
      saving.value = false;
      if (!r.ok) {
        formError.value = r.error;
        return;
      }
    }

    showModal.value = false;
    loadKey.value++;
  });

  const remove$ = $(async (id: string) => {
    if (!confirm("Soft-delete this user? They will be marked deleted in the system.")) return;
    const r = await deleteUser(id);
    if (!r.ok) {
      alert(r.error);
      return;
    }
    loadKey.value++;
  });

  const visibleUsers = () => {
    const q = searchTerm.value.trim().toLowerCase();
    return users.value.filter((u) => {
      if (roleFilter.value !== "all" && u.role !== roleFilter.value) return false;
      if (statusFilter.value !== "all" && u.status !== statusFilter.value) return false;
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q) ||
        (u.mobile_number ?? "").toLowerCase().includes(q)
      );
    });
  };

  return (
    <div class="min-h-screen bg-background text-on-background">
      <AdminPortalNav activeItem="systemUsers" />

      <main class="min-h-screen pt-20 lg:pl-64">
        <div class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:p-8">
          <section class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 class="font-headline text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                System users
              </h2>
              <p class="mt-1 max-w-3xl text-sm text-on-surface-variant sm:text-base">
                Backed by <code class="text-xs">GET /api/v1/users</code>. Create, update, and soft-delete require
                admin.
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <button
                class="rounded-xl bg-surface-container-highest px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-dim"
                type="button"
                onClick$={$(() => {
                  loadKey.value++;
                })}
              >
                Refresh
              </button>
              <button
                class="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                type="button"
                onClick$={openCreate$}
              >
                Add user
              </button>
            </div>
          </section>

          {loading.value ? (
            <p class="text-on-surface-variant">Loading users…</p>
          ) : error.value ? (
            <div class="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
              {error.value}
            </div>
          ) : null}

          <section class="rounded-2xl bg-surface-container-lowest shadow-sm">
            <div class="border-b border-outline-variant/15 bg-white p-4 sm:p-6">
              <div class="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <input
                  class="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-1 focus:ring-primary lg:col-span-2"
                  placeholder="Search name, email, mobile"
                  type="search"
                  value={searchTerm.value}
                  onInput$={(_, el) => {
                    searchTerm.value = el.value;
                  }}
                />
                <select
                  class="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-1 focus:ring-primary"
                  value={roleFilter.value}
                  onChange$={(_, el) => {
                    roleFilter.value = el.value;
                  }}
                >
                  <option value="all">All roles</option>
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <select
                  class="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-1 focus:ring-primary"
                  value={statusFilter.value}
                  onChange$={(_, el) => {
                    statusFilter.value = el.value;
                  }}
                >
                  <option value="all">All statuses</option>
                  {ACCOUNT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div class="hidden overflow-x-auto lg:block">
              <table class="min-w-[1000px] w-full border-collapse text-left">
                <thead>
                  <tr class="bg-surface-container-low">
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">User</th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Role</th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Body</th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Status</th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Verified</th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Last login</th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/10">
                  {visibleUsers().map((u) => (
                    <tr key={u.id} class="transition-colors hover:bg-surface-container-low">
                      <td class="px-6 py-5">
                        <div class="flex flex-col">
                          <span class="text-sm font-bold text-primary">{u.full_name}</span>
                          <span class="text-xs text-outline">{u.email}</span>
                          {u.mobile_number ? (
                            <span class="text-xs text-on-surface-variant">{u.mobile_number}</span>
                          ) : null}
                        </div>
                      </td>
                      <td class="px-6 py-5">
                        <span class={`rounded-full px-3 py-1 text-[11px] font-bold ${roleBadgeClass(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td class="px-6 py-5 text-sm text-on-surface-variant">
                        {formatUserApproverSummary(u, sportBodies.value)}
                      </td>
                      <td class="px-6 py-5">
                        <span class={`rounded-full px-3 py-1 text-[11px] font-bold ${statusBadgeClass(u.status)}`}>
                          {u.status}
                        </span>
                      </td>
                      <td class="px-6 py-5 text-sm">{u.email_verified ? "Yes" : "No"}</td>
                      <td class="px-6 py-5 text-sm text-on-surface-variant">{formatUserDate(u.last_login_at)}</td>
                      <td class="px-6 py-5">
                        <div class="flex flex-wrap gap-2">
                          <button
                            class="rounded-lg bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary"
                            type="button"
                            onClick$={$(() => openView$(u.id))}
                          >
                            View
                          </button>
                          <button
                            class="rounded-lg bg-surface-container-highest px-3 py-1.5 text-[11px] font-bold text-on-surface-variant"
                            type="button"
                            onClick$={$(() => beginEdit$(u.id))}
                          >
                            Edit
                          </button>
                          <button
                            class="rounded-lg bg-error-container px-3 py-1.5 text-[11px] font-bold text-on-error-container"
                            type="button"
                            onClick$={$(() => remove$(u.id))}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div class="space-y-4 p-4 lg:hidden">
              {visibleUsers().map((u) => (
                <article key={u.id} class="rounded-xl border border-outline-variant/20 bg-white p-4 shadow-sm">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-base font-bold text-primary">{u.full_name}</p>
                      <p class="text-xs text-outline">{u.email}</p>
                    </div>
                    <span class={`rounded-full px-3 py-1 text-[10px] font-bold ${statusBadgeClass(u.status)}`}>
                      {u.status}
                    </span>
                  </div>
                  <div class="mt-4 flex flex-wrap gap-2">
                    <button
                      class="rounded-lg bg-primary/10 px-3 py-2 text-[11px] font-bold text-primary"
                      type="button"
                      onClick$={$(() => openView$(u.id))}
                    >
                      View
                    </button>
                    <button
                      class="rounded-lg bg-surface-container-highest px-3 py-2 text-[11px] font-bold"
                      type="button"
                      onClick$={$(() => beginEdit$(u.id))}
                    >
                      Edit
                    </button>
                    <button
                      class="rounded-lg bg-error-container px-3 py-2 text-[11px] font-bold text-on-error-container"
                      type="button"
                      onClick$={$(() => remove$(u.id))}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div class="border-t border-outline-variant/15 bg-surface-container-low px-4 py-4 text-sm text-outline sm:px-6">
              Showing {visibleUsers().length} of {users.value.length} loaded users
            </div>
          </section>
        </div>
      </main>

      {showModal.value ? (
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            class="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick$={closeModal$}
          />
          <div class="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface-container-lowest p-6 shadow-xl">
            <h3 class="font-headline text-xl font-bold text-primary">
              {editId.value ? "Edit user" : "Create user"}
            </h3>

            {editId.value && editFormLoading.value ? (
              <p class="mt-4 text-sm text-on-surface-variant">Loading user…</p>
            ) : null}

            <div
              class={`mt-4 space-y-3 ${editId.value && editFormLoading.value ? "hidden" : ""}`}
              aria-hidden={editId.value && editFormLoading.value ? true : undefined}
            >
              <label class="block text-xs font-bold uppercase text-outline">
                Email
                <input
                  class="mt-1 w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm"
                  type="email"
                  value={email.value}
                  onInput$={(_, el) => {
                    email.value = el.value;
                  }}
                />
              </label>
              <label class="block text-xs font-bold uppercase text-outline">
                {editId.value ? "New password (optional)" : "Password"}
                <input
                  class="mt-1 w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm"
                  type="password"
                  autoComplete="new-password"
                  value={password.value}
                  onInput$={(_, el) => {
                    password.value = el.value;
                  }}
                />
              </label>
              <label class="block text-xs font-bold uppercase text-outline">
                Full name
                <input
                  class="mt-1 w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm"
                  value={fullName.value}
                  onInput$={(_, el) => {
                    fullName.value = el.value;
                  }}
                />
              </label>
              <label class="block text-xs font-bold uppercase text-outline">
                Mobile (optional)
                <input
                  class="mt-1 w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm"
                  value={mobile.value}
                  onInput$={(_, el) => {
                    mobile.value = el.value;
                  }}
                />
              </label>
              <label class="block text-xs font-bold uppercase text-outline">
                Organisation (optional)
                <select
                  class="mt-1 w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm"
                  value={organisationId.value}
                  onChange$={(_, el) => {
                    organisationId.value = el.value;
                  }}
                >
                  <option value="">— None —</option>
                  {organisations.value.map((o) => (
                    <option key={o.id} value={o.id}>
                      {organisationDisplayName(o) || o.id}
                    </option>
                  ))}
                </select>
              </label>
              <label class="block text-xs font-bold uppercase text-outline">
                User role
                <select
                  class="mt-1 w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm"
                  value={role.value}
                  onChange$={(_, el) => {
                    role.value = el.value;
                    if (el.value !== "reviewer") {
                      approverBodyKind.value = "";
                      sportsBodyCode.value = "";
                    }
                  }}
                >
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              {role.value === "reviewer" ? (
                <>
                  <label class="block text-xs font-bold uppercase text-outline">
                    Approver body type
                    <select
                      class="mt-1 w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm"
                      value={approverBodyKind.value}
                      onChange$={(_, el) => {
                        approverBodyKind.value = el.value;
                        if (el.value !== "SPORTS_BODY") {
                          sportsBodyCode.value = "";
                        }
                      }}
                    >
                      <option value="">— Select —</option>
                      {APPROVER_BODY_KINDS.map((k) => (
                        <option key={k} value={k}>
                          {displayApproverBodyKind(k)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {approverBodyKind.value === "SPORTS_BODY" ? (
                    <label class="block text-xs font-bold uppercase text-outline">
                      Sport body
                      <select
                        class="mt-1 w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm"
                        value={sportsBodyCode.value}
                        onChange$={(_, el) => {
                          sportsBodyCode.value = el.value;
                        }}
                      >
                        <option value="">— Select —</option>
                        {sportBodies.value.map((b) => (
                          <option key={b.id} value={sportBodyUserPayloadId(b)}>
                            {`${b.name ?? sportBodyApprovalCode(b)} (${sportBodyUserPayloadId(b)})`}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </>
              ) : null}
              <label class="block text-xs font-bold uppercase text-outline">
                Account status
                <select
                  class="mt-1 w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm"
                  value={status.value}
                  onChange$={(_, el) => {
                    status.value = el.value;
                  }}
                >
                  {ACCOUNT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label class="block text-xs font-bold uppercase text-outline">
                Status reason (optional)
                <input
                  class="mt-1 w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm"
                  value={statusReason.value}
                  onInput$={(_, el) => {
                    statusReason.value = el.value;
                  }}
                />
              </label>
              <label class="flex items-center gap-2 text-sm font-semibold text-on-surface">
                <input
                  type="checkbox"
                  checked={emailVerified.value}
                  onChange$={(_, el) => {
                    emailVerified.value = (el as HTMLInputElement).checked;
                  }}
                />
                Email verified
              </label>
            </div>

            {formError.value ? <p class="mt-3 text-sm text-error">{formError.value}</p> : null}

            <div class="mt-6 flex justify-end gap-3">
              <button
                type="button"
                class="rounded-xl px-4 py-2 text-sm font-bold text-on-surface-variant"
                onClick$={closeModal$}
              >
                Cancel
              </button>
              <button
                type="button"
                class="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                disabled={saving.value || (Boolean(editId.value) && editFormLoading.value)}
                onClick$={submitModal$}
              >
                {saving.value ? "Saving…" : editId.value ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showViewModal.value ? (
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            class="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick$={closeView$}
          />
          <div class="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface-container-lowest p-6 shadow-xl">
            <h3 class="font-headline text-xl font-bold text-primary">User details</h3>
            <p class="mt-1 text-xs text-on-surface-variant">GET /api/v1/users/&#123;id&#125;</p>

            {viewLoading.value ? (
              <p class="mt-6 text-on-surface-variant">Loading…</p>
            ) : viewError.value ? (
              <p class="mt-6 text-sm text-error" role="alert">
                {viewError.value}
              </p>
            ) : viewUser.value ? (
              <dl class="mt-6 space-y-4 text-sm">
                <div class="border-b border-outline-variant/10 pb-3">
                  <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">ID</dt>
                  <dd class="mt-1 font-mono text-xs break-all text-on-surface">{viewUser.value.id}</dd>
                </div>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Email</dt>
                    <dd class="mt-1 font-medium text-primary">{viewUser.value.email}</dd>
                  </div>
                  <div>
                    <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Full name</dt>
                    <dd class="mt-1">{viewUser.value.full_name}</dd>
                  </div>
                  <div>
                    <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Mobile</dt>
                    <dd class="mt-1">{viewUser.value.mobile_number ?? "—"}</dd>
                  </div>
                  <div>
                    <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">User role</dt>
                    <dd class="mt-1">
                      <span class={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${roleBadgeClass(viewUser.value.role)}`}>
                        {viewUser.value.role}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Approver</dt>
                    <dd class="mt-1">
                      {formatUserApproverSummary(viewUser.value, sportBodies.value)}
                    </dd>
                  </div>
                  <div class="sm:col-span-2">
                    <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Organisation</dt>
                    <dd class="mt-1">
                      {viewUser.value.organisation_id ? (
                        viewOrganisation.value ? (
                          <span class="font-medium text-on-surface">
                            {organisationDisplayName(viewOrganisation.value) || viewOrganisation.value.id}
                          </span>
                        ) : viewOrganisationError.value ? (
                          <span class="text-on-surface-variant">{viewOrganisationError.value}</span>
                        ) : (
                          <span class="text-on-surface-variant">{viewUser.value.organisation_id}</span>
                        )
                      ) : (
                        <span class="text-on-surface-variant">—</span>
                      )}
                    </dd>
                  </div>
                  {viewUser.value.approver_body ||
                  coerceSportsBodyToString(viewUser.value.sports_body) ||
                  viewUser.value.sport_body_id ? (
                    <div>
                      <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">API fields</dt>
                      <dd class="mt-1 font-mono text-xs text-on-surface-variant">
                        approver_body: {viewUser.value.approver_body ?? "—"}
                        {coerceSportsBodyToString(viewUser.value.sports_body)
                          ? ` · sports_body: ${coerceSportsBodyToString(viewUser.value.sports_body)}`
                          : ""}
                        {viewUser.value.sport_body_id != null && viewUser.value.sport_body_id > 0
                          ? ` · sport_body_id: ${viewUser.value.sport_body_id}`
                          : ""}
                      </dd>
                    </div>
                  ) : null}
                  {viewUser.value.body ? (
                    <div>
                      <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Legacy body</dt>
                      <dd class="mt-1 font-mono text-xs">{viewUser.value.body}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Account status</dt>
                    <dd class="mt-1">
                      <span class={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${statusBadgeClass(viewUser.value.status)}`}>
                        {viewUser.value.status}
                      </span>
                    </dd>
                  </div>
                </div>
                <div>
                  <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Status reason</dt>
                  <dd class="mt-1 text-on-surface-variant">{viewUser.value.status_reason ?? "—"}</dd>
                </div>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Email verified</dt>
                    <dd class="mt-1">{viewUser.value.email_verified ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Verified at</dt>
                    <dd class="mt-1 text-on-surface-variant">{formatUserDate(viewUser.value.email_verified_at)}</dd>
                  </div>
                </div>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Last login</dt>
                    <dd class="mt-1 text-on-surface-variant">{formatUserDate(viewUser.value.last_login_at)}</dd>
                  </div>
                  <div>
                    <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Created</dt>
                    <dd class="mt-1 text-on-surface-variant">{formatUserDate(viewUser.value.created_at)}</dd>
                  </div>
                  <div class="sm:col-span-2">
                    <dt class="text-[10px] font-bold uppercase tracking-widest text-outline">Updated</dt>
                    <dd class="mt-1 text-on-surface-variant">{formatUserDate(viewUser.value.updated_at)}</dd>
                  </div>
                </div>
              </dl>
            ) : null}

            <div class="mt-6 flex flex-wrap justify-end gap-3">
              {viewUser.value ? (
                viewUser.value.status?.trim().toLowerCase() === "active" ? (
                  <button
                    type="button"
                    class="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest"
                    disabled={viewLoading.value}
                    onClick$={$(() => setAccountStatus$("inactive"))}
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    type="button"
                    class="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                    disabled={viewLoading.value}
                    onClick$={$(() => setAccountStatus$("active"))}
                  >
                    Activate
                  </button>
                )
              ) : null}
              <button
                type="button"
                class="rounded-xl px-4 py-2 text-sm font-bold text-on-surface-variant"
                onClick$={closeView$}
              >
                Close
              </button>
              {viewUser.value ? (
                <button
                  type="button"
                  class="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white"
                  onClick$={editFromView$}
                >
                  Edit user
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
});

export const head: DocumentHead = {
  title: "System Users",
};
