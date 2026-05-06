/** Days between calendar today (UTC date) and departure must be >= minLeadDays (inclusive of departure day). */
export function validateMinLeadDays(departureIsoDate: string, minLeadDays: number): string | null {
  const dep = String(departureIsoDate ?? "").trim();
  if (!dep) return "Departure date is required.";
  const d = new Date(`${dep}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return "Departure date is invalid.";
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const depUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const diffDays = Math.floor((depUtc - todayUtc) / (24 * 60 * 60 * 1000));
  if (diffDays < minLeadDays) {
    return `Application must be submitted at least ${minLeadDays} days before departure (currently ${diffDays} day(s) before).`;
  }
  return null;
}
