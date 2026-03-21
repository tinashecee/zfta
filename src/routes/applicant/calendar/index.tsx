import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ApplicantPortalNav } from "~/components/applicant-portal-nav";

export default component$(() => {
  return (
    <div class="bg-surface font-body text-on-surface min-h-screen">
      <ApplicantPortalNav activeItem="calendar" />

      <div class="max-w-7xl mx-auto p-8">
        <main class="bg-surface">
          <div class="flex justify-between items-end mb-8 gap-4 flex-wrap">
            <div>
              <h1 class="text-4xl font-extrabold tracking-tight font-headline text-primary">Travel Logistics</h1>
              <p class="text-on-surface-variant font-medium mt-1">
                Institutional Planning Dashboard • March 2025
              </p>
            </div>

            <div class="flex gap-3 flex-wrap">
              <button
                class="px-4 py-2 bg-surface-container-high rounded-xl text-on-surface-variant font-medium flex items-center gap-2"
                type="button"
              >
                <span class="material-symbols-outlined text-lg">filter_list</span>
                Filter View
              </button>
              <button
                class="px-4 py-2 bg-primary text-white rounded-xl font-medium flex items-center gap-2"
                type="button"
              >
                <span class="material-symbols-outlined text-lg">download</span>
                Export PDF
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div class="lg:col-span-8 bg-surface-container-low rounded-xl p-8 shadow-sm">
              <div class="flex items-center justify-between mb-8">
                <h3 class="text-2xl font-bold font-headline">March 2025</h3>
                <div class="flex items-center gap-4">
                  <button class="p-2 hover:bg-surface-container-highest rounded-full transition-colors" type="button">
                    <span class="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button class="font-bold text-primary" type="button">
                    Today
                  </button>
                  <button class="p-2 hover:bg-surface-container-highest rounded-full transition-colors" type="button">
                    <span class="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-7 text-center mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} class="text-xs font-bold text-on-surface-variant uppercase tracking-widest py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div class="grid grid-cols-7 gap-px bg-outline-variant/20 rounded-lg overflow-hidden border border-outline-variant/10">
                <div class="aspect-square bg-surface-container-lowest/50 p-3 opacity-40">23</div>
                <div class="aspect-square bg-surface-container-lowest/50 p-3 opacity-40">24</div>
                <div class="aspect-square bg-surface-container-lowest/50 p-3 opacity-40">25</div>
                <div class="aspect-square bg-surface-container-lowest/50 p-3 opacity-40">26</div>
                <div class="aspect-square bg-surface-container-lowest/50 p-3 opacity-40">27</div>
                <div class="aspect-square bg-surface-container-lowest/50 p-3 opacity-40">28</div>

                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">1</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">2</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">3</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">4</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">5</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">6</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">7</div>

                <div class="aspect-square bg-surface-container-lowest p-2 relative">
                  <span class="font-medium text-on-surface-variant">8</span>
                  <div class="mt-1 bg-primary-fixed text-on-primary-fixed-variant text-[10px] leading-tight p-1.5 rounded-lg border border-on-primary-fixed-variant/10 shadow-sm">
                    <div class="font-bold flex items-center gap-1">
                      <span class="material-symbols-outlined text-[12px]" style="font-variation-settings: 'FILL' 1;">
                        flight_land
                      </span>
                      Return: Botswana
                    </div>
                    <div class="opacity-70 mt-0.5">ZTA-2025-0038</div>
                  </div>
                </div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">9</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">10</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">11</div>

                <div class="aspect-square bg-surface-container-lowest p-2 relative border-2 border-secondary/20">
                  <span class="font-medium text-on-surface">12</span>
                  <div class="mt-1 bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] leading-tight p-1.5 rounded-lg border border-secondary/20 shadow-sm">
                    <div class="font-bold flex items-center gap-1">
                      <span class="material-symbols-outlined text-[12px]" style="font-variation-settings: 'FILL' 1;">
                        flight_takeoff
                      </span>
                      Departure: South Africa
                    </div>
                    <div class="opacity-70 mt-0.5">ZTA-2025-0042</div>
                  </div>
                </div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">13</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">14</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">15</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">16</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">17</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">18</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">19</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">20</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">21</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">22</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">23</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">24</div>

                <div class="aspect-square bg-surface-container-lowest p-2 relative">
                  <span class="font-medium text-on-surface-variant">25</span>
                  <div class="mt-1 bg-tertiary-fixed text-on-tertiary-fixed-variant text-[10px] leading-tight p-1.5 rounded-lg border border-tertiary/10">
                    <div class="font-bold flex items-center gap-1">
                      <span class="material-symbols-outlined text-[12px]">priority_high</span>
                      Submission Date
                    </div>
                    <div class="opacity-70 mt-0.5">World Cup Qualifier</div>
                  </div>
                </div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">26</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">27</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">28</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">29</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">30</div>
                <div class="aspect-square bg-surface-container-lowest p-3 font-medium text-on-surface-variant">31</div>
              </div>
            </div>

            <div class="lg:col-span-4 flex flex-col gap-6">
              <div class="bg-surface-container-lowest rounded-xl shadow-[0_40px_40px_rgba(0,0,0,0.06)] p-6 border border-outline-variant/15">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-xl font-bold font-headline flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">notifications_active</span>
                    Notifications Log
                  </h3>
                  <span class="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">2 NEW</span>
                </div>

                <div class="space-y-4">
                  <div class="group p-4 rounded-xl bg-surface-container-high/50 hover:bg-surface-container-high transition-colors cursor-pointer relative overflow-hidden">
                    <div class="absolute left-0 top-0 bottom-0 w-1 bg-secondary" />
                    <div class="flex justify-between items-start mb-1">
                      <span class="text-xs font-bold text-secondary uppercase tracking-wider">Action Required</span>
                      <span class="text-[10px] text-on-surface-variant">14 mins ago</span>
                    </div>
                    <p class="text-sm font-semibold text-on-surface leading-tight">
                      Verification Incomplete: ZTA-2025-0042
                    </p>
                    <p class="text-xs text-on-surface-variant mt-2">
                      South Africa departure logistics require additional passport verification for 3 staff members.
                    </p>
                    <div class="mt-3 flex gap-2">
                      <button class="text-[11px] font-bold text-primary underline" type="button">
                        Update Now
                      </button>
                      <button class="text-[11px] font-bold text-on-surface-variant opacity-60" type="button">
                        Dismiss
                      </button>
                    </div>
                  </div>

                  <div class="p-4 rounded-xl bg-surface-container-low transition-colors relative">
                    <div class="flex justify-between items-start mb-1">
                      <span class="text-xs font-bold text-on-primary-fixed-variant uppercase tracking-wider">
                        Certificate Ready
                      </span>
                      <span class="text-[10px] text-on-surface-variant">2 hours ago</span>
                    </div>
                    <p class="text-sm font-semibold text-on-surface leading-tight">ZTA-2025-0038 Approved</p>
                    <p class="text-xs text-on-surface-variant mt-2">
                      Official travel authorization for Botswana arrival is now available for download.
                    </p>
                    <button
                      class="mt-3 w-full py-2 bg-primary-fixed text-on-primary-fixed-variant rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                      type="button"
                    >
                      <span class="material-symbols-outlined text-sm">download</span>
                      Download Auth
                    </button>
                  </div>

                  <div class="p-4 rounded-xl bg-surface-container-low transition-colors opacity-70">
                    <div class="flex justify-between items-start mb-1">
                      <span class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        System Update
                      </span>
                      <span class="text-[10px] text-on-surface-variant">Yesterday</span>
                    </div>
                    <p class="text-sm font-semibold text-on-surface leading-tight">New Travel Protocol v4.2</p>
                    <p class="text-xs text-on-surface-variant mt-1">
                      Please review the updated transit guidelines for regional COSAFA countries.
                    </p>
                  </div>
                </div>

                <button
                  class="w-full mt-6 py-3 border border-outline-variant text-on-surface-variant text-sm font-bold rounded-xl hover:bg-surface-container-low transition-colors"
                  type="button"
                >
                  View All History
                </button>
              </div>

              <div class="bg-primary text-white p-6 rounded-xl relative overflow-hidden">
                <div class="absolute -right-10 -bottom-10 opacity-10">
                  <span class="material-symbols-outlined text-[140px]">travel_explore</span>
                </div>
                <h4 class="text-lg font-bold font-headline mb-4">March Snapshot</h4>
                <div class="space-y-4 relative z-10">
                  <div class="flex justify-between items-center border-b border-white/10 pb-2">
                    <span class="text-sm text-white/70">Scheduled Flights</span>
                    <span class="text-xl font-black text-[#fdd000]">02</span>
                  </div>
                  <div class="flex justify-between items-center border-b border-white/10 pb-2">
                    <span class="text-sm text-white/70">Pending Auth</span>
                    <span class="text-xl font-black text-[#fdd000]">01</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-white/70">Active Personnel</span>
                    <span class="text-xl font-black text-[#fdd000]">42</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Travel Calendar",
};
