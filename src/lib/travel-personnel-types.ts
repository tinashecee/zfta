/** Aligns with `travel_personnel` and API JSON (snake_case). */

export const PERSONNEL_GENDERS = ["male", "female"] as const;
export type PersonnelGender = (typeof PERSONNEL_GENDERS)[number];

export const PERSONNEL_ROLES = ["player", "coach", "medical", "admin"] as const;
export type PersonnelRole = (typeof PERSONNEL_ROLES)[number];

export const PERSONNEL_STATUSES = [
  "active",
  "withdrawn",
  "visa_pending",
  "visa_approved",
  "visa_rejected",
] as const;
export type PersonnelStatus = (typeof PERSONNEL_STATUSES)[number];

/** Payload for create/update (server sets `id` when omitted; include `id` when replacing existing rows). */
export type TravelPersonnelInput = {
  id?: string;
  full_name: string;
  gender: PersonnelGender;
  date_of_birth: string;
  national_id_number?: string | null;
  passport_number?: string | null;
  passport_expiry?: string | null;
  role: PersonnelRole;
  position?: string | null;
  status?: PersonnelStatus;
};

export type ApiTravelPersonnel = TravelPersonnelInput & {
  id: string;
  application_id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

/** Client-side row with stable key for lists before save. */
export type TravelPersonnelRow = TravelPersonnelInput & {
  _clientId: string;
  /** From GET when editing existing roster. */
  id?: string;
};

export function newPersonnelRow(partial?: Partial<TravelPersonnelInput>): TravelPersonnelRow {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `person-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  return {
    _clientId: id,
    full_name: partial?.full_name ?? "",
    gender: partial?.gender ?? "male",
    date_of_birth: partial?.date_of_birth ?? "",
    national_id_number: partial?.national_id_number ?? "",
    passport_number: partial?.passport_number ?? "",
    passport_expiry: partial?.passport_expiry ?? "",
    role: partial?.role ?? "player",
    position: partial?.position ?? "",
    status: partial?.status ?? "active",
  };
}

/**
 * Derive `player_count` / `officials_count` for the application payload from roster roles so they
 * match what the API expects (players vs coach/medical/admin).
 */
export function personnelRoleCountsForApplication(rows: readonly { role: PersonnelRole }[]): {
  player_count: number;
  officials_count: number;
} {
  let player_count = 0;
  let officials_count = 0;
  for (const row of rows) {
    if (row.role === "player") player_count += 1;
    else officials_count += 1;
  }
  return { player_count, officials_count };
}

export function rowToPayload(row: TravelPersonnelRow): TravelPersonnelInput {
  const base: TravelPersonnelInput = {
    full_name: row.full_name.trim(),
    gender: row.gender,
    date_of_birth: row.date_of_birth,
    role: row.role,
    status: row.status ?? "active",
  };
  const nid = row.national_id_number?.trim();
  const pn = row.passport_number?.trim();
  const pe = row.passport_expiry?.trim();
  const pos = row.position?.trim();
  if (nid) base.national_id_number = nid;
  if (pn) base.passport_number = pn;
  if (pe) base.passport_expiry = pe;
  if (pos) base.position = pos;
  if (row.id) base.id = row.id;
  return base;
}

export function apiPersonnelToRow(p: ApiTravelPersonnel): TravelPersonnelRow {
  return {
    _clientId: p.id,
    id: p.id,
    full_name: p.full_name,
    gender: p.gender,
    date_of_birth: p.date_of_birth?.slice(0, 10) ?? "",
    national_id_number: p.national_id_number ?? "",
    passport_number: p.passport_number ?? "",
    passport_expiry: p.passport_expiry?.slice(0, 10) ?? "",
    role: p.role,
    position: p.position ?? "",
    status: p.status ?? "active",
  };
}
