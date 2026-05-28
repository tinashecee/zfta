import {
  createHostingCompetition,
  createIncomingTour,
  createOutgoingTour,
  uploadHostingCompetitionDocuments,
  uploadIncomingTourDocuments,
  uploadOutgoingTourDocuments,
} from "~/lib/applications-api";
import { buildApplicationRecordFromForm } from "~/lib/build-application-payload";
import { validateApplicationPayload, validateNewApplicationFormData } from "~/lib/validate-application-form";
import { personnelRoleCountsForApplication, rowToIncomingDelegationPayload, rowToPayload, validateIncomingDelegationRows, type TravelPersonnelRow } from "~/lib/travel-personnel-types";
import { validateMinLeadDays } from "~/lib/application-form-lead";
import type { ApplicationTypeKey } from "~/lib/application-types";
import { initialTravelApplicationStatus } from "~/lib/approval-rules";
import { validateTournamentClassificationOptional } from "~/lib/tournament-classification";

export type SubmitTravelApplicationFlowParams = {
  form: HTMLFormElement;
  personnel: TravelPersonnelRow[];
  uploads: Record<string, File | null | undefined>;
  organisationId: string;
  organisationSport: string;
  /** Whether the applicant organisation is a PSL affiliate (affects initial review queue). */
  pslAffiliate: boolean;
  applicationType: ApplicationTypeKey;
  minLeadDays: number;
};

export type SubmitTravelApplicationFlowResult =
  | { ok: true; reference: string }
  | { ok: false; error: string };

/** Re-exported from {@link "~/lib/approval-rules"} so existing imports keep working. */
export { initialTravelApplicationStatus };

/**
 * Shared client flow: validate form → upload attachments → build application → POST /applications.
 */
