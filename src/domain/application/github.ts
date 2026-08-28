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
