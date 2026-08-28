import { z } from "zod";
import { applicationFieldKeys } from "./types";

export const httpsUrlSchema = z
  .string()
  .url()
  .max(500)
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, {
    message: "URL must use HTTPS",
  });

export const repositoryRequestSchema = z
  .object({ repositoryUrl: z.string().url().max(500) })
  .strict();

export const patchChangeSchema = z
  .object({
    field: z.enum(applicationFieldKeys),
    value: z.string().max(4_000),
    rationale: z.string().trim().min(1).max(240),
  })
  .strict();

export const stagePatchInputSchema = z
  .object({
    changes: z.array(patchChangeSchema).min(1).max(4),
  })
  .strict();

export type StagePatchInput = z.infer<typeof stagePatchInputSchema>;
