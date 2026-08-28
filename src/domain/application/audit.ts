import { PROGRAM } from "./sample-program";
import { httpsUrlSchema } from "./schemas";
import type {
  ApplicationDraft,
  ApplicationFieldKey,
  AuditCheck,
  AuditReport,
  RequirementStatus,
} from "./types";
import type { RepositoryVerification } from "./github";
import { parseGitHubRepositoryUrl } from "./github";

function wordCount(value: string): number {
  const normalized = value.trim();
  return normalized ? normalized.split(/\s+/).length : 0;
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function isHttpsUrl(value: string): boolean {
  return httpsUrlSchema.safeParse(value).success;
}

function check(
  requirementId: string,
  status: RequirementStatus,
  message: string,
  field?: ApplicationFieldKey,
): AuditCheck {
  return { requirementId, status, message, ...(field ? { field } : {}) };
}

function repositoryUrlIsSupported(value: string): boolean {
  try {
    parseGitHubRepositoryUrl(value);
    return true;
  } catch {
    return false;
  }
}

function repositoryCheck(
  draft: ApplicationDraft,
  verification: RepositoryVerification | null,
): AuditCheck {
  const supported = repositoryUrlIsSupported(draft.fields.repositoryUrl);
  if (!supported) {
    return check(
      "repository_public",
      "block",
      "Add a public github.com repository URL.",
      "repositoryUrl",
    );
  }

  if (
    !verification ||
    verification.repositoryUrl !== draft.fields.repositoryUrl ||
    verification.status === "unavailable"
  ) {
    return check(
      "repository_public",
      "block",
      "Repository status is unverified; retry the public metadata check.",
      "repositoryUrl",
    );
  }

  if (verification.status === "not_found" || verification.isPublic !== true) {
    return check(
      "repository_public",
      "block",
      "The repository could not be confirmed as public.",
      "repositoryUrl",
    );
  }

  return check(
    "repository_public",
    "pass",
    "Public repository verified.",
    "repositoryUrl",
  );
}

function repositoryLicenseCheck(
  draft: ApplicationDraft,
  verification: RepositoryVerification | null,
): AuditCheck {
  if (
    verification?.status === "verified" &&
    verification.repositoryUrl === draft.fields.repositoryUrl &&
    verification.licenseSpdx &&
    verification.licenseSpdx !== "NOASSERTION"
  ) {
    return check(
      "repository_license",
      "pass",
      `Open-source license verified: ${verification.licenseSpdx}.`,
      "repositoryUrl",
    );
  }

  const message =
    verification?.status === "not_found"
      ? "Repository license could not be verified because the repository was not found."
      : "Repository license is unverified.";
  return check(
    "repository_license",
    "block",
    message,
    "repositoryUrl",
  );
}

export function auditApplication(
  draft: ApplicationDraft,
  repository: RepositoryVerification | null,
  checkedAt: string,
): AuditReport {
  const summaryWords = wordCount(draft.fields.summary);
  const evidenceReady =
    draft.evidence.length > 0 &&
    draft.evidence.every(
      (item) => hasText(item.claim) && isHttpsUrl(item.url),
    );

  const checks: AuditCheck[] = [
    check(
      "project_name",
      hasText(draft.fields.projectName) ? "pass" : "block",
      hasText(draft.fields.projectName)
        ? "Project name supplied."
        : "Add a project name.",
      "projectName",
    ),
    check(
      "summary_present",
      hasText(draft.fields.summary) ? "pass" : "block",
      hasText(draft.fields.summary)
        ? "Project summary supplied."
        : "Add a project summary.",
      "summary",
    ),
    check(
      "summary_word_limit",
      summaryWords <= PROGRAM.summaryWordLimit ? "pass" : "block",
      summaryWords <= PROGRAM.summaryWordLimit
        ? `Summary uses ${summaryWords} of ${PROGRAM.summaryWordLimit} words.`
        : `Summary uses ${summaryWords} words; limit is ${PROGRAM.summaryWordLimit}.`,
      "summary",
    ),
    check(
      "audience_problem",
      hasText(draft.fields.audienceProblem) ? "pass" : "block",
      hasText(draft.fields.audienceProblem)
        ? "Audience and problem supplied."
        : "The applicant must supply the audience and problem.",
      "audienceProblem",
    ),
    check(
      "live_url_https",
      isHttpsUrl(draft.fields.liveUrl) ? "pass" : "block",
      isHttpsUrl(draft.fields.liveUrl)
        ? "HTTPS live URL supplied."
        : "Add an HTTPS live URL.",
      "liveUrl",
    ),
    repositoryCheck(draft, repository),
    repositoryLicenseCheck(draft, repository),
    check(
      "impact_statement",
      hasText(draft.fields.impactStatement) ? "pass" : "block",
      hasText(draft.fields.impactStatement)
        ? "Impact statement supplied."
        : "Add an impact statement.",
      "impactStatement",
    ),
    check(
      "claim_evidence",
      evidenceReady ? "pass" : "block",
      evidenceReady
        ? "Every listed claim has an HTTPS evidence link."
        : "Add at least one claim with an HTTPS evidence link.",
    ),
    check(
      "human_attestation",
      draft.attested ? "pass" : "block",
      draft.attested
        ? "Applicant attestation supplied."
        : "The applicant must personally attest this draft.",
    ),
  ];

  return {
    draftRevision: draft.revision,
    checkedAt,
    checks,
    blockingCount: checks.filter((item) => item.status === "block").length,
    attentionCount: checks.filter((item) => item.status === "attention").length,
  };
}
