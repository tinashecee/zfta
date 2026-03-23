import { component$, Slot, useVisibleTask$ } from "@builder.io/qwik";
import { getCurrentUser, redirectPathIfWrongRole } from "~/lib/auth";

export default component$(() => {
  useVisibleTask$(() => {
    const u = getCurrentUser();
    const path = redirectPathIfWrongRole(u, "applicant");
    if (path) window.location.assign(path);
  });

  return <Slot />;
});
