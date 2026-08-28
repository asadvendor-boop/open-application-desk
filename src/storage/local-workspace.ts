import { z } from "zod";

import { applicationFieldKeys } from "@/domain/application/types";
import type { WorkspaceState } from "@/domain/application/types";

export const STORAGE_KEY = "webmcp-application-portal:v1";

const fieldSchema = z.enum(applicationFieldKeys);
const fieldsSchema = z.object(
  Object.fromEntries(applicationFieldKeys.map((key) => [key, z.string()])) as Record<
    (typeof applicationFieldKeys)[number],
    z.ZodString
  >,
).strict();

const evidenceSchema = z
  .object({
    id: z.string(),
    claim: z.string(),
    url: z.string(),
    kind: z.enum(["repository", "live_demo", "other"]),
  })
  .strict();

const draftSchema = z
  .object({
    id: z.string(),
    revision: z.number().int().positive(),
    fields: fieldsSchema,
    evidence: z.array(evidenceSchema),
    attested: z.boolean(),
    workflowState: z.enum(["draft", "review", "submitted"]),
    updatedAt: z.string(),
  })
  .strict();

const auditCheckSchema = z
  .object({
    requirementId: z.string(),
    status: z.enum(["pass", "attention", "block"]),
    message: z.string(),
    field: fieldSchema.optional(),
    evidenceId: z.string().optional(),
  })
  .strict();

const auditSchema = z
  .object({
    draftRevision: z.number().int().positive(),
    checkedAt: z.string(),
    checks: z.array(auditCheckSchema),
    blockingCount: z.number().int().nonnegative(),
    attentionCount: z.number().int().nonnegative(),
  })
  .strict();

const patchSchema = z
  .object({
    id: z.string(),
    baseRevision: z.number().int().positive(),
    changes: z.array(
      z
        .object({
          field: fieldSchema,
          value: z.string(),
          rationale: z.string(),
        })
        .strict(),
    ),
    state: z.enum(["staged", "applied", "rejected", "stale"]),
    createdAt: z.string(),
  })
  .strict();

const reviewSchema = z
  .object({
    id: z.string(),
    draftRevision: z.number().int().positive(),
    draftHash: z.string(),
    createdAt: z.string(),
    expiresAt: z.string(),
    authorizedAt: z.string().nullable(),
  })
  .strict();

const receiptSchema = z
  .object({
    id: z.string(),
    reviewId: z.string(),
    draftHash: z.string(),
    submittedAt: z.string(),
  })
  .strict();

const activitySchema = z
  .object({
    id: z.string(),
    actor: z.enum(["human", "agent", "system"]),
    action: z.string(),
    summary: z.string(),
    createdAt: z.string(),
  })
  .strict();

export const workspaceStateSchema = z
  .object({
    version: z.literal(1),
    draft: draftSchema,
    audit: auditSchema.nullable(),
    stagedPatch: patchSchema.nullable(),
    review: reviewSchema.nullable(),
    receipt: receiptSchema.nullable(),
    activity: z.array(activitySchema),
  })
  .strict();

export type SaveResult =
  | { ok: true }
  | { ok: false; error: "Browser storage is unavailable" };

export function loadWorkspace(): WorkspaceState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = workspaceStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveWorkspace(workspace: WorkspaceState): SaveResult {
  try {
    const parsed = workspaceStateSchema.parse(workspace);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    return { ok: true };
  } catch {
    return { ok: false, error: "Browser storage is unavailable" };
  }
}

export function clearWorkspace(): SaveResult {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return { ok: true };
  } catch {
    return { ok: false, error: "Browser storage is unavailable" };
  }
}
