import type { z } from "zod";

import { PROGRAM } from "@/domain/application/sample-program";
import type { AuditReport } from "@/domain/application/types";
import type { WorkspaceController } from "@/hooks/use-application-workspace";
import {
  auditApplicationInputSchema,
  contextSections,
  getApplicationContextInputSchema,
  prepareSubmissionInputSchema,
  requestApplicantFactInputSchema,
  stagePatchInputSchema,
  submitApprovedApplicationInputSchema,
  toolInputSchemas,
} from "./tool-schemas";

export interface ToolExecutionObserver {
  onAuditCompleted?(report: AuditReport): void;
}

function parseInput<T>(
  schema: z.ZodType<T>,
  input: Record<string, unknown>,
  toolName: string,
): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Input was rejected.";
    throw new Error(`Invalid ${toolName} input: ${message}`);
  }
  return parsed.data;
}

function throwIfAborted(execution?: { signal?: AbortSignal }) {
  execution?.signal?.throwIfAborted();
}

function getApplicationContext(
  controller: WorkspaceController,
  input: Record<string, unknown>,
) {
  const parsed = parseInput(
    getApplicationContextInputSchema,
    input,
    "get_application_context",
  );
  const selected = new Set(parsed.sections ?? contextSections);
  const state = controller.getState();

  return {
    outcome: "context",
    ...(selected.has("program")
      ? {
          program: {
            id: PROGRAM.id,
            title: PROGRAM.title,
            deadlineIso: PROGRAM.deadlineIso,
            summaryWordLimit: PROGRAM.summaryWordLimit,
            requirementCount: PROGRAM.requirements.length,
            requirements: PROGRAM.requirements.map((item) => ({ ...item })),
          },
        }
      : {}),
    ...(selected.has("draft")
      ? {
          draft: {
            id: state.draft.id,
            revision: state.draft.revision,
            fields: { ...state.draft.fields },
            evidence: state.draft.evidence.map((item) => ({ ...item })),
          },
        }
      : {}),
    ...(selected.has("audit")
      ? { audit: state.audit ? structuredClone(state.audit) : null }
      : {}),
    ...(selected.has("workflow")
      ? {
          workflow: {
            state: state.draft.workflowState,
            attested: state.draft.attested,
            stagedPatch: state.stagedPatch
              ? {
                  id: state.stagedPatch.id,
                  state: state.stagedPatch.state,
                  baseRevision: state.stagedPatch.baseRevision,
                  changeCount: state.stagedPatch.changes.length,
                }
              : null,
            review: state.review
              ? {
                  id: state.review.id,
                  draftRevision: state.review.draftRevision,
                  draftHash: state.review.draftHash,
                  expiresAt: state.review.expiresAt,
                  authorized: Boolean(state.review.authorizedAt),
                }
              : null,
            receipt: state.receipt ? { ...state.receipt } : null,
          },
        }
      : {}),
  };
}

