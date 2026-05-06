/**
 * Maps the new-application form (`name` attributes) to API `application` object (snake_case).
 */
export function buildApplicationRecordFromForm(
  fd: FormData,
  opts: {
    organisation_id: string;
    support_documents: string | null;
    travel_documents: string | null;
    /** When set (e.g. copied from organisation profile), sent as `sport` on the application. */
    sport?: string | null;
    status?:
      | "draft"
      | "awaiting_body"
      | "awaiting_zifa"
      | "awaiting_primary_body"
      | "awaiting_sport_body";
    /** Until backend adds a column; API may ignore unknown keys. */
    application_type?: string | null;
    /** Free-text purpose / benefits (maps to API `event_description` when set). */
    event_description?: string | null;
    /** e.g. accommodation establishment for incoming tours (maps to API `training_facility_name`). */
    training_facility_name?: string | null;
  },
): Record<string, unknown> {
  const event_type = String(fd.get("event_type") ?? "tournament").trim();
  const tournament_name = String(fd.get("tournament_name") ?? "").trim();
  const tournament_name_other = String(fd.get("tournament_name_other") ?? "").trim() || null;
  const host_country = String(fd.get("host_country") ?? "").trim();
  const host_city = String(fd.get("host_city") ?? "").trim() || null;
  const departure_date = String(fd.get("departure_date") ?? "").trim();
  const return_date = String(fd.get("return_date") ?? "").trim();
  const player_count = Math.min(100, Math.max(1, Number(fd.get("player_count")) || 1));
  const officials_count = Math.min(50, Math.max(0, Number(fd.get("officials_count")) || 0));
  const age_group = String(fd.get("age_group") ?? "senior").trim();
  const gender_category = String(fd.get("gender_category") ?? "male").trim();
  const travel_mode = String(fd.get("travel_mode") ?? "air").trim();
  const port_of_entry = String(fd.get("port_of_entry") ?? "").trim() || null;
  const port_of_exit = port_of_entry;
  const declaration_accepted = fd.get("declaration_accepted") === "on";
  const opponent_team_name = String(fd.get("opponent_team_name") ?? "").trim() || null;
  const opponent_team_country = String(fd.get("opponent_team_country") ?? "").trim() || null;
  const training_facility_name_from_form = String(fd.get("training_facility_name") ?? "").trim() || null;
  const event_display_name_custom = String(fd.get("event_display_name") ?? "").trim();
  const event_description_from_form = String(fd.get("event_description") ?? "").trim() || null;
  const sport =
    opts.sport !== undefined
      ? String(opts.sport ?? "").trim().slice(0, 255) || null
      : String(fd.get("sport") ?? "").trim().slice(0, 255) || null;

  const tn = tournament_name || "Other";
  const event_display_name = (() => {
    if (event_display_name_custom.trim()) return event_display_name_custom.trim();
    const parts = [tn !== "Other" ? tn : tournament_name_other || "Event", host_country].filter(
      (p) => String(p).trim() !== "",
    );
    const joined = parts.join(" — ").trim();
    if (joined) return joined;
    return `${event_type} — ${host_country}`.trim() || "Travel authorization";
  })();

  const training_facility_name =
    opts.training_facility_name != null && String(opts.training_facility_name).trim() !== ""
      ? String(opts.training_facility_name).trim()
      : training_facility_name_from_form;

  const base: Record<string, unknown> = {
    organisation_id: String(opts.organisation_id).trim(),
    sport,
    event_type,
    tournament_name: tn === "Other" ? "Other" : tn,
    tournament_name_other: tn === "Other" ? tournament_name_other : null,
    opponent_team_name,
    opponent_team_country,
    ...(training_facility_name ? { training_facility_name } : {}),
    event_display_name,
    host_country,
    host_city,
    port_of_entry,
    port_of_exit,
    departure_date,
    return_date,
    player_count,
    officials_count,
    age_group,
    gender_category,
    travel_mode,
    emergency_contact_name: String(fd.get("emergency_contact_name") ?? "").trim() || null,
    emergency_contact_mobile: String(fd.get("emergency_contact_mobile") ?? "").trim() || null,
    emergency_contact_relation: String(fd.get("emergency_contact_relation") ?? "").trim() || null,
    declaration_accepted,
    support_documents: opts.support_documents,
    travel_documents: opts.travel_documents,
    status: opts.status ?? "awaiting_body",
    priority: "normal",
  };

  const desc =
    opts.event_description != null && String(opts.event_description).trim() !== ""
      ? String(opts.event_description).trim()
      : event_description_from_form;
  if (desc) base.event_description = desc;

  const at = opts.application_type != null ? String(opts.application_type).trim() : "";
  if (at) base.application_type = at;

  return base;
}
