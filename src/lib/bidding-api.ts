import { apiFetchFormData, apiFetchJson } from "~/lib/auth";
import { CATALOG_SPORT_KEYS } from "~/lib/catalog-sports";

/** Hosting bidding module — `/api/hosting/*`. */

export type ApiBiddingEventStatus = "draft" | "open_for_bids" | "closed" | "awarded" | string;

export type ApiBiddingEvent = {
  id: string;
  title: string;
  sport?: string | null;
  description?: string | null;
  location?: string | null;
  event_start_date?: string | null;
  event_end_date?: string | null;
  bid_deadline?: string | null;
  max_bids?: number | null;
  required_documents?: string[] | null;
  status?: ApiBiddingEventStatus | null;
  bid_pack_url?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  bid_count?: number | null;
  awarded_to?: string | null;
};

export type CreateHostingEventInput = {
  title: string;
  sport?: string | null;
  description?: string | null;
  location?: string | null;
  event_start_date?: string | null;
  event_end_date?: string | null;
  bid_deadline?: string | null;
  max_bids?: number | null;
  required_documents?: string[] | null;
  bid_pack_url?: string | null;
};

export type ApiBid = {
  id: string;
  event_id?: string | null;
  sport_body_id?: string | null;
  status?: string | null;
  organisation_name?: string | null;
  // Narrative / bid form fields (optional; editable in draft/info_requested).
  event_objectives?: string | null;
  expected_benefits?: string | null;
  infrastructure_plan?: string | null;
  competition_plan?: string | null;
  volunteer_plan?: string | null;
  transport_plan?: string | null;
  security_plan?: string | null;
  accommodation_plan?: string | null;
  catering_plan?: string | null;
  marketing_plan?: string | null;
  risk_management_plan?: string | null;
  communication_strategy?: string | null;
  total_budget?: string | number | null;
  government_funding_pct?: string | number | null;
  income_breakdown?: string | null;
  expenditure_breakdown?: string | null;
  legacy_plan?: string | null;
  submitted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  event_title?: string | null;
  event_bid_deadline?: string | null;
  document_count?: number | null;
  has_missing_docs?: boolean | null;
  admin_notes?: string | null;
};

/** One uploaded file row for a bid (`bid_documents` table). */
export type ApiBidDocument = {
  id: string;
  document_type: string;
  file_name?: string | null;
  file_url?: string | null;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  uploaded_at?: string | null;
};

export type BidWorkspacePayload = {
  bid: ApiBid;
  event: ApiBiddingEvent | null;
  documents: ApiBidDocument[];
};

const HOSTING_BASE = "/api/hosting";

function unwrapRecordArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const k of ["events", "data", "items", "results"]) {
      const v = o[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

function unwrapBidsArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const k of ["bids", "data", "items", "results"]) {
      const v = o[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

function pickStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function pickNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function parseHostingEvent(raw: unknown): ApiBiddingEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = pickStr(o.id);
  if (!id) return null;
  const req = o.required_documents;
  const required_documents = Array.isArray(req) ? req.filter((x): x is string => typeof x === "string") : null;
  return {
    id,
    title: pickStr(o.title) || "—",
    sport: pickStr(o.sport) || null,
    description: pickStr(o.description) || null,
    location: pickStr(o.location) || null,
    event_start_date: pickStr(o.event_start_date) || null,
    event_end_date: pickStr(o.event_end_date) || null,
    bid_deadline: pickStr(o.bid_deadline) || null,
    max_bids: pickNum(o.max_bids),
    required_documents,
    status: pickStr(o.status) || null,
    bid_pack_url: pickStr(o.bid_pack_url) || null,
    created_by: pickStr(o.created_by) || null,
    created_at: pickStr(o.created_at) || null,
    updated_at: pickStr(o.updated_at) || null,
    bid_count: pickNum(o.bid_count),
    awarded_to: pickStr(o.awarded_to) || null,
  };
}

export function parseHostingBid(raw: unknown): ApiBid | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = pickStr(o.id);
  if (!id) return null;
  return {
    id,
    event_id: pickStr(o.event_id) || null,
    sport_body_id: pickStr(o.sport_body_id) || null,
    status: pickStr(o.status) || null,
    organisation_name: pickStr(o.organisation_name) || null,
    event_objectives: pickStr(o.event_objectives) || null,
    expected_benefits: pickStr(o.expected_benefits) || null,
    infrastructure_plan: pickStr(o.infrastructure_plan) || null,
    competition_plan: pickStr(o.competition_plan) || null,
    volunteer_plan: pickStr(o.volunteer_plan) || null,
    transport_plan: pickStr(o.transport_plan) || null,
    security_plan: pickStr(o.security_plan) || null,
    accommodation_plan: pickStr(o.accommodation_plan) || null,
    catering_plan: pickStr(o.catering_plan) || null,
    marketing_plan: pickStr(o.marketing_plan) || null,
    risk_management_plan: pickStr(o.risk_management_plan) || null,
    communication_strategy: pickStr(o.communication_strategy) || null,
    total_budget: (o.total_budget as string | number | null | undefined) ?? null,
    government_funding_pct: (o.government_funding_pct as string | number | null | undefined) ?? null,
    income_breakdown: pickStr(o.income_breakdown) || null,
    expenditure_breakdown: pickStr(o.expenditure_breakdown) || null,
    legacy_plan: pickStr(o.legacy_plan) || null,
    submitted_at: pickStr(o.submitted_at) || null,
    created_at: pickStr(o.created_at) || null,
    updated_at: pickStr(o.updated_at) || null,
    event_title: pickStr(o.event_title) || null,
    event_bid_deadline: pickStr(o.event_bid_deadline) || null,
    document_count: pickNum(o.document_count),
    has_missing_docs: typeof o.has_missing_docs === "boolean" ? o.has_missing_docs : null,
    admin_notes: pickStr(o.admin_notes) || null,
  };
}

function parseBidDocument(raw: unknown): ApiBidDocument | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = pickStr(o.id);
  const document_type = pickStr(o.document_type);
  if (!id || !document_type) return null;
  return {
    id,
    document_type,
    file_name: pickStr(o.file_name) || null,
    file_url: pickStr(o.file_url) || null,
    file_size_bytes: pickNum(o.file_size_bytes),
    mime_type: pickStr(o.mime_type) || null,
    uploaded_at: pickStr(o.uploaded_at) || null,
  };
}

function unwrapDocumentsArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const k of ["documents", "bid_documents", "data", "items"]) {
      const v = o[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

/**
 * Normalizes `GET /api/hosting/bids/{id}` (or nested shapes) into bid + event + documents.
 */
export function parseBidWorkspacePayload(raw: unknown): BidWorkspacePayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  // Backend contract: GET /api/hosting/bids/{id} returns a hostingBidResp (bid object) with inline `documents`.
  // Also support nested shapes defensively (e.g. `{ bid: {...}, documents: [...] }`).
  const nested = o.bid ?? o.data ?? raw;
  let bid = parseHostingBid(nested);
  if (!bid) return null;

  const evRaw = o.event;
  const event = evRaw != null && typeof evRaw === "object" ? parseHostingEvent(evRaw) : null;

  const nestedObj = nested && typeof nested === "object" ? (nested as Record<string, unknown>) : null;
  const docsSource = nestedObj?.documents ?? o.documents ?? o.bid_documents;
  const documents = unwrapDocumentsArray(docsSource)
    .map(parseBidDocument)
    .filter((x): x is ApiBidDocument => x != null);

  return { bid, event, documents };
}

async function fetchBidWorkspaceViaListAndEvent(bidId: string): Promise<
  { ok: true; data: BidWorkspacePayload } | { ok: false; status: number; error: string }
> {
  const list = await listMyBids({ limit: 500, offset: 0 });
  if (!list.ok) return list;
  const bid = list.data.find((b) => b.id === bidId);
  if (!bid) return { ok: false, status: 404, error: "Bid not found." };
  const eid = String(bid.event_id ?? "").trim();
  if (!eid) {
    return {
      ok: true,
      data: { bid, event: null, documents: [] },
    };
  }
  const evR = await getHostingEvent(eid);
  if (!evR.ok) {
    return {
      ok: true,
      data: { bid, event: null, documents: [] },
    };
  }
  return {
    ok: true,
    data: {
      bid,
      event: evR.data.event,
      documents: [],
    },
  };
}

/**
 * `GET /api/hosting/bids/{id}` when available; otherwise composes from `listMyBids` + `getHostingEvent`.
 */
export async function loadBidWorkspaceContext(
  bidId: string,
): Promise<{ ok: true; data: BidWorkspacePayload } | { ok: false; status: number; error: string }> {
  const trimmed = bidId.trim();
  if (!trimmed) return { ok: false, status: 400, error: "Missing bid id." };

  const direct = await apiFetchJson<unknown>(`${HOSTING_BASE}/bids/${encodeURIComponent(trimmed)}`);
  if (direct.ok) {
    const parsed = parseBidWorkspacePayload(direct.data);
    if (parsed) {
      if (!parsed.event && parsed.bid.event_id) {
        const evR = await getHostingEvent(String(parsed.bid.event_id));
        if (evR.ok) {
          return {
            ok: true,
            data: {
              ...parsed,
              event: evR.data.event,
            },
          };
        }
      }
      return { ok: true, data: parsed };
    }
    return fetchBidWorkspaceViaListAndEvent(trimmed);
  }

  if (direct.status === 404 || direct.status === 405) {
    return fetchBidWorkspaceViaListAndEvent(trimmed);
  }

  return direct;
}

/** `POST /api/hosting/bids/{id}/documents` — multipart `document_type` + `file`. */
export async function uploadHostingBidDocument(
  bidId: string,
  params: { document_type: string; file: File },
): Promise<{ ok: true; data: BidWorkspacePayload } | { ok: false; status: number; error: string }> {
  const fd = new FormData();
  fd.append("document_type", params.document_type.trim());
  fd.append("file", params.file);
  const r = await apiFetchFormData<unknown>(
    `${HOSTING_BASE}/bids/${encodeURIComponent(bidId.trim())}/documents`,
    fd,
  );
  if (!r.ok) return r;
  const parsed = parseBidWorkspacePayload(r.data);
  if (!parsed) return { ok: false, status: 500, error: "Invalid upload response." };
  return { ok: true, data: parsed };
}

/** `POST /api/hosting/bids/{id}/submit` — final submission after required docs are present. */
export async function submitHostingBid(
  bidId: string,
): Promise<
  | { ok: true; data: BidWorkspacePayload }
  | { ok: false; status: number; error: string; missing?: string[] }
> {
  const r = await apiFetchJson<unknown>(`${HOSTING_BASE}/bids/${encodeURIComponent(bidId.trim())}/submit`, {
    method: "POST",
  });
  if (!r.ok) {
    const miss = parseMissingListFromError(r.error);
    return miss?.length ? { ...r, missing: miss } : r;
  }
  const parsed = parseBidWorkspacePayload(r.data);
  if (!parsed) return { ok: false, status: 500, error: "Invalid submit response." };
  return { ok: true, data: parsed };
}

/** `PATCH /api/hosting/bids/{id}` — narrative fields update (draft/info_requested only). */
export async function patchHostingBid(
  bidId: string,
  patch: Record<string, unknown>,
): Promise<{ ok: true; data: BidWorkspacePayload } | { ok: false; status: number; error: string }> {
  const r = await apiFetchJson<unknown>(`${HOSTING_BASE}/bids/${encodeURIComponent(bidId.trim())}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  if (!r.ok) return r;
  const parsed = parseBidWorkspacePayload(r.data);
  if (!parsed) return { ok: false, status: 500, error: "Invalid patch response." };
  return { ok: true, data: parsed };
}

function parseMissingListFromError(error: string): string[] | null {
  // `readApiErrorMessage` formats: "<error> — Missing: a, b"
  const idx = error.indexOf("Missing:");
  if (idx < 0) return null;
  const tail = error.slice(idx + "Missing:".length).trim();
  if (!tail) return null;
  const parts = tail
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : null;
}

/** Which required document type strings already have an uploaded row. */
export function uploadedBidDocumentTypes(documents: ApiBidDocument[]): Set<string> {
  return new Set(documents.map((d) => d.document_type.trim()).filter(Boolean));
}

/** Local completeness check when `has_missing_docs` is absent. */
export function bidHasAllRequiredDocuments(
  requiredTypes: string[] | null | undefined,
  documents: ApiBidDocument[],
): boolean {
  const req = (requiredTypes ?? []).map((s) => String(s).trim()).filter(Boolean);
  if (req.length === 0) return true;
  const uploaded = uploadedBidDocumentTypes(documents);
  return req.every((t) => uploaded.has(t));
}

function hostingEventsQuery(params: { limit?: number; offset?: number; status?: string }): string {
  const q = new URLSearchParams();
  q.set("limit", String(params.limit ?? 50));
  q.set("offset", String(params.offset ?? 0));
  if (params.status?.trim()) q.set("status", params.status.trim());
  return q.toString();
}

export async function listHostingEvents(params?: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<{ ok: true; data: ApiBiddingEvent[] } | { ok: false; status: number; error: string }> {
  const qs = hostingEventsQuery({
    limit: params?.limit ?? 100,
    offset: params?.offset ?? 0,
    status: params?.status,
  });
  const r = await apiFetchJson<unknown>(`${HOSTING_BASE}/events?${qs}`);
  if (!r.ok) return r;
  const rows = unwrapRecordArray(r.data)
    .map(parseHostingEvent)
    .filter((x): x is ApiBiddingEvent => x != null);
  return { ok: true, data: rows };
}

export async function listBiddingEvents(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ ok: true; data: ApiBiddingEvent[] } | { ok: false; status: number; error: string }> {
  return listHostingEvents({ ...params, status: undefined });
}

export async function createHostingEvent(
  body: CreateHostingEventInput,
): Promise<{ ok: true; data: ApiBiddingEvent } | { ok: false; status: number; error: string }> {
  const r = await apiFetchJson<unknown>(`${HOSTING_BASE}/events`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!r.ok) return r;
  const ev = parseHostingEvent(r.data);
  if (!ev) return { ok: false, status: 500, error: "Invalid create event response." };
  return { ok: true, data: ev };
}

export async function publishHostingEvent(
  eventId: string,
): Promise<{ ok: true; data: ApiBiddingEvent } | { ok: false; status: number; error: string }> {
  const r = await apiFetchJson<unknown>(`${HOSTING_BASE}/events/${encodeURIComponent(eventId)}/publish`, {
    method: "POST",
  });
  if (!r.ok) return r;
  const ev = parseHostingEvent(r.data);
  if (!ev) return { ok: false, status: 500, error: "Invalid publish response." };
  return { ok: true, data: ev };
}

export async function patchHostingEvent(
  eventId: string,
  patch: Record<string, unknown>,
): Promise<{ ok: true; data: ApiBiddingEvent } | { ok: false; status: number; error: string }> {
  const r = await apiFetchJson<unknown>(`${HOSTING_BASE}/events/${encodeURIComponent(eventId)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  if (!r.ok) return r;
  const ev = parseHostingEvent(r.data);
  if (!ev) return { ok: false, status: 500, error: "Invalid patch event response." };
  return { ok: true, data: ev };
}

export async function getHostingEventBids(
  eventId: string,
): Promise<{ ok: true; data: ApiBid[] } | { ok: false; status: number; error: string }> {
  const r = await apiFetchJson<unknown>(`${HOSTING_BASE}/events/${encodeURIComponent(eventId)}/bids`);
  if (!r.ok) return r;
  const rows = unwrapBidsArray(r.data)
    .map(parseHostingBid)
    .filter((x): x is ApiBid => x != null);
  return { ok: true, data: rows };
}

export async function requestHostingBidInfo(
  bidId: string,
  body: { message: string; deadline: string },
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; error: string }> {
  return apiFetchJson<unknown>(`${HOSTING_BASE}/bids/${encodeURIComponent(bidId)}/request-info`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function approveHostingBid(
  bidId: string,
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; error: string }> {
  return apiFetchJson<unknown>(`${HOSTING_BASE}/bids/${encodeURIComponent(bidId)}/approve`, {
    method: "POST",
  });
}

export async function getHostingEvent(id: string): Promise<
  | {
      ok: true;
      data: {
        event: ApiBiddingEvent;
        bids?: unknown[];
        bid?: ApiBid | null;
      };
    }
  | { ok: false; status: number; error: string }
> {
  const r = await apiFetchJson<unknown>(`${HOSTING_BASE}/events/${encodeURIComponent(id)}`);
  if (!r.ok) return r;
  const raw = r.data as Record<string, unknown> | null;
  const evRaw = raw?.event;
  const ev = parseHostingEvent(evRaw);
  if (!ev) return { ok: false, status: 500, error: "Invalid event response." };
  const bids = Array.isArray(raw?.bids) ? raw?.bids : undefined;
  const bidRaw = raw?.bid;
  const bid =
    bidRaw != null && typeof bidRaw === "object"
      ? parseHostingBid(bidRaw)
      : bidRaw === null
        ? null
        : undefined;
  return { ok: true, data: { event: ev, bids, bid: bid ?? undefined } };
}

/** POST /api/hosting/events/{id}/bids — body `{ organisation_name }`; event must be open, before deadline, under cap. */
export async function createHostingBid(
  eventId: string,
  body: { organisation_name: string },
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; error: string }> {
  return apiFetchJson<unknown>(`${HOSTING_BASE}/events/${encodeURIComponent(eventId)}/bids`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function listMyBids(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ ok: true; data: ApiBid[] } | { ok: false; status: number; error: string }> {
  const limit = params?.limit ?? 100;
  const offset = params?.offset ?? 0;
  const r = await apiFetchJson<unknown>(`${HOSTING_BASE}/bids?limit=${limit}&offset=${offset}`);
  if (!r.ok) return r;
  const rows = unwrapBidsArray(r.data)
    .map(parseHostingBid)
    .filter((x): x is ApiBid => x != null);
  return { ok: true, data: rows };
}

function normalizeHostingSportKey(raw: string | null | undefined): string | null {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (!s) return null;
  if ((CATALOG_SPORT_KEYS as readonly string[]).includes(s)) return s;
  return null;
}

export function hostingEventSportMatchesCatalogKey(
  eventSport: string | null | undefined,
  catalogSportKey: string,
): boolean {
  const want = catalogSportKey.trim().toLowerCase();
  const n = normalizeHostingSportKey(eventSport);
  if (n) return n === want;
  const raw = String(eventSport ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  return raw === want;
}

/** True when `bid_deadline` parses and is strictly after now. */
export function isHostingBidDeadlineOpen(bidDeadlineIso: string | null | undefined): boolean {
  const dl = bidDeadlineIso?.trim();
  if (!dl) return false;
  const t = Date.parse(dl);
  return Number.isFinite(t) && t > Date.now();
}

export function filterHostingEventsForSportBodyReviewer(
  events: ApiBiddingEvent[],
  catalogSportKey: string,
): { filtered: ApiBiddingEvent[]; allowedEventIds: Set<string> } {
  const now = Date.now();
  const filtered: ApiBiddingEvent[] = [];
  const allowedEventIds = new Set<string>();
  for (const ev of events) {
    if (!hostingEventSportMatchesCatalogKey(ev.sport, catalogSportKey)) continue;
    const dl = ev.bid_deadline?.trim();
    if (!dl) continue;
    const t = Date.parse(dl);
    if (!Number.isFinite(t) || t <= now) continue;
    filtered.push(ev);
    allowedEventIds.add(ev.id);
  }
  return { filtered, allowedEventIds };
}

export function filterHostingBidsForSportBodyReviewer(bids: ApiBid[], allowedEventIds: Set<string>): ApiBid[] {
  const now = Date.now();
  return bids.filter((b) => {
    const eid = String(b.event_id ?? "").trim();
    if (!eid || !allowedEventIds.has(eid)) return false;
    const dl = b.event_bid_deadline?.trim();
    if (dl) {
      const t = Date.parse(dl);
      if (Number.isFinite(t) && t <= now) return false;
    }
    return true;
  });
}

export function biddingEventStatusLabel(status: string | null | undefined): string {
  const s = (status ?? "").trim().toLowerCase().replace(/-/g, "_");
  if (s === "draft") return "Draft";
  if (s === "open_for_bids") return "Open for bids";
  if (s === "closed") return "Closed";
  if (s === "awarded") return "Awarded";
  return status?.replace(/_/g, " ") || "—";
}

export function isHostingEventOpenForBids(status: string | null | undefined): boolean {
  return (status ?? "").trim().toLowerCase().replace(/-/g, "_") === "open_for_bids";
}

export function isHostingEventClosedForBids(status: string | null | undefined): boolean {
  const s = (status ?? "").trim().toLowerCase().replace(/-/g, "_");
  return s === "closed" || s === "awarded";
}

export function filterHostingEventsByBidWindowTab(
  events: ApiBiddingEvent[],
  tab: "open" | "closed",
): ApiBiddingEvent[] {
  return events.filter((ev) =>
    tab === "open" ? isHostingEventOpenForBids(ev.status) : isHostingEventClosedForBids(ev.status),
  );
}

export function bidStatusLabel(status: string | null | undefined): string {
  const s = (status ?? "").trim().toLowerCase().replace(/-/g, "_");
  if (s === "draft") return "Draft";
  if (s === "submitted") return "Submitted";
  if (s === "under_review") return "Under review";
  if (s === "info_requested") return "Info requested";
  if (s === "approved") return "Approved";
  if (s === "rejected") return "Rejected";
  return status?.replace(/_/g, " ") || "—";
}

export {
  isSportBodyReviewerSession,
  isSrcReviewerSession,
  userCanBidOnHostingOpportunities,
  userCanBrowseApproverHostingPages,
  userCanManageHostingEvents,
} from "~/lib/hosting-access";
