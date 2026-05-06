/**
 * Approvals data comes from `GET /api/v1/approvals?application_id=`.
 *
 * **Timeline** — Built in time order (submission, then approvals oldest→newest), then **reversed**
 * for display so the **latest** event is on top. Sort keys: `decided_at` when set, else
 * `updated_at` / `created_at` (stable tie-break: `id`). Title uses `body` (sport body code, SRC, …)
 * and `status`; each approval card shows **decided_at** and **decision_note** explicitly. When
 * there are no approval rows, synthetic “processing / outcome”
 * lines may appear after submission; `priority_reason` is listed after approvals (or after those
 * synthetics when there are no rows).
 *
 * **Governance check** — For the primary sport body and SRC we take the **latest** approval whose
 * `body` matches that stakeholder (substring match, case-insensitive). That row’s `status`
 * drives the pill. Bodies with no matching row show **pending**. If the approvals list is empty,
 * both are **pending** and completion is 0%.
 */
import type { ApiApproval } from "~/lib/approvals-api";

export function labelEventType(raw: string | undefined): string {
  const s = (raw ?? "").trim().toLowerCase();
  if (s === "tournament") return "Tournament";
  if (s === "friendly_match") return "Friendly match";
  return raw?.replace(/_/g, " ") ?? "—";
}

export function formatIsoDate(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = iso.slice(0, 10);
  return d || "—";
}

/** Locale date + time for timeline / submission lines. */
export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Prefer `submitted_at`, then `created_at`, for a single “submitted” instant. */
export function submittedInstantIso(app: {
  submitted_at?: string | null;
  created_at?: string | null;
}): string | null {
  const s = app.submitted_at?.trim();
  if (s) return s;
  const c = app.created_at?.trim();
  return c || null;
}

export function humanApplicationStatus(raw: string | undefined): string {
  if (!raw) return "—";
  return raw.replace(/_/g, " ");
}

/** Short label for hero status pills (applicant-facing). */
export function applicantFacingStatusLabel(status: string | undefined): string {
  const s = (status ?? "").toLowerCase();
  if (s === "approved") return "Approved";
  if (s === "certificate_issued") return "Certificate issued";
  if (s === "rejected") return "Not approved";
  if (s === "draft") return "Draft";
  if (
    s === "awaiting_body" ||
    s === "awaiting_zifa" ||
    s === "awaiting_primary_body" ||
    s === "awaiting_sport_body" ||
    s === "submitted"
  ) {
    return "Awaiting sport body review";
  }
  if (s === "awaiting_src" || s === "under_review") return "Awaiting SRC";
  if (s === "awaiting_information") return "Awaiting information";
  if (s === "awaiting_immigration") return "Processing"; // legacy API status — immigration stage removed
  if (s === "information_requested") return "Information requested";
  return humanApplicationStatus(status);
}

export type GovernanceStake = {
  name: string;
  subtitle: string;
  state: "approved" | "reviewing" | "pending" | "rejected";
};

function ts(iso?: string | null): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

const SRC_GOVERNANCE_SUBTITLE = "Sports Commission";

function matchBodyKey(body: string | null | undefined): "ZIFA" | "SRC" | null {
  const s = (body ?? "").toUpperCase();
  if (s.includes("ZIFA")) return "ZIFA";
  if (s.includes("SRC")) return "SRC";
  return null;
}

/** Map API approval status to governance pill state. */
export function approvalStatusToStakeState(status: string | undefined): GovernanceStake["state"] {
  const s = (status ?? "").toLowerCase();
  if (s.includes("approv") && !s.includes("un")) return "approved";
  if (s.includes("reject") || s.includes("denied")) return "rejected";
  if (s.includes("review") || s.includes("progress") || s.includes("assign")) return "reviewing";
  return "pending";
}

/** Instant used for sorting and “when” labels — decision time when available. */
export function approvalActivityInstantIso(a: ApiApproval): string | null {
  const d = a.decided_at?.trim();
  if (d) return d;
  const u = a.updated_at?.trim();
  if (u) return u;
  return a.created_at?.trim() ?? null;
}

function approvalTimelineVariant(a: ApiApproval): TimelineItem["variant"] {
  const s = (a.status ?? "").toLowerCase();
  if (s.includes("reject") || s.includes("info") || s.includes("request")) return "action";
  if (s.includes("approv")) return "success";
  return "success";
}

