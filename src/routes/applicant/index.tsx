import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ApplicantPortalNav } from "~/components/applicant-portal-nav";

export default component$(() => {
  return (
    <div class="bg-background font-body text-on-background min-h-screen">
      <ApplicantPortalNav activeItem="applications" />

      <main class="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <header class="mb-12">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div class="space-y-2">
              <span class="text-secondary font-bold tracking-widest uppercase text-xs">Official Portal</span>
              <h1 class="text-4xl md:text-5xl font-extrabold font-headline tracking-tighter text-primary leading-tight">
                New Travel Authorization <br />
                Application
              </h1>
              <p class="text-on-surface-variant max-w-xl text-lg font-light leading-relaxed">
                Complete the form below to initiate the international travel clearance process for national delegations and football squads.
              </p>
            </div>

            <div class="flex items-center gap-3 bg-surface-container-high px-4 py-3 rounded-2xl">
              <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">
                info
              </span>
              <span class="text-sm font-medium text-primary">Applications require 14 days lead time.</span>
            </div>
          </div>
        </header>

        <form class="space-y-12 mb-24">
          {/* Section 1: Event Type Selection (Asymmetric Layout) */}
          <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-4 sticky top-24">
              <h2 class="text-2xl font-bold font-headline text-primary mb-2">Event Nature</h2>
              <p class="text-sm text-on-surface-variant leading-relaxed">
                Select the primary purpose of this international journey. This determines the required supporting documentation.
              </p>
            </div>

            <div class="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <label class="relative flex cursor-pointer rounded-xl border border-outline-variant p-4 hover:bg-surface-container-low transition-colors group has-[:checked]:border-secondary has-[:checked]:bg-secondary/5">
                  <input
                    class="sr-only peer"
                    name="event_type"
                    type="radio"
                    value="tournament"
                    defaultChecked
                  />
                  <div class="flex items-center gap-3">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary peer-checked:bg-secondary peer-checked:text-white transition-colors">
                      <span class="material-symbols-outlined">emoji_events</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-bold font-headline text-primary">Tournament</span>
                      <span class="text-xs text-on-surface-variant">Competitive championships</span>
                    </div>
                  </div>
                </label>

                <label class="relative flex cursor-pointer rounded-xl border border-outline-variant p-4 hover:bg-surface-container-low transition-colors group has-[:checked]:border-secondary has-[:checked]:bg-secondary/5">
                  <input class="sr-only peer" name="event_type" type="radio" value="friendly" />
                  <div class="flex items-center gap-3">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary transition-colors">
                      <span class="material-symbols-outlined">handshake</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-bold font-headline text-primary">Friendly Match</span>
                      <span class="text-xs text-on-surface-variant">Non-competitive fixtures</span>
                    </div>
                  </div>
                </label>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Tournament Category</label>
                  <select class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body">
                    <option>AFCON Qualification</option>
                    <option>COSAFA Cup</option>
                    <option>AFCON</option>
                    <option>World Cup Qualification</option>
                    <option>CAF Champions League</option>
                    <option>Other</option>
                  </select>
                </div>

                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Host Country</label>
                  <input
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                    placeholder="e.g. South Africa"
                    type="text"
                  />
                </div>

                <div class="md:col-span-2 space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Host City / Venue</label>
                  <input
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                    placeholder="Specify city and stadium name"
                    type="text"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Logistics & Delegation */}
          <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-4 sticky top-24">
              <h2 class="text-2xl font-bold font-headline text-primary mb-2">Logistics &amp; Squad</h2>
              <p class="text-sm text-on-surface-variant leading-relaxed">
                Specify the travel timeline, squad size, and team demographics for clearance auditing.
              </p>
            </div>

            <div class="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Departure Date</label>
                  <input
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                    type="date"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Return Date</label>
                  <input
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                    type="date"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Total Players</label>
                  <div class="relative">
                    <input
                      class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                      type="number"
                      defaultValue="23"
                    />
                    <span class="absolute right-4 top-3 text-xs text-on-surface-variant">Athletes</span>
                  </div>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Officials/Staff</label>
                <div class="relative">
                  <input
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                    type="number"
                    defaultValue="7"
                  />
                  <span class="absolute right-4 top-3 text-xs text-on-surface-variant">Tech/Med</span>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-outline-variant/10">
                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Age Group</label>
                  <select class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body">
                    <option>Senior</option>
                    <option>U23</option>
                    <option>U20</option>
                    <option>U17</option>
                  </select>
                </div>

                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Gender</label>
                  <select class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Mixed</option>
                  </select>
                </div>

                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Mode of Travel</label>
                  <select class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body">
                    <option>Air</option>
                    <option>Road</option>
                    <option>Both</option>
                  </select>
                </div>

                <div class="md:col-span-3 space-y-1.5">
                  <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Primary Port of Entry/Exit</label>
                  <input
                    class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                    placeholder="e.g. Robert Gabriel Mugabe Intl / Beitbridge Border"
                    type="text"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Document Upload Center (Bento Grid Style) */}
          <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-4 sticky top-24">
              <h2 class="text-2xl font-bold font-headline text-primary mb-2">Document Center</h2>
              <p class="text-sm text-on-surface-variant leading-relaxed">
                Ensure all uploads are clear, high-resolution scans. Formats: PDF, PNG, or JPG (Max 10MB per file).
              </p>
            </div>

            <div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Required Document Card */}
              <div class="bg-primary-container p-6 rounded-2xl text-on-primary-container border border-white/10 flex flex-col justify-between aspect-video md:aspect-auto">
                <div>
                  <span class="inline-block px-2 py-0.5 rounded-full bg-yellow-500 text-emerald-950 text-[10px] font-bold uppercase tracking-wider mb-4">Required</span>
                  <h3 class="font-headline font-bold text-lg mb-1 text-white">Team / Player List</h3>
                  <p class="text-xs text-emerald-100/70">
                    Official list of all traveling athletes and technical personnel.
                  </p>
                </div>

                <button
                  class="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10 group"
                  type="button"
                >
                  <span class="material-symbols-outlined text-yellow-500 group-hover:scale-110 transition-transform">cloud_upload</span>
                  <span class="text-sm font-bold text-white">Upload List</span>
                </button>
              </div>

              <div class="bg-surface-container-highest p-6 rounded-2xl flex flex-col justify-between border border-outline-variant/30">
                <div>
                  <span class="inline-block px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider mb-4">Required</span>
                  <h3 class="font-headline font-bold text-lg mb-1 text-primary">Invitation Letter</h3>
                  <p class="text-xs text-on-surface-variant">
                    Hosting confirmation from the host country&apos;s FA.
                  </p>
                </div>

                <button
                  class="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-surface-container-lowest hover:bg-white rounded-xl transition-colors border border-outline-variant group"
                  type="button"
                >
                  <span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">attachment</span>
                  <span class="text-sm font-bold text-primary">Select File</span>
                </button>
              </div>

              <div class="bg-surface-container-highest p-6 rounded-2xl flex flex-col justify-between border border-outline-variant/30 md:col-span-2">
                <div class="flex justify-between items-start mb-6">
                  <div>
                    <span class="inline-block px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider mb-2">Required</span>
                    <h3 class="font-headline font-bold text-lg text-primary">Identity Documents</h3>
                    <p class="text-xs text-on-surface-variant">
                      Bulk upload Passport/ID copies for the entire delegation.
                    </p>
                  </div>

                  <div class="flex -space-x-3">
                    <div class="w-8 h-8 rounded-full border-2 border-surface-container-highest bg-emerald-100 flex items-center justify-center">
                      <span class="material-symbols-outlined text-[14px]">person</span>
                    </div>
                    <div class="w-8 h-8 rounded-full border-2 border-surface-container-highest bg-emerald-200 flex items-center justify-center">
                      <span class="material-symbols-outlined text-[14px]">person</span>
                    </div>
                    <div class="w-8 h-8 rounded-full border-2 border-surface-container-highest bg-emerald-300 flex items-center justify-center">
                      <span class="text-[10px] font-bold">+30</span>
                    </div>
                  </div>
                </div>

                <div class="border-2 border-dashed border-outline-variant rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/40 transition-colors cursor-pointer bg-surface-container-low/50">
                  <span class="material-symbols-outlined text-4xl text-outline mb-2">drive_folder_upload</span>
                  <p class="text-sm font-medium text-primary">Drop delegation folder here or browse</p>
                  <p class="text-[10px] text-on-surface-variant mt-1">Accepts multiple PDF/JPG files</p>
                </div>
              </div>
            </div>
          </section>

          {/* Submit Actions */}
          <footer class="flex flex-col md:flex-row items-center justify-end gap-4 py-12 border-t border-outline-variant/20">
            <button
              class="w-full md:w-auto px-8 py-3 bg-surface-container-highest text-primary font-headline font-bold rounded-xl hover:bg-surface-container-high transition-all active:scale-95"
              type="button"
            >
              Save as Draft
            </button>
            <button
              class="w-full md:w-auto px-12 py-3 bg-gradient-to-r from-primary to-primary-container text-white font-headline font-bold rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2"
              type="submit"
            >
              Submit Application
              <span class="material-symbols-outlined">send</span>
            </button>
          </footer>
        </form>
      </main>

      {/* Footer */}
      <footer class="bg-emerald-950 w-full py-12 px-8">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="text-lg font-bold text-white font-headline">
            Zimbabwe Football Travel Authority
          </div>
          <div class="flex flex-wrap justify-center gap-8 font-body text-sm antialiased">
            <a class="text-emerald-200/60 hover:text-amber-400 transition-colors" href="#">
              Privacy Policy
            </a>
            <a
              class="text-emerald-200/60 hover:text-amber-400 transition-colors"
              href="#"
            >
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

export const head: DocumentHead = {
  title: "Travel Authorization Application",
};

