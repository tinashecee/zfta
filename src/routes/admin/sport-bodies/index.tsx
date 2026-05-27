import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AdminPortalNav } from "~/components/admin-portal-nav";
import { appPageTitle } from "~/lib/app-branding";
import { CATALOG_SPORT_KEYS, type CatalogSportKey } from "~/lib/catalog-sports";
import {
  createSportBody,
  deleteSportBody,
  listSportBodies,
  patchSportBody,
  sportBodyApprovalCode,
  type ApiSportBody,
} from "~/lib/sport-bodies-api";

/** One governing body per sport type — matches API `sport_type`. */
const SPORT_BODY_SPORT_OPTIONS = CATALOG_SPORT_KEYS;

export type SportTypeKey = CatalogSportKey;

function capitalizeSport(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** Map API row to a catalog sport key (prefer `sport_type`, else code/name). */
function resolveSportKeyFromRow(row: ApiSportBody): string {
  const st = typeof row.sport_type === "string" ? row.sport_type.trim().toLowerCase() : "";
  if (st && SPORT_BODY_SPORT_OPTIONS.includes(st as SportTypeKey)) return st;
  const code = (row.code ?? "").trim().toLowerCase();
  const name = (row.name ?? "").trim().toLowerCase();
  if (SPORT_BODY_SPORT_OPTIONS.includes(code as SportTypeKey)) return code;
  if (SPORT_BODY_SPORT_OPTIONS.includes(name as SportTypeKey)) return name;
  return "";
}

/** At most one body per sport key (first wins if API returns duplicates). */
function bodyBySportKey(rows: ApiSportBody[]): Map<string, ApiSportBody> {
  const m = new Map<string, ApiSportBody>();
  for (const row of rows) {
    const k = resolveSportKeyFromRow(row);
    if (k && !m.has(k)) m.set(k, row);
  }
  return m;
}

export default component$(() => {
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const rows = useSignal<ApiSportBody[]>([]);
  const loadKey = useSignal(0);

  const showModal = useSignal(false);
  const editId = useSignal<number | null>(null);
  const sportKey = useSignal<SportTypeKey | "">("");
  const displayName = useSignal("");
  const shortName = useSignal("");
  /** Snapshot of `short_name` when modal opened — used to send `clear_short_name` on PATCH when cleared */
  const initialShortName = useSignal("");
  const formError = useSignal<string | null>(null);
  const saving = useSignal(false);

  useVisibleTask$(async ({ track }) => {
    track(() => loadKey.value);
    loading.value = true;
    error.value = null;
    const r = await listSportBodies({ limit: 500, offset: 0 });
    loading.value = false;
    if (!r.ok) {
      error.value = r.error;
      rows.value = [];
      return;
    }
    rows.value = r.data;
  });

  const openCreateForSport$ = $((key: SportTypeKey) => {
    const map = bodyBySportKey(rows.value);
    if (map.has(key)) return;
    editId.value = null;
    sportKey.value = key;
    displayName.value = "";
    shortName.value = "";
    initialShortName.value = "";
    formError.value = null;
    showModal.value = true;
  });

  const openEdit$ = $((key: SportTypeKey, row: ApiSportBody) => {
    editId.value = row.id;
    sportKey.value = key;
    displayName.value = (row.name ?? "").trim();
    const sn = (row.short_name ?? "").trim();
    shortName.value = sn;
    initialShortName.value = sn;
    formError.value = null;
    showModal.value = true;
  });

  const closeModal$ = $(() => {
    showModal.value = false;
  });

  const submit$ = $(async () => {
    formError.value = null;
    const key = sportKey.value;
    if (!key) {
      formError.value = "Missing sport type.";
      return;
    }
    const name = displayName.value.trim();
    if (!name) {
      formError.value = "Name is required.";
      return;
    }
    const sport_type = key;
    const code = key.toUpperCase();
    const snTrim = shortName.value.trim();
    const hadShort = initialShortName.value.trim().length > 0;

    saving.value = true;
    const id = editId.value;
    let r;
    if (id == null) {
      const payload: Record<string, unknown> = { name, sport_type, code };
      if (snTrim) payload.short_name = snTrim;
      r = await createSportBody(payload);
    } else {
      const payload: Record<string, unknown> = { name, sport_type, code };
      if (hadShort && !snTrim) {
        payload.clear_short_name = true;
      } else if (snTrim) {
        payload.short_name = snTrim;
      }
      r = await patchSportBody(id, payload);
    }
    saving.value = false;
    if (!r.ok) {
      formError.value = r.error;
      return;
    }
    showModal.value = false;
    loadKey.value++;
  });

  const remove$ = $(async (id: number) => {
    if (!window.confirm("Delete this sport body? You can add it again for the same sport later.")) return;
    const r = await deleteSportBody(id);
    if (!r.ok) {
      error.value = r.error;
      return;
    }
    loadKey.value++;
  });

  return (
    <div class="min-h-screen bg-background text-on-background">
      <AdminPortalNav activeItem="sportBodies" />

      <main class="min-h-screen pt-20 lg:pl-64">
        <div class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:p-8">
          <div>
            <h1 class="font-headline text-3xl font-extrabold tracking-tight text-primary">Sport bodies</h1>
            <p class="mt-1 text-sm text-on-surface-variant">
              One governing body per sport. Set a display <span class="font-semibold">name</span> and{" "}
              <span class="font-semibold">sport_type</span> (the catalog sport). Approval <span class="font-mono">code</span>{" "}
              is the uppercase sport type. Use Edit to change the body for that sport — you cannot add a second body for the
              same sport.
            </p>
          </div>

          {error.value && !showModal.value ? (
            <div class="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">{error.value}</div>
          ) : null}

          {loading.value ? (
            <p class="text-on-surface-variant">Loading…</p>
          ) : (
            <div class="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
              <table class="w-full min-w-[36rem] text-left text-sm">
                <thead>
                  <tr class="border-b border-outline-variant/20 bg-surface-container-low">
                    <th class="px-4 py-3 font-bold text-outline">Sport</th>
                    <th class="px-4 py-3 font-bold text-outline">sport_type</th>
                    <th class="px-4 py-3 font-bold text-outline">Name</th>
                    <th class="px-4 py-3 font-bold text-outline">Code</th>
                    <th class="px-4 py-3 font-bold text-outline">Short</th>
                    <th class="px-4 py-3 font-bold text-outline text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const map = bodyBySportKey(rows.value);
                    return SPORT_BODY_SPORT_OPTIONS.map((key) => {
                      const row = map.get(key);
                      return (
                        <tr key={key} class="border-b border-outline-variant/10">
                          <td class="px-4 py-3 font-medium">{capitalizeSport(key)}</td>
                          <td class="px-4 py-3 font-mono text-xs text-on-surface-variant">{key}</td>
                          <td class="px-4 py-3">{row?.name ?? "—"}</td>
                          <td class="px-4 py-3 font-mono text-xs">{row ? sportBodyApprovalCode(row) : "—"}</td>
                          <td class="px-4 py-3 text-on-surface-variant">{row?.short_name ?? "—"}</td>
                          <td class="px-4 py-3 text-right">
                            {row ? (
                              <>
                                <button
                                  type="button"
                                  class="mr-2 text-primary text-sm font-bold"
                                  onClick$={() => openEdit$(key, row)}
                                >
                                  Edit
                                </button>
                                <button type="button" class="text-error text-sm font-bold" onClick$={() => remove$(row.id)}>
                                  Delete
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                class="text-primary text-sm font-bold"
                                onClick$={() => openCreateForSport$(key)}
                              >
                                Create body
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showModal.value ? (
        <div
          class="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick$={closeModal$}
        >
          <div
            class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface-container-highest p-6 shadow-xl"
            onClick$={(e) => e.stopPropagation()}
          >
            <h2 class="font-headline text-xl font-bold text-primary">
              {editId.value == null
                ? `Create sport body — ${sportKey.value ? capitalizeSport(sportKey.value) : ""}`
                : `Edit sport body — ${sportKey.value ? capitalizeSport(sportKey.value) : ""}`}
            </h2>
            <p class="mt-1 text-sm text-on-surface-variant">
              Required: <span class="font-semibold">name</span> and <span class="font-semibold">sport_type</span>. Only one
              record per sport.
            </p>

            <div class="mt-4 space-y-4">
              <div>
                <span class="block text-xs font-bold uppercase text-outline">sport_type (fixed)</span>
                <p class="mt-1 rounded-xl bg-surface-container-low px-4 py-3 text-sm font-mono">{sportKey.value || "—"}</p>
              </div>

              <label class="block text-xs font-bold uppercase text-outline">
                Name <span class="text-error">*</span>
                <input
                  class="mt-1 w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm"
                  placeholder="e.g. Cricket Zimbabwe"
                  value={displayName.value}
                  onInput$={(_, el) => {
                    displayName.value = el.value;
                  }}
                />
              </label>

              <div>
                <span class="block text-xs font-bold uppercase text-outline">Approval code (from sport)</span>
                <p class="mt-1 rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-4 py-3 text-sm font-mono text-on-surface-variant">
                  {sportKey.value ? sportKey.value.toUpperCase() : "—"}
                </p>
              </div>

              <label class="block text-xs font-bold uppercase text-outline">
                Short name (optional)
                <input
                  class="mt-1 w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm"
                  value={shortName.value}
                  onInput$={(_, el) => {
                    shortName.value = el.value;
                  }}
                />
                {editId.value != null ? (
                  <p class="mt-1 text-xs text-on-surface-variant">
                    If a short name was set before, clearing the field and saving removes it on the server.
                  </p>
                ) : null}
              </label>
            </div>
            {formError.value ? <p class="mt-3 text-sm text-error">{formError.value}</p> : null}
            <div class="mt-6 flex justify-end gap-3">
              <button type="button" class="rounded-xl px-4 py-2 text-sm font-bold text-on-surface-variant" onClick$={closeModal$}>
                Cancel
              </button>
              <button
                type="button"
                class="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                disabled={saving.value}
                onClick$={submit$}
              >
                {saving.value ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
});

export const head: DocumentHead = {
  title: appPageTitle("Sport bodies — Admin"),
};
