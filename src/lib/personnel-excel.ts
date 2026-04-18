/** Excel template + parsing for travel personnel (SheetJS). */
import type { PersonnelGender, PersonnelStatus, TravelPersonnelInput } from "~/lib/travel-personnel-types";
import { PERSONNEL_GENDERS, PERSONNEL_STATUSES } from "~/lib/travel-personnel-types";

export const PERSONNEL_TEMPLATE_FILENAME = "zfta-personnel-template.xlsx";

/** Header row in the template — matches DB / API fields. */
export const PERSONNEL_TEMPLATE_HEADERS = [
  "full_name",
  "gender",
  "date_of_birth",
  "national_id_number",
  "passport_number",
  "passport_expiry",
  "role",
  "position",
  "status",
] as const;

function normalizeHeader(s: string): string {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function normalizeGender(v: unknown): PersonnelGender | null {
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  if (s === "male" || s === "m") return "male";
  if (s === "female" || s === "f") return "female";
  return PERSONNEL_GENDERS.includes(s as PersonnelGender) ? (s as PersonnelGender) : null;
}

function normalizeStatus(v: unknown): PersonnelStatus | null {
  const s = String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (!s) return "active";
  return PERSONNEL_STATUSES.includes(s as PersonnelStatus) ? (s as PersonnelStatus) : null;
}

function formatDate(v: unknown): string {
  if (v == null || v === "") return "";
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return "";
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const t = Date.parse(s);
  if (Number.isNaN(t)) return "";
  const dt = new Date(t);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function downloadPersonnelTemplateXlsx(): Promise<void> {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([
    [...PERSONNEL_TEMPLATE_HEADERS],
    [
      "Example Player",
      "male",
      "1998-05-01",
      "63-1234567X00",
      "AB1234567",
      "2030-12-31",
      "player",
      "Striker",
      "active",
    ],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "personnel");
  XLSX.writeFile(wb, PERSONNEL_TEMPLATE_FILENAME);
}

export type ParsePersonnelResult =
  | { ok: true; rows: TravelPersonnelInput[] }
  | { ok: false; error: string; rowErrors?: string[] };

function rowToPersonnel(row: Record<string, unknown>, rowIndex: number): { ok: true; p: TravelPersonnelInput } | { ok: false; msg: string } {
  const mapped: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(row)) {
    mapped[normalizeHeader(k)] = val;
  }

  const full_name = String(mapped["full_name"] ?? "").trim();
  if (!full_name) return { ok: false, msg: `Row ${rowIndex}: full_name is required` };

  const gender = normalizeGender(mapped["gender"]);
  if (!gender) return { ok: false, msg: `Row ${rowIndex}: gender must be male or female` };

  const dob = formatDate(mapped["date_of_birth"]);
  if (!dob) return { ok: false, msg: `Row ${rowIndex}: date_of_birth is required (YYYY-MM-DD)` };

  const role = String(mapped["role"] ?? "").trim();
  if (!role) return { ok: false, msg: `Row ${rowIndex}: role is required` };

  const status = normalizeStatus(mapped["status"]) ?? "active";

  const p: TravelPersonnelInput = {
    full_name,
    gender,
    date_of_birth: dob,
    role,
    status,
  };

  const nid = String(mapped["national_id_number"] ?? "").trim();
  const pn = String(mapped["passport_number"] ?? "").trim();
  const pe = formatDate(mapped["passport_expiry"]);
  const pos = String(mapped["position"] ?? "").trim();
  if (nid) p.national_id_number = nid;
  if (pn) p.passport_number = pn;
  if (pe) p.passport_expiry = pe;
  if (pos) p.position = pos;

  return { ok: true, p };
}

export async function parsePersonnelExcelFile(file: File): Promise<ParsePersonnelResult> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const first = wb.SheetNames[0];
  if (!first) return { ok: false, error: "The workbook has no sheets." };

  const sheet = wb.Sheets[first];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (!rows.length) return { ok: false, error: "No data rows found under the header row." };

  const out: TravelPersonnelInput[] = [];
  const rowErrors: string[] = [];

  rows.forEach((raw, i) => {
    const rowIndex = i + 2;
    const mapped: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(raw)) {
      mapped[normalizeHeader(k)] = val;
    }
    const fn = String(mapped["full_name"] ?? "").trim();
    if (!fn) return;
    if (fn.toLowerCase() === "example player") return;

    const r = rowToPersonnel(raw, rowIndex);
    if (r.ok) {
      out.push(r.p);
    } else {
      rowErrors.push(r.msg);
    }
  });

  if (rowErrors.length && !out.length) {
    return { ok: false, error: "Could not import any rows.", rowErrors };
  }
  if (rowErrors.length) {
    return { ok: false, error: "Some rows had errors; fix the spreadsheet and try again.", rowErrors };
  }
  if (!out.length) return { ok: false, error: "No valid personnel rows found." };

  return { ok: true, rows: out };
}
