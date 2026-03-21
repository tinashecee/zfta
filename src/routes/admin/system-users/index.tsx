import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AdminPortalNav } from "~/components/admin-portal-nav";
import {
  SYSTEM_USERS,
  getSystemRoleClasses,
  getSystemUserStatusClasses,
  type SystemUserRecord,
  type SystemUserRole,
  type SystemUserStatus,
} from "~/lib/admin-system-users";

type UserTypeFilter = "all" | "Approving Member" | "Football Applicant";
type RoleFilter = "all" | SystemUserRole;
type StatusFilter = "all" | SystemUserStatus;

const getVisibleUsers = (
  searchTerm: string,
  userType: UserTypeFilter,
  role: RoleFilter,
  status: StatusFilter,
) => {
  const query = searchTerm.trim().toLowerCase();

  return SYSTEM_USERS.filter((user) => {
    if (userType !== "all" && user.userType !== userType) {
      return false;
    }

    if (role !== "all" && user.role !== role) {
      return false;
    }

    if (status !== "all" && user.status !== status) {
      return false;
    }

    if (!query) {
      return true;
    }

    return (
      user.fullName.toLowerCase().includes(query) ||
      user.organisation.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });
};

export default component$(() => {
  const searchTerm = useSignal("");
  const selectedUserType = useSignal<UserTypeFilter>("all");
  const selectedRole = useSignal<RoleFilter>("all");
  const selectedStatus = useSignal<StatusFilter>("all");

  const visibleUsers = getVisibleUsers(
    searchTerm.value,
    selectedUserType.value,
    selectedRole.value,
    selectedStatus.value,
  );

  return (
    <div class="min-h-screen bg-background text-on-background">
      <AdminPortalNav activeItem="systemUsers" />

      <main class="min-h-screen pt-20 lg:pl-64">
        <div class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:p-8">
          <section class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 class="font-headline text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                System Users
              </h2>
              <p class="mt-1 max-w-3xl text-sm text-on-surface-variant sm:text-base">
                Manage approving members and football applicants already using the system. Use this page to
                review account status and activate or deactivate access.
              </p>
            </div>

            <button
              class="w-fit rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
              type="button"
            >
              Add User
            </button>
          </section>

          <section class="rounded-2xl bg-surface-container-lowest shadow-sm">
            <div class="border-b border-outline-variant/15 bg-white p-4 sm:p-6">
              <div class="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <input
                  class="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-1 focus:ring-primary"
                  placeholder="Search user, organisation, or email"
                  type="text"
                  value={searchTerm.value}
                  onInput$={(_, element) => {
                    searchTerm.value = element.value;
                  }}
                />

                <select
                  class="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-1 focus:ring-primary"
                  value={selectedUserType.value}
                  onChange$={(_, element) => {
                    selectedUserType.value = element.value as UserTypeFilter;
                  }}
                >
                  <option value="all">All user types</option>
                  <option value="Approving Member">Approving Members</option>
                  <option value="Football Applicant">Football Applicants</option>
                </select>

                <select
                  class="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-1 focus:ring-primary"
                  value={selectedRole.value}
                  onChange$={(_, element) => {
                    selectedRole.value = element.value as RoleFilter;
                  }}
                >
                  <option value="all">All roles</option>
                  <option value="Applicant">Applicant</option>
                  <option value="ZIFA">ZIFA</option>
                  <option value="SRC">SRC</option>
                  <option value="Immigration">Immigration</option>
                </select>

                <select
                  class="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-1 focus:ring-primary"
                  value={selectedStatus.value}
                  onChange$={(_, element) => {
                    selectedStatus.value = element.value as StatusFilter;
                  }}
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div class="hidden overflow-x-auto lg:block">
              <table class="min-w-[1100px] w-full border-collapse text-left">
                <thead>
                  <tr class="bg-surface-container-low">
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">User</th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Organisation</th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">User Type</th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Role</th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Province</th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Last Active</th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Status</th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/10">
                  {visibleUsers.map((user) => (
                    <tr key={user.id} class="transition-colors hover:bg-surface-container-low">
                      <td class="px-6 py-5">
                        <div class="flex flex-col">
                          <span class="text-sm font-bold text-primary">{user.fullName}</span>
                          <span class="text-xs text-outline">{user.email}</span>
                        </div>
                      </td>
                      <td class="px-6 py-5 text-sm">{user.organisation}</td>
                      <td class="px-6 py-5 text-sm">{user.userType}</td>
                      <td class="px-6 py-5">
                        <span class={`rounded-full px-3 py-1 text-[11px] font-bold ${getSystemRoleClasses(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td class="px-6 py-5 text-sm">{user.province}</td>
                      <td class="px-6 py-5 text-sm text-on-surface-variant">{user.lastActive}</td>
                      <td class="px-6 py-5">
                        <span class={`rounded-full px-3 py-1 text-[11px] font-bold ${getSystemUserStatusClasses(user.status)}`}>
                          {user.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td class="px-6 py-5">
                        <div class="flex flex-wrap gap-2">
                          <button class="rounded-lg bg-surface-container-highest px-3 py-1.5 text-[11px] font-bold text-on-surface-variant" type="button">
                            Edit
                          </button>
                          <button
                            class={`rounded-lg px-3 py-1.5 text-[11px] font-bold ${
                              user.status === "active"
                                ? "bg-error-container text-on-error-container"
                                : "bg-primary text-white"
                            }`}
                            type="button"
                          >
                            {user.status === "active" ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div class="space-y-4 p-4 lg:hidden">
              {visibleUsers.map((user) => (
                <article key={user.id} class="rounded-xl border border-outline-variant/20 bg-white p-4 shadow-sm">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-base font-bold text-primary">{user.fullName}</p>
                      <p class="text-xs text-outline">{user.email}</p>
                    </div>
                    <span class={`rounded-full px-3 py-1 text-[10px] font-bold ${getSystemUserStatusClasses(user.status)}`}>
                      {user.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Organisation</p>
                      <p>{user.organisation}</p>
                    </div>
                    <div>
                      <p class="text-[10px] font-bold uppercase tracking-widest text-outline">User Type</p>
                      <p>{user.userType}</p>
                    </div>
                    <div>
                      <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Role</p>
                      <span class={`mt-1 inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${getSystemRoleClasses(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                    <div>
                      <p class="text-[10px] font-bold uppercase tracking-widest text-outline">Last Active</p>
                      <p>{user.lastActive}</p>
                    </div>
                  </div>

                  <div class="mt-4 flex flex-wrap gap-2">
                    <button class="rounded-lg bg-surface-container-highest px-3 py-2 text-[11px] font-bold text-on-surface-variant" type="button">
                      Edit
                    </button>
                    <button
                      class={`rounded-lg px-3 py-2 text-[11px] font-bold ${
                        user.status === "active" ? "bg-error-container text-on-error-container" : "bg-primary text-white"
                      }`}
                      type="button"
                    >
                      {user.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div class="border-t border-outline-variant/15 bg-surface-container-low px-4 py-4 text-sm text-outline sm:px-6">
              Showing {visibleUsers.length} of {SYSTEM_USERS.length} system users
            </div>
          </section>
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "System Users",
};
