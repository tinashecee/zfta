import { $, component$, useSignal, useStore, useTask$, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  getCurrentUser,
  signOut,
  signUp,
  type AuthUser,
} from "~/lib/auth";
import { APPROVER_BODY_KINDS, displayApproverBodyKind } from "~/lib/users-api";
import {
  listSportBodies,
  sportBodyApprovalCode,
  sportBodyUserPayloadId,
  sportBodiesForApproverSelect,
  type ApiSportBody,
} from "~/lib/sport-bodies-api";
import { listOrganisations, organisationDisplayName, type ApiOrganisation } from "~/lib/organisations-api";

/** Values accepted by `POST /api/v1/auth/sign-up` */
const SIGNUP_ROLES = ["applicant", "reviewer", "supervisor", "system_admin"] as const;
type SignUpRole = (typeof SIGNUP_ROLES)[number];

type SignUpFormState = {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  mobile_number: string;
  role: SignUpRole;
  /** Organisation id for NSA reviewer accounts */
  organisation_id: string;
  /** `SPORTS_BODY` | `SRC` or "" */
  approver_body: string;
  /** Sport-body row id as string when `approver_body` is SPORTS_BODY */
  sports_body: string;
};

function buildSignUpPayload(form: SignUpFormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    email: form.email.trim().toLowerCase(),
    password: form.password,
    full_name: form.full_name.trim(),
    mobile_number: form.mobile_number.trim(),
    role: form.role,
  };
  if (form.role === "reviewer" && form.organisation_id.trim()) {
    payload.organisation_id = form.organisation_id.trim();
  }
  if (form.role === "reviewer" && form.approver_body.trim()) {
    payload.approver_body = form.approver_body.trim().toUpperCase();
    if (payload.approver_body === "SPORTS_BODY") {
      const code = form.sports_body.trim();
      if (code) payload.sports_body = code;
    }
  }
  return payload;
}

type FieldKey = "email" | "full_name" | "mobile_number" | "password" | "confirmPassword";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errorEmail(v: string): string {
  const t = v.trim();
  if (!t) return "Email is required.";
  if (!EMAIL_RE.test(t)) return "Enter a valid email address.";
  return "";
}

function errorFullName(v: string): string {
  if (!v.trim()) return "Full name is required.";
  return "";
}

function errorMobile(v: string): string {
  if (!v.trim()) return "Mobile number is required.";
  return "";
}

function errorPassword(v: string): string {
  if (!v) return "Password is required.";
  if (v.length < 8) return "Password must be at least 8 characters.";
  return "";
}

function errorConfirmPassword(password: string, confirm: string): string {
  if (!confirm) return "Confirm your password.";
  if (password !== confirm) return "Passwords must match.";
  return "";
}

function syncFieldErrors(
  form: SignUpFormState,
  fieldErrors: Record<FieldKey, string>,
) {
  fieldErrors.email = errorEmail(form.email);
  fieldErrors.full_name = errorFullName(form.full_name);
  fieldErrors.mobile_number = errorMobile(form.mobile_number);
  fieldErrors.password = errorPassword(form.password);
  fieldErrors.confirmPassword = errorConfirmPassword(form.password, form.confirmPassword);
}

function hasBlockingErrors(fieldErrors: Record<FieldKey, string>): boolean {
  return Object.values(fieldErrors).some(Boolean);
}

function inputErrorClass(show: boolean): string {
  return show
    ? "ring-2 ring-error/80 bg-error/5"
    : "focus:ring-1 focus:ring-primary/30";
}

