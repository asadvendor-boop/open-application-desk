import { auditApplication } from "@/domain/application/audit";
import type { RepositoryVerification } from "@/domain/application/github";
import type { StagePatchInput } from "@/domain/application/schemas";
import type {
  ActivityEntry,
  ApplicationDraft,
  ApplicationFieldKey,
  AuditReport,
  EvidenceBinding,
  ReviewSnapshot,
  StagedPatch,
  SubmissionReceipt,
  WorkspaceState,
} from "@/domain/application/types";
import {
  applyPatch,
  applyPatchChangesToDraft,
  authorizeReview,
  createReadinessProjection,
  createWorkspace,
  editDraftField,
  prepareReview,
  recordAudit,
  rejectPatch,
  setAttestation,
  stagePatch,
  submitApproved,
  upsertEvidence,
} from "@/domain/application/workspace";
import type {
  WorkspaceController,
} from "@/hooks/use-application-workspace";

export const verifiedRepository: RepositoryVerification = {
  status: "verified",
  repositoryUrl: "https://github.com/openai/openai-node",
  isPublic: true,
  licenseSpdx: "Apache-2.0",
  checkedAt: "2026-08-27T01:00:00.000Z",
  message: "Public repository and license verified.",
};

export const unavailableRepository: RepositoryVerification = {
  status: "unavailable",
  repositoryUrl: "https://github.com/openai/openai-node",
  isPublic: null,
  licenseSpdx: null,
  checkedAt: "2026-08-27T01:00:00.000Z",
  message: "GitHub metadata is temporarily unavailable.",
};

export function createValidDraft(): ApplicationDraft {
  return {
    id: "valid-application",
    revision: 3,
    fields: {
      projectName: "Agent-native application portal",
      summary:
        "A WebMCP portal lets applicants and agents inspect one live draft, stage exact changes, verify public evidence, and submit only after human review.",
      audienceProblem:
        "Applicants lose time and risk rejection when requirements, claims, and evidence drift across disconnected submission surfaces.",
      liveUrl: "https://example.com/application",
      repositoryUrl: "https://github.com/openai/openai-node",
      impactStatement:
        "People retain factual and submission authority while agents handle structured inspection and preparation.",
    },
    evidence: [
      {
        id: "repository-evidence",
        claim: "The project has a public open-source repository.",
        url: "https://github.com/openai/openai-node",
        kind: "repository",
      },
    ],
    attested: true,
    workflowState: "draft",
    updatedAt: "2026-08-27T00:55:00.000Z",
  };
}

export function passingAudit() {
  return auditApplication(
    createValidDraft(),
    verifiedRepository,
    "2026-08-27T01:00:00.000Z",
  );
}

export interface WorkspaceControllerHarness extends WorkspaceController {
  replaceState(next: WorkspaceState): void;
}

export function createWorkspaceControllerHarness(
  initialDraft: ApplicationDraft = createValidDraft(),
  repository: RepositoryVerification = verifiedRepository,
): WorkspaceControllerHarness {
  let state = createWorkspace(initialDraft);
  let sequence = 0;
  let pendingApplicantFact = false;

  const nextNow = () =>
    new Date(Date.parse("2026-08-27T01:00:00.000Z") + sequence++ * 1_000)
      .toISOString();
  const nextId = (prefix: string) => `${prefix}-${++sequence}`;
  const commit = (next: WorkspaceState) => {
    state = next;
  };

  return {
    getState: () => state,
    replaceState(next) {
      state = next;
    },
    editField(field: ApplicationFieldKey, value: string) {
      commit(editDraftField(state, field, value, nextNow()));
    },
    setAttestation(value: boolean) {
      commit(setAttestation(state, value, nextNow()));
    },
    upsertEvidence(evidence: EvidenceBinding) {
      commit(upsertEvidence(state, evidence, nextNow()));
    },
    async runAudit(signal?: AbortSignal): Promise<AuditReport> {
      signal?.throwIfAborted();
      const report = auditApplication(state.draft, repository, nextNow());
      signal?.throwIfAborted();
      commit(recordAudit(state, report));
      return report;
    },
    async stagePatch(input: StagePatchInput): Promise<StagedPatch> {
      const currentAudit = auditApplication(state.draft, repository, nextNow());
      const candidateAudit = auditApplication(
        applyPatchChangesToDraft(state.draft, input.changes),
        repository,
        nextNow(),
      );
      commit(
        stagePatch(
          state,
          input,
          nextId("patch"),
          nextNow(),
          createReadinessProjection(currentAudit, candidateAudit),
        ),
      );
      return state.stagedPatch!;
    },
    hasMissingApplicantFact() {
      return !state.draft.fields.audienceProblem.trim();
    },
    async requestApplicantFact(field) {
      if (field !== "audienceProblem" || state.draft.fields.audienceProblem.trim()) {
        return { outcome: "not_needed", field: "audienceProblem" } as const;
      }
      if (pendingApplicantFact) {
        return {
          outcome: "awaiting_human",
          requestId: "applicant-fact-pending",
          field: "audienceProblem",
          question: "Who is this application for, and what specific difficulty do they face?",
          draftRevision: state.draft.revision,
        } as const;
      }
      pendingApplicantFact = true;
      return {
        outcome: "awaiting_human",
        requestId: "applicant-fact-pending",
        field: "audienceProblem",
        question: "Who is this application for, and what specific difficulty do they face?",
        draftRevision: state.draft.revision,
      } as const;
    },
    answerApplicantFact(value) {
      const answer = value.trim();
      if (!pendingApplicantFact || !answer) {
        throw new Error("A non-empty answer is required for the active applicant request.");
      }
      pendingApplicantFact = false;
      commit(editDraftField(state, "audienceProblem", answer, nextNow()));
    },
    cancelApplicantFact() {
      pendingApplicantFact = false;
    },
    applyPatch(patchId: string) {
      commit(applyPatch(state, patchId, nextNow()));
    },
    rejectPatch(patchId: string) {
      commit(rejectPatch(state, patchId, nextNow()));
    },
    async prepareSubmission(): Promise<ReviewSnapshot> {
      commit(await prepareReview(state, nextId("review"), nextNow()));
      return state.review!;
    },
    authorizeSubmission(reviewId: string) {
      commit(authorizeReview(state, reviewId, nextNow()));
    },
    async submit(
      reviewId: string,
      draftHash: string,
    ): Promise<SubmissionReceipt> {
      commit(
        await submitApproved(
          state,
          { reviewId, draftHash },
          nextId("receipt"),
          nextNow(),
        ),
      );
      return state.receipt!;
    },
    recordActivity(
      actor: ActivityEntry["actor"],
      action: string,
      summary: string,
    ) {
      state = {
        ...state,
        activity: [
          ...state.activity,
          {
            id: nextId("activity"),
            actor,
            action,
            summary,
            createdAt: nextNow(),
          },
        ],
      };
    },
    reset() {
      pendingApplicantFact = false;
      state = createWorkspace(initialDraft);
    },
  };
}
