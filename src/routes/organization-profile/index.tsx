import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <div class="min-h-screen flex flex-col bg-background text-on-background font-body">
      {/* TopNavBar */}
      <nav class="fixed top-0 w-full z-50 bg-primary/95 backdrop-blur-xl shadow-[0_40px_60px_-15px_rgba(25,28,27,0.06)] flex justify-between items-center px-8 py-4 max-w-none w-full">
        <div class="text-xl font-extrabold tracking-tighter text-white uppercase font-headline">
          Zim Sports Travel Authority
        </div>

        <div class="flex items-center gap-4">
          <button class="text-[#725c00] font-headline tracking-tight font-bold hover:bg-white/5 px-4 py-2 transition-all duration-300 rounded">
            Sign In
          </button>
          <button class="bg-secondary-container text-on-secondary-container px-6 py-2 rounded-md font-headline tracking-tight font-bold shadow-sm scale-95 active:scale-90 transition-transform">
            Register
          </button>
        </div>
      </nav>

      <main class="flex-grow pt-24 pb-20 px-4 md:px-0">
        <div class="max-w-5xl mx-auto">
          {/* Hero Header Section */}
          <div class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div class="max-w-2xl">
              <h1 class="text-4xl md:text-5xl font-extrabold font-headline text-primary tracking-tight mb-4">
                Complete Your Organization Profile
              </h1>
              <p class="text-on-surface-variant text-lg leading-relaxed">
                Ensure your registration data is accurate. This information is required for mandatory travel
                clearances and compliance verification by ZIFA and the Sports and Recreation Commission (SRC).
              </p>
            </div>
            <div class="flex items-center gap-3 bg-surface-container-low p-4 rounded-xl border-l-4 border-secondary">
              <span class="material-symbols-outlined text-secondary text-3xl">verified_user</span>
              <div>
                <p class="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Status</p>
                <p class="text-sm font-semibold text-primary">Pending Verification</p>
              </div>
            </div>
          </div>

          <form class="space-y-8" preventdefault:submit>
            {/* Section 1: Core Identification (Bento Layout) */}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="md:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15">
                <h3 class="font-headline font-bold text-xl text-primary mb-6 flex items-center gap-2">
                  <span class="material-symbols-outlined">corporate_fare</span> Core Identification
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Organization Name
                    </label>
                    <input
                      class="w-full bg-surface-container-low border-0 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30 rounded-lg p-3 text-on-surface"
                      placeholder="e.g. Dynamos FC or Heritage School"
                      type="text"
                    />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Organization Type
                    </label>
                    <select class="w-full bg-surface-container-low border-0 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30 rounded-lg p-3 text-on-surface appearance-none">
                      <option>Football Club</option>
                      <option>Football Academy</option>
                      <option>High School</option>
                      <option>Primary School</option>
                      <option>College/University</option>
                    </select>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Establishment Date
                    </label>
                    <input
                      class="w-full bg-surface-container-low border-0 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30 rounded-lg p-3 text-on-surface"
                      type="date"
                    />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Affiliation / Reg Number
                    </label>
                    <input
                      class="w-full bg-surface-container-low border-0 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30 rounded-lg p-3 text-on-surface"
                      placeholder="ZIFA-XXXX or Min-EDU-XXXX"
                      type="text"
                    />
                  </div>
                </div>
              </div>

              {/* Location Sidebar */}
              <div class="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15 flex flex-col">
                <h3 class="font-headline font-bold text-xl text-primary mb-6 flex items-center gap-2">
                  <span class="material-symbols-outlined">location_on</span> Logistics Base
                </h3>
                <div class="space-y-5">
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Street Address
                    </label>
                    <textarea
                      class="w-full bg-surface-container-low border-0 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30 rounded-lg p-3 text-on-surface text-sm"
                      placeholder="123 Samora Machel Ave"
                      rows={2}
                    />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Province
                    </label>
                    <select class="w-full bg-surface-container-low border-0 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30 rounded-lg p-3 text-on-surface text-sm appearance-none">
                      <option>Harare</option>
                      <option>Bulawayo</option>
                      <option>Manicaland</option>
                      <option>Mashonaland Central</option>
                      <option>Mashonaland East</option>
                      <option>Mashonaland West</option>
                      <option>Masvingo</option>
                      <option>Matabeleland North</option>
                      <option>Matabeleland South</option>
                      <option>Midlands</option>
                    </select>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Website (Optional)
                    </label>
                    <input
                      class="w-full bg-surface-container-low border-0 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30 rounded-lg p-3 text-on-surface text-sm"
                      placeholder="https://"
                      type="url"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Contact Persons */}
            <div class="bg-surface-container-low p-8 rounded-xl">
              <h3 class="font-headline font-bold text-2xl text-primary mb-8 border-b border-outline-variant pb-4">
                Key Personnel &amp; Contacts
              </h3>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Primary Contact */}
                <div class="space-y-6">
                  <div class="flex items-center gap-3 mb-2">
                    <div class="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-fixed text-xs font-bold">
                      01
                    </div>
                    <span class="font-headline font-bold text-primary">Primary Administrator</span>
                  </div>

                  <div class="grid grid-cols-1 gap-4">
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Full Legal Name
                      </label>
                      <input
                        class="w-full bg-surface-container-lowest border-0 rounded-lg p-3 shadow-sm"
                        type="text"
                      />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          Role/Title
                        </label>
                        <input
                          class="w-full bg-surface-container-lowest border-0 rounded-lg p-3 shadow-sm"
                          placeholder="Secretary General"
                          type="text"
                        />
                      </div>
                      <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          Mobile Number
                        </label>
                        <input
                          class="w-full bg-surface-container-lowest border-0 rounded-lg p-3 shadow-sm"
                          placeholder="+263..."
                          type="tel"
                        />
                      </div>
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Official Email Address
                      </label>
                      <input
                        class="w-full bg-surface-container-lowest border-0 rounded-lg p-3 shadow-sm"
                        type="email"
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Contact */}
                <div class="space-y-6">
                  <div class="flex items-center gap-3 mb-2">
                    <div class="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center text-primary text-xs font-bold">
                      02
                    </div>
                    <span class="font-headline font-bold text-primary">Emergency Travel Contact</span>
                  </div>

                  <div class="p-6 bg-surface-container-high rounded-xl border border-dashed border-outline-variant">
                    <div class="flex flex-col gap-4">
                      <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          Full Legal Name
                        </label>
                        <input
                          class="w-full bg-surface-container-lowest border-0 rounded-lg p-3 shadow-sm"
                          type="text"
                        />
                      </div>
                      <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          Mobile (Mandatory for Emergencies)
                        </label>
                        <input
                          class="w-full bg-surface-container-lowest border-0 rounded-lg p-3 shadow-sm"
                          placeholder="+263..."
                          type="tel"
                        />
                      </div>
                      <div class="pt-4">
                        <p class="text-xs text-on-surface-variant italic">
                          This contact must be reachable 24/7 during any international travel authorization periods.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Specialized Status (Glass Card Style) */}
            <div class="relative group">
              <div class="absolute inset-0 bg-secondary/5 rounded-2xl blur-xl group-hover:bg-secondary/10 transition-all" />
              <div class="relative bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/30 p-8 rounded-2xl">
                <div class="flex flex-col md:flex-row gap-10">
                  {/* Left Side: Club Specifics */}
                  <div class="flex-1 space-y-6">
                    <h4 class="font-headline font-bold text-lg text-primary flex items-center gap-2">
                      <span class="material-symbols-outlined text-secondary">sports_soccer</span> For Professional Clubs
                    </h4>
                    <div class="grid grid-cols-1 gap-4">
                      <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          Division / League
                        </label>
                        <input
                          class="w-full bg-surface-container-low border-0 rounded-lg p-3"
                          placeholder="e.g. Castle Lager Premier League"
                          type="text"
                        />
                      </div>

                      <div class="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                        <label class="text-sm font-semibold text-primary">ZIFA Registration Active?</label>
                        <div class="flex gap-4">
                          <label class="inline-flex items-center cursor-pointer">
                            <input class="text-primary focus:ring-primary h-4 w-4" name="zifa_reg" type="radio" />
                            <span class="ml-2 text-sm">Yes</span>
                          </label>
                          <label class="inline-flex items-center cursor-pointer">
                            <input class="text-primary focus:ring-primary h-4 w-4" name="zifa_reg" type="radio" />
                            <span class="ml-2 text-sm">No</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: School Specifics */}
                  <div class="flex-1 space-y-6">
                    <h4 class="font-headline font-bold text-lg text-primary flex items-center gap-2">
                      <span class="material-symbols-outlined text-secondary">school</span> For Educational Institutions
                    </h4>
                    <div class="grid grid-cols-1 gap-4">
                      <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          Principal / Headmaster Name
                        </label>
                        <input
                          class="w-full bg-surface-container-low border-0 rounded-lg p-3"
                          type="text"
                        />
                      </div>

                      <div class="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                        <label class="text-sm font-semibold text-primary">Sport in Official Program?</label>
                        <div class="flex gap-4">
                          <label class="inline-flex items-center cursor-pointer">
                            <input
                              class="text-primary focus:ring-primary h-4 w-4"
                              name="edu_program"
                              type="radio"
                            />
                            <span class="ml-2 text-sm">Yes</span>
                          </label>
                          <label class="inline-flex items-center cursor-pointer">
                            <input
                              class="text-primary focus:ring-primary h-4 w-4"
                              name="edu_program"
                              type="radio"
                            />
                            <span class="ml-2 text-sm">No</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Action */}
            <div class="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-outline-variant">
              <div class="flex items-start gap-3 max-w-md">
                <input class="mt-1 rounded border-outline text-primary focus:ring-primary" type="checkbox" />
                <p class="text-xs text-on-surface-variant leading-tight">
                  I certify that the information provided is true and accurate according to the Constitution of the
                  Zimbabwe Football Association and the statutes of the SRC.
                </p>
              </div>
              <div class="flex gap-4 w-full md:w-auto">
                <button
                  class="flex-1 md:flex-none px-8 py-4 text-on-surface font-bold uppercase tracking-widest text-sm hover:underline decoration-secondary underline-offset-4"
                  type="button"
                >
                  Save Draft
                </button>
                <button
                  class="flex-1 md:flex-none px-12 py-4 bg-primary text-white font-headline font-extrabold rounded-lg shadow-lg hover:translate-y-[-2px] transition-all active:scale-95"
                  type="submit"
                >
                  Complete Registration
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer class="bg-[#191c1b] dark:bg-black w-full mt-auto flex flex-col md:flex-row justify-between items-center px-12 py-10 border-t border-white/5">
        <div class="font-['Manrope'] font-black text-emerald-50 mb-6 md:mb-0">
          Zim Sports Travel Authority
        </div>
        <div class="flex flex-wrap justify-center gap-8 mb-6 md:mb-0">
          <a
            class="text-gray-400 hover:text-emerald-200 font-['Inter'] text-sm uppercase tracking-widest transition-opacity duration-200 hover:underline decoration-[#725c00] underline-offset-4"
            href="#"
          >
            Privacy Policy
          </a>
          <a
            class="text-gray-400 hover:text-emerald-200 font-['Inter'] text-sm uppercase tracking-widest transition-opacity duration-200 hover:underline decoration-[#725c00] underline-offset-4"
            href="#"
          >
            Terms of Service
          </a>
          <a
            class="text-gray-400 hover:text-emerald-200 font-['Inter'] text-sm uppercase tracking-widest transition-opacity duration-200 hover:underline decoration-[#725c00] underline-offset-4"
            href="#"
          >
            Consular Services
          </a>
          <a
            class="text-gray-400 hover:text-emerald-200 font-['Inter'] text-sm uppercase tracking-widest transition-opacity duration-200 hover:underline decoration-[#725c00] underline-offset-4"
            href="#"
          >
            Contact
          </a>
        </div>
        <div class="text-gray-400 font-['Inter'] text-[10px] uppercase tracking-widest">
          © 2026 Soxfort Solutions
        </div>
      </footer>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Organization Profile Setup",
};