export default component$(() => {
  const currentUser = useSignal<AuthUser | null>(null);
  const busy = useSignal(false);
  const submitAttempted = useSignal(false);
  const form = useStore<SignUpFormState>({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    mobile_number: "",
    role: "applicant",
    organisation_id: "",
    approver_body: "",
    sports_body: "",
  });

  const roleFormError = useSignal("");

  const fieldErrors = useStore<Record<FieldKey, string>>({
    email: "",
    full_name: "",
    mobile_number: "",
    password: "",
    confirmPassword: "",
  });

  const touched = useStore<Record<FieldKey, boolean>>({
    email: false,
    full_name: false,
    mobile_number: false,
    password: false,
    confirmPassword: false,
  });

  const sportBodies = useSignal<ApiSportBody[]>([]);
  const nsaOrganisations = useSignal<ApiOrganisation[]>([]);

  useTask$(() => {
    currentUser.value = getCurrentUser();
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    const r = await listSportBodies({ limit: 500, offset: 0 });
    if (r.ok) sportBodies.value = r.data;

    const or = await listOrganisations({ limit: 500, offset: 0 });
    if (or.ok) {
      nsaOrganisations.value = or.data.filter((o) => {
        const t = String(o.org_type ?? o.organization_type ?? "").trim().toLowerCase();
        return t === "national_sports_association";
      });
    }
  });

  const onSubmit$ = $(async () => {
    submitAttempted.value = true;
    syncFieldErrors(form, fieldErrors);
    roleFormError.value = "";

    if (!SIGNUP_ROLES.includes(form.role)) {
      return;
    }

    if (hasBlockingErrors(fieldErrors)) {
      return;
    }

    if (form.role === "reviewer") {
      if (!form.organisation_id.trim()) {
        roleFormError.value = "Select a National Sports Association.";
        return;
      }
      const k = form.approver_body.trim().toUpperCase();
      if (!k || !(APPROVER_BODY_KINDS as readonly string[]).includes(k)) {
        roleFormError.value = "Select an approver body type.";
        return;
      }
      if (k === "SPORTS_BODY") {
        if (!form.sports_body.trim()) {
          roleFormError.value = "Select a sport body.";
          return;
        }
      }
    }

    busy.value = true;
    try {
      const res = await signUp(buildSignUpPayload(form));

      if (!res.ok) {
        await signOut();
        window.location.assign(`/sign-up/complete/?error=${encodeURIComponent(res.error)}`);
        return;
      }

      await signOut();
      window.location.assign(
        `/sign-up/complete/?success=1&email=${encodeURIComponent(form.email.trim().toLowerCase())}`,
      );
    } finally {
      busy.value = false;
    }
  });

  return (
    <>
      <header class="fixed top-0 w-full z-50 bg-emerald-950/70 backdrop-blur-xl shadow-2xl shadow-emerald-950/20">
        <nav class="flex justify-between items-center px-8 py-4 max-w-full">
          <div class="text-xl font-bold text-white tracking-tighter font-headline">
            Zimbabwe Sports Travel Authority
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

      <main class="flex-grow flex items-center justify-center pt-24 pb-12 px-6 relative overflow-hidden bg-surface-container-low">
        <div class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div class="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] rounded-full bg-secondary/5 blur-[120px]" />

        <div class="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-0 bg-surface-container-lowest rounded-xl overflow-hidden premium-shadow relative z-10">
          <div class="lg:col-span-5 bg-primary p-12 flex flex-col justify-between text-white relative">
            <div class="absolute inset-0 opacity-10" data-alt="Subtle geometric pattern">
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
                Create your account
              </h1>
              <p class="text-emerald-50/70 font-body text-lg leading-relaxed max-w-sm">
                Register with your work email. You will choose your role and optional approver body for reviewer
                workflows.
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
                  <p class="text-sm font-bold font-headline">Secure registration</p>
                  <p class="text-xs text-emerald-50/50 font-body">Password min. 8 characters</p>
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-7 p-8 md:p-12 bg-surface-container-lowest">
            <div class="mb-10">
              <h2 class="text-3xl font-headline font-bold text-on-background tracking-tight">Sign up</h2>
              <p class="text-on-surface-variant mt-2 font-body">
                All fields marked with your selections are required by the system unless noted optional.
              </p>
            </div>

            {currentUser.value ? (
              <section class="rounded-xl bg-surface-container-highest p-5">
                <p class="text-sm text-on-surface-variant">
                  You are already signed in as <span class="font-bold">{currentUser.value.email}</span>.
                </p>
                <button
                  type="button"
                  class="mt-4 w-full py-4 rounded-xl bg-primary text-white font-bold hover:bg-primary-container disabled:opacity-60"
                  onClick$={$(async () => {
                    await signOut();
                    window.location.assign("/sign-in/");
                  })}
                >
                  Sign out
                </button>
              </section>
            ) : (
              <form class="space-y-6" preventdefault:submit onSubmit$={onSubmit$}>
                <div>
                  <label
                    class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                    for="signup-email"
                  >
                    Email
                  </label>
                  <input
                    id="signup-email"
                    class={`w-full rounded-xl border-none bg-surface-container-low p-4 text-on-surface outline-none transition-shadow ${inputErrorClass(
                      (touched.email || submitAttempted.value) && Boolean(fieldErrors.email),
                    )}`}
                    type="email"
                    placeholder="you@organization.co.zw"
                    value={form.email}
                    aria-invalid={(touched.email || submitAttempted.value) && Boolean(fieldErrors.email)}
                    aria-describedby={
                      (touched.email || submitAttempted.value) && fieldErrors.email ? "signup-email-error" : undefined
                    }
                    onInput$={(e) => {
                      form.email = (e.target as HTMLInputElement).value;
                      if (touched.email || submitAttempted.value) {
                        fieldErrors.email = errorEmail(form.email);
                      }
                    }}
                    onBlur$={() => {
                      touched.email = true;
                      fieldErrors.email = errorEmail(form.email);
                    }}
                    autoComplete="email"
                    required
                  />
                  {(touched.email || submitAttempted.value) && fieldErrors.email ? (
                    <p id="signup-email-error" class="mt-1.5 text-xs text-error" role="alert">
                      {fieldErrors.email}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                    for="signup-full-name"
                  >
                    Full name
                  </label>
                  <input
                    id="signup-full-name"
                    class={`w-full rounded-xl border-none bg-surface-container-low p-4 text-on-surface outline-none transition-shadow ${inputErrorClass(
                      (touched.full_name || submitAttempted.value) && Boolean(fieldErrors.full_name),
                    )}`}
                    type="text"
                    placeholder="As it should appear on your profile"
                    value={form.full_name}
                    aria-invalid={(touched.full_name || submitAttempted.value) && Boolean(fieldErrors.full_name)}
                    aria-describedby={
                      (touched.full_name || submitAttempted.value) && fieldErrors.full_name
                        ? "signup-full-name-error"
                        : undefined
                    }
                    onInput$={(e) => {
                      form.full_name = (e.target as HTMLInputElement).value;
                      if (touched.full_name || submitAttempted.value) {
                        fieldErrors.full_name = errorFullName(form.full_name);
                      }
                    }}
                    onBlur$={() => {
                      touched.full_name = true;
                      fieldErrors.full_name = errorFullName(form.full_name);
                    }}
                    autoComplete="name"
                    required
                  />
                  {(touched.full_name || submitAttempted.value) && fieldErrors.full_name ? (
                    <p id="signup-full-name-error" class="mt-1.5 text-xs text-error" role="alert">
                      {fieldErrors.full_name}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                    for="signup-mobile"
                  >
                    Mobile number
                  </label>
                  <input
                    id="signup-mobile"
                    class={`w-full rounded-xl border-none bg-surface-container-low p-4 text-on-surface outline-none transition-shadow ${inputErrorClass(
                      (touched.mobile_number || submitAttempted.value) && Boolean(fieldErrors.mobile_number),
                    )}`}
                    type="tel"
                    placeholder="+263..."
                    value={form.mobile_number}
                    aria-invalid={
                      (touched.mobile_number || submitAttempted.value) && Boolean(fieldErrors.mobile_number)
                    }
                    aria-describedby={
                      (touched.mobile_number || submitAttempted.value) && fieldErrors.mobile_number
                        ? "signup-mobile-error"
                        : undefined
                    }
                    onInput$={(e) => {
                      form.mobile_number = (e.target as HTMLInputElement).value;
                      if (touched.mobile_number || submitAttempted.value) {
                        fieldErrors.mobile_number = errorMobile(form.mobile_number);
                      }
                    }}
                    onBlur$={() => {
                      touched.mobile_number = true;
                      fieldErrors.mobile_number = errorMobile(form.mobile_number);
                    }}
                    autoComplete="tel"
                    required
                  />
                  {(touched.mobile_number || submitAttempted.value) && fieldErrors.mobile_number ? (
                    <p id="signup-mobile-error" class="mt-1.5 text-xs text-error" role="alert">
                      {fieldErrors.mobile_number}
                    </p>
                  ) : null}
                </div>

                <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div class="md:col-span-2">
                    <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Role
                    </label>
                    <select
                      class="w-full rounded-xl border-none bg-surface-container-low p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                      value={form.role}
                      onChange$={(e) => {
                        form.role = (e.target as HTMLSelectElement).value as SignUpRole;
                        if (form.role !== "reviewer") {
                          form.organisation_id = "";
                          form.approver_body = "";
                          form.sports_body = "";
                          roleFormError.value = "";
                        }
                      }}
                      required
                    >
                      <option value="applicant">Applicant</option>
                      <option value="reviewer">National Sports Association</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="system_admin">System admin</option>
                    </select>
                  </div>

                  {form.role === "reviewer" ? (
                    <>
                      <div class="md:col-span-2">
                        <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          National Sports Association
                        </label>
                        <select
                          class="w-full rounded-xl border-none bg-surface-container-low p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                          value={form.organisation_id}
                          onChange$={(e) => {
                            form.organisation_id = (e.target as HTMLSelectElement).value;
                            roleFormError.value = "";
                          }}
                          required
                        >
                          <option value="">— Select —</option>
                          {nsaOrganisations.value.map((o) => (
                            <option key={o.id} value={o.id}>
                              {organisationDisplayName(o) || o.id}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div class="md:col-span-2">
                        <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          Approver body type
                        </label>
                        <select
                          class="w-full rounded-xl border-none bg-surface-container-low p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                          value={form.approver_body}
                          onChange$={(e) => {
                            form.approver_body = (e.target as HTMLSelectElement).value;
                            if (form.approver_body !== "SPORTS_BODY") {
                              form.sports_body = "";
                            }
                            roleFormError.value = "";
                          }}
                          required
                        >
                          <option value="">— Select —</option>
                          {APPROVER_BODY_KINDS.map((k) => (
                            <option key={k} value={k}>
                              {displayApproverBodyKind(k)}
                            </option>
                          ))}
                        </select>
                      </div>
                      {form.approver_body === "SPORTS_BODY" ? (
                        <div class="md:col-span-2">
                          <label class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Sport body
                          </label>
                          <select
                            class="w-full rounded-xl border-none bg-surface-container-low p-4 text-on-surface focus:ring-1 focus:ring-primary/30"
                            value={form.sports_body}
                            onChange$={(e) => {
                              form.sports_body = (e.target as HTMLSelectElement).value;
                              roleFormError.value = "";
                            }}
                            required
                          >
                            <option value="">— Select —</option>
                            {sportBodiesForApproverSelect(sportBodies.value).map((b) => (
                              <option key={b.id} value={sportBodyUserPayloadId(b)}>
                                {`${b.name ?? sportBodyApprovalCode(b)} (${sportBodyUserPayloadId(b)})`}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
                {roleFormError.value ? (
                  <p class="text-sm text-error" role="alert">
                    {roleFormError.value}
                  </p>
                ) : null}

                <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label
                      class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                      for="signup-password"
                    >
                      Password <span class="text-xs font-normal">(min 8)</span>
                    </label>
                    <input
                      id="signup-password"
                      class={`w-full rounded-xl border-none bg-surface-container-low p-4 text-on-surface outline-none transition-shadow ${inputErrorClass(
                        (touched.password || submitAttempted.value) && Boolean(fieldErrors.password),
                      )}`}
                      type="password"
                      value={form.password}
                      aria-invalid={(touched.password || submitAttempted.value) && Boolean(fieldErrors.password)}
                      aria-describedby={
                        (touched.password || submitAttempted.value) && fieldErrors.password
                          ? "signup-password-error"
                          : undefined
                      }
                      onInput$={(e) => {
                        form.password = (e.target as HTMLInputElement).value;
                        fieldErrors.password = errorPassword(form.password);
                        fieldErrors.confirmPassword = errorConfirmPassword(form.password, form.confirmPassword);
                      }}
                      onBlur$={() => {
                        touched.password = true;
                        fieldErrors.password = errorPassword(form.password);
                        fieldErrors.confirmPassword = errorConfirmPassword(form.password, form.confirmPassword);
                      }}
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                    {(touched.password || submitAttempted.value) && fieldErrors.password ? (
                      <p id="signup-password-error" class="mt-1.5 text-xs text-error" role="alert">
                        {fieldErrors.password}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label
                      class="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                      for="signup-confirm-password"
                    >
                      Confirm password
                    </label>
                    <input
                      id="signup-confirm-password"
                      class={`w-full rounded-xl border-none bg-surface-container-low p-4 text-on-surface outline-none transition-shadow ${inputErrorClass(
                        (touched.confirmPassword || submitAttempted.value) && Boolean(fieldErrors.confirmPassword),
                      )}`}
                      type="password"
                      value={form.confirmPassword}
                      aria-invalid={
                        (touched.confirmPassword || submitAttempted.value) && Boolean(fieldErrors.confirmPassword)
                      }
                      aria-describedby={
                        (touched.confirmPassword || submitAttempted.value) && fieldErrors.confirmPassword
                          ? "signup-confirm-password-error"
                          : undefined
                      }
                      onInput$={(e) => {
                        form.confirmPassword = (e.target as HTMLInputElement).value;
                        fieldErrors.confirmPassword = errorConfirmPassword(form.password, form.confirmPassword);
                      }}
                      onBlur$={() => {
                        touched.confirmPassword = true;
                        fieldErrors.confirmPassword = errorConfirmPassword(form.password, form.confirmPassword);
                      }}
                      autoComplete="new-password"
                      required
                    />
                    {(touched.confirmPassword || submitAttempted.value) && fieldErrors.confirmPassword ? (
                      <p id="signup-confirm-password-error" class="mt-1.5 text-xs text-error" role="alert">
                        {fieldErrors.confirmPassword}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div class="pt-2">
                  <button
                    class="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold rounded-xl shadow-lg shadow-primary/20 hover:translate-y-[-2px] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-60"
                    type="submit"
                    disabled={busy.value}
                  >
                    {busy.value ? "Submitting..." : "Create account"}
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

      <footer class="bg-emerald-950 w-full py-12 px-8">
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
    </>
  );
});

export const head: DocumentHead = {
  title: "Sign up",
};
