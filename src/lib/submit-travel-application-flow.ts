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
import { personnelRoleCountsForApplication, rowToPayload, type TravelPersonnelRow } from "~/lib/travel-personnel-types";
import { validateMinLeadDays } from "~/lib/application-form-lead";
import type { ApplicationTypeKey } from "~/lib/application-types";

export type SubmitTravelApplicationFlowParams = {
  form: HTMLFormElement;
  personnel: TravelPersonnelRow[];
  uploads: Record<string, File | null | undefined>;
  organisationId: string;
  organisationSport: string;
  applicationType: ApplicationTypeKey;
  minLeadDays: number;
};

export type SubmitTravelApplicationFlowResult =
  | { ok: true; reference: string }
  | { ok: false; error: string };

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
  if (formValidation) return { ok: false, error: formValidation };

  const departure = String(fd.get("departure_date") ?? "").trim();
  const leadErr = validateMinLeadDays(departure, params.minLeadDays);
  if (leadErr) return { ok: false, error: leadErr };

  if (fd.get("declaration_accepted") !== "on") {
    return { ok: false, error: "Please accept the declaration to submit." };
  }
  const requiredUploadKeys: Record<ApplicationTypeKey, string[]> = {
    outgoing_tour: [
      "compliance_declaration",
      "invitation_letter",
      "national_assoc_clearance",
      "funding_proof",
      "liabilities_breakdown",
    ],
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
  if (params.personnel.length === 0) {
    return { ok: false, error: "Add at least one person to the roster (traveller or key contact)." };
  }
  const emptyRole = params.personnel.find((r) => !String(r.role ?? "").trim());
  if (emptyRole) {
    return { ok: false, error: "Each roster row must have a role (e.g. player, coach, official)." };
  }
  if (
    params.applicationType === "outgoing_tour" &&
    !params.personnel.some((r) => String(r.role ?? "").trim().toLowerCase() === "player")
  ) {
    return { ok: false, error: 'Outgoing tour roster must include at least one person with role "player".' };
  }

  const up = await (async () => {
    if (params.applicationType === "outgoing_tour") {
      return uploadOutgoingTourDocuments({
        compliance_declaration: params.uploads.compliance_declaration as File,
        invitation_letter: params.uploads.invitation_letter as File,
        national_assoc_clearance: params.uploads.national_assoc_clearance as File,
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
  if (!up.ok) return { ok: false, error: up.error };

  const cr = await (async () => {
    if (params.applicationType === "outgoing_tour") {
      const host_country = String(fd.get("host_country") ?? "").trim();
      const departure_date = String(fd.get("departure_date") ?? "").trim();
      const return_date = String(fd.get("return_date") ?? "").trim();
      const event_description_raw = String(fd.get("event_description") ?? "").trim();
      const payload = {
        organisation_id: params.organisationId,
        sport: params.organisationSport || null,
        host_country,
        departure_date,
        return_date,
        event_description: event_description_raw ? event_description_raw : null,
        declaration_accepted: true,
        personnel: params.personnel.map(rowToPayload),
        ...up.data,
      };
      return createOutgoingTour({ application: payload, personnel: [] });
    }

    const application = buildApplicationRecordFromForm(fd, {
      organisation_id: params.organisationId,
      sport: params.organisationSport,
      support_documents: null,
      travel_documents: null,
      status: "awaiting_body",
      application_type: null,
    });
    delete (application as Record<string, unknown>).status;
    delete (application as Record<string, unknown>).application_type;
    Object.assign(application, up.data);

    const roleCounts = personnelRoleCountsForApplication(params.personnel);
    application.player_count = roleCounts.player_count;
    application.officials_count = roleCounts.officials_count;

    const payloadCheck = validateApplicationPayload(application);
    if (payloadCheck) return { ok: false, error: payloadCheck };

    const payload = {
      application,
      personnel: params.personnel.map(rowToPayload),
    };
    if (params.applicationType === "incoming_tour") return createIncomingTour(payload);
    return createHostingCompetition(payload);
  })();
  if (!cr.ok) return { ok: false, error: cr.error };

  const reference = String(cr.data?.reference_number ?? cr.data?.id ?? "").trim();
  return { ok: true, reference };
}
