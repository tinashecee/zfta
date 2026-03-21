import { $, component$, useSignal, useStore, useTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  getCurrentUser,
  signOutMock,
  signUpMock,
  type AuthUser,
} from "~/lib/auth";

export default component$(() => {
  const currentUser = useSignal<AuthUser | null>(null);
  const error = useSignal<string | null>(null);
  const busy = useSignal(false);
  const form = useStore({
    registrationPath: "team",
    organizationName: "",
    organizationType: "Football Club",
    establishmentDate: "",
    affiliationNumber: "",
    streetAddress: "",
    province: "Harare",
    website: "",
    divisionLeague: "",
    zifaRegistrationActive: "",
    principalName: "",
    sportInOfficialProgram: "",
    primaryName: "",
    primaryRole: "",
    primaryMobile: "",
    primaryEmail: "",
    secondaryName: "",
    secondaryMobile: "",
    approverBody: "",
    authorityName: "",
    departmentUnit: "",
    staffId: "",
    supervisorName: "",
    workStation: "",
    approvalScope: "",
    accountEmail: "",
    password: "",
    confirmPassword: "",
    certified: false,
  });

  useTask$(() => {
    currentUser.value = getCurrentUser();
  });

  const onSubmit$ = $(() => {
    error.value = null;
    if (form.registrationPath === "team") {
      if (!form.organizationName.trim()) {
        error.value = "Organization name is required.";
        return;
      }

      if (!form.affiliationNumber.trim()) {
        error.value = "Affiliation or registration number is required.";
        return;
      }

      if (
        !form.primaryName.trim() ||
        !form.primaryRole.trim() ||
        !form.primaryMobile.trim() ||
        !form.primaryEmail.trim()
      ) {
        error.value = "Complete the primary administrator details before registering.";
        return;
      }
    } else {
      if (!form.approverBody) {
        error.value = "Select the approver body before registering.";
        return;
      }

      if (!form.authorityName.trim() || !form.departmentUnit.trim() || !form.staffId.trim()) {
        error.value = "Complete the approver authority details before registering.";
        return;
      }

      if (
        !form.primaryName.trim() ||
        !form.primaryRole.trim() ||
        !form.primaryMobile.trim() ||
        !form.primaryEmail.trim()
      ) {
        error.value = "Complete the approver officer details before registering.";
        return;
      }
    }

    if (!form.accountEmail.trim()) {
      error.value = "Account email is required.";
      return;
    }

    if (form.password !== form.confirmPassword) {
      error.value = "Password confirmation does not match.";
      return;
    }

    if (!form.certified) {
      error.value = "Please certify that the registration information is accurate.";
      return;
    }

    busy.value = true;

    const res = signUpMock({
      email: form.accountEmail,
      password: form.password,
    });

    busy.value = false;

    if (!res.ok) {
      error.value = res.error;
      return;
    }

    signOutMock();
    window.location.assign("/sign-in/?registered=1");
  });

  return (
    <>
      {/* TopNavBar Shell */}
      <header class="fixed top-0 w-full z-50 bg-emerald-950/70 backdrop-blur-xl shadow-2xl shadow-emerald-950/20">
        <nav class="flex justify-between items-center px-8 py-4 max-w-full">
          <div class="text-xl font-bold text-white tracking-tighter font-headline">
            Zimbabwe Football Travel Authority
          </div>

          <div class="flex items-center gap-4">
            <a
              class="text-amber-400 font-semibold border-b-2 border-amber-500 pb-1 font-headline tracking-tight scale-95 active:scale-90 transition-transform"
              href="/sign-in/"
            >
              Sign In
            </a>
            <div class="bg-secondary-container text-on-secondary-container px-5 py-2 rounded-md font-semibold transition-all duration-300 scale-95 active:scale-90 font-headline tracking-tight">
              Register
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main class="flex-grow flex items-center justify-center pt-24 pb-12 px-6 relative overflow-hidden bg-surface-container-low">
        {/* Decorative Background Element */}
        <div class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div class="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] rounded-full bg-secondary/5 blur-[120px]" />

        <div class="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-0 bg-surface-container-lowest rounded-xl overflow-hidden premium-shadow relative z-10">
          {/* Left Side: Editorial Branding */}
          <div class="lg:col-span-5 bg-primary p-12 flex flex-col justify-between text-white relative">
            <div class="absolute inset-0 opacity-10" data-alt="Subtle geometric pattern inspired by Great Zimbabwe ruins">
              <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern height="40" id="grid" patternUnits="userSpaceOnUse" width="40">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-width="1" />
                  </pattern>
                </defs>
                <rect fill="url(#grid)" height="100%" width="100%" />
              </svg>
            </div>

            <div class="relative z-10">
              <span class="text-secondary-fixed font-headline font-bold tracking-widest text-xs uppercase mb-6 block">
                Official Portal
              </span>
              <h1 class="text-4xl lg:text-5xl font-headline font-extrabold tracking-tighter leading-none mb-6">
                The Diplomatic Pitch.
              </h1>
              <p class="text-emerald-50/70 font-body text-lg leading-relaxed max-w-sm">
                Submit your full organization registration at sign-up so the admin team can review and approve
                your account without requesting missing profile details.
              </p>
            </div>

            <div class="relative z-10 mt-12">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                  <span class="material-symbols-outlined text-primary-fixed" style="font-variation-settings: 'FILL' 1;">
                    verified_user
                  </span>
                </div>
                <div>
                  <p class="text-sm font-bold font-headline">Accredited Access</p>
                  <p class="text-xs text-emerald-50/50 font-body">Verified identities only</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Combined Registration Form */}
          <div class="lg:col-span-7 p-8 md:p-12 bg-surface-container-lowest">
            <div class="mb-10">
              <h2 class="text-3xl font-headline font-bold text-on-background tracking-tight">
                Organization Registration
              </h2>
              <p class="text-on-surface-variant mt-2 font-body">
                Complete the organization profile first, then set your account email and password for admin
                review.
              </p>
            </div>

            {currentUser.value ? (
              <section class="rounded-xl bg-surface-container-highest p-5">
                <p class="text-sm text-on-surface-variant">
                  You are already signed in as{" "}
                  <span class="font-bold">{currentUser.value.email}</span>.
                </p>
                <button
                  type="button"
                  class="mt-4 w-full py-4 rounded-xl bg-primary text-white font-bold hover:bg-primary-container disabled:opacity-60"
                  onClick$={() => {
                    signOutMock();
                    window.location.assign("/sign-in/");
                  }}
                >
                  Sign out
                </button>
              </section>
            ) : (
              <form class="space-y-8" preventdefault:submit onSubmit$={onSubmit$}>
                <section class="rounded-xl border border-outline-variant/15 bg-surface-container-low p-6">
                  <h3 class="font-headline text-xl font-bold text-primary">Registration Path</h3>
                  <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label class="flex items-start gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                      <input
                        class="mt-1 text-primary focus:ring-primary"
                        type="radio"
                        name="registration-path"
                        checked={form.registrationPath === "team"}
                        onChange$={() => {
                          form.registrationPath = "team";
                        }}
                      />
                      <div>
                        <p class="font-bold text-primary">Team / Organization Registration</p>
                        <p class="mt-1 text-sm text-on-surface-variant">
                          For football clubs, academies, schools, and other teams requesting access to the system.
                        </p>
                      </div>
                    </label>
                    <label class="flex items-start gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                      <input
                        class="mt-1 text-primary focus:ring-primary"
                        type="radio"
                        name="registration-path"
                        checked={form.registrationPath === "approver"}
                        onChange$={() => {
                          form.registrationPath = "approver";
                        }}
                      />
                      <div>
                        <p class="font-bold text-primary">Approver Registration</p>
                        <p class="mt-1 text-sm text-on-surface-variant">
                          For officers registering under ZIFA, SRC, or Immigration to review and approve workflows.
                        </p>
                      </div>
                    </label>
                  </div>
                </section>

                {form.registrationPath === "team" ? (
                  <>
                    <section class="rounded-xl border border-outline-variant/15 bg-surface-container-low p-6">
                      <h3 class="font-headline text-xl font-bold text-primary">Organization Details</h3>
                      <div class="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div class="md:col-span-2">
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Organization Name
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            placeholder="e.g. Dynamos FC or Heritage School"
                            type="text"
                            value={form.organizationName}
                            onInput$={(event) => {
                              form.organizationName = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Organization Type
                          </label>
                          <select
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            value={form.organizationType}
                            onChange$={(event) => {
                              form.organizationType = (event.target as HTMLSelectElement).value;
                            }}
                          >
                            <option>Football Club</option>
                            <option>Football Academy</option>
                            <option>High School</option>
                            <option>Primary School</option>
                            <option>College/University</option>
                          </select>
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Establishment Date
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            type="date"
                            value={form.establishmentDate}
                            onInput$={(event) => {
                              form.establishmentDate = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Affiliation / Registration Number
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            placeholder="ZIFA-XXXX or Min-EDU-XXXX"
                            type="text"
                            value={form.affiliationNumber}
                            onInput$={(event) => {
                              form.affiliationNumber = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Division / League
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            placeholder="e.g. Premier League or Schools League"
                            type="text"
                            value={form.divisionLeague}
                            onInput$={(event) => {
                              form.divisionLeague = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div class="md:col-span-2">
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Street Address
                          </label>
                          <textarea
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-sm text-on-surface focus:ring-1 focus:ring-primary/30"
                            rows={2}
                            placeholder="123 Samora Machel Ave"
                            value={form.streetAddress}
                            onInput$={(event) => {
                              form.streetAddress = (event.target as HTMLTextAreaElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Province
                          </label>
                          <select
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            value={form.province}
                            onChange$={(event) => {
                              form.province = (event.target as HTMLSelectElement).value;
                            }}
                          >
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
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Website
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            placeholder="https://"
                            type="url"
                            value={form.website}
                            onInput$={(event) => {
                              form.website = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                      </div>
                    </section>

                    <section class="rounded-xl border border-outline-variant/15 bg-surface-container-low p-6">
                      <h3 class="font-headline text-xl font-bold text-primary">Contacts And Status</h3>
                      <div class="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Primary Administrator Name
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            type="text"
                            value={form.primaryName}
                            onInput$={(event) => {
                              form.primaryName = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Primary Role / Title
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            type="text"
                            placeholder="Secretary General"
                            value={form.primaryRole}
                            onInput$={(event) => {
                              form.primaryRole = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Primary Mobile
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            type="tel"
                            placeholder="+263..."
                            value={form.primaryMobile}
                            onInput$={(event) => {
                              form.primaryMobile = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Official Contact Email
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            type="email"
                            value={form.primaryEmail}
                            onInput$={(event) => {
                              form.primaryEmail = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Secondary Contact Name
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            type="text"
                            value={form.secondaryName}
                            onInput$={(event) => {
                              form.secondaryName = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Secondary Mobile
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            type="tel"
                            placeholder="+263..."
                            value={form.secondaryMobile}
                            onInput$={(event) => {
                              form.secondaryMobile = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Principal / Headmaster Name
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            type="text"
                            value={form.principalName}
                            onInput$={(event) => {
                              form.principalName = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Sport In Official Program?
                          </label>
                          <select
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            value={form.sportInOfficialProgram}
                            onChange$={(event) => {
                              form.sportInOfficialProgram = (event.target as HTMLSelectElement).value;
                            }}
                          >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                        <div class="md:col-span-2">
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            ZIFA Registration Active?
                          </label>
                          <select
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            value={form.zifaRegistrationActive}
                            onChange$={(event) => {
                              form.zifaRegistrationActive = (event.target as HTMLSelectElement).value;
                            }}
                          >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                      </div>
                    </section>
                  </>
                ) : (
                  <>
                    <section class="rounded-xl border border-outline-variant/15 bg-surface-container-low p-6">
                      <h3 class="font-headline text-xl font-bold text-primary">Approver Authority Details</h3>
                      <div class="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Approver Body
                          </label>
                          <select
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            value={form.approverBody}
                            onChange$={(event) => {
                              form.approverBody = (event.target as HTMLSelectElement).value;
                            }}
                          >
                            <option value="">Select approver body</option>
                            <option value="ZIFA">ZIFA</option>
                            <option value="SRC">SRC</option>
                            <option value="Immigration">Immigration</option>
                          </select>
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Authority / Institution Name
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            placeholder="e.g. ZIFA Secretariat"
                            type="text"
                            value={form.authorityName}
                            onInput$={(event) => {
                              form.authorityName = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Department / Unit
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            placeholder="Compliance, Registration, Border Control..."
                            type="text"
                            value={form.departmentUnit}
                            onInput$={(event) => {
                              form.departmentUnit = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Staff / Employee ID
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            placeholder="STAFF-0042"
                            type="text"
                            value={form.staffId}
                            onInput$={(event) => {
                              form.staffId = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Work Station / Office
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            placeholder="Harare HQ or Plumtree Border Post"
                            type="text"
                            value={form.workStation}
                            onInput$={(event) => {
                              form.workStation = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Province
                          </label>
                          <select
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            value={form.province}
                            onChange$={(event) => {
                              form.province = (event.target as HTMLSelectElement).value;
                            }}
                          >
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
                        <div class="md:col-span-2">
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Approval Scope
                          </label>
                          <select
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            value={form.approvalScope}
                            onChange$={(event) => {
                              form.approvalScope = (event.target as HTMLSelectElement).value;
                            }}
                          >
                            <option value="">Select approval scope</option>
                            <option value="National team clearances">National team clearances</option>
                            <option value="Club and academy approvals">Club and academy approvals</option>
                            <option value="School and youth approvals">School and youth approvals</option>
                            <option value="Immigration and border clearances">Immigration and border clearances</option>
                          </select>
                        </div>
                      </div>
                    </section>

                    <section class="rounded-xl border border-outline-variant/15 bg-surface-container-low p-6">
                      <h3 class="font-headline text-xl font-bold text-primary">Approver Officer Details</h3>
                      <div class="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Officer Full Name
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            type="text"
                            value={form.primaryName}
                            onInput$={(event) => {
                              form.primaryName = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Position / Title
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            type="text"
                            placeholder="Registration Officer"
                            value={form.primaryRole}
                            onInput$={(event) => {
                              form.primaryRole = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Official Mobile
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            type="tel"
                            placeholder="+263..."
                            value={form.primaryMobile}
                            onInput$={(event) => {
                              form.primaryMobile = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Official Email
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            type="email"
                            value={form.primaryEmail}
                            onInput$={(event) => {
                              form.primaryEmail = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Supervisor Name
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            type="text"
                            value={form.supervisorName}
                            onInput$={(event) => {
                              form.supervisorName = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                        <div>
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Secondary Contact / Desk Line
                          </label>
                          <input
                            class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            type="tel"
                            value={form.secondaryMobile}
                            onInput$={(event) => {
                              form.secondaryMobile = (event.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                      </div>
                    </section>
                  </>
                )}

                <section class="rounded-xl border border-outline-variant/15 bg-surface-container-low p-6">
                  <h3 class="font-headline text-xl font-bold text-primary">Account Access</h3>
                  <div class="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div class="md:col-span-2">
                      <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Account Email Address
                      </label>
                      <input
                        class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                        placeholder="official@delegation.gov.zw"
                        type="email"
                        value={form.accountEmail}
                        onInput$={(event) => {
                          form.accountEmail = (event.target as HTMLInputElement).value;
                        }}
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Password
                      </label>
                      <input
                        class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                        placeholder="••••••••••••"
                        type="password"
                        value={form.password}
                        onInput$={(event) => {
                          form.password = (event.target as HTMLInputElement).value;
                        }}
                        autoComplete="new-password"
                      />
                    </div>
                    <div>
                      <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Confirm Password
                      </label>
                      <input
                        class="w-full rounded-xl border-none bg-surface-container-lowest p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                        placeholder="••••••••••••"
                        type="password"
                        value={form.confirmPassword}
                        onInput$={(event) => {
                          form.confirmPassword = (event.target as HTMLInputElement).value;
                        }}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </section>

                <div class="rounded-xl bg-surface-container-highest p-5">
                  <label class="flex items-start gap-3">
                    <input
                      class="mt-1 rounded border-outline text-primary focus:ring-primary"
                      type="checkbox"
                      checked={form.certified}
                      onChange$={(event) => {
                        form.certified = (event.target as HTMLInputElement).checked;
                      }}
                    />
                    <span class="text-sm text-on-surface-variant">
                      I certify that the organization and contact information provided is accurate and ready for
                      admin verification during account approval.
                    </span>
                  </label>
                </div>

                {error.value ? (
                  <p class="text-sm text-error" role="alert">
                    {error.value}
                  </p>
                ) : null}

                <div class="pt-2">
                  <button
                    class="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white font-headline font-bold rounded-xl shadow-lg shadow-primary/20 hover:translate-y-[-2px] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-60"
                    type="submit"
                    disabled={busy.value}
                  >
                    {busy.value ? "Submitting..." : "Submit registration"}
                    <span class="material-symbols-outlined text-lg" aria-hidden="true">
                      arrow_forward
                    </span>
                  </button>
                </div>

                <div class="text-center pt-2 text-sm">
                  <p class="text-on-surface-variant font-body">
                    Already have an account?{" "}
                    <a class="text-secondary hover:underline font-bold" href="/sign-in/">
                      Sign in
                    </a>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer Shell */}
      <footer class="bg-emerald-950 w-full py-12 px-8">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="text-lg font-bold text-white font-headline">
            Zimbabwe Football Travel Authority
          </div>
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
    </>
  );
});

export const head: DocumentHead = {
  title: "Organization Registration",
};

