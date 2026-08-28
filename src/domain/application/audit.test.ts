import { describe, expect, it } from "vitest";
import {
  createValidDraft,
  unavailableRepository,
  verifiedRepository,
} from "@/test/fixtures";
import { auditApplication } from "./audit";

describe("auditApplication", () => {
  it("passes a complete draft with a public licensed repository", () => {
    const report = auditApplication(
      createValidDraft(),
      verifiedRepository,
      "2026-08-27T01:00:00.000Z",
    );

    expect(report.blockingCount).toBe(0);
    expect(report.checks).toHaveLength(10);
    expect(report.checks.every((check) => check.status === "pass")).toBe(true);
  });

  it("blocks missing human-owned facts and attestation", () => {
    const draft = createValidDraft();
    draft.fields.audienceProblem = "";
    draft.attested = false;

    const report = auditApplication(
      draft,
      verifiedRepository,
      "2026-08-27T01:00:00.000Z",
    );

    expect(
      report.checks.find(
        (check) => check.requirementId === "audience_problem",
      )?.status,
    ).toBe("block");
    expect(
      report.checks.find(
        (check) => check.requirementId === "human_attestation",
      )?.status,
    ).toBe("block");
  });

  it("reports unavailable repository metadata as unverified", () => {
    const report = auditApplication(
      createValidDraft(),
      unavailableRepository,
      "2026-08-27T01:00:00.000Z",
    );
    const repositoryCheck = report.checks.find(
      (check) => check.requirementId === "repository_public",
    );

    expect(repositoryCheck?.status).toBe("block");
    expect(repositoryCheck?.message).toMatch(/unverified/i);
  });
});
