import type { ApplicationDraft } from "@/domain/application/types";
import { auditApplication } from "@/domain/application/audit";
import type { RepositoryVerification } from "@/domain/application/github";

export const verifiedRepository: RepositoryVerification = {
  status: "verified",
  repositoryUrl: "https://github.com/openai/openai-node",
  isPublic: true,
  licenseSpdx: "Apache-2.0",
  checkedAt: "2026-08-27T01:00:00.000Z",
  message: "Public repository and license verified.",
};

export const unavailableRepository: RepositoryVerification = {
  status: "unavailable",
  repositoryUrl: "https://github.com/openai/openai-node",
  isPublic: null,
  licenseSpdx: null,
  checkedAt: "2026-08-27T01:00:00.000Z",
  message: "GitHub metadata is temporarily unavailable.",
};

export function createValidDraft(): ApplicationDraft {
  return {
    id: "valid-application",
    revision: 3,
    fields: {
      projectName: "Agent-native application portal",
      summary:
        "A WebMCP portal lets applicants and agents inspect one live draft, stage exact changes, verify public evidence, and submit only after human review.",
      audienceProblem:
        "Applicants lose time and risk rejection when requirements, claims, and evidence drift across disconnected submission surfaces.",
      liveUrl: "https://example.com/application",
      repositoryUrl: "https://github.com/openai/openai-node",
      impactStatement:
        "People retain factual and submission authority while agents handle structured inspection and preparation.",
    },
    evidence: [
      {
        id: "repository-evidence",
        claim: "The project has a public open-source repository.",
        url: "https://github.com/openai/openai-node",
        kind: "repository",
      },
    ],
    attested: true,
    workflowState: "draft",
    updatedAt: "2026-08-27T00:55:00.000Z",
  };
}

export function passingAudit() {
  return auditApplication(
    createValidDraft(),
    verifiedRepository,
    "2026-08-27T01:00:00.000Z",
  );
}
