import { z } from "zod";

import { stagePatchInputSchema } from "@/domain/application/schemas";

export const contextSections = [
  "program",
  "draft",
  "audit",
  "workflow",
] as const;

export const requirementIds = [
  "project_name",
  "summary_present",
  "summary_word_limit",
  "audience_problem",
  "live_url_https",
  "repository_public",
  "repository_license",
  "impact_statement",
  "claim_evidence",
  "human_attestation",
] as const;

export const getApplicationContextInputSchema = z
  .object({
    sections: z.array(z.enum(contextSections)).min(1).max(4).optional(),
  })
  .strict();

export const auditApplicationInputSchema = z
  .object({
    requirementIds: z
      .array(z.enum(requirementIds))
      .min(1)
      .max(requirementIds.length)
      .optional(),
  })
  .strict();

export const prepareSubmissionInputSchema = z
  .object({
    expectedDraftRevision: z.number().int().nonnegative(),
  })
  .strict();

export const submitApprovedApplicationInputSchema = z
  .object({
    reviewId: z.string().trim().min(1).max(200),
    draftHash: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

const fieldNames = [
  "projectName",
  "summary",
  "audienceProblem",
  "liveUrl",
  "repositoryUrl",
  "impactStatement",
] as const;

export const toolInputSchemas = {
  get_application_context: {
    type: "object",
    properties: {
      sections: {
        type: "array",
        minItems: 1,
        maxItems: 4,
        uniqueItems: true,
        items: { type: "string", enum: [...contextSections] },
      },
    },
    additionalProperties: false,
  },
  audit_application: {
    type: "object",
    properties: {
      requirementIds: {
        type: "array",
        minItems: 1,
        maxItems: requirementIds.length,
        uniqueItems: true,
        items: { type: "string", enum: [...requirementIds] },
      },
    },
    additionalProperties: false,
  },
  stage_draft_patch: {
    type: "object",
    properties: {
      changes: {
        type: "array",
        minItems: 1,
        maxItems: 4,
        items: {
          type: "object",
          properties: {
            field: { type: "string", enum: [...fieldNames] },
            value: { type: "string", maxLength: 4_000 },
            rationale: { type: "string", minLength: 1, maxLength: 240 },
          },
          required: ["field", "value", "rationale"],
          additionalProperties: false,
        },
      },
    },
    required: ["changes"],
    additionalProperties: false,
  },
  prepare_submission: {
    type: "object",
    properties: {
      expectedDraftRevision: { type: "integer", minimum: 0 },
    },
    required: ["expectedDraftRevision"],
    additionalProperties: false,
  },
  submit_approved_application: {
    type: "object",
    properties: {
      reviewId: { type: "string", minLength: 1, maxLength: 200 },
      draftHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
    },
    required: ["reviewId", "draftHash"],
    additionalProperties: false,
  },
} as const;

export { stagePatchInputSchema };
