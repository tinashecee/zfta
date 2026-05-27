import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { ApproverPortalNav } from "~/components/approver-portal-nav";

export default component$(() => {
  const location = useLocation();
  const applicationRef = location.url.searchParams.get("ref") ?? "ZTA-2025-0039";
  const decision = location.url.searchParams.get("result") === "rejected" ? "rejected" : "approved";
  const isRejected = decision === "rejected";

  return (
    <div class="flex flex-1 flex-col min-h-0 min-w-0 bg-background text-on-background">
      <ApproverPortalNav activeItem="archived" title="Official Approver Portal - Historical Review" />

      <main class="flex-1 min-h-0 min-w-0 w-full">
        <div class="pt-24 px-4 pb-8 sm:px-6 sm:pb-12 lg:px-8">
          <header class="mb-6 rounded-xl bg-white/80 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.04)] backdrop-blur-md sm:mb-10 sm:p-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-secondary font-bold text-xs tracking-widest uppercase">
                    Application Reference
                  </span>
                  <span class="bg-surface-container-highest px-2 py-0.5 rounded text-[10px] font-bold">
                    ARCHIVED RECORD
                  </span>
                </div>
                <h1 class="break-words text-2xl font-extrabold tracking-tight text-primary sm:text-4xl">
                  {applicationRef}
                </h1>
                <div class="flex items-center gap-4 mt-2 flex-wrap">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-secondary text-sm">sports_soccer</span>
                    <span class="font-bold text-lg">Highlanders FC</span>
                  </div>
                  <span class="hidden text-outline sm:inline">|</span>
                  <div class="text-on-surface-variant font-medium">Club Friendly • Botswana</div>
                </div>
              </div>

              <div class="w-full md:w-auto md:text-right">
                <div class="mb-4 flex flex-wrap gap-2 md:justify-end">
                  <div class="flex items-center gap-1.5 bg-primary-fixed px-3 py-1 rounded-full text-[10px] font-bold text-on-primary-fixed-variant">
                    <span class="material-symbols-outlined text-[14px]">check_circle</span> ZIFA: VERIFIED
                  </div>
                  <div class="flex items-center gap-1.5 bg-primary-fixed px-3 py-1 rounded-full text-[10px] font-bold text-on-primary-fixed-variant">
                    <span class="material-symbols-outlined text-[14px]">task_alt</span> SRC: COMPLETE
                  </div>
                  <div
                    class={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                      isRejected
                        ? "bg-error-container text-on-error-container"
                        : "bg-primary-fixed text-on-primary-fixed-variant"
                    }`}
                  >
                    <span class="material-symbols-outlined text-[14px]">
                      {isRejected ? "cancel" : "verified"}
                    </span>
                    FINAL: {isRejected ? "REJECTED" : "APPROVED"}
                  </div>
                </div>
                <div class="inline-block w-full rounded-xl bg-surface-container px-4 py-2 text-xs font-medium text-on-surface-variant md:w-auto">
                  Closed on <span class="text-primary font-bold">14 Feb 2025</span> by SRC-ADMIN-04
                </div>
              </div>
            </div>
          </header>

          <div class="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 items-start">
            <div class="lg:col-span-8 space-y-8">
              <section class="group rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
                <div class="mb-6 flex items-start justify-between gap-4">
                  <h2 class="text-xl font-bold text-primary flex items-center gap-3">
                    <span class="w-1 bg-secondary h-6 rounded-full" />
                    Organization Profile
                  </h2>
                  <span class="material-symbols-outlined text-outline">expand_less</span>
                </div>
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 md:gap-y-6 md:gap-x-12">
                  <div>
                    <div class="text-xs text-outline mb-1 font-bold">ORGANIZATION NAME</div>
                    <div class="text-sm font-semibold">Highlanders Football Club</div>
                  </div>
                  <div>
                    <div class="text-xs text-outline mb-1 font-bold">TYPE</div>
                    <div class="text-sm font-semibold">Professional Sports Club</div>
                  </div>
                  <div>
                    <div class="text-xs text-outline mb-1 font-bold">DIVISION</div>
                    <div class="text-sm font-semibold">Premier League</div>
                  </div>
                  <div>
                    <div class="text-xs text-outline mb-1 font-bold">ZIFA REGISTRATION</div>
                    <div class="text-sm font-semibold">#3311-H (Registered)</div>
                  </div>
                  <div>
                    <div class="text-xs text-outline mb-1 font-bold">ESTABLISHED</div>
                    <div class="text-sm font-semibold">1926 (99 Years)</div>
                  </div>
                  <div>
                    <div class="text-xs text-outline mb-1 font-bold">CONTACT</div>
                    <div class="text-sm font-semibold underline text-primary">travel@highlanders.co.zw</div>
                  </div>
                </div>
              </section>

              <section class="rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
                <div class="mb-6 flex items-start justify-between gap-4">
                  <h2 class="text-xl font-bold text-primary flex items-center gap-3">
                    <span class="w-1 bg-secondary h-6 rounded-full" />
                    Trip Details
                  </h2>
                </div>
                <div class="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:gap-12">
                  <div class="flex gap-4 min-w-0">
                    <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                      <span class="material-symbols-outlined text-3xl">flight_takeoff</span>
                    </div>
                    <div>
                      <div class="text-[10px] text-outline font-extrabold tracking-widest">SCHEDULE</div>
                      <div class="text-sm font-bold">08 Mar - 14 Mar 2025</div>
                      <div class="text-xs text-on-surface-variant italic">Duration: 6 Days</div>
                    </div>
                  </div>
                  <div class="flex gap-4 min-w-0">
                    <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                      <span class="material-symbols-outlined text-3xl">groups</span>
                    </div>
                    <div>
                      <div class="text-[10px] text-outline font-extrabold tracking-widest">DELEGATION</div>
                      <div class="text-sm font-bold">28 Personnel</div>
                      <div class="text-xs text-on-surface-variant">22 Players, 6 Officials</div>
                    </div>
                  </div>
                  <div class="flex gap-4 min-w-0">
                    <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                      <span class="material-symbols-outlined text-3xl">location_on</span>
                    </div>
                    <div>
                      <div class="text-[10px] text-outline font-extrabold tracking-widest">DESTINATION</div>
                      <div class="text-sm font-bold">Gaborone</div>
                      <div class="text-xs text-on-surface-variant">Club Representation</div>
                    </div>
                  </div>
                </div>
              </section>

              <section class="rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
                <div class="mb-4 flex items-start justify-between gap-4">
                  <h2 class="text-xl font-bold text-primary flex items-center gap-3">
                    <span class="w-1 bg-secondary h-6 rounded-full" />
                    Players &amp; Officials
                  </h2>
                </div>

                <div class="space-y-2 mb-6">
                  <div class="bg-primary-fixed/30 border-l-4 border-primary px-4 py-2 rounded flex items-start gap-3 text-xs font-medium">
                    <span class="material-symbols-outlined text-primary text-sm">verified</span>
                    Delegation manifest verified and matched against supporting documents.
                  </div>
                  <div
                    class={`border-l-4 px-4 py-2 rounded flex items-start gap-3 text-xs font-medium ${
                      isRejected
                        ? "bg-error-container/40 border-error text-on-error-container"
                        : "bg-surface-container-low border-outline-variant text-on-surface-variant"
                    }`}
                  >
                    <span class={`material-symbols-outlined text-sm ${isRejected ? "text-error" : "text-primary"}`}>
                      {isRejected ? "gpp_bad" : "task_alt"}
                    </span>
                    {isRejected
                      ? "Immigration objection was recorded against 1 traveler profile during final review."
                      : "All traveler checks cleared before final approval was recorded."}
                  </div>
                </div>

                <div class="overflow-x-auto border-none">
                  <table class="min-w-[640px] w-full text-left">
                    <thead>
                      <tr class="text-[10px] text-outline font-bold tracking-widest border-b border-surface-container">
                        <th class="pb-3 px-2">NAME</th>
                        <th class="pb-3">DOB</th>
                        <th class="pb-3">PASSPORT #</th>
                        <th class="pb-3">ROLE</th>
                        <th class="pb-3 text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody class="text-sm">
                      <tr class="border-b border-surface-container-low hover:bg-surface-container-low transition-colors">
                        <td class="py-4 px-2 font-bold">Marvelous Nakamba</td>
                        <td class="py-4">19 Jan 1994</td>
                        <td class="py-4 font-mono">ZW811004</td>
                        <td class="py-4">Captain / Midfielder</td>
                        <td class="py-4 text-right">
                          <span class="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded font-bold uppercase">
                            Cleared
                          </span>
                        </td>
                      </tr>
                      <tr class="border-b border-surface-container-low hover:bg-surface-container-low transition-colors">
                        <td class="py-4 px-2 font-bold">Ariel Sibanda</td>
                        <td class="py-4">29 Jan 1990</td>
                        <td class="py-4 font-mono">ZW772001</td>
                        <td class="py-4">Goalkeeper</td>
                        <td class="py-4 text-right">
                          <span class="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded font-bold uppercase">
                            Cleared
                          </span>
                        </td>
                      </tr>
                      <tr class="border-b border-surface-container-low hover:bg-surface-container-low transition-colors">
                        <td class="py-4 px-2 font-bold">Baltemar Brito</td>
                        <td class="py-4">15 Jan 1957</td>
                        <td class="py-4 font-mono">ZW551778</td>
                        <td class="py-4">Head Coach</td>
                        <td class="py-4 text-right">
                          <span
                            class={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                              isRejected ? "bg-error-container text-on-error-container" : "bg-primary/10 text-primary"
                            }`}
                          >
                            {isRejected ? "Flagged" : "Cleared"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section class="rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
                <h2 class="text-xl font-bold text-primary mb-6 flex items-center gap-3">
                  <span class="w-1 bg-secondary h-6 rounded-full" />
                  Verification Documents
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div class="p-4 rounded-xl border border-surface-container-high">
                    <div class="aspect-video bg-surface-container rounded-lg mb-4 overflow-hidden">
                      <img
                        class="w-full h-full object-cover"
                        alt="Official government team list document preview"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNz9QDgpQf9vGvUT6UM-nkFBVlW-s7fDXK5df_q7CBLVUCPBkEQMOaqBbu-ykOrJ6S8ukq-qsnO2oJ9XKwsBLVGfqplTvSLQRR9bJ8TUkkkENbGC4yfF4W7jRhVMxgqUWCkGu3KcGS-1fDjumlHgAgPjWjLCcg7svjI4yQOGIvhsqYxWiNV2JSHKVDLUTd4qYA16pYqJWIW0Q68t2v2E-kgzdhjeWp_vobcT_fvPKzcS-V_9x5pgyHujxhNtUirEHwgXo-nQ0EnYk"
                      />
                    </div>
                    <div class="text-sm font-bold mb-1">Official Team List</div>
                    <div class="text-[10px] text-outline mb-4">PDF • 2.4 MB</div>
                    <div class="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">
                      <span class="material-symbols-outlined text-sm">check_circle</span>
                      Accepted
                    </div>
                  </div>

                  <div class="p-4 rounded-xl border border-surface-container-high">
                    <div class="aspect-video bg-surface-container rounded-lg mb-4 overflow-hidden">
                      <img
                        class="w-full h-full object-cover"
                        alt="Invitation letter from sports body preview"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQ0ytgAnR2LeP3vIHTYK5csRhYQAQ32e04cvcnCU5Fe3oTAXvNywWUYn4cCV1WfGHzVmz044HMytYNAk15WgDHEmpw_fQCKjA9uzwG2hNu4qd7MxqXJUxXYGJAIOOYKkna5Fnt-0POmoiXDOvt19ULVPeSCkb8OVjbYSu19qyMKr-WxMg6vArOAKU4CiRlhvqVYYTFxG8O0bjzr_369a7bA01UP8m_1H64GVYb5W7bR3n7sxEbgbTx-AsKjBxiL0DH7LPhIQ_gLVE"
                      />
                    </div>
                    <div class="text-sm font-bold mb-1">Invitation Letter</div>
                    <div class="text-[10px] text-outline mb-4">JPG • 1.1 MB</div>
                    <div class="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">
                      <span class="material-symbols-outlined text-sm">check_circle</span>
                      Accepted
                    </div>
                  </div>

                  <div class="p-4 rounded-xl border border-surface-container-high">
                    <div class="aspect-video bg-surface-container rounded-lg mb-4 overflow-hidden">
                      <img
                        class="w-full h-full object-cover"
                        alt="Passport scans batch document preview"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIaXXp6B4bNjLxOwaLp_kSsj4sYaEn5Vzx_YW5rIQxO8SGU2gtURpnldraHP0QQgkbeHJ4fJ2lTH2_U0WeLRQ9Yy_oLMhkL9ILiaY33uJGhxy0X4e8ywVEjNYjDrqnRFN6hy5UMcCHSf9x4Zx_qpaTYDZ7jVKRrHWeKgy5om9kxMlFC0ovMTogdlMsgxWQBFwbrA996otrDbJItky09_M2lH-2uN9S0g-QTX5mXKSofQQAd47GNknzEqEQEwMjflUDhptuMOJ2Qzs"
                      />
                    </div>
                    <div class="text-sm font-bold mb-1">Passports (Batch)</div>
                    <div class="text-[10px] text-outline mb-4">PDF • 18.5 MB</div>
                    <div
                      class={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold ${
                        isRejected
                          ? "bg-error-container text-on-error-container"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <span class="material-symbols-outlined text-sm">{isRejected ? "gpp_bad" : "check_circle"}</span>
                      {isRejected ? "Raised in final review" : "Accepted"}
                    </div>
                  </div>
                </div>
              </section>

              <section class="rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
                <h2 class="text-xl font-bold text-primary mb-6 flex items-center gap-3">
                  <span class="w-1 bg-secondary h-6 rounded-full" />
                  Correspondence History
                </h2>
                <div class="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-outline-variant">
                  <div class="relative pl-10">
                    <div class="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center ring-4 ring-white">
                      <span class="material-symbols-outlined text-white text-[14px]">task_alt</span>
                    </div>
                    <div class="text-xs font-bold text-primary mb-1">SRC REVIEWER • 13 Feb 2025, 10:05 AM</div>
                    <div class="bg-surface-container-low p-3 rounded-lg text-sm text-on-surface">
                      Final verification review completed and archived for audit reference.
                    </div>
                  </div>
                  <div class="relative pl-10">
                    <div
                      class={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${
                        isRejected ? "bg-error" : "bg-secondary"
                      }`}
                    >
                      <span class="material-symbols-outlined text-white text-[14px]">
                        {isRejected ? "cancel" : "check_circle"}
                      </span>
                    </div>
                    <div class={`text-xs font-bold mb-1 ${isRejected ? "text-error" : "text-secondary"}`}>
                      FINAL DECISION • 14 Feb 2025, 08:40 AM
                    </div>
                    <div class="bg-surface-container-high/50 p-3 rounded-lg text-sm text-on-surface">
                      {isRejected
                        ? "Application was rejected after final governance review flagged an unresolved documentation conflict."
                        : "Application was approved after all required supporting documents and external checks were completed."}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div class="lg:col-span-4">
              <div class="rounded-2xl bg-[#002b14] p-5 text-white shadow-xl sm:p-8">
                <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
                  <span class="material-symbols-outlined text-secondary">history</span>
                  Final Determination
                </h3>
                <div
                  class={`rounded-2xl p-5 border mb-6 ${
                    isRejected ? "bg-error/10 border-error/40" : "bg-white/5 border-white/10"
                  }`}
                >
                  <div class="text-[10px] font-bold tracking-widest text-secondary/80 mb-2">RECORDED DECISION</div>
                  <div class="flex items-center gap-3">
                    <span
                      class={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                        isRejected
                          ? "bg-error-container text-on-error-container"
                          : "bg-primary-fixed text-on-primary-fixed-variant"
                      }`}
                    >
                      <span class="material-symbols-outlined text-sm">{isRejected ? "cancel" : "verified"}</span>
                      {isRejected ? "Rejected" : "Approved"}
                    </span>
                    <span class="text-xs text-white/60">14 Feb 2025 • SRC-ADMIN-04</span>
                  </div>
                </div>

                <div class="space-y-4 mb-8">
                  <div>
                    <span class="text-[10px] font-bold tracking-widest text-secondary/80">OFFICIAL SUMMARY</span>
                    <div class="mt-2 rounded-xl bg-white/5 border border-white/10 p-4 text-sm leading-relaxed text-white/80">
                      {isRejected
                        ? "Travel authorization was declined pending resolution of a documentation discrepancy attached to the delegation dossier."
                        : "Travel authorization was cleared after all regulatory checks returned satisfactory results and payment confirmation was validated."}
                    </div>
                  </div>

                  <div>
                    <span class="text-[10px] font-bold tracking-widest text-secondary/80">AUDIT NOTES</span>
                    <div class="mt-2 rounded-xl bg-white/5 border border-white/10 p-4 text-sm leading-relaxed text-white/60">
                      This historical record is read-only. Any follow-up action should be logged as a new review or
                      audit event.
                    </div>
                  </div>
                </div>

                <button
                  class="w-full bg-secondary-container text-on-secondary-container py-4 rounded-xl font-extrabold tracking-tight hover:shadow-[0_0_20px_rgba(253,208,0,0.4)] transition-all"
                  type="button"
                >
                  DOWNLOAD DECISION RECORD
                </button>
                <div class="mt-6 flex items-center gap-2 text-[10px] text-white/40 justify-center">
                  <span class="material-symbols-outlined text-xs">lock</span>
                  Historical entries are locked after archival
                </div>
              </div>

              <div class="mt-6 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 sm:p-6">
                <div class="text-xs font-bold text-primary mb-2">QUICK ACTIONS</div>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    class="flex items-center justify-center gap-2 py-2 bg-white rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                    type="button"
                  >
                    <span class="material-symbols-outlined text-sm">print</span> Print Dossier
                  </button>
                  <button
                    class="flex items-center justify-center gap-2 py-2 bg-white rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                    type="button"
                  >
                    <span class="material-symbols-outlined text-sm">summarize</span> Audit Summary
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Historical Application Review",
};
