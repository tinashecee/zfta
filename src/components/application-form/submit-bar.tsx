import { component$ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";

export type SubmitBarProps = {
  submitBusy: Signal<boolean>;
  /** Optional second button (e.g. disabled draft). */
  showDraft?: boolean;
};

export const SubmitBar = component$<SubmitBarProps>((props) => {
  return (
    <footer class="flex flex-col md:flex-row items-center justify-end gap-4 py-12 border-t border-outline-variant/20">
      {props.showDraft ? (
        <button
          class="w-full md:w-auto px-8 py-3 bg-surface-container-highest text-primary font-headline font-bold rounded-xl hover:bg-surface-container-high transition-all active:scale-95 opacity-70"
          type="button"
          disabled
          title="Draft save will be available when the API supports status draft with attachments."
        >
          Save as Draft
        </button>
      ) : null}
      <button
        class={
          props.submitBusy.value
            ? "w-full md:w-auto px-12 py-3 bg-gradient-to-r from-primary to-primary-container text-white font-headline font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 cursor-wait ring-4 ring-primary/25 ring-offset-2 ring-offset-background opacity-95"
            : "w-full md:w-auto px-12 py-3 bg-gradient-to-r from-primary to-primary-container text-white font-headline font-bold rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
        }
        disabled={props.submitBusy.value}
        type="submit"
        aria-busy={props.submitBusy.value}
      >
        {props.submitBusy.value ? (
          <>
            <span
              class="inline-block size-5 shrink-0 rounded-full border-2 border-white border-t-transparent motion-safe:animate-spin"
              aria-hidden
            />
            <span>Submitting…</span>
          </>
        ) : (
          <>
            Submit Application
            <span class="material-symbols-outlined" aria-hidden>
              send
            </span>
          </>
        )}
      </button>
    </footer>
  );
});
