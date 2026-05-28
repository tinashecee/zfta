import type { ApiApplication } from "~/lib/applications-api";
import { labelApplicationType } from "~/lib/application-types";
import type { ApiApproval } from "~/lib/approvals-api";
import {
  applicantFacingStatusLabel,
  formatDateTime,
  formatIsoDate,
  labelEventType,
} from "~/lib/application-display";
import { organisationDisplayName, type ApiOrganisation } from "~/lib/organisations-api";

export type DossierField = { label: string; value: string };

export type DossierFieldGroup = { title: string; icon?: string; fields: DossierField[] };

export type DocumentDescriptor = { label: string; path: string };

function norm(v: string | null | undefined): string {
  return String(v ?? "").trim();
}

/** True when a scalar should be shown (allows 0 and false). */
export function hasDisplayValue(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "boolean") return true;
  if (typeof v === "number") return true;
  if (typeof v === "string") return v.trim() !== "";
  return true;
}

function field(label: string, value: unknown, format?: (v: unknown) => string): DossierField | null {
  if (!hasDisplayValue(value)) return null;
  const formatted = format ? format(value) : String(value);
  if (!formatted.trim()) return null;
  return { label, value: formatted };
}

function fieldsFromPairs(pairs: Array<[string, unknown, ((v: unknown) => string)?]>): DossierField[] {
  const out: DossierField[] = [];
  for (const [label, value, fmt] of pairs) {
    const f = field(label, value, fmt);
    if (f) out.push(f);
  }
  return out;
}

function applicationTypeKey(app: ApiApplication): string {
  return norm(app.application_type).toLowerCase();
}

export function applicationDocumentDescriptors(app: ApiApplication): DocumentDescriptor[] {
  const pairs: Array<[string, string | null | undefined]> = [
    ["2.1 Compliance declaration", app.compliance_declaration_doc],
    ["1.1 Statutory compliance declaration", app.statutory_compliance_declaration_doc],
    ["2.3 Invitation letter", app.invitation_letter_doc],
    ["2.4 National association clearance", app.national_assoc_clearance_doc],
    ["2.5 Passport pack", app.passport_pack_doc],
    ["2.7 Liabilities & expenditure", app.liabilities_breakdown_doc],
    ["2.9 Proof of funding", app.funding_proof_doc],
    ["Hosting plan", app.hosting_plan_doc],
    ["Budget", app.budget_doc],
    ["Roll-out plan", app.roll_out_plan_doc],
    ["Organising committee composition", app.organising_committee_doc],
    ["Support documents (legacy)", app.support_documents],
    ["Travel documents (legacy)", app.travel_documents],
  ];
  return pairs
    .map(([label, path]) => ({ label, path: norm(path) }))
    .filter((d) => d.path.length > 0);
}

