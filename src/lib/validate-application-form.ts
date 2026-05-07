/**
 * Client-side checks before POST /api/v1/applications (matches server required fields).
 */
export function validateNewApplicationFormData(fd: FormData): string | null {
  // Outgoing tours have a stricter/minimal create body now; validate only what the server requires.
  const applicationType = String(fd.get("application_type") ?? "").trim();
  if (applicationType === "outgoing_tour") {
    const host_country = String(fd.get("host_country") ?? "").trim();
    if (!host_country) return "Host country is required.";
    const departure_date = String(fd.get("departure_date") ?? "").trim();
    if (!departure_date) return "Departure date is required.";
    const return_date = String(fd.get("return_date") ?? "").trim();
    if (!return_date) return "Return date is required.";
    if (return_date < departure_date) return "Return date must be on or after the departure date.";
    const desc = String(fd.get("event_description") ?? "").trim();
    if (!desc) return "Purpose / benefits (2.8) is required.";
    return null;
  }
  if (applicationType === "incoming_tour") {
    const host_country = String(fd.get("host_country") ?? "").trim();
    if (!host_country) return "Host country is required.";
    const departure_date = String(fd.get("departure_date") ?? "").trim();
    if (!departure_date) return "Arrival date is required.";
    const return_date = String(fd.get("return_date") ?? "").trim();
    if (!return_date) return "Departure date is required.";
    if (return_date < departure_date) return "Departure date must be on or after the arrival date.";
    const represented_country = String(fd.get("represented_country") ?? "").trim();
    if (!represented_country) return "Country represented is required.";
    const training_facility_name = String(fd.get("training_facility_name") ?? "").trim();
    if (!training_facility_name) return "Accommodation establishment (1.7) is required.";
    return null;
  }
  if (applicationType === "hosting_competition") {
    const host_country = String(fd.get("host_country") ?? "").trim();
    if (!host_country) return "Host country is required.";
    const start_date = String(fd.get("start_date") ?? "").trim();
    if (!start_date) return "Start date is required.";
    const end_date = String(fd.get("end_date") ?? "").trim();
    if (!end_date) return "End date is required.";
    if (end_date < start_date) return "End date must be on or after the start date.";
    const event_display_name = String(fd.get("event_display_name") ?? "").trim();
    if (!event_display_name) return "Event display name is required.";
    const event_type = String(fd.get("event_type") ?? "").trim();
    if (!event_type) return "Event type is required.";
    return null;
  }

  const event_type = String(fd.get("event_type") ?? "").trim();
  if (!event_type) {
    return "Select event type: tournament or friendly match.";
  }

  const host_country = String(fd.get("host_country") ?? "").trim();
  if (!host_country) {
    return "Host country is required.";
  }

  const departure_date = String(fd.get("departure_date") ?? "").trim();
  if (!departure_date) {
    return "Departure date is required.";
  }

  const return_date = String(fd.get("return_date") ?? "").trim();
  if (!return_date) {
    return "Return date is required.";
  }

  if (return_date < departure_date) {
    return "Return date must be on or after the departure date.";
  }

  const age_group = String(fd.get("age_group") ?? "").trim();
  if (!age_group) {
    return "Age group is required.";
  }

  const gender_category = String(fd.get("gender_category") ?? "").trim();
  if (!gender_category) {
    return "Gender category is required.";
  }

  const travel_mode = String(fd.get("travel_mode") ?? "").trim();
  if (!travel_mode) {
    return "Travel mode is required.";
  }

  const tournament_name = String(fd.get("tournament_name") ?? "").trim();
  const tournament_name_other = String(fd.get("tournament_name_other") ?? "").trim();
  if (tournament_name === "Other" && !tournament_name_other) {
    return 'When tournament category is "Other", specify the tournament name.';
  }

  const event_display_name_custom = String(fd.get("event_display_name") ?? "").trim();
  const tn = tournament_name || "Other";
  const synthetic =
    event_display_name_custom ||
    [tn !== "Other" ? tn : tournament_name_other || "Event", host_country].filter(Boolean).join(" — ");

  if (!String(synthetic).trim()) {
    return "Event display name is required (fill event title or host country).";
  }

  return null;
}

/** After building the `application` object — catch empty strings / missing keys before POST. */
export function validateApplicationPayload(application: Record<string, unknown>): string | null {
  const required: Array<{ key: string; label: string }> = [
    { key: "organisation_id", label: "Organisation" },
    { key: "sport", label: "Sport" },
    { key: "event_type", label: "Event type" },
    { key: "event_display_name", label: "Event display name" },
    { key: "host_country", label: "Host country" },
    { key: "departure_date", label: "Departure date" },
    { key: "return_date", label: "Return date" },
    { key: "age_group", label: "Age group" },
    { key: "gender_category", label: "Gender category" },
    { key: "travel_mode", label: "Travel mode" },
  ];

  for (const { key, label } of required) {
    const v = application[key];
    if (v === undefined || v === null) {
      return `${label} is missing — please refresh and try again.`;
    }
    if (typeof v === "string" && v.trim() === "") {
      return `${label} cannot be empty.`;
    }
  }

  return null;
}
