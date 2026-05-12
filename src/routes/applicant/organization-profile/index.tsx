import { $, component$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { type DocumentHead, useLocation } from "@builder.io/qwik-city";
import { ApplicantPortalNav } from "~/components/applicant-portal-nav";
import { getCurrentUser, persistStoredSessionUser } from "~/lib/auth";
import {
  createOrganisation,
  deleteOrganisation,
  getOrganisation,
  organisationDisplayName,
  ORG_STATUSES,
  patchOrganisation,
  type ApiOrganisation,
} from "~/lib/organisations-api";
import { patchUser } from "~/lib/users-api";

/** `models.ValidOrgType` — align with backend enum. */
const ORG_TYPE_VALUES = [
  "club",
  "individual",
  "academy",
  "high_school",
  "primary_school",
  "college_university",
  "company",
  "sport_body",
] as const;

const ORG_TYPE_OPTIONS = [
  { value: "club" as const, label: "Club" },
  { value: "individual" as const, label: "Individual" },
  { value: "academy" as const, label: "Academy" },
  { value: "high_school" as const, label: "High School" },
  { value: "primary_school" as const, label: "Primary School" },
  { value: "college_university" as const, label: "College / University" },
  { value: "company" as const, label: "Company" },
  { value: "sport_body" as const, label: "Sports body" },
] as const;

/** Older API responses (`football_club`, …) map to the new `org_type` strings. */
const LEGACY_ORG_TYPE_TO_CANONICAL: Record<string, (typeof ORG_TYPE_VALUES)[number]> = {
  football_club: "club",
  football_academy: "academy",
};

/**
 * `zw_province` — values sent as JSON must match backend enum (often Title Case names, not snake_case).
 * Aliases map API responses like `harare` / `mashonaland_central` back to canonical values.
 */
/** `zw_province` — exact strings expected by the API. */
const ZW_PROVINCE_VALUES = [
  "Bulawayo",
  "Harare",
  "Manicaland",
  "Mashonaland Central",
  "Mashonaland East",
  "Mashonaland West",
  "Masvingo",
  "Matabeleland North",
  "Matabeleland South",
  "Midlands",
] as const;

const ZW_PROVINCE_ALIASES: Record<string, (typeof ZW_PROVINCE_VALUES)[number]> = {
  harare: "Harare",
  bulawayo: "Bulawayo",
  manicaland: "Manicaland",
  mashonaland_central: "Mashonaland Central",
  mashonaland_east: "Mashonaland East",
  mashonaland_west: "Mashonaland West",
  masvingo: "Masvingo",
  matabeleland_north: "Matabeleland North",
  matabeleland_south: "Matabeleland South",
  midlands: "Midlands",
};

const ZW_PROVINCE_OPTIONS = ZW_PROVINCE_VALUES.map((v) => ({ value: v, label: v }));

/** `football_division` — API expects these exact Title Case strings. */
const FOOTBALL_DIVISION_VALUES = [
  "Castle Lager Premier League",
  "Division One",
  "Division Two",
  "Division Three",
  "Academy League",
  "Women Premier League",
  "Other",
  "Unaffiliated",
] as const;

const OTHER_DIVISION = "Other";

const FOOTBALL_DIVISION_OPTIONS = FOOTBALL_DIVISION_VALUES.map((v) => ({ value: v, label: v }));

/** Maps legacy snake_case / older responses to canonical `football_division` strings. */
const LEGACY_DIVISION_TO_CANONICAL: Record<string, (typeof FOOTBALL_DIVISION_VALUES)[number]> = {
  castle_lager_premier_league: "Castle Lager Premier League",
  division_one: "Division One",
  division_two: "Division Two",
  division_three: "Division Three",
  academy_league: "Academy League",
  women_premier_league: "Women Premier League",
  other: "Other",
  unaffiliated: "Unaffiliated",
};

const REQ = " (required)";

/** API `sport` — must match backend enum strings. */
const SPORT_VALUES = [
  "cricket",
  "football",
  "rugby",
  "hockey",
  "tennis",
  "chess",
  "darts",
  "boxing",
  "karate",
  "athletics",
  "swimming",
  "netball",
  "golf",
  "basketball",
  "volleyball",
  "cycling",
  "motorsport",
] as const;

function sportLabel(value: string): string {
  if (value === "motorsport") return "Motorsport";
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

const SPORT_OPTIONS = SPORT_VALUES.map((v) => ({ value: v, label: sportLabel(v) }));

function normalizeSport(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  const hit = SPORT_VALUES.find((v) => v === lower);
  if (hit) return hit;
  return (SPORT_VALUES as readonly string[]).includes(s) ? s : "";
}

function normalizeProvince(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  const asKey = s.toLowerCase().replace(/\s+/g, "_");
  if (ZW_PROVINCE_ALIASES[asKey]) return ZW_PROVINCE_ALIASES[asKey];
  const exact = ZW_PROVINCE_VALUES.find((v) => v === s);
  if (exact) return exact;
  const ci = ZW_PROVINCE_VALUES.find((v) => v.toLowerCase() === s.toLowerCase());
  return ci ?? "";
}

function normalizeOrgType(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  if ((ORG_TYPE_VALUES as readonly string[]).includes(s)) return s;
  const lowerUnderscore = s.toLowerCase().replace(/\s+/g, "_");
  const fromLegacy = LEGACY_ORG_TYPE_TO_CANONICAL[lowerUnderscore];
  if (fromLegacy) return fromLegacy;
  const byLabel = ORG_TYPE_OPTIONS.find((o) => o.label.toLowerCase() === s.toLowerCase());
  return byLabel?.value ?? "";
}

function parseDivisionFromApi(raw: string | null | undefined): { division: string; divisionOther: string } {
  const s = (raw ?? "").trim();
  if (!s) return { division: "", divisionOther: "" };
  const lowerUnderscore = s.toLowerCase().replace(/\s+/g, "_");
  const fromLegacyKey = LEGACY_DIVISION_TO_CANONICAL[lowerUnderscore];
  if (fromLegacyKey) return { division: fromLegacyKey, divisionOther: "" };
  if ((FOOTBALL_DIVISION_VALUES as readonly string[]).includes(s)) {
    return { division: s, divisionOther: "" };
  }
  const ci = FOOTBALL_DIVISION_VALUES.find((v) => v.toLowerCase() === s.toLowerCase());
  if (ci) return { division: ci, divisionOther: "" };
  const legacyPhrase: Record<string, (typeof FOOTBALL_DIVISION_VALUES)[number]> = {
    "castle lager premier league": "Castle Lager Premier League",
    "division one": "Division One",
    "division two": "Division Two",
    "division three": "Division Three",
    "academy league": "Academy League",
    "women premier league": "Women Premier League",
    other: "Other",
    unaffiliated: "Unaffiliated",
  };
  if (legacyPhrase[s.toLowerCase()]) {
    return { division: legacyPhrase[s.toLowerCase()], divisionOther: "" };
  }
  /** Custom league name not in enum — treat as Other + detail */
  return { division: OTHER_DIVISION, divisionOther: s };
}

function ynToBool(v: string | boolean | null | undefined): boolean {
  if (typeof v === "boolean") return v;
  if (v == null) return false;
  const s = String(v).toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

type OrgForm = {
  orgName: string;
  orgType: string;
  physicalAddress: string;
  city: string;
  province: string;
  establishmentDate: string;
  website: string;
  division: string;
  /** When division is "Other", custom text sent as `division` in the payload. */
  divisionOther: string;
  moeRegistrationNumber: string;
  principalName: string;
  isOfficialSchoolSport: boolean;
  /** One of {@link SPORT_VALUES}; required for create/update. */
  sport: string;
  primaryContactName: string;
  primaryContactTitle: string;
  primaryContactMobile: string;
  primaryContactEmail: string;
  secondaryContactName: string;
  secondaryContactTitle: string;
  secondaryContactMobile: string;
  secondaryContactEmail: string;
  emergencyContactName: string;
  emergencyContactMobile: string;
  emergencyContactRelation: string;
  /** Football only. False by default. */
  pslAffiliate: boolean;
  status: string;
  certified: boolean;
};

function emptyForm(): OrgForm {
  return {
    orgName: "",
    orgType: "",
    physicalAddress: "",
    city: "",
    province: "",
    establishmentDate: "",
    website: "",
    division: "",
    divisionOther: "",
    moeRegistrationNumber: "",
    principalName: "",
    isOfficialSchoolSport: false,
    sport: "",
    primaryContactName: "",
    primaryContactTitle: "",
    primaryContactMobile: "",
    primaryContactEmail: "",
    secondaryContactName: "",
    secondaryContactTitle: "",
    secondaryContactMobile: "",
    secondaryContactEmail: "",
    emergencyContactName: "",
    emergencyContactMobile: "",
    emergencyContactRelation: "",
    pslAffiliate: false,
    status: "incomplete",
    certified: false,
  };
}

function mapOrgToForm(o: ApiOrganisation): OrgForm {
  const psl = (() => {
    const raw = o.psl_affiliate ?? o.pslAffiliate ?? o.PslAffiliate;
    return typeof raw === "boolean" ? raw : ynToBool(raw as unknown as string | boolean | null | undefined);
  })();
  return {
    orgName: organisationDisplayName(o),
    orgType: normalizeOrgType(o.org_type ?? o.organization_type),
    physicalAddress: (o.physical_address ?? o.street_address ?? "").trim(),
    city: (o.city ?? "").trim(),
    province: normalizeProvince(o.province),
    establishmentDate: (o.establishment_date ?? "").slice(0, 10),
    website: o.website ?? "",
    ...parseDivisionFromApi(o.division ?? o.division_league),
    moeRegistrationNumber: o.moe_registration_number ?? "",
    principalName: o.principal_name ?? "",
    isOfficialSchoolSport:
      typeof o.is_official_school_sport === "boolean"
        ? o.is_official_school_sport
        : ynToBool(o.sport_in_official_program),
    sport: normalizeSport(o.sport != null ? String(o.sport) : ""),
    primaryContactName: o.primary_contact_name ?? "",
    primaryContactTitle: o.primary_contact_title ?? o.primary_role ?? "",
    primaryContactMobile: o.primary_contact_mobile ?? o.primary_mobile ?? "",
    primaryContactEmail: o.primary_contact_email ?? o.primary_email ?? "",
    secondaryContactName: o.secondary_contact_name ?? "",
    secondaryContactTitle: o.secondary_contact_title ?? "",
    secondaryContactMobile: o.secondary_contact_mobile ?? o.secondary_mobile ?? "",
    secondaryContactEmail: o.secondary_contact_email ?? "",
    emergencyContactName: o.emergency_contact_name ?? "",
    emergencyContactMobile: o.emergency_contact_mobile ?? "",
    emergencyContactRelation: o.emergency_contact_relation ?? "",
    pslAffiliate: psl,
    status: ORG_STATUSES.includes(o.status as (typeof ORG_STATUSES)[number])
      ? o.status!
      : "incomplete",
    certified: false,
  };
}

function formToPayload(form: OrgForm): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    org_name: form.orgName.trim(),
    org_type: form.orgType,
    physical_address: form.physicalAddress.trim(),
    city: form.city.trim(),
    province: form.province,
    primary_contact_name: form.primaryContactName.trim(),
    primary_contact_mobile: form.primaryContactMobile.trim(),
    primary_contact_email: form.primaryContactEmail.trim(),
    is_official_school_sport: form.isOfficialSchoolSport,
  };

  if (form.establishmentDate.trim()) {
    payload.establishment_date = form.establishmentDate.trim();
  }
  if (form.website.trim()) {
    payload.website = form.website.trim();
  }
  if (form.division === OTHER_DIVISION) {
    const spec = form.divisionOther.trim();
    /** Literal enum `Other`, or custom league name if provided. */
    payload.division = spec || OTHER_DIVISION;
  } else if (form.division.trim()) {
    payload.division = form.division.trim();
  }
  if (form.moeRegistrationNumber.trim()) {
    payload.moe_registration_number = form.moeRegistrationNumber.trim();
  }
  if (form.principalName.trim()) {
    payload.principal_name = form.principalName.trim();
  }
  if (form.primaryContactTitle.trim()) {
    payload.primary_contact_title = form.primaryContactTitle.trim();
  }
  if (form.secondaryContactName.trim()) {
    payload.secondary_contact_name = form.secondaryContactName.trim();
  }
  if (form.secondaryContactTitle.trim()) {
    payload.secondary_contact_title = form.secondaryContactTitle.trim();
  }
  if (form.secondaryContactMobile.trim()) {
    payload.secondary_contact_mobile = form.secondaryContactMobile.trim();
  }
  if (form.secondaryContactEmail.trim()) {
    payload.secondary_contact_email = form.secondaryContactEmail.trim();
  }
  if (form.emergencyContactName.trim()) {
    payload.emergency_contact_name = form.emergencyContactName.trim();
  }
  if (form.emergencyContactMobile.trim()) {
    payload.emergency_contact_mobile = form.emergencyContactMobile.trim();
  }
  if (form.emergencyContactRelation.trim()) {
    payload.emergency_contact_relation = form.emergencyContactRelation.trim();
  }
  payload.sport = form.sport.trim();
  payload.psl_affiliate = form.sport.trim() === "football" ? form.pslAffiliate : false;
  return payload;
}

function validateOrgForm(form: OrgForm): string | null {
  const sport = form.sport.trim();
  if (!sport || !(SPORT_VALUES as readonly string[]).includes(sport)) {
    return "Sport is required.";
  }
  if (!form.orgName.trim()) {
    return "Organization name is required.";
  }
  if (!form.orgType.trim()) {
    return "Organization type is required.";
  }
  if (!form.physicalAddress.trim()) {
    return "Physical address is required.";
  }
  if (!form.city.trim()) {
    return "City is required.";
  }
  if (!form.province.trim()) {
    return "Province is required.";
  }
  if (!form.primaryContactName.trim()) {
    return "Primary contact name is required.";
  }
  if (!form.primaryContactMobile.trim()) {
    return "Primary contact mobile is required.";
  }
  if (!form.primaryContactEmail.trim()) {
    return "Primary contact email is required.";
  }
  const em = form.primaryContactEmail.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
    return "Primary contact email must be a valid email address.";
  }
  return null;
}

