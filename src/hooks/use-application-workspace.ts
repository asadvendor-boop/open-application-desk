"use client";

import { useCallback, useMemo, useRef, useState } from "react";

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
  authorizeReview,
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

export interface WorkspaceController {
  getState(): WorkspaceState;
  editField(field: ApplicationFieldKey, value: string): void;
  setAttestation(value: boolean): void;
  upsertEvidence(evidence: EvidenceBinding): void;
  runAudit(signal?: AbortSignal): Promise<AuditReport>;
  stagePatch(input: StagePatchInput): StagedPatch;
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
} {
  const [workspace, setWorkspace] = useState<WorkspaceState>(initialWorkspace);
  const [persistence, setPersistence] = useState<PersistenceState>(() =>
    loadWorkspace()
      ? { status: "saved", message: "Judge workspace — saved in this browser" }
      : { status: "unsaved", message: "Judge workspace — not yet saved" },
  );
  const workspaceRef = useRef(workspace);

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
        const snapshot = workspaceRef.current.draft;
        const repositoryUrl = snapshot.fields.repositoryUrl.trim();
        let repository: RepositoryVerification | null = null;

        if (repositoryUrl) {
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
            repository = parsed.success
              ? parsed.data
              : unavailableRepository(
                  repositoryUrl,
                  "Repository metadata response was unverified.",
                );
          } catch (error) {
            if (signal?.aborted) {
              throw error;
            }
            repository = unavailableRepository(
              repositoryUrl,
              "Repository metadata request was unverified.",
            );
          }
        }

        const report = auditApplication(snapshot, repository, nowIso());
        commit(recordAudit(workspaceRef.current, report));
        return report;
      },
      stagePatch(input) {
        const next = stageWorkspacePatch(
          workspaceRef.current,
          input,
          makeId("patch"),
          nowIso(),
        );
        commit(next);
        return next.stagedPatch!;
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
        clearWorkspace();
        const next = createWorkspace(createSampleDraft(nowIso()));
        commit(next);
      },
    };
  }, [commit]);

  return { workspace, controller, persistence };
}
