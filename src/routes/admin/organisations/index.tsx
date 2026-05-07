import { $, component$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AdminPortalNav } from "~/components/admin-portal-nav";
import {
  createOrganisation,
  listOrganisations,
  organisationDisplayName,
  patchOrganisation,
  type ApiOrganisation,
} from "~/lib/organisations-api";

const NSA_TYPE = "national_sports_association";

const SPORT_VALUES = [
  "cricket",
  "football",
  "rugby",
  "hockey",
  "tennis",
  "chess",
  "darts",
  "boxing",
  "karate",
  "athletics",
  "swimming",
  "netball",
  "golf",
  "basketball",
  "volleyball",
  "cycling",
  "motorsport",
] as const;

function sportLabel(value: string): string {
  if (value === "motorsport") return "Motorsport";
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

const SPORT_OPTIONS = SPORT_VALUES.map((v) => ({ value: v, label: sportLabel(v) }));

type OrgRow = ApiOrganisation & { _name: string; _type: string; _sport: string; _status: string };

function norm(s: string | null | undefined): string {
  return (s ?? "").trim();
}

function orgType(o: ApiOrganisation): string {
  return norm(o.org_type ?? o.organization_type);
}

function isNsa(o: Pick<ApiOrganisation, "org_type" | "organization_type">): boolean {
  return orgType(o) === NSA_TYPE;
}

type CreateEditForm = {
  id?: string;
  org_name: string;
  org_type: string;
  sport: string;
  physical_address: string;
  city: string;
  establishment_date: string;
  website: string;
  primary_contact_name: string;
  primary_contact_title: string;
  primary_contact_mobile: string;
  primary_contact_email: string;
  secondary_contact_name: string;
  secondary_contact_title: string;
  secondary_contact_mobile: string;
  secondary_contact_email: string;
  emergency_contact_name: string;
  emergency_contact_mobile: string;
  emergency_contact_relation: string;
};

function emptyForm(): CreateEditForm {
  return {
    org_name: "",
    org_type: NSA_TYPE,
    sport: "",
    physical_address: "",
    city: "",
    establishment_date: "",
    website: "",
    primary_contact_name: "",
    primary_contact_title: "",
    primary_contact_mobile: "",
    primary_contact_email: "",
    secondary_contact_name: "",
    secondary_contact_title: "",
    secondary_contact_mobile: "",
    secondary_contact_email: "",
    emergency_contact_name: "",
    emergency_contact_mobile: "",
    emergency_contact_relation: "",
  };
}

function formFromOrg(o: ApiOrganisation): CreateEditForm {
  return {
    id: o.id,
    org_name: organisationDisplayName(o),
    org_type: orgType(o) || NSA_TYPE,
    sport: norm(o.sport),
    physical_address: norm(o.physical_address ?? o.street_address),
    city: norm(o.city),
    establishment_date: norm(o.establishment_date)?.slice(0, 10) || "",
    website: norm(o.website),
    primary_contact_name: norm(o.primary_contact_name),
    primary_contact_title: norm(o.primary_contact_title ?? o.primary_role),
    primary_contact_mobile: norm(o.primary_contact_mobile ?? o.primary_mobile),
    primary_contact_email: norm(o.primary_contact_email ?? o.primary_email),
    secondary_contact_name: norm(o.secondary_contact_name),
    secondary_contact_title: norm(o.secondary_contact_title),
    secondary_contact_mobile: norm(o.secondary_contact_mobile ?? o.secondary_mobile),
    secondary_contact_email: norm(o.secondary_contact_email),
    emergency_contact_name: norm(o.emergency_contact_name),
    emergency_contact_mobile: norm(o.emergency_contact_mobile),
    emergency_contact_relation: norm(o.emergency_contact_relation),
  };
}

function validateForm(f: CreateEditForm): string | null {
  if (!f.org_name.trim()) return "Organisation name is required.";
  if (!f.org_type.trim()) return "Organisation type is required.";
  if (f.org_type.trim() !== NSA_TYPE) return `Organisation type must be ${NSA_TYPE}.`;
  const sport = f.sport.trim();
  if (!sport || !(SPORT_VALUES as readonly string[]).includes(sport)) return "Sport is required.";
  if (!f.physical_address.trim()) return "Physical address is required.";
  if (!f.city.trim()) return "City is required.";
  if (!f.primary_contact_name.trim()) return "Primary contact name is required.";
  if (!f.primary_contact_mobile.trim()) return "Primary contact mobile is required.";
  if (!f.primary_contact_email.trim()) return "Primary contact email is required.";
  const em = f.primary_contact_email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return "Primary contact email must be valid.";
  return null;
}

export default component$(() => {
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const saving = useSignal(false);
  const query = useSignal("");
  const rows = useStore<OrgRow[]>([]);

  const showCreate = useSignal(false);
  const createError = useSignal<string | null>(null);
  const createForm = useStore<CreateEditForm>(emptyForm());

  const editingId = useSignal<string | null>(null);
  const editError = useSignal<string | null>(null);
  const editForm = useStore<CreateEditForm>(emptyForm());

  const load$ = $(async () => {
    loading.value = true;
    error.value = null;
    const r = await listOrganisations({ limit: 500, offset: 0 });
    loading.value = false;
    if (!r.ok) {
      error.value = r.error;
      rows.length = 0;
      return;
    }
    rows.length = 0;
    for (const o of r.data) {
      rows.push({
        ...o,
        _name: organisationDisplayName(o),
        _type: orgType(o),
        _sport: norm(o.sport),
        _status: norm(o.status),
      });
    }
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    await load$();
  });

  const filtered = () => {
    const q = query.value.trim().toLowerCase();
    const base = [...rows];
    if (!q) return base;
    return base.filter((r) => {
      const hay = [
        r._name,
        r._type,
        r._sport,
        r._status,
        norm(r.id),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  };

  const startEdit$ = $((o: ApiOrganisation) => {
    if (!isNsa(o)) return;
    editingId.value = o.id;
    editError.value = null;
    Object.assign(editForm, formFromOrg(o));
  });

  const cancelEdit$ = $(() => {
    editingId.value = null;
    editError.value = null;
    Object.assign(editForm, emptyForm());
  });

  const saveEdit$ = $(async () => {
    if (!editingId.value) return;
    editError.value = null;
    const v = validateForm(editForm);
    if (v) {
      editError.value = v;
      return;
    }
    saving.value = true;
    const patch: Record<string, unknown> = {
      org_name: editForm.org_name.trim(),
      org_type: NSA_TYPE,
      sport: editForm.sport.trim(),
      physical_address: editForm.physical_address.trim(),
      city: editForm.city.trim(),
      primary_contact_name: editForm.primary_contact_name.trim(),
      primary_contact_mobile: editForm.primary_contact_mobile.trim(),
      primary_contact_email: editForm.primary_contact_email.trim(),
      is_official_school_sport: false,
    };
    if (editForm.establishment_date.trim()) patch.establishment_date = editForm.establishment_date.trim();
    if (editForm.website.trim()) patch.website = editForm.website.trim();
    if (editForm.primary_contact_title.trim()) patch.primary_contact_title = editForm.primary_contact_title.trim();
    if (editForm.secondary_contact_name.trim()) patch.secondary_contact_name = editForm.secondary_contact_name.trim();
    if (editForm.secondary_contact_title.trim()) patch.secondary_contact_title = editForm.secondary_contact_title.trim();
    if (editForm.secondary_contact_mobile.trim()) patch.secondary_contact_mobile = editForm.secondary_contact_mobile.trim();
    if (editForm.secondary_contact_email.trim()) patch.secondary_contact_email = editForm.secondary_contact_email.trim();
    if (editForm.emergency_contact_name.trim()) patch.emergency_contact_name = editForm.emergency_contact_name.trim();
    if (editForm.emergency_contact_mobile.trim()) patch.emergency_contact_mobile = editForm.emergency_contact_mobile.trim();
    if (editForm.emergency_contact_relation.trim()) patch.emergency_contact_relation = editForm.emergency_contact_relation.trim();
    const r = await patchOrganisation(editingId.value, patch);
    saving.value = false;
    if (!r.ok) {
      editError.value = r.error;
      return;
    }
    await load$();
    await cancelEdit$();
  });

  const openCreate$ = $(() => {
    showCreate.value = true;
    createError.value = null;
    Object.assign(createForm, emptyForm());
  });

  const closeCreate$ = $(() => {
    showCreate.value = false;
    createError.value = null;
    Object.assign(createForm, emptyForm());
  });

  const submitCreate$ = $(async () => {
    createError.value = null;
    const v = validateForm(createForm);
    if (v) {
      createError.value = v;
      return;
    }
    saving.value = true;
    const payload: Record<string, unknown> = {
      org_name: createForm.org_name.trim(),
      org_type: NSA_TYPE,
      sport: createForm.sport.trim(),
      physical_address: createForm.physical_address.trim(),
      city: createForm.city.trim(),
      primary_contact_name: createForm.primary_contact_name.trim(),
      primary_contact_mobile: createForm.primary_contact_mobile.trim(),
      primary_contact_email: createForm.primary_contact_email.trim(),
      is_official_school_sport: false,
    };
    if (createForm.establishment_date.trim()) payload.establishment_date = createForm.establishment_date.trim();
    if (createForm.website.trim()) payload.website = createForm.website.trim();
    if (createForm.primary_contact_title.trim()) payload.primary_contact_title = createForm.primary_contact_title.trim();
    if (createForm.secondary_contact_name.trim()) payload.secondary_contact_name = createForm.secondary_contact_name.trim();
    if (createForm.secondary_contact_title.trim()) payload.secondary_contact_title = createForm.secondary_contact_title.trim();
    if (createForm.secondary_contact_mobile.trim()) payload.secondary_contact_mobile = createForm.secondary_contact_mobile.trim();
    if (createForm.secondary_contact_email.trim()) payload.secondary_contact_email = createForm.secondary_contact_email.trim();
    if (createForm.emergency_contact_name.trim()) payload.emergency_contact_name = createForm.emergency_contact_name.trim();
    if (createForm.emergency_contact_mobile.trim()) payload.emergency_contact_mobile = createForm.emergency_contact_mobile.trim();
    if (createForm.emergency_contact_relation.trim()) payload.emergency_contact_relation = createForm.emergency_contact_relation.trim();
    const r = await createOrganisation(payload);
    saving.value = false;
    if (!r.ok) {
      createError.value = r.error;
      return;
    }
    await load$();
    await closeCreate$();
  });

  return (
    <div class="min-h-screen bg-background text-on-background">
      <AdminPortalNav activeItem="organisations" />

      <main class="min-h-screen pt-20 lg:pl-64">
        <div class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:p-8">
          <section class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 class="font-headline text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                Organisations
              </h1>
              <p class="mt-1 text-sm text-on-surface-variant sm:text-base">
                View all organisations. Only <span class="font-semibold text-primary">{NSA_TYPE}</span> can be created/edited.
              </p>
            </div>
            <button
              type="button"
              class="w-fit rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
              disabled={saving.value}
              onClick$={openCreate$}
            >
              Create national sports association
            </button>
          </section>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="relative w-full max-w-xl">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                search
              </span>
              <input
                class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary/30"
                placeholder="Search by name, type, sport, status, or id…"
                value={query.value}
                onInput$={(e) => {
                  query.value = (e.target as HTMLInputElement).value;
                }}
              />
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-primary hover:bg-surface-container-low transition-colors disabled:opacity-60"
              disabled={loading.value || saving.value}
              onClick$={load$}
            >
              <span class="material-symbols-outlined text-base">refresh</span>
              Refresh
            </button>
          </div>

          {loading.value ? (
            <p class="text-on-surface-variant">Loading organisations…</p>
          ) : error.value ? (
            <div class="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error" role="alert">
              {error.value}
            </div>
          ) : (
            <div class="overflow-x-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
              <table class="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead class="bg-surface-container-low">
                  <tr>
                    <th class="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-outline">Name</th>
                    <th class="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-outline">Type</th>
                    <th class="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-outline">Sport</th>
                    <th class="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-outline">Status</th>
                    <th class="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-outline">Created</th>
                    <th class="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-outline text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/10">
                  {filtered().map((o) => (
                    <tr key={o.id} class="hover:bg-surface-container-low transition-colors align-top">
                      <td class="px-4 py-3">
                        <div class="min-w-0">
                          <p class="font-semibold text-on-surface break-words">{o._name || "—"}</p>
                          <p class="text-[11px] text-on-surface-variant break-all">{o.id}</p>
                        </div>
                      </td>
                      <td class="px-4 py-3 text-on-surface-variant">{o._type || "—"}</td>
                      <td class="px-4 py-3 text-on-surface-variant">{o._sport || "—"}</td>
                      <td class="px-4 py-3 text-on-surface-variant">{o._status || "—"}</td>
                      <td class="px-4 py-3 text-on-surface-variant">
                        {(o.created_at ?? "").slice(0, 10) || "—"}
                      </td>
                      <td class="px-4 py-3 text-right">
                        {editingId.value === o.id ? (
                          <span class="text-xs font-bold text-secondary">Editing</span>
                        ) : isNsa(o) ? (
                          <button
                            type="button"
                            class="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/15 transition-colors"
                            onClick$={() => startEdit$(o)}
                          >
                            <span class="material-symbols-outlined text-base">edit</span>
                            Edit
                          </button>
                        ) : (
                          <a
                            class="inline-flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                            href={`/admin/organisations/${encodeURIComponent(o.id)}/`}
                          >
                            <span class="material-symbols-outlined text-base">open_in_new</span>
                            View
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {editingId.value ? (
            <section class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 class="font-headline text-xl font-extrabold text-primary">Edit national sports association</h2>
                  <p class="text-sm text-on-surface-variant">Only {NSA_TYPE} organisations can be edited here.</p>
                </div>
                <div class="flex flex-wrap gap-3">
                  <button
                    type="button"
                    class="rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2 text-sm font-semibold hover:bg-surface-container-high transition-colors"
                    disabled={saving.value}
                    onClick$={cancelEdit$}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 disabled:opacity-60"
                    disabled={saving.value}
                    onClick$={saveEdit$}
                  >
                    {saving.value ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>

              {editError.value ? (
                <div class="mt-4 rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error" role="alert">
                  {editError.value}
                </div>
              ) : null}

              <div class="mt-6 grid grid-cols-1 gap-6">
                <div class="rounded-xl border border-outline-variant/20 bg-surface-container-low p-5">
                  <h3 class="font-headline font-bold text-primary">Core</h3>
                  <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label class="flex flex-col gap-1.5 md:col-span-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Organisation name
                      </span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={editForm.org_name}
                        onInput$={(e) => {
                          editForm.org_name = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>

                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Organisation type</span>
                      <select
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={editForm.org_type}
                        onChange$={(e) => {
                          editForm.org_type = (e.target as HTMLSelectElement).value;
                        }}
                      >
                        <option value={NSA_TYPE}>{NSA_TYPE}</option>
                      </select>
                    </label>

                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Sport</span>
                      <select
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={editForm.sport}
                        onChange$={(e) => {
                          editForm.sport = (e.target as HTMLSelectElement).value;
                        }}
                      >
                        <option value="" disabled>
                          Select sport
                        </option>
                        {SPORT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Establishment date (optional)
                      </span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        type="date"
                        value={editForm.establishment_date}
                        onInput$={(e) => {
                          editForm.establishment_date = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>

                    <label class="flex flex-col gap-1.5 md:col-span-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Website (optional)</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={editForm.website}
                        onInput$={(e) => {
                          editForm.website = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div class="rounded-xl border border-outline-variant/20 bg-surface-container-low p-5">
                  <h3 class="font-headline font-bold text-primary">Address</h3>
                  <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label class="flex flex-col gap-1.5 md:col-span-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Physical address
                      </span>
                      <textarea
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        rows={2}
                        value={editForm.physical_address}
                        onInput$={(e) => {
                          editForm.physical_address = (e.target as HTMLTextAreaElement).value;
                        }}
                      />
                    </label>
                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">City</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={editForm.city}
                        onInput$={(e) => {
                          editForm.city = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div class="rounded-xl border border-outline-variant/20 bg-surface-container-low p-5">
                  <h3 class="font-headline font-bold text-primary">Primary contact (required)</h3>
                  <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label class="flex flex-col gap-1.5 md:col-span-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Full name</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={editForm.primary_contact_name}
                        onInput$={(e) => {
                          editForm.primary_contact_name = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Title / role (optional)
                      </span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={editForm.primary_contact_title}
                        onInput$={(e) => {
                          editForm.primary_contact_title = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Mobile</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={editForm.primary_contact_mobile}
                        onInput$={(e) => {
                          editForm.primary_contact_mobile = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                    <label class="flex flex-col gap-1.5 md:col-span-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Email</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={editForm.primary_contact_email}
                        onInput$={(e) => {
                          editForm.primary_contact_email = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div class="rounded-xl border border-outline-variant/20 bg-surface-container-low p-5">
                  <h3 class="font-headline font-bold text-primary">Secondary contact (optional)</h3>
                  <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label class="flex flex-col gap-1.5 md:col-span-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Name</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={editForm.secondary_contact_name}
                        onInput$={(e) => {
                          editForm.secondary_contact_name = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Title (optional)</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={editForm.secondary_contact_title}
                        onInput$={(e) => {
                          editForm.secondary_contact_title = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Mobile (optional)</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={editForm.secondary_contact_mobile}
                        onInput$={(e) => {
                          editForm.secondary_contact_mobile = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                    <label class="flex flex-col gap-1.5 md:col-span-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Email (optional)</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={editForm.secondary_contact_email}
                        onInput$={(e) => {
                          editForm.secondary_contact_email = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div class="rounded-xl border border-outline-variant/20 bg-surface-container-low p-5">
                  <h3 class="font-headline font-bold text-primary">Emergency contact (optional)</h3>
                  <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label class="flex flex-col gap-1.5 md:col-span-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Name</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={editForm.emergency_contact_name}
                        onInput$={(e) => {
                          editForm.emergency_contact_name = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Mobile (optional)</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={editForm.emergency_contact_mobile}
                        onInput$={(e) => {
                          editForm.emergency_contact_mobile = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Relation (optional)</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={editForm.emergency_contact_relation}
                        onInput$={(e) => {
                          editForm.emergency_contact_relation = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {showCreate.value ? (
            <section class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 class="font-headline text-xl font-extrabold text-primary">Create national sports association</h2>
                  <p class="text-sm text-on-surface-variant">Creates an organisation with org_type = {NSA_TYPE}.</p>
                </div>
                <div class="flex flex-wrap gap-3">
                  <button
                    type="button"
                    class="rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2 text-sm font-semibold hover:bg-surface-container-high transition-colors"
                    disabled={saving.value}
                    onClick$={closeCreate$}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 disabled:opacity-60"
                    disabled={saving.value}
                    onClick$={submitCreate$}
                  >
                    {saving.value ? "Creating…" : "Create"}
                  </button>
                </div>
              </div>

              {createError.value ? (
                <div class="mt-4 rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error" role="alert">
                  {createError.value}
                </div>
              ) : null}

              <div class="mt-6 grid grid-cols-1 gap-6">
                <div class="rounded-xl border border-outline-variant/20 bg-surface-container-low p-5">
                  <h3 class="font-headline font-bold text-primary">Core</h3>
                  <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label class="flex flex-col gap-1.5 md:col-span-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Organisation name
                      </span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={createForm.org_name}
                        onInput$={(e) => {
                          createForm.org_name = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>

                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Organisation type</span>
                      <select
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={createForm.org_type}
                        onChange$={(e) => {
                          createForm.org_type = (e.target as HTMLSelectElement).value;
                        }}
                      >
                        <option value={NSA_TYPE}>{NSA_TYPE}</option>
                      </select>
                    </label>

                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Sport</span>
                      <select
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={createForm.sport}
                        onChange$={(e) => {
                          createForm.sport = (e.target as HTMLSelectElement).value;
                        }}
                      >
                        <option value="" disabled>
                          Select sport
                        </option>
                        {SPORT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Establishment date (optional)
                      </span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        type="date"
                        value={createForm.establishment_date}
                        onInput$={(e) => {
                          createForm.establishment_date = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>

                    <label class="flex flex-col gap-1.5 md:col-span-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Website (optional)</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={createForm.website}
                        onInput$={(e) => {
                          createForm.website = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div class="rounded-xl border border-outline-variant/20 bg-surface-container-low p-5">
                  <h3 class="font-headline font-bold text-primary">Address</h3>
                  <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label class="flex flex-col gap-1.5 md:col-span-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Physical address
                      </span>
                      <textarea
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        rows={2}
                        value={createForm.physical_address}
                        onInput$={(e) => {
                          createForm.physical_address = (e.target as HTMLTextAreaElement).value;
                        }}
                      />
                    </label>
                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">City</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={createForm.city}
                        onInput$={(e) => {
                          createForm.city = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div class="rounded-xl border border-outline-variant/20 bg-surface-container-low p-5">
                  <h3 class="font-headline font-bold text-primary">Primary contact (required)</h3>
                  <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label class="flex flex-col gap-1.5 md:col-span-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Full name</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={createForm.primary_contact_name}
                        onInput$={(e) => {
                          createForm.primary_contact_name = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Title / role (optional)
                      </span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={createForm.primary_contact_title}
                        onInput$={(e) => {
                          createForm.primary_contact_title = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Mobile</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={createForm.primary_contact_mobile}
                        onInput$={(e) => {
                          createForm.primary_contact_mobile = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                    <label class="flex flex-col gap-1.5 md:col-span-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Email</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={createForm.primary_contact_email}
                        onInput$={(e) => {
                          createForm.primary_contact_email = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div class="rounded-xl border border-outline-variant/20 bg-surface-container-low p-5">
                  <h3 class="font-headline font-bold text-primary">Secondary contact (optional)</h3>
                  <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label class="flex flex-col gap-1.5 md:col-span-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Name</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={createForm.secondary_contact_name}
                        onInput$={(e) => {
                          createForm.secondary_contact_name = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Title (optional)</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={createForm.secondary_contact_title}
                        onInput$={(e) => {
                          createForm.secondary_contact_title = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Mobile (optional)</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={createForm.secondary_contact_mobile}
                        onInput$={(e) => {
                          createForm.secondary_contact_mobile = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                    <label class="flex flex-col gap-1.5 md:col-span-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Email (optional)</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={createForm.secondary_contact_email}
                        onInput$={(e) => {
                          createForm.secondary_contact_email = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div class="rounded-xl border border-outline-variant/20 bg-surface-container-low p-5">
                  <h3 class="font-headline font-bold text-primary">Emergency contact (optional)</h3>
                  <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label class="flex flex-col gap-1.5 md:col-span-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Name</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={createForm.emergency_contact_name}
                        onInput$={(e) => {
                          createForm.emergency_contact_name = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Mobile (optional)</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={createForm.emergency_contact_mobile}
                        onInput$={(e) => {
                          createForm.emergency_contact_mobile = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                    <label class="flex flex-col gap-1.5">
                      <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Relation (optional)</span>
                      <input
                        class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30"
                        value={createForm.emergency_contact_relation}
                        onInput$={(e) => {
                          createForm.emergency_contact_relation = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Organisations | Admin",
};