export function organisationFieldGroups(org: ApiOrganisation): DossierFieldGroup[] {
  const name = organisationDisplayName(org);
  const orgType = norm(org.org_type ?? org.organization_type);
  const sport = norm(org.sport);
  const status = norm(org.status);
  const website = norm(org.website);
  const division = [norm(org.division), norm(org.division_league)].filter(Boolean).join(" · ");
  const address = [norm(org.physical_address ?? org.street_address), norm(org.city), norm(org.province)]
    .filter(Boolean)
    .join(" · ");
  const primaryContact = [
    norm(org.primary_contact_name),
    norm(org.primary_contact_title ?? org.primary_role),
    norm(org.primary_contact_mobile ?? org.primary_mobile),
    norm(org.primary_contact_email ?? org.primary_email),
  ]
    .filter(Boolean)
    .join(" · ");
  const secondaryContact = [
    norm(org.secondary_contact_name),
    norm(org.secondary_contact_title),
    norm(org.secondary_contact_mobile ?? org.secondary_mobile),
    norm(org.secondary_contact_email),
  ]
    .filter(Boolean)
    .join(" · ");
  const orgEmergency = [
    norm(org.emergency_contact_name),
    norm(org.emergency_contact_mobile),
    norm(org.emergency_contact_relation),
  ]
    .filter(Boolean)
    .join(" · ");
  const zifa = [
    org.is_zifa_registered === true ? "Registered" : org.is_zifa_registered === false ? "Not registered" : "",
    norm(org.zifa_affiliation_number ?? org.affiliation_number),
    org.zifa_registration_active != null ? String(org.zifa_registration_active) : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const psl =
    org.psl_affiliate === true || org.pslAffiliate === true || org.PslAffiliate === true
      ? "Yes"
      : org.psl_affiliate === false || org.pslAffiliate === false || org.PslAffiliate === false
        ? "No"
        : "";

  const identity = fieldsFromPairs([
    ["Organisation name", name || null],
    ["Type", orgType || null],
    ["Sport", sport || null],
    ["Status", status || null],
    ["Organisation ID", org.id],
    ["Establishment date", norm(org.establishment_date) || null, (v) => formatIsoDate(String(v))],
  ]);

  const registration = fieldsFromPairs([
    ["ZIFA registration", zifa || null],
    ["MoE registration number", norm(org.moe_registration_number) || null],
    ["PSL affiliate", psl || null],
    ["Principal name", norm(org.principal_name) || null],
    [
      "Official school sport",
      org.is_official_school_sport === true ? "Yes" : org.is_official_school_sport === false ? "No" : null,
    ],
    ["Sport in official program", org.sport_in_official_program != null ? String(org.sport_in_official_program) : null],
  ]);

  const location = fieldsFromPairs([
    ["Address", address || null],
    ["Website", website || null],
    ["Division / league", division || null],
  ]);

  const contacts = fieldsFromPairs([
    ["Primary contact", primaryContact || null],
    ["Secondary contact", secondaryContact || null],
    ["Emergency contact", orgEmergency || null],
  ]);

  const metadata = fieldsFromPairs([
    ["Created", org.created_at, (v) => formatDateTime(String(v)) || String(v)],
    ["Updated", org.updated_at, (v) => formatDateTime(String(v)) || String(v)],
  ]);

  return [
    { title: "Organisation", icon: "domain", fields: identity },
    { title: "Registration & affiliation", icon: "verified", fields: registration },
    { title: "Location", icon: "location_on", fields: location },
    { title: "Contacts", icon: "contact_phone", fields: contacts },
    { title: "Organisation record", icon: "info", fields: metadata },
  ].filter((g) => g.fields.length > 0);
}

export type ApplicationFieldGroupsContext = {
  routingSportLabel?: string;
};

function applicationDateFields(app: ApiApplication): DossierField[] {
  return fieldsFromPairs([
    ["Tour start date", app.tour_start_date, (v) => formatIsoDate(String(v))],
    ["Tour end date", app.tour_end_date, (v) => formatIsoDate(String(v))],
    ["Incoming arrival date", app.incoming_arrival_date, (v) => formatIsoDate(String(v))],
    ["Incoming departure date", app.incoming_departure_date, (v) => formatIsoDate(String(v))],
    ["Departure date", app.departure_date, (v) => formatIsoDate(String(v))],
    ["Return date", app.return_date, (v) => formatIsoDate(String(v))],
    ["Start date", app.start_date, (v) => formatIsoDate(String(v))],
    ["End date", app.end_date, (v) => formatIsoDate(String(v))],
  ]);
}

export function applicationFieldGroups(
  app: ApiApplication,
  ctx: ApplicationFieldGroupsContext = {},
): DossierFieldGroup[] {
  const typeKey = applicationTypeKey(app);
  const isHosting = typeKey === "hosting_competition";
  const isIncoming = typeKey === "incoming_tour";
  const isOutgoing = typeKey === "outgoing_tour";

  const core = fieldsFromPairs([
    ["Reference", norm(app.reference_number) || app.id],
    ["Status", app.status, (v) => applicantFacingStatusLabel(String(v))],
    ["Application type", app.application_type, (v) => labelApplicationType(String(v))],
    ["Sport", ctx.routingSportLabel || norm(app.sport) || null],
    ["Priority", app.priority && String(app.priority).toLowerCase() !== "normal" ? app.priority : null],
    ["Priority reason", app.priority_reason],
    ["Applicant ID", app.applicant_id],
    ["Organisation ID", app.organisation_id],
    [
      "Declaration accepted",
      app.declaration_accepted != null ? (app.declaration_accepted ? "Yes" : "No") : null,
    ],
    ["Submitted", app.submitted_at, (v) => formatDateTime(String(v)) || String(v)],
    ["Created", app.created_at, (v) => formatDateTime(String(v)) || String(v)],
    ["Updated", app.updated_at, (v) => formatDateTime(String(v)) || String(v)],
  ]);

  const event = fieldsFromPairs([
    ["Event name", app.event_display_name],
    ["Event type", app.event_type, (v) => labelEventType(String(v))],
    ["Tournament", app.tournament_name],
    ["Other tournament name", app.tournament_name_other],
    ["Purpose / description", app.event_description],
    ["Opponent", [norm(app.opponent_team_name), norm(app.opponent_team_country)].filter(Boolean).join(" · ") || null],
    ["Represented country", app.represented_country],
    ["Training facility", app.training_facility_name],
    ["Training camp objective", app.training_camp_objective],
    ["Host country", app.host_country],
    ["Host city / venue", app.host_city],
  ]);

  const logistics = [
    ...applicationDateFields(app),
    ...fieldsFromPairs([
      ["Travel mode", app.travel_mode],
      ["Age group", app.age_group],
      ["Gender category", app.gender_category],
      ["Port of entry", app.port_of_entry],
      ["Port of exit", app.port_of_exit],
      ["Player count", app.player_count],
      ["Officials count", app.officials_count],
      ["Total travellers", app.total_travellers],
    ]),
  ];

  const logisticsTitle = isHosting
    ? "Event schedule & logistics"
    : isIncoming
      ? "Tour & travel dates"
      : isOutgoing
        ? "Trip & tour dates"
        : "Trip & logistics";

  const emergency = fieldsFromPairs([
    ["Emergency contact name", app.emergency_contact_name],
    ["Emergency contact mobile", app.emergency_contact_mobile],
    ["Emergency contact relation", app.emergency_contact_relation],
  ]);

  return [
    { title: "Application", icon: "description", fields: core },
    { title: "Event & destination", icon: "emoji_events", fields: event },
    { title: logisticsTitle, icon: "calendar_month", fields: logistics },
    { title: "Emergency contact", icon: "contact_emergency", fields: emergency },
  ].filter((g) => g.fields.length > 0);
}

export function approvalDetailRows(approval: ApiApproval): DossierField[] {
  return fieldsFromPairs([
    ["Body", approval.body],
    ["Body code", approval.body_code],
    ["Status", approval.status, (v) => String(v).replace(/_/g, " ")],
    ["Sports body", approval.sports_body],
    ["Assigned to", approval.assigned_to],
    ["Decided by", approval.decided_by],
    ["Decided at", approval.decided_at, (v) => formatDateTime(String(v)) || String(v)],
    ["Decision note", approval.decision_note],
    ["Notes", approval.notes],
    ["Decision", approval.decision],
    ["Created", approval.created_at, (v) => formatDateTime(String(v)) || String(v)],
    ["Updated", approval.updated_at, (v) => formatDateTime(String(v)) || String(v)],
    ["Approval ID", approval.id],
  ]);
}

function flattenFieldGroups(groups: DossierFieldGroup[]): DossierField[] {
  return groups.flatMap((g) => g.fields);
}

export function organisationFieldsFlat(org: ApiOrganisation): DossierField[] {
  return flattenFieldGroups(organisationFieldGroups(org));
}

export function applicationFieldsFlat(
  app: ApiApplication,
  ctx: ApplicationFieldGroupsContext = {},
): DossierField[] {
  return flattenFieldGroups(applicationFieldGroups(app, ctx));
}
