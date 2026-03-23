import { $, component$, useSignal } from "@builder.io/qwik";
import { downloadPersonnelTemplateXlsx, parsePersonnelExcelFile } from "~/lib/personnel-excel";
import {
  newPersonnelRow,
  PERSONNEL_GENDERS,
  PERSONNEL_ROLES,
  PERSONNEL_STATUSES,
  type TravelPersonnelRow,
} from "~/lib/travel-personnel-types";

export type TravelPersonnelRosterProps = {
  /** Mutable store array from parent (`useStore<TravelPersonnelRow[]>([])`) */
  personnel: TravelPersonnelRow[];
  /** `view` = read-only table (no uploads, add/remove, or cell editing). */
  mode?: "create" | "edit" | "view";
};

export const TravelPersonnelRoster = component$<TravelPersonnelRosterProps>(({ personnel, mode }) => {
  const uploadError = useSignal<string | null>(null);
  const fileInputKey = useSignal(0);

  const onDownloadTemplate$ = $(async () => {
    await downloadPersonnelTemplateXlsx();
  });

  const onFileChange$ = $(async (e: Event) => {
    const el = e.target as HTMLInputElement;
    const file = el.files?.[0];
    el.value = "";
    fileInputKey.value++;
    if (!file) return;
    uploadError.value = null;
    const result = await parsePersonnelExcelFile(file);
    if (!result.ok) {
      uploadError.value = [result.error, ...(result.rowErrors ?? [])].filter(Boolean).join("\n");
      return;
    }
    result.rows.forEach((p) => {
      personnel.push(newPersonnelRow(p));
    });
  });

  const removeRow$ = $((clientId: string) => {
    const i = personnel.findIndex((r) => r._clientId === clientId);
    if (i >= 0) personnel.splice(i, 1);
  });

  const addEmptyRow$ = $(() => {
    personnel.push(newPersonnelRow());
  });

  const isEdit = mode === "edit";
  const isView = mode === "view";

  return (
    <div class="space-y-6">
      {!isView ? (
        <>
          <div class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              class="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm font-bold text-primary hover:bg-surface-container-high transition-colors"
              type="button"
              onClick$={onDownloadTemplate$}
            >
              <span class="material-symbols-outlined text-lg">download</span>
              Download Excel template
            </button>

            <label class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-container px-4 py-3 text-sm font-bold text-on-primary-container hover:brightness-105 transition-colors">
              <span class="material-symbols-outlined text-lg">upload_file</span>
              Upload filled spreadsheet
              <input
                key={fileInputKey.value}
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                class="sr-only"
                type="file"
                onChange$={onFileChange$}
              />
            </label>

            <button
              class="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
              type="button"
              onClick$={addEmptyRow$}
            >
              <span class="material-symbols-outlined text-lg">person_add</span>
              Add person manually
            </button>
          </div>

          <p class="text-xs text-on-surface-variant leading-relaxed">
            Template columns:{" "}
            <code class="rounded bg-surface-container-high px-1 py-0.5 text-[10px]">
              full_name, gender, date_of_birth, national_id_number, passport_number, passport_expiry, role, position,
              status
            </code>
            . Dates use <code class="text-[10px]">YYYY-MM-DD</code>. Gender: <code class="text-[10px]">male</code> or{" "}
            <code class="text-[10px]">female</code>. Role: <code class="text-[10px]">player</code>,{" "}
            <code class="text-[10px]">coach</code>, <code class="text-[10px]">medical</code>,{" "}
            <code class="text-[10px]">admin</code>. Remove the sample row before upload.
            {isEdit ? " Uploading replaces listed rows only after you save the application." : ""}
          </p>
        </>
      ) : (
        <p class="text-xs text-on-surface-variant">Submitted roster (read-only).</p>
      )}

      {uploadError.value ? (
        <div class="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error whitespace-pre-wrap" role="alert">
          {uploadError.value}
        </div>
      ) : null}

      {personnel.length === 0 ? (
        <div class="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low/50 p-8 text-center text-sm text-on-surface-variant">
          {isView ? "No travellers on this application." : "No travellers yet. Upload a spreadsheet or add people manually."}
        </div>
      ) : (
        <div class="overflow-x-auto rounded-xl border border-outline-variant/20">
          <table class="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr class="bg-surface-container-high text-[10px] font-black uppercase tracking-wider text-outline">
                <th class="px-3 py-3">Name</th>
                <th class="px-3 py-3">Gender</th>
                <th class="px-3 py-3">Date of birth</th>
                <th class="px-3 py-3">Role</th>
                <th class="px-3 py-3">Position</th>
                <th class="px-3 py-3">Passport</th>
                <th class="px-3 py-3">Status</th>
                {isView ? null : <th class="px-3 py-3 w-24" />}
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/10">
              {personnel.map((row) => (
                <tr key={row._clientId} class="bg-surface-container-lowest hover:bg-surface-container-low/80">
                  {isView ? (
                    <>
                      <td class="px-3 py-2 align-top text-on-surface">{row.full_name}</td>
                      <td class="px-3 py-2 align-top text-on-surface">{row.gender}</td>
                      <td class="px-3 py-2 align-top text-on-surface">{row.date_of_birth || "—"}</td>
                      <td class="px-3 py-2 align-top text-on-surface">{row.role}</td>
                      <td class="px-3 py-2 align-top text-on-surface">{row.position?.trim() || "—"}</td>
                      <td class="px-3 py-2 align-top text-on-surface">{row.passport_number?.trim() || "—"}</td>
                      <td class="px-3 py-2 align-top text-on-surface">{row.status ?? "active"}</td>
                    </>
                  ) : (
                    <>
                      <td class="px-3 py-2 align-top">
                        <input
                          class="w-full min-w-[140px] rounded-lg border-none bg-surface-container-highest px-2 py-1.5 text-on-surface"
                          type="text"
                          value={row.full_name}
                          onInput$={(e) => {
                            row.full_name = (e.target as HTMLInputElement).value;
                          }}
                        />
                      </td>
                      <td class="px-3 py-2 align-top">
                        <select
                          class="w-full rounded-lg border-none bg-surface-container-highest px-2 py-1.5 text-on-surface"
                          value={row.gender}
                          onChange$={(e) => {
                            row.gender = (e.target as HTMLSelectElement).value as TravelPersonnelRow["gender"];
                          }}
                        >
                          {PERSONNEL_GENDERS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td class="px-3 py-2 align-top">
                        <input
                          class="w-full min-w-[120px] rounded-lg border-none bg-surface-container-highest px-2 py-1.5 text-on-surface"
                          type="date"
                          value={row.date_of_birth}
                          onInput$={(e) => {
                            row.date_of_birth = (e.target as HTMLInputElement).value;
                          }}
                        />
                      </td>
                      <td class="px-3 py-2 align-top">
                        <select
                          class="w-full min-w-[100px] rounded-lg border-none bg-surface-container-highest px-2 py-1.5 text-on-surface"
                          value={row.role}
                          onChange$={(e) => {
                            row.role = (e.target as HTMLSelectElement).value as TravelPersonnelRow["role"];
                          }}
                        >
                          {PERSONNEL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td class="px-3 py-2 align-top">
                        <input
                          class="w-full min-w-[80px] rounded-lg border-none bg-surface-container-highest px-2 py-1.5 text-on-surface"
                          placeholder="—"
                          type="text"
                          value={row.position ?? ""}
                          onInput$={(e) => {
                            row.position = (e.target as HTMLInputElement).value;
                          }}
                        />
                      </td>
                      <td class="px-3 py-2 align-top">
                        <input
                          class="w-full min-w-[100px] rounded-lg border-none bg-surface-container-highest px-2 py-1.5 text-on-surface"
                          placeholder="—"
                          type="text"
                          value={row.passport_number ?? ""}
                          onInput$={(e) => {
                            row.passport_number = (e.target as HTMLInputElement).value;
                          }}
                        />
                      </td>
                      <td class="px-3 py-2 align-top">
                        <select
                          class="w-full min-w-[110px] rounded-lg border-none bg-surface-container-highest px-2 py-1.5 text-on-surface"
                          value={row.status ?? "active"}
                          onChange$={(e) => {
                            row.status = (e.target as HTMLSelectElement).value as TravelPersonnelRow["status"];
                          }}
                        >
                          {PERSONNEL_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td class="px-3 py-2 align-top text-right">
                        <button
                          class="rounded-lg p-2 text-error hover:bg-error/10"
                          type="button"
                          aria-label="Remove traveller"
                          onClick$={$(() => removeRow$(row._clientId))}
                        >
                          <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {personnel.length > 0 ? (
        <p class="text-xs text-on-surface-variant">
          <span class="font-bold text-primary">{personnel.length}</span> traveller{personnel.length === 1 ? "" : "s"}{" "}
          listed.
        </p>
      ) : null}
    </div>
  );
});
