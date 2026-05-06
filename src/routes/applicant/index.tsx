import { component$ } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";

export const onGet: RequestHandler = ({ redirect }) => {
  throw redirect(302, "/applicant/new/");
};

/** Fallback if navigation is opened without running `onGet` (should not happen in City). */
export default component$(() => (
  <p class="p-8 text-on-surface-variant">Redirecting to new applications…</p>
));

export const head: DocumentHead = {
  title: "New application",
};
