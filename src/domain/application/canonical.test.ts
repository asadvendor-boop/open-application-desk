import { describe, expect, it } from "vitest";

import { createValidDraft } from "@/test/fixtures";
import { canonicalDraftJson, hashDraft } from "./canonical";

describe("canonical application drafts", () => {
  it("ignores mutable workflow metadata and sorts evidence by ID", async () => {
    const original = createValidDraft();
    original.evidence = [
      ...original.evidence,
      {
        id: "live-evidence",
        claim: "The live product is reachable.",
        url: "https://example.com/application",
        kind: "live_demo",
      },
    ];
    const equivalent = {
      ...original,
      workflowState: "review" as const,
      updatedAt: "2026-08-27T04:00:00.000Z",
      evidence: [...original.evidence].reverse(),
    };

    expect(canonicalDraftJson(equivalent)).toBe(canonicalDraftJson(original));
    await expect(hashDraft(equivalent)).resolves.toBe(await hashDraft(original));
  });

  it("changes the hash when reviewable content changes", async () => {
    const original = createValidDraft();
    const changed = {
      ...original,
      fields: { ...original.fields, projectName: "A different project" },
    };

    await expect(hashDraft(changed)).resolves.not.toBe(await hashDraft(original));
  });
});
