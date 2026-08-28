import { NextResponse } from "next/server";
import { z } from "zod";

import {
  detectCommonLicenseSpdx,
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

function notFound(repositoryUrl: string): RepositoryVerification {
  return {
    status: "not_found",
    repositoryUrl,
    isPublic: null,
    licenseSpdx: null,
    checkedAt: new Date().toISOString(),
    message: "GitHub did not find a public repository at this URL.",
  };
}

async function verifyWithoutApi(
  repositoryUrl: string,
  owner: string,
  repository: string,
): Promise<RepositoryVerification> {
  try {
    const repositoryPage = await fetch(
      `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`,
      {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(4_000),
      },
    );

    if (repositoryPage.status === 404) {
      return notFound(repositoryUrl);
    }

    if (!repositoryPage.ok) {
      return unavailable(
        repositoryUrl,
        "GitHub metadata is temporarily unavailable.",
      );
    }

    const licenseResponse = await fetch(
      `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/HEAD/LICENSE`,
      {
        headers: { Accept: "text/plain", Range: "bytes=0-65535" },
        signal: AbortSignal.timeout(4_000),
      },
    );
    const licenseSpdx = licenseResponse.ok
      ? detectCommonLicenseSpdx((await licenseResponse.text()).slice(0, 65_536))
      : null;

    return {
      status: "verified",
      repositoryUrl,
      isPublic: true,
      licenseSpdx,
      checkedAt: new Date().toISOString(),
      message: "Public repository metadata checked.",
    };
  } catch {
    return unavailable(
      repositoryUrl,
      "GitHub metadata request failed or timed out.",
    );
  }
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
      `https://api.github.com/repos/${encodeURIComponent(repositoryPath.owner)}/${encodeURIComponent(repositoryPath.repository)}`,
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
      return NextResponse.json(notFound(repositoryUrl));
    }

    if (!response.ok) {
      return NextResponse.json(
        await verifyWithoutApi(
          repositoryUrl,
          repositoryPath.owner,
          repositoryPath.repository,
        ),
      );
    }

    const parsedGitHub = githubResponseSchema.safeParse(await response.json());
    if (!parsedGitHub.success) {
      return NextResponse.json(
        await verifyWithoutApi(
          repositoryUrl,
          repositoryPath.owner,
          repositoryPath.repository,
        ),
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
      await verifyWithoutApi(
        repositoryUrl,
        repositoryPath.owner,
        repositoryPath.repository,
      ),
    );
  }
}
