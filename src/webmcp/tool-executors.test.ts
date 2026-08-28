import { describe, expect, it } from "vitest";

import { PROGRAM } from "@/domain/application/sample-program";
import {
  createValidDraft,
  createWorkspaceControllerHarness,
} from "@/test/fixtures";
import {
  createApplicantFactToolDefinition,
  createToolDefinitions,
} from "./tool-executors";

function toolNamed(
  name: string,
  controller = createWorkspaceControllerHarness(),
) {
  const tool = createToolDefinitions(controller).find(
    (candidate) => candidate.name === name,
  );
  if (!tool) {
    throw new Error(`Missing ${name}`);
  }
  return { controller, tool };
}

const liveSignal = () => new AbortController().signal;

async function executeWithoutBrowserContext(
  tool: WebMCP.ModelContextTool,
  input: Record<string, unknown>,
) {
  return (
    tool.execute as (input: Record<string, unknown>) => Promise<unknown>
  )(input);
}

describe("WebMCP tool executors", () => {
  it("waits for the applicant-owned fact and returns only the human response", async () => {
    const controller = createWorkspaceControllerHarness(createValidDraft());
    controller.editField("audienceProblem", "");
    const tool = createApplicantFactToolDefinition(controller);

    const pending = tool.execute(
      { field: "audienceProblem" },
      { signal: liveSignal() },
    );
    controller.answerApplicantFact(
      "Independent applicants need one truthful view of requirements and evidence.",
    );

    await expect(pending).resolves.toMatchObject({
      outcome: "answered",
      field: "audienceProblem",
      source: "human",
      draftRevision: 5,
    });
    expect(controller.getState().draft.fields.audienceProblem).toContain(
      "Independent applicants",
    );
  });

  it("runs the complete tool path when a native browser omits execution context", async () => {
    const controller = createWorkspaceControllerHarness(createValidDraft());
    const tools = createToolDefinitions(controller);
    const tool = (name: string) => {
      const definition = tools.find((candidate) => candidate.name === name);
      if (!definition) {
        throw new Error(`Missing ${name}`);
      }
      return definition;
    };

    await expect(
      executeWithoutBrowserContext(tool("get_application_context"), {
        sections: ["draft", "workflow"],
      }),
    ).resolves.toMatchObject({ outcome: "context" });
    await expect(
      executeWithoutBrowserContext(tool("audit_application"), {}),
    ).resolves.toMatchObject({ outcome: "audited", blockingCount: 0 });
    await expect(
      executeWithoutBrowserContext(tool("stage_draft_patch"), {
        changes: [
          {
            field: "summary",
            value: "A shorter summary.",
            rationale: "Meet the stated limit.",
          },
        ],
      }),
    ).resolves.toMatchObject({ outcome: "staged" });

    const prepared = (await executeWithoutBrowserContext(
      tool("prepare_submission"),
      { expectedDraftRevision: 3 },
    )) as { reviewId: string; draftHash: string };
    controller.authorizeSubmission(prepared.reviewId);

    await expect(
      executeWithoutBrowserContext(tool("submit_approved_application"), {
        reviewId: prepared.reviewId,
        draftHash: prepared.draftHash,
      }),
    ).resolves.toMatchObject({ outcome: "submitted" });
  });

  it("reads the exact current application without mutating it", async () => {
    const { controller, tool } = toolNamed("get_application_context");
    const before = structuredClone(controller.getState());

    const result = await tool.execute(
      { sections: ["program", "draft", "workflow"] },
      { signal: liveSignal() },
    );

    expect(result).toMatchObject({
      outcome: "context",
      program: { id: PROGRAM.id, requirementCount: 10 },
      draft: { revision: 3 },
      workflow: { state: "draft", attested: true },
    });
    expect(controller.getState()).toEqual(before);
  });

  it("audits the live revision and returns discrete deterministic checks", async () => {
    const { controller, tool } = toolNamed("audit_application");

    const result = await tool.execute({}, { signal: liveSignal() });

    expect(result).toMatchObject({
      outcome: "audited",
      draftRevision: 3,
      blockingCount: 0,
      attentionCount: 0,
    });
    expect(result).toHaveProperty("checks");
    expect(controller.getState().audit?.checks).toHaveLength(10);
  });

  it("reports counts for the selected audit checks rather than the hidden full report", async () => {
    const incompleteDraft = createValidDraft();
    incompleteDraft.fields.summary = "";
    const controller = createWorkspaceControllerHarness(incompleteDraft);
    const { tool } = toolNamed("audit_application", controller);

    const result = await tool.execute(
      { requirementIds: ["project_name"] },
      { signal: liveSignal() },
    );

    expect(result).toMatchObject({
      outcome: "audited",
      blockingCount: 0,
      attentionCount: 0,
      checks: [
        {
          requirementId: "project_name",
          status: "pass",
        },
      ],
    });
  });

  it("stages but does not apply an agent-proposed patch", async () => {
    const { controller, tool } = toolNamed("stage_draft_patch");
    const before = controller.getState().draft.fields.summary;

    const result = await tool.execute(
      {
        changes: [
          {
            field: "summary",
            value: "A shorter summary.",
            rationale: "Meet the stated limit.",
          },
        ],
      },
      { signal: liveSignal() },
    );

    expect(controller.getState().draft.fields.summary).toBe(before);
    expect(controller.getState().stagedPatch?.state).toBe("staged");
    expect(result).toMatchObject({ outcome: "staged", changeCount: 1 });
  });

  it("prepares an exact review but cannot authorize it", async () => {
    const controller = createWorkspaceControllerHarness(createValidDraft());
    await controller.runAudit();
    const { tool } = toolNamed("prepare_submission", controller);

    const result = await tool.execute(
      { expectedDraftRevision: 3 },
      { signal: liveSignal() },
    );

    expect(result).toMatchObject({
      outcome: "prepared",
      draftRevision: 3,
      authorized: false,
    });
    expect(controller.getState().review?.authorizedAt).toBeNull();
  });

  it("submits only the exact review after native human authorization", async () => {
    const controller = createWorkspaceControllerHarness(createValidDraft());
    await controller.runAudit();
    const review = await controller.prepareSubmission();
    const { tool } = toolNamed("submit_approved_application", controller);

    await expect(
      tool.execute(
        { reviewId: review.id, draftHash: review.draftHash },
        { signal: liveSignal() },
      ),
    ).rejects.toThrow("Human authorization is required");

    controller.authorizeSubmission(review.id);
    const result = await tool.execute(
      { reviewId: review.id, draftHash: review.draftHash },
      { signal: liveSignal() },
    );

    expect(result).toMatchObject({
      outcome: "submitted",
      reviewId: review.id,
      draftHash: review.draftHash,
    });
    expect(controller.getState().draft.workflowState).toBe("submitted");
  });

  it("rejects unknown input properties and already-aborted work", async () => {
    const { tool } = toolNamed("audit_application");
    await expect(
      tool.execute({ invented: true }, { signal: liveSignal() }),
    ).rejects.toThrow("Invalid audit_application input");

    const controller = new AbortController();
    controller.abort();
    await expect(tool.execute({}, { signal: controller.signal })).rejects.toThrow(
      "aborted",
    );
  });
});