function governanceAllPending(primary: { code: string; label: string }): {
  rows: GovernanceStake[];
  completion: number;
} {
  const p = primary;
  const rows: GovernanceStake[] = [
    { name: p.label, subtitle: "Sport federation", state: "pending" },
    { name: "SRC", subtitle: SRC_GOVERNANCE_SUBTITLE, state: "pending" },
  ];
  return { rows, completion: 0 };
}

function approvalMatchesBodyCode(a: ApiApproval, bodyCode: string): boolean {
  const want = bodyCode.trim().toUpperCase();
  if (!want) return false;

  // Newer APIs may store the specific sport-body routing code separately from the enum `body`.
  const gotCode = ((a as unknown as { body_code?: string | null }).body_code ?? "").trim().toUpperCase();
  if (gotCode) {
    if (gotCode === want) return true;
    if (gotCode.includes(want) || want.includes(gotCode)) return true;
    return false;
  }

  const got = (a.body ?? "").trim().toUpperCase();
  if (!got) return false;
  // If the API only stores the enum `SPORT_BODY` without a `body_code`,
  // allow it to satisfy the primary sport-body stake.
  if (got === "SPORT_BODY" && want !== "SRC") return true;
  if (got === want) return true;
  if (got.includes(want) || want.includes(got)) return true;
  return false;
}

/**
 * Governance from approval rows; empty list ⇒ all bodies pending.
 * First column is the sport-specific body (`primary`), then SRC.
 */
export function governanceFromApprovals(
  _applicationStatus: string | undefined,
  approvals: ApiApproval[] | null | undefined,
  primary?: { code: string; label: string },
): { rows: GovernanceStake[]; completion: number } {
  const p = primary ?? { code: "ZIFA", label: "ZIFA" };
  if (!approvals?.length) {
    return governanceAllPending(p);
  }

  const pair: Array<{ code: string; label: string; subtitle: string }> = [
    { code: p.code, label: p.label, subtitle: "Sport federation" },
    { code: "SRC", label: "SRC", subtitle: SRC_GOVERNANCE_SUBTITLE },
  ];

  const sorted = [...approvals].sort(
    (a, b) => ts(approvalActivityInstantIso(b)) - ts(approvalActivityInstantIso(a)),
  );
  const latest = new Map<string, ApiApproval>();
  for (const a of sorted) {
    for (const t of pair) {
      if (approvalMatchesBodyCode(a, t.code) && !latest.has(t.code)) {
        latest.set(t.code, a);
      }
    }
  }

  const rows: GovernanceStake[] = pair.map((t) => {
    const ap = latest.get(t.code);
    return {
      name: t.label,
      subtitle: t.subtitle,
      state: ap ? approvalStatusToStakeState(ap.status) : "pending",
    };
  });

  const approvedCount = rows.filter((r) => r.state === "approved").length;
  const completion = Math.min(100, Math.round((approvedCount / 2) * 100));
  return { rows, completion };
}

export type TimelineItem = {
  when: string;
  eyebrow: string;
  title: string;
  body?: string;
  variant: "action" | "success" | "neutral";
  /** Approval rows: labeled timestamp + decision_note in the UI. */
  approvalDetail?: {
    /** "Decided at" when `decided_at` is set on the API row; otherwise "Recorded at". */
    timeLabel: "Decided at" | "Recorded at";
    decidedAt: string;
    decisionNote: string | null;
  };
};

/** Formatted decided_at for display, or activity time if no decision timestamp yet. */
export function formatApprovalDecidedAtDisplay(a: ApiApproval): string {
  const decided = a.decided_at?.trim();
  if (decided && formatDateTime(decided)) return formatDateTime(decided);
  const fallback = approvalActivityInstantIso(a);
  if (fallback && formatDateTime(fallback)) return formatDateTime(fallback);
  return "—";
}

function normStatus(s: string | undefined): string {
  return (s ?? "").toLowerCase().replace(/\s+/g, "_");
}

export function relativeActivityLabel(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatIsoDate(iso);
}

export function buildApplicationTimeline(app: {
  status?: string;
  priority_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}): TimelineItem[] {
  return buildMergedApplicationTimeline(app, null);
}

/**
 * Builds the applicant timeline in **logical time order** (submission → approvals ascending →
 * fallbacks → priority), then **reverses** so the **newest** card appears **first** in the list.
 */
