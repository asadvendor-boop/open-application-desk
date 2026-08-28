import { describe, expect, it } from "vitest";
import { PROGRAM, createSampleDraft } from "./sample-program";

describe("sample program", () => {
  it("has unique requirements and an honestly incomplete judge draft", () => {
    const ids = PROGRAM.requirements.map((item) => item.id);
    const draft = createSampleDraft();

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(10);
    expect(draft.workflowState).toBe("draft");
    expect(draft.fields.audienceProblem).toBe("");
    expect(draft.attested).toBe(false);
  });
});