function statusLabel(s: string | undefined): string {
  if (!s) return "—";
  return s.replace(/_/g, " ");
}

export default component$(() => {
  const location = useLocation();
  const loading = useSignal(true);
  const saving = useSignal(false);
  const loadError = useSignal<string | null>(null);
  const formError = useSignal<string | null>(null);
  const orgId = useSignal<string | null>(null);
  const mode = useSignal<"create" | "edit">("create");
  const form = useStore<OrgForm>(emptyForm());

  useVisibleTask$(async () => {
    const current = getCurrentUser();
    if (!current?.id) {
      loadError.value = "You need to be signed in to manage your organisation.";
      loading.value = false;
      return;
    }

    loading.value = true;
    loadError.value = null;
    const orgIdFromUser = String(current.organisation_id ?? "").trim();
    if (!orgIdFromUser) {
      loading.value = false;
      mode.value = "create";
      orgId.value = null;
      Object.assign(form, emptyForm());
      return;
    }

    const detail = await getOrganisation(orgIdFromUser);
    loading.value = false;
    if (!detail.ok) {
      loadError.value = detail.error;
      return;
    }
    mode.value = "edit";
    orgId.value = detail.data.id;
    Object.assign(form, mapOrgToForm(detail.data));
  });

  const onSave$ = $(async () => {
    formError.value = null;
    if (!form.certified) {
      formError.value = "Please certify that the information is accurate before saving.";
      return;
    }
    const v = validateOrgForm(form);
    if (v) {
      formError.value = v;
      return;
    }

    saving.value = true;
    try {
      if (mode.value === "create") {
        const payload = formToPayload(form);
        const r = await createOrganisation(payload);
        if (!r.ok) {
          saving.value = false;
          formError.value = r.status === 409 ? "An organization already exists for your account." : r.error;
          return;
        }

        const current = getCurrentUser();
        if (!current?.id) {
          saving.value = false;
          formError.value = "You need to be signed in to link your organisation.";
          return;
        }
        const ur = await patchUser(current.id, { organisation_id: r.data.id });
        if (!ur.ok) {
          saving.value = false;
          formError.value = `Organisation created, but could not link it to your account: ${ur.error}`;
          return;
        }
        persistStoredSessionUser({ ...current, organisation_id: r.data.id });

        saving.value = false;
        mode.value = "edit";
        orgId.value = r.data.id;
        Object.assign(form, mapOrgToForm(r.data));
        if (location.url.searchParams.has("onboarding")) {
          window.history.replaceState({}, "", "/applicant/organization-profile/");
        }
        return;
      }

      if (!orgId.value) {
        formError.value = "Missing organization id.";
        return;
      }
      const r = await patchOrganisation(orgId.value, formToPayload(form));
      saving.value = false;
      if (!r.ok) {
        formError.value = r.error;
        return;
      }
      Object.assign(form, mapOrgToForm(r.data));
    } finally {
      saving.value = false;
    }
  });

  const onDelete$ = $(async () => {
    if (!orgId.value) return;
    if (!confirm("Remove this organization from your account? (This may be a soft delete on the server.)")) return;
    formError.value = null;
    saving.value = true;
    const r = await deleteOrganisation(orgId.value);
    saving.value = false;
    if (!r.ok) {
      formError.value = r.error;
      return;
    }
    mode.value = "create";
    orgId.value = null;
    Object.assign(form, emptyForm());
  });

  return (
    <div class="min-h-screen flex flex-col bg-background text-on-background font-body">
      <ApplicantPortalNav activeItem="organization" />

      <main class="flex-grow pt-24 pb-20 px-4 md:px-8">
        <div class="max-w-5xl mx-auto">
          <p class="mb-4 text-sm text-on-surface-variant">
            Fields marked <span class="font-bold text-primary">{REQ.trim()}</span> must be filled before you can save.
          </p>

          <div class="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div class="max-w-2xl">
              <h1 class="text-4xl md:text-5xl font-extrabold font-headline text-primary tracking-tight mb-4">
                Organization profile
              </h1>
              <p class="text-on-surface-variant text-lg leading-relaxed">
                Manage your organisation details for travel clearances and compliance. One organisation per account.
              </p>
            </div>
            <div class="flex items-center gap-3 bg-surface-container-low p-4 rounded-xl border-l-4 border-secondary">
              <span class="material-symbols-outlined text-secondary text-3xl">verified_user</span>
              <div>
                <p class="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Mode</p>
                <p class="text-sm font-semibold text-primary">
                  {loading.value ? "Loading…" : mode.value === "create" ? "Create organisation" : "Edit organisation"}
                </p>
                {mode.value === "edit" && !loading.value ? (
                  <p class="text-xs text-on-surface-variant mt-1">Status: {statusLabel(form.status)}</p>
                ) : null}
              </div>
            </div>
          </div>

          {!loading.value && !loadError.value && mode.value === "create" ? (
            <div
              class="mb-8 rounded-xl border border-secondary/40 bg-secondary/10 p-5 sm:p-6 shadow-sm"
              role="status"
            >
              <h2 class="font-headline text-lg font-bold text-primary sm:text-xl">
                {location.url.searchParams.get("onboarding") === "1"
                  ? "Welcome — create your organisation"
                  : "Add your organisation"}
              </h2>
              <p class="mt-2 text-sm text-on-surface-variant sm:text-base">
                {location.url.searchParams.get("onboarding") === "1"
                  ? "No organisation is linked to your account yet. Complete all required fields below."
                  : "We could not find an organisation for your account. Complete all required fields below."}
              </p>
            </div>
          ) : null}

          {loadError.value ? (
            <div class="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error" role="alert">
              {loadError.value}
            </div>
          ) : loading.value ? (
            <p class="text-on-surface-variant">Loading organization…</p>
          ) : (
            <form class="space-y-8" preventdefault:submit onSubmit$={onSave$}>
              <div class="bg-surface-container-lowest p-6 sm:p-8 rounded-xl shadow-sm border border-outline-variant/15">
                <div class="max-w-xl flex flex-col gap-1.5">
                  <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Sport <span class="text-primary">{REQ}</span>
                  </label>
                  <select
                    class="w-full bg-surface-container-low border-0 focus:ring-1 focus:ring-primary/30 rounded-lg p-3 text-on-surface appearance-none"
                    value={form.sport}
                    required
                    onChange$={(e) => {
                      const next = (e.target as HTMLSelectElement).value;
                      form.sport = next;
                      if (next !== "football") form.pslAffiliate = false;
                    }}
                  >
                    <option value="" disabled>
                      Select sport
                    </option>
                    {SPORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {form.sport === "football" ? (
                <div class="bg-surface-container-lowest p-6 sm:p-8 rounded-xl shadow-sm border border-outline-variant/15">
                  <h3 class="font-headline font-bold text-xl text-primary mb-4 flex items-center gap-2">
                    <span class="material-symbols-outlined">sports_soccer</span> Football affiliation
                  </h3>
                  <div class="flex flex-col gap-2">
                    <p class="text-sm text-on-surface-variant">
                      Is this organisation a PSL affiliate?
                    </p>
                    <div class="flex flex-col sm:flex-row gap-3">
                      <label class="flex cursor-pointer items-center gap-3 rounded-lg bg-surface-container-low p-3">
                        <input
                          type="radio"
                          name="pslAffiliate"
                          value="yes"
                          checked={form.pslAffiliate === true}
                          onChange$={() => {
                            form.pslAffiliate = true;
                          }}
                        />
                        <span class="text-sm font-semibold text-primary">Yes</span>
                      </label>
                      <label class="flex cursor-pointer items-center gap-3 rounded-lg bg-surface-container-low p-3">
                        <input
                          type="radio"
                          name="pslAffiliate"
                          value="no"
                          checked={form.pslAffiliate === false}
                          onChange$={() => {
                            form.pslAffiliate = false;
                          }}
                        />
                        <span class="text-sm font-semibold text-primary">No</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : null}

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="md:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15">
                  <h3 class="font-headline font-bold text-xl text-primary mb-6 flex items-center gap-2">
                    <span class="material-symbols-outlined">corporate_fare</span> Core identification
                  </h3>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="md:col-span-2 flex flex-col gap-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Organization name <span class="text-primary">{REQ}</span>
                      </label>
                      <input
                        class="w-full bg-surface-container-low border-0 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30 rounded-lg p-3 text-on-surface"
                        placeholder="e.g. Dynamos FC or Heritage School"
                        type="text"
                        value={form.orgName}
                        onInput$={(e) => {
                          form.orgName = (e.target as HTMLInputElement).value;
                        }}
                        required
                      />
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Organization type <span class="text-primary">{REQ}</span>
                      </label>
                      <select
                        class="w-full bg-surface-container-low border-0 focus:ring-1 focus:ring-primary/30 rounded-lg p-3 text-on-surface appearance-none"
                        value={form.orgType}
                        onChange$={(e) => {
                          form.orgType = (e.target as HTMLSelectElement).value;
                        }}
                      >
                        <option value="">Select organization type</option>
                        {ORG_TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Establishment date <span class="text-on-surface-variant/80">(optional)</span>
                      </label>
                      <input
                        class="w-full bg-surface-container-low border-0 focus:ring-1 focus:ring-primary/30 rounded-lg p-3 text-on-surface"
                        type="date"
                        value={form.establishmentDate}
                        onInput$={(e) => {
                          form.establishmentDate = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        MoE registration number <span class="text-on-surface-variant/80">(optional)</span>
                      </label>
                      <input
                        class="w-full bg-surface-container-low border-0 focus:ring-1 focus:ring-primary/30 rounded-lg p-3 text-on-surface"
                        placeholder="Min-EDU-XXXX"
                        type="text"
                        value={form.moeRegistrationNumber}
                        onInput$={(e) => {
                          form.moeRegistrationNumber = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div class="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15 flex flex-col">
                  <h3 class="font-headline font-bold text-xl text-primary mb-6 flex items-center gap-2">
                    <span class="material-symbols-outlined">location_on</span> Address
                  </h3>
                  <div class="space-y-5">
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Physical address <span class="text-primary">{REQ}</span>
                      </label>
                      <textarea
                        class="w-full bg-surface-container-low border-0 focus:ring-1 focus:ring-primary/30 rounded-lg p-3 text-on-surface text-sm"
                        placeholder="123 Samora Machel Ave"
                        rows={2}
                        value={form.physicalAddress}
                        onInput$={(e) => {
                          form.physicalAddress = (e.target as HTMLTextAreaElement).value;
                        }}
                        required
                      />
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        City <span class="text-primary">{REQ}</span>
                      </label>
                      <input
                        class="w-full bg-surface-container-low border-0 focus:ring-1 focus:ring-primary/30 rounded-lg p-3 text-on-surface text-sm"
                        type="text"
                        value={form.city}
                        onInput$={(e) => {
                          form.city = (e.target as HTMLInputElement).value;
                        }}
                        required
                      />
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Province <span class="text-primary">{REQ}</span>
                      </label>
                      <select
                        class="w-full bg-surface-container-low border-0 focus:ring-1 focus:ring-primary/30 rounded-lg p-3 text-on-surface text-sm appearance-none"
                        value={form.province}
                        onChange$={(e) => {
                          form.province = (e.target as HTMLSelectElement).value;
                        }}
                      >
                        <option value="">Select province</option>
                        {ZW_PROVINCE_OPTIONS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Website <span class="text-on-surface-variant/80">(optional)</span>
                      </label>
                      <input
                        class="w-full bg-surface-container-low border-0 focus:ring-1 focus:ring-primary/30 rounded-lg p-3 text-on-surface text-sm"
                        placeholder="https://"
                        type="url"
                        value={form.website}
                        onInput$={(e) => {
                          form.website = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-surface-container-low p-8 rounded-xl">
                <h3 class="font-headline font-bold text-2xl text-primary mb-8 border-b border-outline-variant pb-4">
                  Primary contact <span class="text-base font-normal text-primary">(required)</span>
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="flex flex-col gap-1.5 md:col-span-2">
                    <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Full name <span class="text-primary">{REQ}</span>
                    </label>
                    <input
                      class="w-full bg-surface-container-lowest border-0 rounded-lg p-3 shadow-sm"
                      type="text"
                      value={form.primaryContactName}
                      onInput$={(e) => {
                        form.primaryContactName = (e.target as HTMLInputElement).value;
                      }}
                      required
                    />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Title / role <span class="text-on-surface-variant/80">(optional)</span>
                    </label>
                    <input
                      class="w-full bg-surface-container-lowest border-0 rounded-lg p-3 shadow-sm"
                      placeholder="Secretary General"
                      type="text"
                      value={form.primaryContactTitle}
                      onInput$={(e) => {
                        form.primaryContactTitle = (e.target as HTMLInputElement).value;
                      }}
                    />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Mobile <span class="text-primary">{REQ}</span>
                    </label>
                    <input
                      class="w-full bg-surface-container-lowest border-0 rounded-lg p-3 shadow-sm"
                      placeholder="+263..."
                      type="tel"
                      value={form.primaryContactMobile}
                      onInput$={(e) => {
                        form.primaryContactMobile = (e.target as HTMLInputElement).value;
                      }}
                      required
                    />
                  </div>
                  <div class="flex flex-col gap-1.5 md:col-span-2">
                    <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Email <span class="text-primary">{REQ}</span>
                    </label>
                    <input
                      class="w-full bg-surface-container-lowest border-0 rounded-lg p-3 shadow-sm"
                      type="email"
                      value={form.primaryContactEmail}
                      onInput$={(e) => {
                        form.primaryContactEmail = (e.target as HTMLInputElement).value;
                      }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="bg-surface-container-low p-8 rounded-xl">
                  <h3 class="font-headline font-bold text-xl text-primary mb-6">Secondary contact</h3>
                  <div class="space-y-4">
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Name <span class="text-on-surface-variant/80">(optional)</span>
                      </label>
                      <input
                        class="w-full bg-surface-container-lowest border-0 rounded-lg p-3"
                        type="text"
                        value={form.secondaryContactName}
                        onInput$={(e) => {
                          form.secondaryContactName = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Title <span class="text-on-surface-variant/80">(optional)</span>
                      </label>
                      <input
                        class="w-full bg-surface-container-lowest border-0 rounded-lg p-3"
                        type="text"
                        value={form.secondaryContactTitle}
                        onInput$={(e) => {
                          form.secondaryContactTitle = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Mobile <span class="text-on-surface-variant/80">(optional)</span>
                      </label>
                      <input
                        class="w-full bg-surface-container-lowest border-0 rounded-lg p-3"
                        type="tel"
                        value={form.secondaryContactMobile}
                        onInput$={(e) => {
                          form.secondaryContactMobile = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Email <span class="text-on-surface-variant/80">(optional)</span>
                      </label>
                      <input
                        class="w-full bg-surface-container-lowest border-0 rounded-lg p-3"
                        type="email"
                        value={form.secondaryContactEmail}
                        onInput$={(e) => {
                          form.secondaryContactEmail = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div class="bg-surface-container-low p-8 rounded-xl border border-dashed border-outline-variant">
                  <h3 class="font-headline font-bold text-xl text-primary mb-6">Emergency contact</h3>
                  <div class="space-y-4">
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Name <span class="text-on-surface-variant/80">(optional)</span>
                      </label>
                      <input
                        class="w-full bg-surface-container-lowest border-0 rounded-lg p-3"
                        type="text"
                        value={form.emergencyContactName}
                        onInput$={(e) => {
                          form.emergencyContactName = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Mobile <span class="text-on-surface-variant/80">(optional)</span>
                      </label>
                      <input
                        class="w-full bg-surface-container-lowest border-0 rounded-lg p-3"
                        type="tel"
                        value={form.emergencyContactMobile}
                        onInput$={(e) => {
                          form.emergencyContactMobile = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Relation <span class="text-on-surface-variant/80">(optional)</span>
                      </label>
                      <input
                        class="w-full bg-surface-container-lowest border-0 rounded-lg p-3"
                        placeholder="e.g. Deputy head"
                        type="text"
                        value={form.emergencyContactRelation}
                        onInput$={(e) => {
                          form.emergencyContactRelation = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="relative group">
                <div class="absolute inset-0 bg-secondary/5 rounded-2xl blur-xl group-hover:bg-secondary/10 transition-all" />
                <div class="relative bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/30 p-8 rounded-2xl">
                  <div class="flex flex-col md:flex-row gap-10">
                    <div class="flex-1 space-y-6">
                      <h4 class="font-headline font-bold text-lg text-primary flex items-center gap-2">
                        <span class="material-symbols-outlined text-secondary">sports_soccer</span> Club / league
                      </h4>
                      <div class="grid grid-cols-1 gap-4">
                        <div class="flex flex-col gap-1.5">
                          <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Division <span class="text-on-surface-variant/80">(optional)</span>
                          </label>
                          <select
                            class="w-full bg-surface-container-low border-0 rounded-lg p-3 text-on-surface appearance-none"
                            value={form.division}
                            onChange$={(e) => {
                              const v = (e.target as HTMLSelectElement).value;
                              form.division = v;
                              if (v !== OTHER_DIVISION) form.divisionOther = "";
                            }}
                          >
                            <option value="">Select division (optional)</option>
                            {FOOTBALL_DIVISION_OPTIONS.map((d) => (
                              <option key={d.value} value={d.value}>
                                {d.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {form.division === OTHER_DIVISION && (
                          <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                              Specify league <span class="text-on-surface-variant/80">(optional)</span>
                            </label>
                            <input
                              class="w-full bg-surface-container-low border-0 rounded-lg p-3"
                              type="text"
                              placeholder="e.g. regional league name"
                              value={form.divisionOther}
                              onInput$={(e) => {
                                form.divisionOther = (e.target as HTMLInputElement).value;
                              }}
                            />
                          </div>
                        )}

                        <div class="flex flex-col gap-1.5">
                          <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Principal / headmaster <span class="text-on-surface-variant/80">(optional)</span>
                          </label>
                          <input
                            class="w-full bg-surface-container-low border-0 rounded-lg p-3"
                            type="text"
                            value={form.principalName}
                            onInput$={(e) => {
                              form.principalName = (e.target as HTMLInputElement).value;
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div class="flex-1 space-y-6">
                      <h4 class="font-headline font-bold text-lg text-primary flex items-center gap-2">
                        <span class="material-symbols-outlined text-secondary">school</span> School sport
                      </h4>
                      <label class="flex cursor-pointer items-center gap-3 rounded-lg bg-surface-container-low p-3">
                        <input
                          class="h-4 w-4 rounded border-outline text-primary focus:ring-primary"
                          type="checkbox"
                          checked={form.isOfficialSchoolSport}
                          onChange$={(e) => {
                            form.isOfficialSchoolSport = (e.target as HTMLInputElement).checked;
                          }}
                        />
                        <span class="text-sm font-semibold text-primary">
                          Sport in official school programme
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-outline-variant">
                <div class="flex items-start gap-3 max-w-md">
                  <input
                    class="mt-1 rounded border-outline text-primary focus:ring-primary"
                    type="checkbox"
                    checked={form.certified}
                    onChange$={(e) => {
                      form.certified = (e.target as HTMLInputElement).checked;
                    }}
                  />
                  <p class="text-xs text-on-surface-variant leading-tight">
                    I certify that the information provided is true and accurate according to the Constitution of the
                    Zimbabwe Football Association and the statutes of the SRC. <span class="font-bold text-primary">(required)</span>
                  </p>
                </div>
                <div class="flex flex-wrap gap-4 w-full md:w-auto justify-end">
                  {mode.value === "edit" && orgId.value ? (
                    <button
                      class="px-6 py-4 text-error font-bold text-sm uppercase tracking-widest border border-error/30 rounded-lg hover:bg-error/5"
                      type="button"
                      disabled={saving.value}
                      onClick$={onDelete$}
                    >
                      Remove organisation
                    </button>
                  ) : null}
                  <button
                    class="px-12 py-4 bg-primary text-on-primary font-headline font-extrabold rounded-lg shadow-lg hover:translate-y-[-2px] transition-all active:scale-95 disabled:opacity-60"
                    type="submit"
                    disabled={saving.value}
                  >
                    {saving.value ? "Saving…" : mode.value === "create" ? "Create organisation" : "Save changes"}
                  </button>
                </div>
              </div>

              {formError.value ? (
                <p class="text-sm text-error" role="alert">
                  {formError.value}
                </p>
              ) : null}
            </form>
          )}
        </div>
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Organization profile",
};
