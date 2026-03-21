import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { ApproverPortalNav } from "~/components/approver-portal-nav";

export default component$(() => {
  const location = useLocation();
  const applicationRef = location.url.searchParams.get("ref") ?? "ZTA-2025-0042";

  return (
    <div class="bg-background text-on-background min-h-screen">
      <ApproverPortalNav activeItem="pendingQueue" title="Official Approver Portal - ZIFA Queue" />

      <main class="min-h-screen">
        <div class="pt-24 px-4 pb-8 sm:px-6 sm:pb-12 lg:px-8">
          <header class="mb-6 rounded-xl bg-white/80 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.04)] backdrop-blur-md sm:mb-10 sm:p-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-secondary font-bold text-xs tracking-widest uppercase">
                    Application Reference
                  </span>
                  <span class="bg-surface-container-highest px-2 py-0.5 rounded text-[10px] font-bold">
                    3 DAYS IN QUEUE
                  </span>
                </div>
                <h1 class="break-words text-2xl font-extrabold tracking-tight text-primary sm:text-4xl">
                  {applicationRef}
                </h1>
                <div class="flex items-center gap-4 mt-2 flex-wrap">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-secondary text-sm">sports_soccer</span>
                    <span class="font-bold text-lg">Dynamos FC</span>
                  </div>
                  <span class="hidden text-outline sm:inline">|</span>
                  <div class="text-on-surface-variant font-medium">
                    AFCON Qualification (Tournament) • South Africa
                  </div>
                </div>
              </div>

              <div class="w-full md:w-auto md:text-right">
                <div class="mb-4 flex flex-wrap gap-2 md:justify-end">
                  <div class="flex items-center gap-1.5 bg-primary-fixed px-3 py-1 rounded-full text-[10px] font-bold text-on-primary-fixed-variant">
                    <span class="material-symbols-outlined text-[14px]">check_circle</span> ZIFA: APPROVED
                  </div>
                  <div class="flex items-center gap-1.5 bg-secondary-fixed px-3 py-1 rounded-full text-[10px] font-bold text-on-secondary-fixed-variant">
                    <span class="material-symbols-outlined text-[14px]">pending</span> SRC: UNDER REVIEW
                  </div>
                  <div class="flex items-center gap-1.5 bg-surface-container-highest px-3 py-1 rounded-full text-[10px] font-bold text-on-surface-variant">
                    <span class="material-symbols-outlined text-[14px]">hourglass_empty</span> IMMIGRATION:
                    PENDING
                  </div>
                </div>
                <div class="inline-block w-full rounded-xl bg-surface-container px-4 py-2 text-xs font-medium text-on-surface-variant md:w-auto">
                  Payment: <span class="text-primary font-bold">Confirmed (Receipt #88219)</span> • $450.00 • 10
                  Feb 2025
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
                  <span class="material-symbols-outlined text-outline cursor-pointer hover:text-primary transition-colors">
                    expand_less
                  </span>
                </div>
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 md:gap-y-6 md:gap-x-12">
                  <div>
                    <div class="text-xs text-outline mb-1 font-bold">ORGANIZATION NAME</div>
                    <div class="text-sm font-semibold">Dynamos Football Club</div>
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
                    <div class="text-sm font-semibold">#4492-Z (Registered)</div>
                  </div>
                  <div>
                    <div class="text-xs text-outline mb-1 font-bold">ESTABLISHED</div>
                    <div class="text-sm font-semibold">1963 (62 Years)</div>
                  </div>
                  <div>
                    <div class="text-xs text-outline mb-1 font-bold">CONTACT</div>
                    <div class="text-sm font-semibold underline text-primary">admin@dynamos.co.zw</div>
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
                      <div class="text-sm font-bold">12 Mar - 20 Mar 2025</div>
                      <div class="text-xs text-on-surface-variant italic">Duration: 8 Days</div>
                    </div>
                  </div>
                  <div class="flex gap-4 min-w-0">
                    <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                      <span class="material-symbols-outlined text-3xl">groups</span>
                    </div>
                    <div>
                      <div class="text-[10px] text-outline font-extrabold tracking-widest">DELEGATION</div>
                      <div class="text-sm font-bold">30 Personnel</div>
                      <div class="text-xs text-on-surface-variant">23 Players, 7 Officials</div>
                    </div>
                  </div>
                  <div class="flex gap-4 min-w-0">
                    <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                      <span class="material-symbols-outlined text-3xl">location_on</span>
                    </div>
                    <div>
                      <div class="text-[10px] text-outline font-extrabold tracking-widest">DESTINATION</div>
                      <div class="text-sm font-bold">OR Tambo (JNB)</div>
                      <div class="text-xs text-on-surface-variant">National Representation</div>
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
                    Player count matches uploaded list (23/23 confirmed)
                  </div>
                  <div class="bg-error-container/30 border-l-4 border-error px-4 py-2 rounded flex items-start gap-3 text-xs font-medium text-on-error-container">
                    <span class="material-symbols-outlined text-error text-sm">warning</span>
                    Warning: 1 player flagged for age verification (U17 category - Passport: ZW220194)
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
                        <td class="py-4 px-2 font-bold">Denver Mukamba</td>
                        <td class="py-4">12 Oct 1992</td>
                        <td class="py-4 font-mono">ZW900122</td>
                        <td class="py-4">Captain / Forward</td>
                        <td class="py-4 text-right">
                          <span class="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded font-bold uppercase">
                            Cleared
                          </span>
                        </td>
                      </tr>
                      <tr class="border-b border-surface-container-low hover:bg-surface-container-low transition-colors">
                        <td class="py-4 px-2 font-bold">K. Musona (Jr)</td>
                        <td class="py-4">05 Jan 2008</td>
                        <td class="py-4 font-mono">ZW220194</td>
                        <td class="py-4">Midfielder</td>
                        <td class="py-4 text-right">
                          <span class="bg-tertiary-container text-on-tertiary-container text-[10px] px-2 py-1 rounded font-bold uppercase">
                            Flagged
                          </span>
                        </td>
                      </tr>
                      <tr class="border-b border-surface-container-low hover:bg-surface-container-low transition-colors">
                        <td class="py-4 px-2 font-bold">Lloyd Chigowe</td>
                        <td class="py-4">22 Mar 1964</td>
                        <td class="py-4 font-mono">ZW449010</td>
                        <td class="py-4">Head Coach</td>
                        <td class="py-4 text-right">
                          <span class="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded font-bold uppercase">
                            Cleared
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
                  <div class="p-4 rounded-xl border border-surface-container-high hover:border-secondary transition-all group">
                    <div class="aspect-video bg-surface-container rounded-lg mb-4 overflow-hidden relative">
                      <img
                        class="w-full h-full object-cover"
                        alt="Official government team list document preview"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNz9QDgpQf9vGvUT6UM-nkFBVlW-s7fDXK5df_q7CBLVUCPBkEQMOaqBbu-ykOrJ6S8ukq-qsnO2oJ9XKwsBLVGfqplTvSLQRR9bJ8TUkkkENbGC4yfF4W7jRhVMxgqUWCkGu3KcGS-1fDjumlHgAgPjWjLCcg7svjI4yQOGIvhsqYxWiNV2JSHKVDLUTd4qYA16pYqJWIW0Q68t2v2E-kgzdhjeWp_vobcT_fvPKzcS-V_9x5pgyHujxhNtUirEHwgXo-nQ0EnYk"
                      />
                      <div class="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span class="material-symbols-outlined text-white text-3xl">zoom_in</span>
                      </div>
                    </div>
                    <div class="text-sm font-bold mb-1">Official Team List</div>
                    <div class="text-[10px] text-outline mb-4">PDF • 2.4 MB</div>
                    <select class="w-full bg-surface-container text-xs border-none rounded-lg focus:ring-secondary py-2">
                      <option selected>Accepted</option>
                      <option>Insufficient</option>
                      <option>Missing</option>
                    </select>
                  </div>

                  <div class="p-4 rounded-xl border border-surface-container-high hover:border-secondary transition-all group">
                    <div class="aspect-video bg-surface-container rounded-lg mb-4 overflow-hidden relative">
                      <img
                        class="w-full h-full object-cover"
                        alt="Invitation letter from sports body preview"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQ0ytgAnR2LeP3vIHTYK5csRhYQAQ32e04cvcnCU5Fe3oTAXvNywWUYn4cCV1WfGHzVmz044HMytYNAk15WgDHEmpw_fQCKjA9uzwG2hNu4qd7MxqXJUxXYGJAIOOYKkna5Fnt-0POmoiXDOvt19ULVPeSCkb8OVjbYSu19qyMKr-WxMg6vArOAKU4CiRlhvqVYYTFxG8O0bjzr_369a7bA01UP8m_1H64GVYb5W7bR3n7sxEbgbTx-AsKjBxiL0DH7LPhIQ_gLVE"
                      />
                      <div class="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span class="material-symbols-outlined text-white text-3xl">zoom_in</span>
                      </div>
                    </div>
                    <div class="text-sm font-bold mb-1">Invitation Letter</div>
                    <div class="text-[10px] text-outline mb-4">JPG • 1.1 MB</div>
                    <select class="w-full bg-surface-container text-xs border-none rounded-lg focus:ring-secondary py-2">
                      <option selected>Accepted</option>
                      <option>Insufficient</option>
                      <option>Missing</option>
                    </select>
                  </div>

                  <div class="p-4 rounded-xl border border-secondary/30 bg-secondary/5 transition-all group">
                    <div class="aspect-video bg-surface-container rounded-lg mb-4 overflow-hidden relative">
                      <img
                        class="w-full h-full object-cover"
                        alt="Passport scans batch document preview"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIaXXp6B4bNjLxOwaLp_kSsj4sYaEn5Vzx_YW5rIQxO8SGU2gtURpnldraHP0QQgkbeHJ4fJ2lTH2_U0WeLRQ9Yy_oLMhkL9ILiaY33uJGhxy0X4e8ywVEjNYjDrqnRFN6hy5UMcCHSf9x4Zx_qpaTYDZ7jVKRrHWeKgy5om9kxMlFC0ovMTogdlMsgxWQBFwbrA996otrDbJItky09_M2lH-2uN9S0g-QTX5mXKSofQQAd47GNknzEqEQEwMjflUDhptuMOJ2Qzs"
                      />
                      <div class="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span class="material-symbols-outlined text-white text-3xl">zoom_in</span>
                      </div>
                    </div>
                    <div class="text-sm font-bold mb-1">Passports (Batch)</div>
                    <div class="text-[10px] text-outline mb-4">PDF • 18.5 MB</div>
                    <select class="w-full bg-surface-container text-xs border-none rounded-lg focus:ring-secondary py-2">
                      <option>Accepted</option>
                      <option selected>Insufficient</option>
                      <option>Missing</option>
                    </select>
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
                      <span class="material-symbols-outlined text-white text-[14px]">send</span>
                    </div>
                    <div class="text-xs font-bold text-primary mb-1">SRC REVIEWER • 11 Feb 2025, 09:12 AM</div>
                    <div class="bg-surface-container-low p-3 rounded-lg text-sm text-on-surface">
                      Requesting clarification on U17 player verification. Please upload birth certificate scan
                      for K. Musona (Jr).
                    </div>
                  </div>
                  <div class="relative pl-10">
                    <div class="absolute left-0 top-1 w-6 h-6 rounded-full bg-secondary flex items-center justify-center ring-4 ring-white">
                      <span class="material-symbols-outlined text-white text-[14px]">account_balance</span>
                    </div>
                    <div class="text-xs font-bold text-secondary mb-1">
                      DYNAMOS FC (APPLICANT) • 11 Feb 2025, 02:45 PM
                    </div>
                    <div class="bg-surface-container-high/50 p-3 rounded-lg text-sm text-on-surface">
                      Birth certificate uploaded as supplementary document. We have also attached a ZIFA
                      age-test confirmation.
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div class="lg:col-span-4">
              <div class="rounded-2xl bg-[#002b14] p-5 text-white shadow-xl sm:p-8">
                <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
                  <span class="material-symbols-outlined text-secondary">gavel</span>
                  Official Decision
                </h3>
                <div class="space-y-4 mb-8">
                  <label class="block">
                    <span class="text-[10px] font-bold tracking-widest text-secondary/80">REVIEWER ACTION</span>
                    <div class="grid grid-cols-1 gap-3 mt-2">
                      <button
                        class="group flex items-start gap-3 rounded-xl border border-white/20 p-4 text-left transition-all hover:bg-white/10"
                        type="button"
                      >
                        <div class="w-5 h-5 rounded-full border-2 border-primary-fixed-dim group-focus:bg-primary-fixed-dim" />
                        <span class="text-sm font-bold">Approve Application</span>
                      </button>
                      <button
                        class="group flex items-start gap-3 rounded-xl border border-white/20 p-4 text-left transition-all hover:bg-white/10"
                        type="button"
                      >
                        <div class="w-5 h-5 rounded-full border-2 border-secondary group-focus:bg-secondary" />
                        <span class="text-sm font-bold">Request More Information</span>
                      </button>
                      <button
                        class="group flex items-start gap-3 rounded-xl border border-white/20 p-4 text-left transition-all hover:bg-error/30"
                        type="button"
                      >
                        <div class="w-5 h-5 rounded-full border-2 border-error group-focus:bg-error" />
                        <span class="text-sm font-bold text-on-tertiary-container">Reject Application</span>
                      </button>
                    </div>
                  </label>
                  <label class="block mt-6">
                    <span class="text-[10px] font-bold tracking-widest text-secondary/80">OFFICIAL COMMENTS</span>
                    <textarea
                      class="mt-2 w-full bg-white/5 border border-white/10 rounded-xl text-sm p-4 focus:ring-secondary focus:border-secondary placeholder-white/20"
                      placeholder="State official reasons for decision..."
                      rows={4}
                    />
                  </label>
                </div>
                <button
                  class="w-full bg-secondary-container text-on-secondary-container py-4 rounded-xl font-extrabold tracking-tight hover:shadow-[0_0_20px_rgba(253,208,0,0.4)] transition-all"
                  type="button"
                >
                  SUBMIT OFFICIAL DECISION
                </button>
                <div class="mt-6 flex items-center gap-2 text-[10px] text-white/40 justify-center">
                  <span class="material-symbols-outlined text-xs">info</span>
                  This action will be logged under ZFTA-ADMIN-04
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
                    <span class="material-symbols-outlined text-sm">mail</span> Contact Rep
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
  title: "Application Processing",
};
