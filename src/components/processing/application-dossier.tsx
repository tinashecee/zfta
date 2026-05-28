import { component$ } from "@builder.io/qwik";
import { ApplicationDocumentsSection } from "~/components/processing/application-documents-section";
import { ApplicationInfoSection } from "~/components/processing/application-info-section";
import { ApprovalActivitySection } from "~/components/processing/approval-activity-section";
import { OrganisationProfileSection } from "~/components/processing/organisation-profile-section";
import { TravelPersonnelRoster } from "~/components/travel-personnel-roster";
import type { ApiApplication } from "~/lib/applications-api";
import type { ApiApproval } from "~/lib/approvals-api";
import type { ApiOrganisation } from "~/lib/organisations-api";
import type { TravelPersonnelRow } from "~/lib/travel-personnel-types";

export type ApplicationDossierProps = {
  app: ApiApplication;
  organisation: ApiOrganisation | null;
  approvals: ApiApproval[];
  personnel: TravelPersonnelRow[];
  routingSportLabel?: string;
};

export const ApplicationDossier = component$<ApplicationDossierProps>((props) => {
  const isIncomingDelegation = String(props.app.application_type ?? "").trim().toLowerCase() === "incoming_tour";

  return (
    <div class="space-y-8">
      <OrganisationProfileSection organisation={props.organisation} />

      <ApplicationInfoSection app={props.app} routingSportLabel={props.routingSportLabel} />

      <ApprovalActivitySection app={props.app} approvals={props.approvals} />

      {props.personnel.length > 0 ? (
        <section class="rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
          <div class="mb-4 flex items-start justify-between gap-4">
            <h2 class="text-xl font-bold text-primary flex items-center gap-3">
              <span class="w-1 bg-secondary h-6 rounded-full" />
              <span class="material-symbols-outlined text-secondary text-xl">groups</span>
              {isIncomingDelegation ? "Squad roster" : "Players & officials"}
            </h2>
          </div>
          <TravelPersonnelRoster personnel={props.personnel} mode="view" />
        </section>
      ) : null}

      <ApplicationDocumentsSection app={props.app} />
    </div>
  );
});
