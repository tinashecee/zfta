export type ApplicationTypeKey = "outgoing_tour" | "incoming_tour" | "hosting_competition";

export type Initiator = "applicant" | "sport_body";

export type ReviewerKind = "sport_body" | "src";

export type ApplicationTypeDefinition = {
  key: ApplicationTypeKey;
  label: string;
  description: string;
  initiator: Initiator;
  /** Review steps after the initiator submits (ordered). */
  workflow: ReviewerKind[];
  minLeadDays: number;
};

export const APPLICATION_TYPES: Record<ApplicationTypeKey, ApplicationTypeDefinition> = {
  outgoing_tour: {
    key: "outgoing_tour",
    label: "Outgoing Sport Tour",
    description:
      "Travel abroad for matches or tours. Submitted by the applicant organisation; reviewed by the sport body then SRC.",
    initiator: "applicant",
    workflow: ["sport_body", "src"],
    minLeadDays: 30,
  },
  incoming_tour: {
    key: "incoming_tour",
    label: "Incoming Sport Tour",
    description:
      "Foreign or external parties touring in Zimbabwe. Submitted by the sport body; forwarded to SRC.",
    initiator: "sport_body",
    workflow: ["sport_body", "src"],
    minLeadDays: 30,
  },
  hosting_competition: {
    key: "hosting_competition",
    label: "Hosting of National, Regional and International Competitions",
    description:
      "Applications to host major sport competitions. Submitted by the sport body; reviewed by SRC.",
    initiator: "sport_body",
    workflow: ["sport_body", "src"],
    minLeadDays: 60,
  },
};

export function listApplicationTypesForInitiator(initiator: Initiator): ApplicationTypeDefinition[] {
  return (Object.values(APPLICATION_TYPES) as ApplicationTypeDefinition[]).filter((t) => t.initiator === initiator);
}

/** Stored on application payload until backend adds a dedicated column. */
export const APPLICATION_TYPE_FIELD = "application_type" as const;

export function isOutgoingTourApplicationType(raw: string | null | undefined): boolean {
  return String(raw ?? "").trim().toLowerCase() === "outgoing_tour";
}
