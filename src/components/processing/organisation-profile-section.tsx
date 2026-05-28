import { component$ } from "@builder.io/qwik";
import { DetailFieldGrid } from "~/components/processing/detail-field-grid";
import { organisationFieldsFlat } from "~/lib/application-dossier-display";
import type { ApiOrganisation } from "~/lib/organisations-api";

export const OrganisationProfileSection = component$((props: { organisation: ApiOrganisation | null }) => {
  if (!props.organisation) return null;
  const fields = organisationFieldsFlat(props.organisation);
  if (!fields.length) return null;

  return <DetailFieldGrid title="Organisation" icon="domain" fields={fields} />;
});
