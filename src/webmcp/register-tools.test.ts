import { describe, expect, it, vi } from "vitest";

import { createWorkspaceControllerHarness } from "@/test/fixtures";
import {
  registerApplicantFactTool,
  registerWebMcpTools,
} from "./register-tools";

describe("WebMCP registration", () => {
  it("registers the contextual fact tool separately from the five core tools", async () => {
    const registered: WebMCP.ModelContextTool[] = [];
    const modelContext = {
      registerTool: vi.fn(async (tool) => {
        registered.push(tool);
      }),
    } as unknown as WebMCP.ModelContext;

    const registration = await registerApplicantFactTool(
      createWorkspaceControllerHarness(),
      modelContext,
    );

    expect(registration.supported).toBe(true);
    expect(registered.map((tool) => tool.name)).toEqual([
      "request_applicant_fact",
    ]);
  });

  it("registers exactly five tools and aborts their lifecycle on dispose", async () => {
    const registered: WebMCP.ModelContextTool[] = [];
    let lifecycleSignal: AbortSignal | undefined;
    const modelContext = {
      registerTool: vi.fn(async (tool, options) => {
        registered.push(tool);
        lifecycleSignal = options?.signal;
      }),
    } as unknown as WebMCP.ModelContext;

    const registration = await registerWebMcpTools(
      createWorkspaceControllerHarness(),
      modelContext,
    );

    expect(registration.supported).toBe(true);
    expect(registered.map((tool) => tool.name)).toEqual([
      "get_application_context",
      "audit_application",
      "stage_draft_patch",
      "prepare_submission",
      "submit_approved_application",
    ]);
    registration.dispose();
    expect(lifecycleSignal?.aborted).toBe(true);
  });

  it("aborts already registered tools when a later registration fails", async () => {
    let firstSignal: AbortSignal | undefined;
    const modelContext = {
      registerTool: vi
        .fn()
        .mockImplementationOnce(async (_tool, options) => {
          firstSignal = options?.signal;
        })
        .mockRejectedValueOnce(new Error("registration rejected")),
    } as unknown as WebMCP.ModelContext;

    await expect(
      registerWebMcpTools(createWorkspaceControllerHarness(), modelContext),
    ).rejects.toThrow("registration rejected");
    expect(firstSignal?.aborted).toBe(true);
  });

  it("reports unsupported without attempting registration", async () => {
    const registration = await registerWebMcpTools(
      createWorkspaceControllerHarness(),
      undefined,
    );

    expect(registration.supported).toBe(false);
    expect(() => registration.dispose()).not.toThrow();
  });
});
