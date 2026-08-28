import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createValidDraft } from "@/test/fixtures";
import type { StagedPatch } from "@/domain/application/types";
import { PatchReviewDrawer } from "./patch-review-drawer";

const patch: StagedPatch = {
  id: "patch-1",
  baseRevision: 3,
  state: "staged",
  createdAt: "2026-08-29T00:00:00.000Z",
  changes: [
    {
      field: "summary",
      value: "A concise summary.",
      rationale: "Meet the word limit.",
    },
  ],
  readinessProjection: {
    currentReadyCount: 3,
    projectedReadyCount: 7,
    requirementCount: 10,
    resolvedRequirementIds: [
      "summary_word_limit",
      "live_url_https",
      "repository_public",
      "repository_license",
    ],
    remainingBlockingRequirementIds: [
      "audience_problem",
      "claim_evidence",
      "human_attestation",
    ],
  },
};

describe("PatchReviewDrawer", () => {
  it("shows a preview-only, accessible readiness comparison", () => {
    render(
      <PatchReviewDrawer
        patch={patch}
        fields={createValidDraft().fields}
        onApply={() => undefined}
        onReject={() => undefined}
      />,
    );

    expect(screen.getByText("Preview only — not applied")).toBeInTheDocument();
    expect(screen.getByLabelText("Now: 3 of 10 ready")).toBeInTheDocument();
    expect(
      screen.getByLabelText("After this proposal: 7 of 10 ready"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Four blockers resolved · Three require the applicant"),
    ).toBeInTheDocument();
  });
});
