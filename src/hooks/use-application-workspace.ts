"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { auditApplication } from "@/domain/application/audit";
import {
  repositoryVerificationSchema,
  type RepositoryVerification,
} from "@/domain/application/github";
import { createSampleDraft } from "@/domain/application/sample-program";
import type { StagePatchInput } from "@/domain/application/schemas";
import type {
  ActivityEntry,
  ApplicationFieldKey,
  AuditReport,
  EvidenceBinding,
  ReviewSnapshot,
  StagedPatch,
  SubmissionReceipt,
  WorkspaceState,
} from "@/domain/application/types";
import {
  applyPatch as applyWorkspacePatch,
  applyPatchChangesToDraft,
  authorizeReview,
  createReadinessProjection,
  createWorkspace,
  editDraftField,
  prepareReview,
  recordAudit,
  rejectPatch as rejectWorkspacePatch,
  setAttestation as mutateAttestation,
  stagePatch as stageWorkspacePatch,
  submitApproved,
  upsertEvidence as mutateEvidence,
} from "@/domain/application/workspace";
import {
  clearWorkspace,
  loadWorkspace,
  saveWorkspace,
} from "@/storage/local-workspace";

type PersistenceState =
  | { status: "saved"; message: string }
  | { status: "unsaved"; message: string }
  | { status: "error"; message: string };

const SUBMISSION_LOCK_NAME = "webmcp-application-portal:submission";
const APPLICANT_FACT_QUESTION =
  "Who is this application for, and what specific difficulty do they face?";

export interface ApplicantFactRequest {
  id: string;
  field: "audienceProblem";
  question: string;
}

export type ApplicantFactResult =
  | {
      outcome: "answered";
      field: "audienceProblem";
      source: "human";
      value: string;
      draftRevision: number;
    }
  | {
      outcome: "cancelled" | "already_pending" | "not_needed";
      field: "audienceProblem";
    };

interface PendingApplicantFact extends ApplicantFactRequest {
  resolve: (result: ApplicantFactResult) => void;
}

