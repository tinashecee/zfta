import { $, component$, useSignal } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";

function buildAccept(allowPdf: boolean, allowDoc: boolean, allowXls: boolean, allowImages: boolean): string {
  const parts: string[] = [];
  if (allowPdf) {
    parts.push(".pdf", "application/pdf");
  }
  if (allowDoc) {
    parts.push(".doc", ".docx", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  }
  if (allowImages) {
    parts.push(".png", ".jpg", ".jpeg", "image/png", "image/jpeg");
  }
  return parts.length ? parts.join(",") : ".pdf,application/pdf";
}

function extOk(name: string, allowPdf: boolean, allowDoc: boolean, allowXls: boolean, allowImages: boolean): boolean {
  const lower = name.toLowerCase();
  if (allowPdf && (lower.endsWith(".pdf") || lower.includes(".pdf"))) return true;
  if (allowDoc && (lower.endsWith(".doc") || lower.endsWith(".docx"))) return true;
  if (allowImages && /\.(png|jpe?g)$/i.test(lower)) return true;
  return false;
}

export type AttachmentFieldProps = {
  title: string;
  description?: string;
  /** Shown as a small badge — e.g. which multipart/API field this maps to when uploaded. */
  apiFieldHint: string;
  file: Signal<File | null>;
  /** Max file size in MB (client-side check). */
  maxSizeMb?: number;
};

export const AttachmentField = component$<AttachmentFieldProps>((props) => {
  const allowPdf = useSignal(true);
  const allowDoc = useSignal(true);
  // Excel uploads are not accepted for this app flow.
  const allowXls = useSignal(false);
  const allowImages = useSignal(true);
  const localError = useSignal<string | null>(null);

  const maxMb = props.maxSizeMb ?? 15;

  const validateAndSet$ = $((f: File | null) => {
    localError.value = null;
    if (!f) {
      props.file.value = null;
      return;
    }
    const name = f.name || "file";
    if (
      !extOk(
        name,
        allowPdf.value,
        allowDoc.value,
        allowXls.value,
        allowImages.value,
      )
    ) {
      localError.value = "This file type is not allowed for the selected formats.";
      props.file.value = null;
      return;
    }
    if (f.size > maxMb * 1024 * 1024) {
      localError.value = `File is too large (max ${maxMb} MB for this demo).`;
      props.file.value = null;
      return;
    }
    props.file.value = f;
  });

  return (
    <div class="bg-surface-container-highest p-6 rounded-2xl flex flex-col border border-outline-variant/30">
      <div>
        <span class="inline-block px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider mb-4">
          {props.apiFieldHint}
        </span>
        <h3 class="font-headline font-bold text-lg mb-1 text-primary">{props.title}</h3>
        {props.description ? <p class="text-xs text-on-surface-variant">{props.description}</p> : null}
      </div>

      <fieldset class="mt-3 flex flex-wrap gap-3 text-xs">
        <legend class="sr-only">Allowed file types</legend>
        <label class="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" bind:checked={allowPdf} />
          PDF
        </label>
        <label class="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" bind:checked={allowDoc} />
          Word
        </label>
        <label class="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" bind:checked={allowImages} />
          Images
        </label>
      </fieldset>

      <label class="mt-4 flex cursor-pointer items-center justify-center gap-2 w-full py-3 bg-surface-container-lowest hover:bg-white rounded-xl transition-colors border border-outline-variant group">
        <input
          key={`file-${allowPdf.value}-${allowDoc.value}-${allowXls.value}-${allowImages.value}`}
          class="sr-only"
          accept={buildAccept(allowPdf.value, allowDoc.value, allowXls.value, allowImages.value)}
          type="file"
          onChange$={async (e) => {
            const f = (e.target as HTMLInputElement).files?.[0] ?? null;
            await validateAndSet$(f);
          }}
        />
        <span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">attachment</span>
        <span class="text-sm font-bold text-primary">Select file</span>
      </label>
      <p class="mt-2 text-[11px] text-on-surface-variant truncate text-white/90" title={props.file.value?.name}>
        {props.file.value ? props.file.value.name : "No file selected"}
      </p>
      {localError.value ? (
        <p class="mt-2 text-xs text-error" role="alert">
          {localError.value}
        </p>
      ) : null}
    </div>
  );
});
