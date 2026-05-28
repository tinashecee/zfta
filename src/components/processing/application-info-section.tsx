import { component$ } from "@builder.io/qwik";
import { DetailFieldGrid } from "~/components/processing/detail-field-grid";
import { applicationFieldsFlat } from "~/lib/application-dossier-display";
import type { ApiApplication } from "~/lib/applications-api";

export const ApplicationInfoSection = component$((props: {
  app: ApiApplication;
  routingSportLabel?: string;
}) => {
  const fields = applicationFieldsFlat(props.app, { routingSportLabel: props.routingSportLabel });
  if (!fields.length) return null;

  return <DetailFieldGrid title="Application" icon="description" fields={fields} />;
});
