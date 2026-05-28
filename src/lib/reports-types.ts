export type ReportFilters = {
  date_from?: string;
  date_to?: string;
  date_field?: string;
  application_type?: string;
  sport?: string;
  status?: string;
  tournament_clasification?: string;
  organisation_id?: string;
  sport_body_id?: string;
  priority?: string;
  host_country?: string;
  represented_country?: string;
};

export type ReportEnvelope<T> = {
  filters_applied: Record<string, unknown>;
  generated_at: string;
  data: T;
};

export type ReportSportBodyOption = {
  id: number;
  name: string;
  short_name?: string | null;
  code: string;
};

export type ReportFiltersData = {
  sports: string[];
  statuses: string[];
  application_types: string[];
  tournament_clasifications: string[];
  sport_bodies: ReportSportBodyOption[];
  host_countries: string[];
  represented_countries: string[];
  date_range: {
    min_submitted_at?: string | null;
    max_submitted_at?: string | null;
    min_created_at?: string | null;
    max_created_at?: string | null;
  };
  rejection_reason_codes: string[];
};

export type ReportSummaryData = {
  total_applications: number;
  by_status: Record<string, number>;
  by_application_type: Record<string, number>;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  certificate_issued_count: number;
  approval_rate?: number | null;
  avg_end_to_end_days?: number | null;
  median_end_to_end_days?: number | null;
  avg_applicant_to_src_days?: number | null;
  overdue_approvals_count: number;
  total_travellers: number;
};

export type ReportVolumeBucket = {
  key: string;
  label: string;
  count: number;
  percentage: number;
};

export type ReportVolumeData = {
  group_by: string;
  total: number;
  buckets: ReportVolumeBucket[];
};

export type ReportTrendsPoint = {
  bucket_start: string;
  bucket_end: string;
  count: number;
  splits?: Record<string, number>;
};

export type ReportTrendsData = {
  period: string;
  metric: string;
  series: ReportTrendsPoint[];
};

export type ReportProcessingTimeData = {
  measure: string;
  sample_size: number;
  avg_days?: number | null;
  median_days?: number | null;
  p90_days?: number | null;
  min_days?: number | null;
  max_days?: number | null;
};

export type ReportSportBodyProcessingBucket = {
  sport_body_id: number;
  sport_body_name: string;
  applications_count: number;
  decided_count: number;
  avg_days?: number | null;
  median_days?: number | null;
  p90_days?: number | null;
  approval_rate?: number | null;
};

export type ReportSportBodyProcessingData = {
  buckets: ReportSportBodyProcessingBucket[];
};

export type ReportPipelineStage = {
  stage: string;
  avg_days?: number | null;
  median_days?: number | null;
};

export type ReportPipelineData = {
  stages: ReportPipelineStage[];
};

export type ReportDurationBucket = {
  key: string;
  avg_days?: number | null;
  median_days?: number | null;
  count: number;
};

export type ReportDurationData = {
  avg_days?: number | null;
  median_days?: number | null;
  min_days?: number | null;
  max_days?: number | null;
  buckets?: ReportDurationBucket[];
};

export type ReportOutcomesBucket = {
  key: string;
  label: string;
  submitted: number;
  approved: number;
  rejected: number;
  withdrawn: number;
  still_pending: number;
  terminal_rate?: number | null;
  cohort_rate?: number | null;
};

export type ReportOutcomesData = {
  group_by: string;
  buckets: ReportOutcomesBucket[];
};

export type ReportRejectionsBucket = {
  code: string;
  count: number;
  other_detail_count: number;
};

export type ReportRejectionsData = {
  body?: string;
  buckets: ReportRejectionsBucket[];
};

export type ReportApprovalRow = {
  approval_id: string;
  application_id: string;
  reference_number: string;
  application_type: string;
  sport?: string | null;
  event_display_name: string;
  body: string;
  status: string;
  decided_at?: string | null;
  decided_by?: string | null;
  decided_by_name?: string | null;
  decided_by_email?: string | null;
  decision_note?: string | null;
  rejection_reason_code?: string | null;
  rejection_reason_detail?: string | null;
  overridden: boolean;
  overridden_by_name?: string | null;
  processing_days?: number | null;
};

export type ReportApprovalsListData = {
  total: number;
  rows: ReportApprovalRow[];
};

export type ReportApproverStats = {
  user_id: string;
  full_name: string;
  body: string;
  approved_count: number;
  rejected_count: number;
  information_requested_count: number;
  avg_decision_days?: number | null;
  median_decision_days?: number | null;
  overdue_count: number;
};

export type ReportApproversData = {
  approvers: ReportApproverStats[];
};

export type ReportWorkloadData = {
  by_application_status: Record<string, number>;
  by_approval_body: Record<string, number>;
  open_approvals: number;
  overdue_approvals: number;
};

export type ReportsTab =
  | "overview"
  | "volume"
  | "trends"
  | "processing"
  | "outcomes"
  | "audit";