export interface WorkspaceController {
  getState(): WorkspaceState;
  editField(field: ApplicationFieldKey, value: string): void;
  setAttestation(value: boolean): void;
  upsertEvidence(evidence: EvidenceBinding): void;
  runAudit(signal?: AbortSignal): Promise<AuditReport>;
  stagePatch(input: StagePatchInput, signal?: AbortSignal): Promise<StagedPatch>;
  hasMissingApplicantFact(): boolean;
  requestApplicantFact(
    field: "audienceProblem",
    signal?: AbortSignal,
  ): Promise<ApplicantFactResult>;
  answerApplicantFact(value: string): void;
  cancelApplicantFact(): void;
  applyPatch(patchId: string): void;
  rejectPatch(patchId: string): void;
  prepareSubmission(): Promise<ReviewSnapshot>;
  authorizeSubmission(reviewId: string): void;
  submit(reviewId: string, draftHash: string): Promise<SubmissionReceipt>;
  recordActivity(
    actor: ActivityEntry["actor"],
    action: string,
    summary: string,
  ): void;
  reset(): void;
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

async function withSubmissionLock<T>(operation: () => Promise<T>): Promise<T> {
  if (typeof navigator === "undefined" || !navigator.locks) {
    throw new Error(
      "This browser cannot guarantee a single submission across open tabs.",
    );
  }
  return navigator.locks.request(SUBMISSION_LOCK_NAME, { mode: "exclusive" }, operation);
}

function initialWorkspace(): WorkspaceState {
  return loadWorkspace() ?? createWorkspace(createSampleDraft());
}

function unavailableRepository(
  repositoryUrl: string,
  message: string,
): RepositoryVerification {
  return {
    status: "unavailable",
    repositoryUrl,
    isPublic: null,
    licenseSpdx: null,
    checkedAt: nowIso(),
    message,
  };
}

export function useApplicationWorkspace(): {
  workspace: WorkspaceState;
  controller: WorkspaceController;
  persistence: PersistenceState;
  pendingApplicantFact: ApplicantFactRequest | null;
} {
  const [workspace, setWorkspace] = useState<WorkspaceState>(initialWorkspace);
  const [persistence, setPersistence] = useState<PersistenceState>(() =>
    loadWorkspace()
      ? { status: "saved", message: "Judge workspace — saved in this browser" }
      : { status: "unsaved", message: "Judge workspace — not yet saved" },
  );
  const workspaceRef = useRef(workspace);
  const pendingApplicantFactRef = useRef<PendingApplicantFact | null>(null);
  const [pendingApplicantFact, setPendingApplicantFact] =
    useState<ApplicantFactRequest | null>(null);
  const mountedRef = useRef(true);

  const settlePendingApplicantFact = useCallback(
    (result: ApplicantFactResult) => {
      const pending = pendingApplicantFactRef.current;
      if (!pending) {
        return;
      }
      pendingApplicantFactRef.current = null;
      pending.resolve(result);
      if (mountedRef.current) {
        if (result.outcome === "answered") {
          setTimeout(() => {
            if (mountedRef.current && !pendingApplicantFactRef.current) {
              setPendingApplicantFact(null);
            }
          }, 0);
        } else {
          setPendingApplicantFact(null);
        }
      }
    },
    [],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      settlePendingApplicantFact({ outcome: "cancelled", field: "audienceProblem" });
    };
  }, [settlePendingApplicantFact]);

  const commit = useCallback(
    (next: WorkspaceState, requirePersistence = false): boolean => {
      const saved = saveWorkspace(next);
      if (!saved.ok) {
        setPersistence({ status: "error", message: saved.error });
        if (requirePersistence) {
          return false;
        }
      } else {
        setPersistence({
          status: "saved",
          message: "Judge workspace — saved in this browser",
        });
      }
      workspaceRef.current = next;
      setWorkspace(next);
      return saved.ok;
    },
    [],
  );

  const controller = useMemo<WorkspaceController>(() => {
    async function repositoryFor(
      repositoryUrl: string,
      signal?: AbortSignal,
    ): Promise<RepositoryVerification | null> {
      if (!repositoryUrl.trim()) {
        return null;
      }
      try {
        const response = await fetch("/api/github-repository", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repositoryUrl }),
          signal,
        });
        const parsed = repositoryVerificationSchema.safeParse(
          await response.json(),
        );
        return parsed.success
          ? parsed.data
          : unavailableRepository(
              repositoryUrl,
              "Repository metadata response was unverified.",
            );
      } catch (error) {
        if (signal?.aborted) {
          throw error;
        }
        return unavailableRepository(
          repositoryUrl,
          "Repository metadata request was unverified.",
        );
      }
    }

    async function auditDraft(
      draft: WorkspaceState["draft"],
      signal?: AbortSignal,
    ): Promise<{ report: AuditReport; repository: RepositoryVerification | null }> {
      const repository = await repositoryFor(draft.fields.repositoryUrl, signal);
      signal?.throwIfAborted();
      return { report: auditApplication(draft, repository, nowIso()), repository };
    }

    return {
      getState: () => workspaceRef.current,
      editField(field, value) {
        commit(editDraftField(workspaceRef.current, field, value, nowIso()));
      },
      setAttestation(value) {
        commit(mutateAttestation(workspaceRef.current, value, nowIso()));
      },
      upsertEvidence(evidence) {
        commit(mutateEvidence(workspaceRef.current, evidence, nowIso()));
      },
      async runAudit(signal) {
        const { report } = await auditDraft(workspaceRef.current.draft, signal);
        commit(recordAudit(workspaceRef.current, report));
        return report;
      },
      async stagePatch(input, signal) {
        const sourceState = workspaceRef.current;
        const candidateDraft = applyPatchChangesToDraft(
          sourceState.draft,
          input.changes,
        );
        const [currentResult, projectedResult] = await Promise.all([
          auditDraft(sourceState.draft, signal),
          auditDraft(candidateDraft, signal),
        ]);
        signal?.throwIfAborted();
        if (workspaceRef.current !== sourceState) {
          throw new Error("The application changed while the proposal was being evaluated.");
        }
        const next = stageWorkspacePatch(
          sourceState,
          input,
          makeId("patch"),
          nowIso(),
          candidateDraft.fields.repositoryUrl.trim() &&
          projectedResult.repository?.status !== "verified"
            ? undefined
            : createReadinessProjection(currentResult.report, projectedResult.report),
        );
        commit(next);
        return next.stagedPatch!;
      },
      hasMissingApplicantFact() {
        return !workspaceRef.current.draft.fields.audienceProblem.trim();
      },
      async requestApplicantFact(field, signal) {
        signal?.throwIfAborted();
        if (
          field !== "audienceProblem" ||
          workspaceRef.current.draft.fields.audienceProblem.trim()
        ) {
          return { outcome: "not_needed", field: "audienceProblem" };
        }
        if (pendingApplicantFactRef.current) {
          return { outcome: "already_pending", field: "audienceProblem" };
        }
        return new Promise<ApplicantFactResult>((resolve) => {
          const request: ApplicantFactRequest = {
            id: makeId("applicant-fact"),
            field: "audienceProblem",
            question: APPLICANT_FACT_QUESTION,
          };
          pendingApplicantFactRef.current = { ...request, resolve };
          setPendingApplicantFact(request);
          signal?.addEventListener(
            "abort",
            () =>
              settlePendingApplicantFact({
                outcome: "cancelled",
                field: "audienceProblem",
              }),
            { once: true },
          );
        });
      },
      answerApplicantFact(value) {
        const pending = pendingApplicantFactRef.current;
        const answer = value.trim();
        if (!pending || !answer) {
          throw new Error("A non-empty answer is required for the active applicant request.");
        }
        const next = editDraftField(
          workspaceRef.current,
          "audienceProblem",
          answer,
          nowIso(),
        );
        commit(next);
        settlePendingApplicantFact({
          outcome: "answered",
          field: "audienceProblem",
          source: "human",
          value: answer,
          draftRevision: next.draft.revision,
        });
      },
      cancelApplicantFact() {
        settlePendingApplicantFact({
          outcome: "cancelled",
          field: "audienceProblem",
        });
      },
      applyPatch(patchId) {
        commit(applyWorkspacePatch(workspaceRef.current, patchId, nowIso()));
      },
      rejectPatch(patchId) {
        commit(rejectWorkspacePatch(workspaceRef.current, patchId, nowIso()));
      },
      async prepareSubmission() {
        const sourceState = workspaceRef.current;
        const next = await prepareReview(
          sourceState,
          makeId("review"),
          nowIso(),
        );
        if (workspaceRef.current !== sourceState) {
          throw new Error(
            "The application changed while the review was being prepared.",
          );
        }
        commit(next);
        return next.review!;
      },
      authorizeSubmission(reviewId) {
        commit(authorizeReview(workspaceRef.current, reviewId, nowIso()));
      },
      async submit(reviewId, draftHash) {
        const sourceState = workspaceRef.current;
        return withSubmissionLock(async () => {
          if (workspaceRef.current !== sourceState) {
            throw new Error(
              "The application changed while the submission was being recorded.",
            );
          }
          const persistedState = loadWorkspace();
          if (!persistedState) {
            throw new Error(
              "Browser storage is unavailable; no submission receipt was issued.",
            );
          }
          const next = await submitApproved(
            persistedState,
            { reviewId, draftHash },
            makeId("receipt"),
            nowIso(),
          );
          if (workspaceRef.current !== sourceState) {
            throw new Error(
              "The application changed while the submission was being recorded.",
            );
          }
          if (!commit(next, true)) {
            throw new Error(
              "Browser storage is unavailable; no submission receipt was issued.",
            );
          }
          return next.receipt!;
        });
      },
      recordActivity(actor, action, summary) {
        const current = workspaceRef.current;
        const createdAt = nowIso();
        commit({
          ...current,
          activity: [
            ...current.activity,
            {
              id: makeId("activity"),
              actor,
              action,
              summary,
              createdAt,
            },
          ],
        });
      },
      reset() {
        settlePendingApplicantFact({
          outcome: "cancelled",
          field: "audienceProblem",
        });
        clearWorkspace();
        const next = createWorkspace(createSampleDraft(nowIso()));
        commit(next);
      },
    };
  }, [commit, settlePendingApplicantFact]);

  return { workspace, controller, persistence, pendingApplicantFact };
}
