import { component$, Slot, useVisibleTask$ } from "@builder.io/qwik";
import {
  getCurrentUser,
  redirectPathIfWrongRole,
  reviewerHasValidApproverProfile,
} from "~/lib/auth";

export default component$(() => {
  useVisibleTask$(() => {
    const u = getCurrentUser();
    const path = redirectPathIfWrongRole(u, "reviewer");
    if (path) {
      window.location.assign(path);
      return;
    }
    if (u?.role === "reviewer" && !reviewerHasValidApproverProfile(u)) {
      window.location.assign("/sign-in/?error=approver");
    }
  });

  return (
    <div class="min-h-screen flex flex-col bg-background text-on-background">
      <Slot />
      <footer class="mt-auto bg-emerald-950 w-full py-12 px-8">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="text-lg font-bold text-white font-headline">Zimbabwe Sports Travel Authority</div>
          <div class="flex flex-wrap justify-center gap-8 font-body text-sm antialiased">
            <a class="text-emerald-200/60 hover:text-amber-400 transition-colors" href="#">
              Privacy Policy
            </a>
            <a class="text-emerald-200/60 hover:text-amber-400 transition-colors" href="#">
              Terms of Service
            </a>
          </div>
          <div class="text-emerald-200/60 font-body text-sm antialiased opacity-80 hover:opacity-100 transition-opacity">
            © 2026 Soxfort Solutions
          </div>
        </div>
      </footer>
    </div>
  );
});
