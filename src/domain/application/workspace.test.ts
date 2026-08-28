import { describe, expect, it } from "vitest";

import { createValidDraft, passingAudit } from "@/test/fixtures";
import {
  applyPatch,
  authorizeReview,
  createWorkspace,
  editDraftField,
  prepareReview,
  recordAudit,
  rejectPatch,
  setAttestation,
  stagePatch,
  submitApproved,
  upsertEvidence,
} from "./workspace";

const NOW = "2026-08-27T01:00:00.000Z";
const LATER = "2026-08-27T01:01:00.000Z";

async function submittedWorkspace() {
  const ready = recordAudit(createWorkspace(createValidDraft()), passingAudit());
  const reviewed = await prepareReview(ready, "review-1", NOW);
  const authorized = authorizeReview(reviewed, "review-1", LATER);
  return submitApproved(
    authorized,
    { reviewId: "review-1", draftHash: authorized.review!.draftHash },
    "receipt-1",
    LATER,
  );
}

describe("workspace authority boundaries", () => {
  it("stages a patch without changing the draft", () => {
    const original = createWorkspace(createValidDraft());
    const staged = stagePatch(
      original,
      {
        changes: [
          {
            field: "summary",
            value: "A concise verified summary.",
            rationale: "Meet the word limit.",
          },
        ],
      },
      "patch-1",
      NOW,
    );

    expect(staged.draft.fields.summary).toBe(original.draft.fields.summary);
    expect(staged.stagedPatch?.state).toBe("staged");
    expect(staged.stagedPatch?.baseRevision).toBe(original.draft.revision);
  });

  it("rejects duplicate fields in one proposed patch", () => {
    const original = createWorkspace(createValidDraft());

    expect(() =>
      stagePatch(
        original,
        {
          changes: [
            { field: "summary", value: "First", rationale: "First reason" },
            { field: "summary", value: "Second", rationale: "Second reason" },
          ],
        },
        "patch-1",
        NOW,
      ),
    ).toThrow("duplicate fields");
  });

  it("applies an entire human-approved patch in one revision", () => {
    const original = createWorkspace(createValidDraft());
    const staged = stagePatch(
      original,
      {
        changes: [
          { field: "summary", value: "A shorter summary.", rationale: "Clarity" },
          {
            field: "impactStatement",
            value: "A measurable impact statement.",
            rationale: "Specificity",
          },
        ],
      },
      "patch-1",
      NOW,
    );
    const applied = applyPatch(staged, "patch-1", LATER);

    expect(applied.draft.revision).toBe(original.draft.revision + 1);
    expect(applied.draft.fields.summary).toBe("A shorter summary.");
    expect(applied.draft.fields.impactStatement).toBe(
      "A measurable impact statement.",
    );
    expect(applied.stagedPatch?.state).toBe("applied");
  });

  it("marks a proposed patch stale after a human edit", () => {
    const original = createWorkspace(createValidDraft());
    const staged = stagePatch(
      original,
      {
        changes: [
          { field: "summary", value: "A shorter summary.", rationale: "Clarity" },
        ],
      },
      "patch-1",
      NOW,
    );
    const edited = editDraftField(
      staged,
      "projectName",
      "Human-edited project",
      LATER,
    );

    expect(edited.stagedPatch?.state).toBe("stale");
    expect(() => applyPatch(edited, "patch-1", LATER)).toThrow("stale");
  });

  it("lets the human reject a patch without changing the draft", () => {
    const original = createWorkspace(createValidDraft());
    const staged = stagePatch(
      original,
      {
        changes: [
          { field: "summary", value: "A shorter summary.", rationale: "Clarity" },
        ],
      },
      "patch-1",
      NOW,
    );
    const rejected = rejectPatch(staged, "patch-1", LATER);

    expect(rejected.draft).toEqual(original.draft);
    expect(rejected.stagedPatch?.state).toBe("rejected");
  });

  it("treats attestation as a human mutation and invalidates its audit", () => {
    const audited = recordAudit(
      createWorkspace(createValidDraft()),
      passingAudit(),
    );
    const changed = setAttestation(audited, false, LATER);

    expect(changed.draft.attested).toBe(false);
    expect(changed.draft.revision).toBe(audited.draft.revision + 1);
    expect(changed.audit).toBeNull();
    expect(changed.activity.at(-1)?.actor).toBe("human");
  });

  it("treats evidence changes as human-owned draft mutations", () => {
    const audited = recordAudit(
      createWorkspace(createValidDraft()),
      passingAudit(),
    );
    const changed = upsertEvidence(
      audited,
      {
        id: "repository-evidence",
        claim: "The repository is public and licensed.",
        url: "https://github.com/openai/openai-node",
        kind: "repository",
      },
      LATER,
    );

    expect(changed.draft.evidence[0]?.claim).toContain("licensed");
    expect(changed.draft.revision).toBe(audited.draft.revision + 1);
    expect(changed.audit).toBeNull();
  });

  it("invalidates authorization when a reviewed draft changes", async () => {
    const ready = recordAudit(createWorkspace(createValidDraft()), passingAudit());
    const reviewed = await prepareReview(ready, "review-1", NOW);
    const authorized = authorizeReview(reviewed, "review-1", NOW);
    const edited = editDraftField(
      authorized,
      "impactStatement",
      "A revised impact statement.",
      LATER,
    );

    expect(edited.review).toBeNull();
    expect(edited.audit).toBeNull();
    expect(edited.draft.revision).toBe(authorized.draft.revision + 1);
  });

  it("rejects stale audits and expired review authorization", async () => {
    const staleDraft = createValidDraft();
    staleDraft.revision += 1;
    const stale = recordAudit(createWorkspace(staleDraft), passingAudit());
    await expect(prepareReview(stale, "review-1", NOW)).rejects.toThrow(
      "current draft",
    );

    const ready = recordAudit(createWorkspace(createValidDraft()), passingAudit());
    const reviewed = await prepareReview(ready, "review-2", NOW);
    expect(() =>
      authorizeReview(reviewed, "review-2", "2026-08-27T01:06:00.000Z"),
    ).toThrow("expired");
  });

  it("submits once only after matching human authorization", async () => {
    const ready = recordAudit(createWorkspace(createValidDraft()), passingAudit());
    const reviewed = await prepareReview(ready, "review-1", NOW);
    await expect(
      submitApproved(
        reviewed,
        { reviewId: "review-1", draftHash: reviewed.review!.draftHash },
        "receipt-1",
        LATER,
      ),
    ).rejects.toThrow("Human authorization is required");

    const authorized = authorizeReview(reviewed, "review-1", LATER);
    const submitted = await submitApproved(
      authorized,
      { reviewId: "review-1", draftHash: authorized.review!.draftHash },
      "receipt-1",
      LATER,
    );
    const repeated = await submitApproved(
      submitted,
      { reviewId: "review-1", draftHash: authorized.review!.draftHash },
      "receipt-2",
      LATER,
    );

    expect(repeated.receipt?.id).toBe("receipt-1");
    expect(repeated.draft.workflowState).toBe("submitted");
    expect(repeated.receipt?.journeyProof).toEqual({
      initialBlockingCount: 0,
      finalBlockingCount: 0,
      finalReadyCount: 10,
      requirementCount: 10,
    });
  });

  it("omits before-and-after proof when a legacy baseline is unknowable", async () => {
    const ready = {
      ...recordAudit(createWorkspace(createValidDraft()), passingAudit()),
      baselineAudit: null,
      baselineAuditTracked: false,
    };
    const reviewed = await prepareReview(ready, "review-1", NOW);
    const authorized = authorizeReview(reviewed, "review-1", LATER);
    const submitted = await submitApproved(
      authorized,
      { reviewId: "review-1", draftHash: authorized.review!.draftHash },
      "receipt-1",
      LATER,
    );

    expect(submitted.receipt?.journeyProof).toBeUndefined();
  });

  it("fails closed when a persisted review has no current passing audit", async () => {
    const ready = recordAudit(createWorkspace(createValidDraft()), passingAudit());
    const reviewed = await prepareReview(ready, "review-1", NOW);
    const authorized = authorizeReview(reviewed, "review-1", LATER);

    await expect(
      submitApproved(
        { ...authorized, audit: null },
        { reviewId: "review-1", draftHash: authorized.review!.draftHash },
        "receipt-1",
        LATER,
      ),
    ).rejects.toThrow("current passing audit");
  });

  it("binds a seven-to-zero journey to the submitted receipt", async () => {
    const firstAudit = {
      ...passingAudit(),
      blockingCount: 7,
      checks: passingAudit().checks.map((check, index) => ({
        ...check,
        status: index < 7 ? ("block" as const) : ("pass" as const),
      })),
    };
    const first = recordAudit(createWorkspace(createValidDraft()), firstAudit);
    const final = recordAudit(first, passingAudit());
    const reviewed = await prepareReview(final, "review-1", NOW);
    const authorized = authorizeReview(reviewed, "review-1", LATER);
    const submitted = await submitApproved(
      authorized,
      { reviewId: "review-1", draftHash: authorized.review!.draftHash },
      "receipt-1",
      LATER,
    );

    expect(final.baselineAudit).toEqual(firstAudit);
    expect(final.audit).toEqual(passingAudit());
    expect(submitted.receipt?.journeyProof).toEqual({
      initialBlockingCount: 7,
      finalBlockingCount: 0,
      finalReadyCount: 10,
      requirementCount: 10,
    });
  });

  it("does not prepare another review after the application was submitted", async () => {
    const submitted = await submittedWorkspace();

    await expect(
      prepareReview(submitted, "review-2", LATER),
    ).rejects.toThrow("already submitted");
    expect(submitted.receipt?.id).toBe("receipt-1");
  });

  it("does not stage a new patch after the application was submitted", async () => {
    const submitted = await submittedWorkspace();

    expect(() =>
      stagePatch(
        submitted,
        {
          changes: [
            { field: "summary", value: "Changed", rationale: "Try again" },
          ],
        },
        "patch-after-submit",
        LATER,
      ),
    ).toThrow("already submitted");
    expect(submitted.receipt?.id).toBe("receipt-1");
  });

  it("does not apply a previously staged patch after submission", async () => {
    const ready = recordAudit(createWorkspace(createValidDraft()), passingAudit());
    const staged = stagePatch(
      ready,
      {
        changes: [
          { field: "summary", value: "Changed", rationale: "Try again" },
        ],
      },
      "patch-1",
      NOW,
    );
    const reviewed = await prepareReview(staged, "review-1", NOW);
    const authorized = authorizeReview(reviewed, "review-1", LATER);
    const submitted = await submitApproved(
      authorized,
      { reviewId: "review-1", draftHash: authorized.review!.draftHash },
      "receipt-1",
      LATER,
    );

    expect(() => applyPatch(submitted, "patch-1", LATER)).toThrow(
      "already submitted",
    );
    expect(submitted.receipt?.id).toBe("receipt-1");
  });

  it("finalizes an unreviewed proposal when its draft is submitted", async () => {
    const ready = recordAudit(createWorkspace(createValidDraft()), passingAudit());
    const staged = stagePatch(
      ready,
      {
        changes: [
          { field: "summary", value: "Changed", rationale: "Try again" },
        ],
      },
      "patch-1",
      NOW,
    );
    const reviewed = await prepareReview(staged, "review-1", NOW);
    const authorized = authorizeReview(reviewed, "review-1", LATER);
    const submitted = await submitApproved(
      authorized,
      { reviewId: "review-1", draftHash: authorized.review!.draftHash },
      "receipt-1",
      LATER,
    );

    expect(submitted.stagedPatch?.state).toBe("stale");
    expect(() => rejectPatch(submitted, "patch-1", LATER)).toThrow(
      "already submitted",
    );
  });
});
