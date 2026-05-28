import { formatIsoDate } from "~/lib/application-display";
import { hasDisplayValue } from "~/lib/application-dossier-display";
import type { TravelPersonnelRow } from "~/lib/travel-personnel-types";

export type PersonnelViewColumnKey =
  | "full_name"
  | "gender"
  | "date_of_birth"
  | "national_id_number"
  | "passport_number"
  | "country_of_origin"
  | "passport_expiry"
  | "role"
  | "position"
  | "status";

export type PersonnelViewColumn = {
  key: PersonnelViewColumnKey;
  label: string;
  isDate?: boolean;
};

const PERSONNEL_VIEW_COLUMNS: PersonnelViewColumn[] = [
  { key: "full_name", label: "Name" },
  { key: "gender", label: "Gender" },
  { key: "date_of_birth", label: "Date of birth", isDate: true },
  { key: "national_id_number", label: "National ID" },
  { key: "passport_number", label: "Passport" },
  { key: "country_of_origin", label: "Country of origin" },
  { key: "passport_expiry", label: "Passport expiry", isDate: true },
  { key: "role", label: "Role" },
  { key: "position", label: "Position" },
  { key: "status", label: "Status" },
];

function personnelFieldValue(row: TravelPersonnelRow, key: PersonnelViewColumnKey): unknown {
  if (key === "status") return row.status ?? "active";
  return row[key];
}

export function visiblePersonnelViewColumns(rows: readonly TravelPersonnelRow[]): PersonnelViewColumn[] {
  if (!rows.length) return [];

  return PERSONNEL_VIEW_COLUMNS.filter((col) => {
    if (col.key === "full_name") return true;
    return rows.some((row) => hasDisplayValue(personnelFieldValue(row, col.key)));
  });
}

export function formatPersonnelCellValue(
  row: TravelPersonnelRow,
  key: PersonnelViewColumnKey,
  col?: PersonnelViewColumn,
): string {
  const raw = personnelFieldValue(row, key);
  if (!hasDisplayValue(raw)) return "—";
  if (col?.isDate) {
    const formatted = formatIsoDate(String(raw));
    return formatted || String(raw);
  }
  return String(raw);
}
