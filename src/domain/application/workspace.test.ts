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
} from "./workspace";

const NOW = "2026-08-27T01:00:00.000Z";
const LATER = "2026-08-27T01:01:00.000Z";

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
  });
});
