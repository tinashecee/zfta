import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ApplicantPortalNav } from "~/components/applicant-portal-nav";

export default component$(() => {
  return (
    <div class="bg-surface font-body text-on-surface min-h-screen great-enclosure-texture">
      <ApplicantPortalNav activeItem="applications" />

      <div class="max-w-7xl mx-auto p-10">
        <main class="space-y-8">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
              <nav class="flex items-center gap-2 text-on-surface-variant mb-4 text-sm font-medium">
                <span>Applications</span>
                <span class="material-symbols-outlined text-xs">chevron_right</span>
                <span class="text-secondary font-semibold">Ref: ZTA-2025-0042</span>
              </nav>

              <h1 class="text-5xl font-extrabold tracking-tighter mb-2">Dynamos FC</h1>
              <p class="text-on-surface-variant flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">flight_takeoff</span>
                Destination: <span class="font-bold text-on-surface">South Africa</span>
              </p>
            </div>

            <div class="flex flex-wrap gap-4">
              <div class="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">hourglass_empty</span>
                Status: Under Review
              </div>
              <div class="bg-primary-fixed text-on-primary-fixed-variant px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">check_circle</span>
                Payment: Confirmed (#88219)
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div class="lg:col-span-8 space-y-8">
              <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold tracking-tight">Application Timeline</h2>
                <span class="text-on-surface-variant text-sm font-medium uppercase tracking-widest">
                  Latest Activity
                </span>
              </div>

              <div class="relative pl-8 space-y-12 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/30">
                <div class="relative group">
                  <div class="absolute -left-10 top-0 w-6 h-6 rounded-full bg-tertiary border-4 border-surface flex items-center justify-center z-10" />

                  <div class="bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] border-l-4 border-tertiary">
                    <div class="flex justify-between items-start mb-4">
                      <div>
                        <span class="text-tertiary text-xs font-bold uppercase tracking-widest block mb-1">
                          Today &bull; Action Required
                        </span>
                        <h3 class="text-xl font-bold">SRC Information Request</h3>
                      </div>
                      <span class="bg-error-container text-on-error-container px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter">
                        Priority
                      </span>
                    </div>

                    <div class="bg-surface-container-low p-4 rounded-lg mb-6 italic text-on-surface-variant border-l-2 border-outline-variant">
                      "Your team list is missing passport numbers for 3 players"
                    </div>

                    <button
                      type="button"
                      class="bg-primary text-white px-6 py-3 rounded-lg font-bold flex items-center gap-3 hover:translate-y-[-2px] transition-all duration-200 shadow-lg shadow-primary/10"
                    >
                      <span class="material-symbols-outlined">upload_file</span>
                      Upload Revised Team List
                    </button>
                  </div>
                </div>

                <div class="relative">
                  <div class="absolute -left-10 top-0 w-6 h-6 rounded-full bg-primary-fixed-dim border-4 border-surface flex items-center justify-center z-10" />

                  <div class="bg-surface-container-low p-8 rounded-xl opacity-90 transition-all duration-300">
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <span class="text-on-surface-variant text-xs font-bold uppercase tracking-widest block mb-1">
                          Yesterday
                        </span>
                        <h3 class="text-xl font-bold">ZIFA Technical Approval</h3>
                      </div>
                      <span
                        class="material-symbols-outlined text-on-primary-fixed-variant"
                        style="font-variation-settings: 'FILL' 1;"
                      >
                        check_circle
                      </span>
                    </div>
                    <p class="text-on-surface-variant">
                      Technical squad list has been verified and endorsed by the Zimbabwe Information Football
                      Association.
                    </p>
                  </div>
                </div>

                <div class="relative">
                  <div class="absolute -left-10 top-0 w-6 h-6 rounded-full bg-outline-variant border-4 border-surface flex items-center justify-center z-10" />

                  <div class="bg-surface-container-low p-8 rounded-xl opacity-80">
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <span class="text-on-surface-variant text-xs font-bold uppercase tracking-widest block mb-1">
                          2 days ago
                        </span>
                        <h3 class="text-xl font-bold">Application Submitted</h3>
                      </div>
                    </div>

                    <p class="text-on-surface-variant mb-4">
                      Initial travel dossier submitted. Application fee payment of $450.00 processed successfully
                      via Transaction ID: #88219.
                    </p>

                    <div class="flex gap-4">
                      <button
                        type="button"
                        class="text-secondary font-bold text-sm flex items-center gap-1 hover:underline"
                      >
                        <span class="material-symbols-outlined text-sm">download</span> View Receipt
                      </button>
                      <button
                        type="button"
                        class="text-secondary font-bold text-sm flex items-center gap-1 hover:underline"
                      >
                        <span class="material-symbols-outlined text-sm">visibility</span> View Form
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="lg:col-span-4 space-y-6">
              <div class="bg-primary text-white p-8 rounded-xl shadow-2xl relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-10">
                  <span class="material-symbols-outlined text-9xl">account_balance</span>
                </div>

                <h2 class="text-2xl font-bold mb-6 relative z-10">Governance Check</h2>

                <div class="space-y-6 relative z-10">
                  <div class="flex items-center justify-between group">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
                        <span class="material-symbols-outlined text-on-primary-fixed-variant">verified_user</span>
                      </div>
                      <div>
                        <p class="font-bold">ZIFA</p>
                        <p class="text-xs text-white/60">Football Admin</p>
                      </div>
                    </div>
                    <span class="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-xs font-black uppercase">
                      Approved
                    </span>
                  </div>

                  <div class="flex items-center justify-between group">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center">
                        <span class="material-symbols-outlined text-on-secondary-fixed-variant">info</span>
                      </div>
                      <div>
                        <p class="font-bold">SRC</p>
                        <p class="text-xs text-white/60">Sports Commission</p>
                      </div>
                    </div>
                    <span class="bg-secondary-fixed text-on-secondary-fixed-variant px-3 py-1 rounded-full text-xs font-black uppercase">
                      Reviewing
                    </span>
                  </div>

                  <div class="flex items-center justify-between group">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <span class="material-symbols-outlined text-white/40">pending</span>
                      </div>
                      <div>
                        <p class="font-bold">Immigration</p>
                        <p class="text-xs text-white/60">Border Control</p>
                      </div>
                    </div>
                    <span class="bg-white/10 text-white/40 px-3 py-1 rounded-full text-xs font-black uppercase">
                      Pending
                    </span>
                  </div>
                </div>

                <div class="mt-8 pt-8 border-t border-white/10">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium text-white/60">Overall Completion</span>
                    <span class="text-sm font-bold">45%</span>
                  </div>
                  <div class="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div class="bg-secondary h-full w-[45%] rounded-full shadow-[0_0_10px_rgba(253,208,0,0.5)]" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      <footer class="mt-12 py-12 px-8 border-t border-outline-variant/15 flex flex-col md:flex-row justify-between items-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
        <div class="flex items-center gap-2">
          <span class="text-primary font-black uppercase tracking-widest text-xs">Official Portal</span>
          <div class="h-1 w-8 bg-secondary" />
        </div>
        <div class="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
          <a class="hover:text-primary transition-colors" href="#">
            Privacy Policy
          </a>
          <a class="hover:text-primary transition-colors" href="#">
            Terms of Service
          </a>
          <a class="hover:text-primary transition-colors" href="#">
            Digital Signature Verification
          </a>
        </div>
        <p class="text-[10px] font-medium">© 2025 Zimbabwe Sports Travel Authority. All rights reserved.</p>
      </footer>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Application Timeline",
};