export function buildMergedApplicationTimeline(
  app: {
    status?: string;
    priority_reason?: string | null;
    submitted_at?: string | null;
    created_at?: string;
    updated_at?: string;
  },
  approvals: ApiApproval[] | null | undefined,
): TimelineItem[] {
  const items: TimelineItem[] = [];
  const hasApprovals = (approvals?.length ?? 0) > 0;

  const sortKeyApproval = (a: ApiApproval): number => {
    const k = approvalActivityInstantIso(a);
    if (k) return ts(k);
    return ts(a.created_at) || 0;
  };

  const sortedApprovals = [...(approvals ?? [])].sort((a, b) => {
    const da = sortKeyApproval(a);
    const db = sortKeyApproval(b);
    if (da !== db) return da - db;
    return a.id.localeCompare(b.id);
  });

  const submittedTs = submittedInstantIso(app);
  const submittedTimestampNote =
    submittedTs && formatDateTime(submittedTs)
      ? `\n\nSubmitted at: ${formatDateTime(submittedTs)}.`
      : "";

  const submissionIso = app.submitted_at?.trim() || app.created_at;
  if (submissionIso) {
    const whenDisplay =
      app.submitted_at?.trim() && formatDateTime(app.submitted_at)
        ? formatDateTime(app.submitted_at)
        : relativeActivityLabel(submissionIso) || formatDateTime(submissionIso);
    items.push({
      when: whenDisplay,
      eyebrow: "Submission",
      title: "Application submitted",
      body: "Initial travel dossier and supporting documents were received." + submittedTimestampNote,
      variant: "neutral",
    });
  }

  const st = normStatus(app.status);

  if (hasApprovals) {
    for (const a of sortedApprovals) {
      const iso = approvalActivityInstantIso(a) ?? undefined;
      const bodyKey = matchBodyKey(a.body);
      const bodyLabel = bodyKey ?? ((a.body ?? "").trim() || "Review");
      const statusLabel = (a.status ?? "updated").replace(/_/g, " ");
      const note = a.decision_note?.trim() ?? null;
      const hasDecidedAt = Boolean(a.decided_at?.trim());
      items.push({
        when: relativeActivityLabel(iso) || "Recent",
        eyebrow: "Approval",
        title: `${bodyLabel} — ${statusLabel}`,
        variant: approvalTimelineVariant(a),
        approvalDetail: {
          timeLabel: hasDecidedAt ? "Decided at" : "Recorded at",
          decidedAt: formatApprovalDecidedAtDisplay(a),
          decisionNote: note && note.length > 0 ? note : null,
        },
      });
    }
  } else {
    if (st === "approved") {
      items.push({
        when: "Recent",
        eyebrow: "Outcome",
        title: "Application approved",
        body: "Governance checks for this travel request are complete." + submittedTimestampNote,
        variant: "success",
      });
    } else if (
      st &&
      st !== "draft" &&
      st !== "rejected" &&
      st !== "awaiting_body" &&
      st !== "awaiting_zifa" &&
      st !== "awaiting_primary_body" &&
      st !== "awaiting_sport_body" &&
      st !== "submitted" &&
      st !== "awaiting_src" &&
      st !== "under_review" &&
      st !== "awaiting_immigration"
    ) {
      items.push({
        when: "Recent",
        eyebrow: "Processing",
        title: "Application in progress",
        body: "Your dossier is being processed by the relevant authorities." + submittedTimestampNote,
        variant: "success",
      });
    } else if (
      st === "awaiting_body" ||
      st === "awaiting_zifa" ||
      st === "awaiting_primary_body" ||
      st === "awaiting_sport_body" ||
      st === "submitted"
    ) {
      items.push({
        when: "Recent",
        eyebrow: "Processing",
        title: "Awaiting sport body review",
        body: "Your dossier is queued for the relevant national sport body." + submittedTimestampNote,
        variant: "success",
      });
    } else if (st === "awaiting_src" || st === "under_review" || st === "awaiting_immigration") {
      items.push({
        when: "Recent",
        eyebrow: "Processing",
        title: st === "awaiting_immigration" ? "In review" : "Awaiting SRC",
        body:
          st === "awaiting_immigration"
            ? "This file is in a legacy processing state on the server; the workflow no longer includes a separate immigration stage." +
              submittedTimestampNote
            : "Sport body review is complete; your dossier is with SRC." + submittedTimestampNote,
        variant: "success",
      });
    }
  }

  const pr = app.priority_reason?.trim();
  if (pr) {
    items.push({
      when: "Today",
      eyebrow: "Action required",
      title: "Reviewer request",
      body: pr,
      variant: "action",
    });
  }

  items.reverse();
  return items;
}