export async function submitTravelApplicationFlow(
  params: SubmitTravelApplicationFlowParams,
): Promise<SubmitTravelApplicationFlowResult> {
  const fd = new FormData(params.form);
  // Ensure legacy validator can branch on application type.
  fd.set("application_type", params.applicationType);

  const formValidation = validateNewApplicationFormData(fd);
  if (formValidation) return { ok: false as const, error: formValidation };

  const leadDateKey =
    params.applicationType === "hosting_competition"
      ? "tour_start_date"
      : params.applicationType === "incoming_tour"
        ? "incoming_arrival_date"
        : "departure_date";
  const leadDate = String(fd.get(leadDateKey) ?? "").trim();
  if (leadDate) {
    const leadErr = validateMinLeadDays(leadDate, params.minLeadDays);
    if (leadErr) return { ok: false as const, error: leadErr };
  }

  if (fd.get("declaration_accepted") !== "on") {
    return { ok: false as const, error: "Please accept the declaration to submit." };
  }
  if (params.applicationType === "incoming_tour" || params.applicationType === "hosting_competition") {
    const tournamentClasificationResult = validateTournamentClassificationOptional(
      String(fd.get("tournament_clasification") ?? ""),
    );
    if (tournamentClasificationResult && typeof tournamentClasificationResult === "object") {
      return { ok: false as const, error: tournamentClasificationResult.error };
    }
  }
  const requiredUploadKeys: Record<ApplicationTypeKey, string[]> = {
    outgoing_tour: ["invitation_letter", "funding_proof", "liabilities_breakdown"],
    incoming_tour: ["statutory_compliance_declaration", "funding_proof"],
    hosting_competition: [
      "hosting_plan",
      "budget",
      "funding_proof",
      "roll_out_plan",
      "organising_committee_composition",
    ],
  };
  const missing = (requiredUploadKeys[params.applicationType] ?? []).filter((k) => !params.uploads[k]);
  if (missing.length) {
    return {
      ok: false,
      error: `Please attach all required documents (${missing.join(", ")}).`,
    };
  }
  if (params.applicationType === "incoming_tour") {
    const delegationErr = validateIncomingDelegationRows(params.personnel);
    if (delegationErr) return { ok: false as const, error: delegationErr };
  } else if (params.applicationType !== "hosting_competition") {
    if (params.personnel.length === 0) {
      return { ok: false as const, error: "Add at least one person to the roster (traveller or key contact)." };
    }
    const emptyRole = params.personnel.find((r) => !String(r.role ?? "").trim());
    if (emptyRole) {
      return { ok: false as const, error: "Each roster row must have a role (e.g. player, coach, official)." };
    }
  }
  if (
    params.applicationType === "outgoing_tour" &&
    !params.personnel.some((r) => String(r.role ?? "").trim().toLowerCase() === "player")
  ) {
    return { ok: false as const, error: 'Outgoing tour roster must include at least one person with role "player".' };
  }

  const up = await (async () => {
    if (params.applicationType === "outgoing_tour") {
      return uploadOutgoingTourDocuments({
        invitation_letter: params.uploads.invitation_letter as File,
        funding_proof: params.uploads.funding_proof as File,
        liabilities_breakdown: params.uploads.liabilities_breakdown as File,
      });
    }
    if (params.applicationType === "incoming_tour") {
      return uploadIncomingTourDocuments({
        statutory_compliance_declaration: params.uploads.statutory_compliance_declaration as File,
        funding_proof: params.uploads.funding_proof as File,
      });
    }
    return uploadHostingCompetitionDocuments({
      hosting_plan: params.uploads.hosting_plan as File,
      budget: params.uploads.budget as File,
      funding_proof: params.uploads.funding_proof as File,
      roll_out_plan: params.uploads.roll_out_plan as File,
      organising_committee_composition: params.uploads.organising_committee_composition as File,
    });
  })();
  if (!up.ok) return { ok: false as const, error: up.error };

  const cr = await (async () => {
    const initialStatus = initialTravelApplicationStatus(params.organisationSport, params.pslAffiliate);
    if (params.applicationType === "outgoing_tour") {
      const host_country = String(fd.get("host_country") ?? "").trim();
      const departure_date = String(fd.get("departure_date") ?? "").trim();
      const return_date = String(fd.get("return_date") ?? "").trim();
      const event_description_raw = String(fd.get("event_description") ?? "").trim();
      const docs = up.data as {
        invitation_letter_doc?: string | null;
        funding_proof_doc?: string | null;
        liabilities_breakdown_doc?: string | null;
        compliance_declaration_doc?: string | null;
        national_assoc_clearance_doc?: string | null;
      };
      const payload: Record<string, unknown> = {
        organisation_id: params.organisationId,
        sport: params.organisationSport || null,
        status: initialStatus,
        host_country,
        departure_date,
        return_date,
        event_description: event_description_raw ? event_description_raw : null,
        declaration_accepted: true,
        personnel: params.personnel.map(rowToPayload),
        invitation_letter_doc: docs.invitation_letter_doc ?? null,
        funding_proof_doc: docs.funding_proof_doc ?? null,
        liabilities_breakdown_doc: docs.liabilities_breakdown_doc ?? null,
      };
      const tourStart = String(fd.get("tour_start_date") ?? "").trim();
      const tourEnd = String(fd.get("tour_end_date") ?? "").trim();
      if (tourStart) payload.tour_start_date = tourStart;
      if (tourEnd) payload.tour_end_date = tourEnd;
      const complianceDoc = String(docs.compliance_declaration_doc ?? "").trim();
      if (complianceDoc) payload.compliance_declaration_doc = complianceDoc;
      const clearanceDoc = String(docs.national_assoc_clearance_doc ?? "").trim();
      if (clearanceDoc) payload.national_assoc_clearance_doc = clearanceDoc;
      return createOutgoingTour({ application: payload, personnel: [] });
    }

    if (params.applicationType === "incoming_tour") {
      const host_country = String(fd.get("host_country") ?? "Zimbabwe").trim() || "Zimbabwe";
      const tour_start_date = String(fd.get("tour_start_date") ?? "").trim();
      const tour_end_date = String(fd.get("tour_end_date") ?? "").trim();
      const incoming_arrival_date = String(fd.get("incoming_arrival_date") ?? "").trim();
      const incoming_departure_date = String(fd.get("incoming_departure_date") ?? "").trim();
      const training_facility_name = String(fd.get("training_facility_name") ?? "").trim();
      const represented_country_raw = String(fd.get("represented_country") ?? "").trim();
      const event_description_raw = String(fd.get("event_description") ?? "").trim();
      const docs = up.data as unknown as {
        statutory_compliance_declaration_doc?: string | null;
        funding_proof_doc?: string | null;
      };
      const payload: Record<string, unknown> = {
        organisation_id: params.organisationId,
        sport: params.organisationSport || null,
        status: initialStatus,
        host_country,
        training_facility_name,
        tour_start_date,
        tour_end_date,
        incoming_arrival_date,
        incoming_departure_date,
        departure_date: incoming_arrival_date,
        return_date: incoming_departure_date,
        declaration_accepted: true,
        personnel: params.personnel.map(rowToIncomingDelegationPayload),
        statutory_compliance_declaration_doc: docs.statutory_compliance_declaration_doc ?? null,
        funding_proof_doc: docs.funding_proof_doc ?? null,
      };
      if (represented_country_raw) payload.represented_country = represented_country_raw;
      if (event_description_raw) payload.event_description = event_description_raw;
      const tournament_clasification = String(fd.get("tournament_clasification") ?? "").trim();
      if (tournament_clasification) payload.tournament_clasification = tournament_clasification;
      return createIncomingTour({ application: payload, personnel: [] });
    }

    if (params.applicationType === "hosting_competition") {
      const event_type = String(fd.get("event_type") ?? "").trim();
      const tournament_name = String(fd.get("tournament_name") ?? "").trim();
      const tournament_name_other = String(fd.get("tournament_name_other") ?? "").trim();
      const host_country = String(fd.get("host_country") ?? "").trim();
      const host_city = String(fd.get("host_city") ?? "").trim();
      const tour_start_date = String(fd.get("tour_start_date") ?? "").trim();
      const tour_end_date = String(fd.get("tour_end_date") ?? "").trim();
      const event_display_name = [tournament_name_other, host_city || host_country].filter(Boolean).join(" — ");
      const docs = up.data as unknown as {
        hosting_plan_doc?: string | null;
        budget_doc?: string | null;
        funding_proof_doc?: string | null;
        roll_out_plan_doc?: string | null;
        organising_committee_doc?: string | null;
      };
      const payload: Record<string, unknown> = {
        organisation_id: params.organisationId,
        sport: params.organisationSport || null,
        status: initialStatus,
        event_type,
        tournament_name,
        tournament_name_other: tournament_name_other || null,
        event_display_name,
        host_country,
        host_city: host_city || null,
        tour_start_date,
        tour_end_date,
        declaration_accepted: true,
        hosting_plan_doc: docs.hosting_plan_doc ?? null,
        budget_doc: docs.budget_doc ?? null,
        funding_proof_doc: docs.funding_proof_doc ?? null,
        roll_out_plan_doc: docs.roll_out_plan_doc ?? null,
        organising_committee_doc: docs.organising_committee_doc ?? null,
      };
      const tournament_clasification = String(fd.get("tournament_clasification") ?? "").trim();
      if (tournament_clasification) payload.tournament_clasification = tournament_clasification;
      return createHostingCompetition({ application: payload, personnel: [] });
    }

    const application = buildApplicationRecordFromForm(fd, {
      organisation_id: params.organisationId,
      sport: params.organisationSport,
      support_documents: null,
      travel_documents: null,
      status: initialTravelApplicationStatus(params.organisationSport, params.pslAffiliate),
      application_type: null,
    });
    delete (application as Record<string, unknown>).status;
    delete (application as Record<string, unknown>).application_type;
    Object.assign(application, up.data);

    const roleCounts = personnelRoleCountsForApplication(params.personnel);
    application.player_count = roleCounts.player_count;
    application.officials_count = roleCounts.officials_count;

    const payloadCheck = validateApplicationPayload(application);
    if (payloadCheck) return { ok: false as const, error: payloadCheck };

    const payload = {
      application,
      personnel: params.personnel.map(rowToPayload),
    };
    if (params.applicationType === "incoming_tour") return createIncomingTour(payload);
    return createHostingCompetition(payload);
  })();
  if (!cr.ok) return { ok: false as const, error: cr.error };

  const reference = String(cr.data.reference_number ?? cr.data.id ?? "").trim();
  return { ok: true, reference };
}
