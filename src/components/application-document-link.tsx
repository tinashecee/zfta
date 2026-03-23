import { component$, useSignal } from "@builder.io/qwik";
import {
  displayFileNameFromStoredPath,
  fetchDocumentByStoredPath,
  validApplicationDocPath,
} from "~/lib/documents-api";

export const ApplicationDocumentLink = component$((props: {
  kind: string;
  storedPath: string | null | undefined;
}) => {
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);
  const path = (props.storedPath ?? "").trim();
  const pathOk = path ? validApplicationDocPath(path) : false;

  return (
    <div>
      <p class="text-xs font-bold text-on-surface-variant mb-1">{props.kind}</p>
      {path ? (
        <div class="space-y-2">
          <p class="text-sm text-on-surface truncate" title={displayFileNameFromStoredPath(path)}>
            {displayFileNameFromStoredPath(path)}
          </p>
          {!pathOk ? (
            <p class="text-xs text-on-surface-variant" role="status">
              This file reference can’t be opened (expected <code class="text-[10px]">upload_zfta_docs/…</code>).
            </p>
          ) : null}
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-1.5 text-xs font-bold text-primary hover:bg-surface-container-high transition-colors disabled:opacity-50"
              disabled={loading.value || !pathOk}
              onClick$={async () => {
                loading.value = true;
                error.value = null;
                const r = await fetchDocumentByStoredPath(path);
                loading.value = false;
                if (!r.ok) {
                  error.value = r.error;
                  return;
                }
                const url = URL.createObjectURL(r.blob);
                const w = window.open(url, "_blank", "noopener,noreferrer");
                if (!w) {
                  error.value = "Could not open a new tab. Allow pop-ups for this site or try again.";
                  URL.revokeObjectURL(url);
                  return;
                }
                window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
              }}
            >
              <span class="material-symbols-outlined text-base">open_in_new</span>
              {loading.value ? "Loading…" : "Open"}
            </button>
          </div>
          {error.value ? (
            <p class="text-xs text-error" role="alert">
              {error.value}
            </p>
          ) : null}
        </div>
      ) : (
        <p class="text-sm text-on-surface-variant">—</p>
      )}
    </div>
  );
});
