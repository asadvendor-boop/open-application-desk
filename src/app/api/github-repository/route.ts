import { NextResponse } from "next/server";
import { z } from "zod";

import {
  parseGitHubRepositoryUrl,
  type RepositoryVerification,
} from "@/domain/application/github";
import { repositoryRequestSchema } from "@/domain/application/schemas";

const githubResponseSchema = z.object({
  private: z.boolean(),
  license: z.object({ spdx_id: z.string().nullable() }).nullable(),
});

function unavailable(
  repositoryUrl: string,
  message: string,
): RepositoryVerification {
  return {
    status: "unavailable",
    repositoryUrl,
    isPublic: null,
    licenseSpdx: null,
    checkedAt: new Date().toISOString(),
    message,
  };
}

export async function POST(request: Request) {
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsedRequest = repositoryRequestSchema.safeParse(requestBody);
  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "A valid public GitHub repository URL is required." },
      { status: 400 },
    );
  }

  const { repositoryUrl } = parsedRequest.data;
  let repositoryPath: ReturnType<typeof parseGitHubRepositoryUrl>;
  try {
    repositoryPath = parseGitHubRepositoryUrl(repositoryUrl);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unsupported repository URL.",
      },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repositoryPath.owner}/${repositoryPath.repository}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "webmcp-application-portal",
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
        signal: AbortSignal.timeout(4_000),
        next: { revalidate: 300 },
      },
    );

    if (response.status === 404) {
      const result: RepositoryVerification = {
        status: "not_found",
        repositoryUrl,
        isPublic: null,
        licenseSpdx: null,
        checkedAt: new Date().toISOString(),
        message: "GitHub did not find a public repository at this URL.",
      };
      return NextResponse.json(result);
    }

    if (!response.ok) {
      return NextResponse.json(
        unavailable(
          repositoryUrl,
          "GitHub metadata is temporarily unavailable.",
        ),
      );
    }

    const parsedGitHub = githubResponseSchema.safeParse(await response.json());
    if (!parsedGitHub.success) {
      return NextResponse.json(
        unavailable(repositoryUrl, "GitHub returned unrecognized metadata."),
      );
    }

    const result: RepositoryVerification = {
      status: "verified",
      repositoryUrl,
      isPublic: !parsedGitHub.data.private,
      licenseSpdx: parsedGitHub.data.license?.spdx_id ?? null,
      checkedAt: new Date().toISOString(),
      message: "Public repository metadata checked.",
    };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      unavailable(repositoryUrl, "GitHub metadata request failed or timed out."),
    );
  }
}