export function createToolDefinitions(
  controller: WorkspaceController,
  observer: ToolExecutionObserver = {},
): WebMCP.ModelContextTool[] {
  return [
    {
      name: "get_application_context",
      title: "Read application context",
      description:
        "Read selected program rules, the exact live draft, deterministic audit, and workflow state. This does not change the application.",
      inputSchema: toolInputSchemas.get_application_context,
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      async execute(input, execution?) {
        throwIfAborted(execution);
        const result = getApplicationContext(controller, input);
        throwIfAborted(execution);
        return result;
      },
    },
    {
      name: "audit_application",
      title: "Audit current application",
      description:
        "Run deterministic requirements and bounded public-repository checks against the exact live draft. This records an audit but does not edit application content.",
      inputSchema: toolInputSchemas.audit_application,
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      async execute(input, execution?) {
        throwIfAborted(execution);
        const parsed = parseInput(
          auditApplicationInputSchema,
          input,
          "audit_application",
        );
        const report = await controller.runAudit(execution?.signal);
        throwIfAborted(execution);
        controller.recordActivity(
          "agent",
          "tool_audit",
          "Agent ran deterministic application checks.",
        );
        observer.onAuditCompleted?.(report);
        const selected = parsed.requirementIds
          ? new Set<string>(parsed.requirementIds)
          : null;
        const checks = report.checks
          .filter((check) => !selected || selected.has(check.requirementId))
          .map((check) => ({ ...check }));
        return {
          outcome: "audited",
          draftRevision: report.draftRevision,
          blockingCount: checks.filter((check) => check.status === "block").length,
          attentionCount: checks.filter((check) => check.status === "attention")
            .length,
          checks,
        };
      },
    },
    {
      name: "stage_draft_patch",
      title: "Stage a visible draft patch",
      description:
        "Stage allowlisted edits as a visible diff. This does not modify the application. The person must apply or reject the patch in the page.",
      inputSchema: toolInputSchemas.stage_draft_patch,
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input, execution?) {
        throwIfAborted(execution);
        const parsed = parseInput(
          stagePatchInputSchema,
          input,
          "stage_draft_patch",
        );
        const patch = await controller.stagePatch(parsed, execution?.signal);
        throwIfAborted(execution);
        return {
          outcome: "staged",
          patchId: patch.id,
          baseRevision: patch.baseRevision,
          changeCount: patch.changes.length,
          state: patch.state,
        };
      },
    },
    {
      name: "prepare_submission",
      title: "Prepare an exact submission review",
      description:
        "Re-audit the expected live revision and create a hash-bound review snapshot. This cannot authorize or submit the application.",
      inputSchema: toolInputSchemas.prepare_submission,
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      async execute(input, execution?) {
        throwIfAborted(execution);
        const parsed = parseInput(
          prepareSubmissionInputSchema,
          input,
          "prepare_submission",
        );
        if (controller.getState().draft.revision !== parsed.expectedDraftRevision) {
          throw new Error(
            "The expected draft revision is stale. Read the application context again.",
          );
        }
        const report = await controller.runAudit(execution?.signal);
        throwIfAborted(execution);
        if (report.draftRevision !== parsed.expectedDraftRevision) {
          throw new Error("The draft changed while preparation was running.");
        }
        const review = await controller.prepareSubmission();
        throwIfAborted(execution);
        controller.recordActivity(
          "agent",
          "tool_prepare_submission",
          "Agent prepared an exact review for human authorization.",
        );
        return {
          outcome: "prepared",
          reviewId: review.id,
          draftRevision: review.draftRevision,
          draftHash: review.draftHash,
          expiresAt: review.expiresAt,
          authorized: false,
        };
      },
    },
    {
      name: "submit_approved_application",
      title: "Submit a human-approved application",
      description:
        "Submit only the exact review ID and draft hash already authorized through the page's native human control. Repeated matching calls return the original receipt.",
      inputSchema: toolInputSchemas.submit_approved_application,
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input, execution?) {
        throwIfAborted(execution);
        const parsed = parseInput(
          submitApprovedApplicationInputSchema,
          input,
          "submit_approved_application",
        );
        const receipt = await controller.submit(
          parsed.reviewId,
          parsed.draftHash,
        );
        throwIfAborted(execution);
        controller.recordActivity(
          "agent",
          "tool_submit_approved",
          "Agent invoked the exact human-approved submission.",
        );
        return {
          outcome: "submitted",
          receiptId: receipt.id,
          reviewId: receipt.reviewId,
          draftHash: receipt.draftHash,
          submittedAt: receipt.submittedAt,
        };
      },
    },
  ];
}

export function createApplicantFactToolDefinition(
  controller: WorkspaceController,
): WebMCP.ModelContextTool {
  return {
    name: "request_applicant_fact",
    title: "Request an applicant-owned fact",
    description:
      "Ask the page to collect the missing audience-and-problem fact from the applicant. The page owns the exact question and the applicant decides whether to share the answer. This tool cannot write any other field or apply a proposal.",
    inputSchema: toolInputSchemas.request_applicant_fact,
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    async execute(input, execution?) {
      throwIfAborted(execution);
      const parsed = parseInput(
        requestApplicantFactInputSchema,
        input,
        "request_applicant_fact",
      );
      return controller.requestApplicantFact(parsed.field, execution?.signal);
    },
  };
}
