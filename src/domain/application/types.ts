export const applicationFieldKeys = [
  "projectName",
  "summary",
  "audienceProblem",
  "liveUrl",
  "repositoryUrl",
  "impactStatement",
] as const;

export type ApplicationFieldKey = (typeof applicationFieldKeys)[number];
export type WorkflowState = "draft" | "review" | "submitted";
export type RequirementStatus = "pass" | "attention" | "block";

export interface RequirementDefinition {
  id: string;
  label: string;
  blocking: boolean;
}

export interface ProgramDefinition {
  id: string;
  title: string;
  deadlineIso: string;
  summaryWordLimit: number;
  requirements: RequirementDefinition[];
}

export interface EvidenceBinding {
  id: string;
  claim: string;
  url: string;
  kind: "repository" | "live_demo" | "other";
}

export interface ApplicationDraft {
  id: string;
  revision: number;
  fields: Record<ApplicationFieldKey, string>;
  evidence: EvidenceBinding[];
  attested: boolean;
  workflowState: WorkflowState;
  updatedAt: string;
}

export interface AuditCheck {
  requirementId: string;
  status: RequirementStatus;
  message: string;
  field?: ApplicationFieldKey;
  evidenceId?: string;
}

export interface AuditReport {
  draftRevision: number;
  checkedAt: string;
  checks: AuditCheck[];
  blockingCount: number;
  attentionCount: number;
}

export interface PatchChange {
  field: ApplicationFieldKey;
  value: string;
  rationale: string;
}

export interface StagedPatch {
  id: string;
  baseRevision: number;
  changes: PatchChange[];
  state: "staged" | "applied" | "rejected" | "stale";
  createdAt: string;
}

export interface ReviewSnapshot {
  id: string;
  draftRevision: number;
  draftHash: string;
  createdAt: string;
  expiresAt: string;
  authorizedAt: string | null;
}

export interface SubmissionReceipt {
  id: string;
  reviewId: string;
  draftHash: string;
  submittedAt: string;
}

export interface ActivityEntry {
  id: string;
  actor: "human" | "agent" | "system";
  action: string;
  summary: string;
  createdAt: string;
}

export interface WorkspaceState {
  version: 1;
  draft: ApplicationDraft;
  audit: AuditReport | null;
  stagedPatch: StagedPatch | null;
  review: ReviewSnapshot | null;
  receipt: SubmissionReceipt | null;
  activity: ActivityEntry[];
}
