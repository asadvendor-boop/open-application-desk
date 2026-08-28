import { z } from "zod";

export interface RepositoryVerification {
  status: "verified" | "not_found" | "unavailable";
  repositoryUrl: string;
  isPublic: boolean | null;
  licenseSpdx: string | null;
  checkedAt: string;
  message: string;
}

export const repositoryVerificationSchema = z
  .object({
    status: z.enum(["verified", "not_found", "unavailable"]),
    repositoryUrl: z.string(),
    isPublic: z.boolean().nullable(),
    licenseSpdx: z.string().nullable(),
    checkedAt: z.string(),
    message: z.string(),
  })
  .strict();

export function detectCommonLicenseSpdx(value: string): string | null {
  const normalized = value.replace(/\s+/g, " ").trim().toUpperCase();

  if (
    normalized.includes("PERMISSION IS HEREBY GRANTED, FREE OF CHARGE") &&
    normalized.includes('THE SOFTWARE IS PROVIDED "AS IS"')
  ) {
    return "MIT";
  }

  if (
    normalized.includes("APACHE LICENSE") &&
    normalized.includes("VERSION 2.0, JANUARY 2004")
  ) {
    return "Apache-2.0";
  }

  return null;
}

const unsupportedRepositoryMessage =
  "Only public github.com repository URLs are supported";

export function parseGitHubRepositoryUrl(value: string): {
  owner: string;
  repository: string;
} {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(unsupportedRepositoryMessage);
  }

  const [owner, rawRepository, extra] = url.pathname
    .replace(/^\//, "")
    .replace(/\/$/, "")
    .split("/");
  const repository = rawRepository?.replace(/\.git$/, "");

  if (
    url.protocol !== "https:" ||
    url.hostname !== "github.com" ||
    !owner ||
    !repository ||
    extra
  ) {
    throw new Error(unsupportedRepositoryMessage);
  }

  return { owner, repository };
}
