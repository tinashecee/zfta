import { component$, Slot, useVisibleTask$ } from "@builder.io/qwik";
import { AUTH_FORCED_SIGNOUT_EVENT, getCurrentUser, redirectPathIfWrongRole } from "~/lib/auth";

export default component$(() => {
  useVisibleTask$(() => {
    const onForced = () => {
      window.location.assign("/sign-in/");
    };
    window.addEventListener(AUTH_FORCED_SIGNOUT_EVENT, onForced);

    const u = getCurrentUser();
    const path = redirectPathIfWrongRole(u, "system_admin");
    if (path) window.location.assign(path);

    return () => {
      window.removeEventListener(AUTH_FORCED_SIGNOUT_EVENT, onForced);
    };
  });

  return <Slot />;
});
