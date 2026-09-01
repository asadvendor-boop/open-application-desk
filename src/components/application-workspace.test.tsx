import { useState } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createWorkspace, applyPatch, stagePatch } from "@/domain/application/workspace";
import type { WorkspaceState } from "@/domain/application/types";
import { createValidDraft, verifiedRepository } from "@/test/fixtures";
import { saveWorkspace } from "@/storage/local-workspace";
import { ApplicationWorkspace } from "./application-workspace";
import { PatchReviewDrawer } from "./patch-review-drawer";

function installSubmissionLock() {
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: {
      request: (
        _name: string,
        _options: LockOptions,
        callback: (lock: Lock) => unknown,
      ) => callback({} as Lock),
    },
  });
}

function installModelContext() {
  const tools = new Map<string, WebMCP.ModelContextTool>();
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: {
      registerTool: vi.fn(async (tool: WebMCP.ModelContextTool, options) => {
        tools.set(tool.name, tool);
        options?.signal?.addEventListener(
          "abort",
          () => {
            if (tools.get(tool.name) === tool) {
              tools.delete(tool.name);
            }
          },
          { once: true },
        );
      }),
    } as unknown as WebMCP.ModelContext,
  });
  return tools;
}

afterEach(() => {
  Reflect.deleteProperty(navigator, "locks");
  Reflect.deleteProperty(document, "modelContext");
});

function PatchHarness() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(() =>
    stagePatch(
      createWorkspace(createValidDraft()),
      {
        changes: [
          {
            field: "summary",
            value: "A concise verified summary.",
            rationale: "Meet the program word limit.",
          },
        ],
      },
      "patch-1",
      "2026-08-27T01:00:00.000Z",
    ),
  );

  return (
    <>
      <label htmlFor="summary-harness">Project summary</label>
      <input
        id="summary-harness"
        readOnly
        value={workspace.draft.fields.summary}
      />
      <PatchReviewDrawer
        patch={workspace.stagedPatch}
        fields={workspace.draft.fields}
        onApply={(patchId) =>
          setWorkspace(
            applyPatch(workspace, patchId, "2026-08-27T01:01:00.000Z"),
          )
        }
        onReject={() => undefined}
      />
    </>
  );
}

describe("application workspace", () => {
  it("shows a staged patch as a diff and requires the human Apply control", async () => {
    const user = userEvent.setup();
    render(<PatchHarness />);

    expect(screen.getByText("Proposed change")).toBeInTheDocument();
    expect(screen.getByLabelText("Project summary")).not.toHaveValue(
      "A concise verified summary.",
    );
    await user.click(
      screen.getByRole("button", { name: "Apply proposed changes" }),
    );
    expect(screen.getByLabelText("Project summary")).toHaveValue(
      "A concise verified summary.",
    );
  });

  it("completes the manual audit, review, authorization, and receipt journey", async () => {
    const user = userEvent.setup();
    installSubmissionLock();
    saveWorkspace(createWorkspace(createValidDraft()));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(verifiedRepository), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    render(<ApplicationWorkspace />);
    await waitFor(() =>
      expect(screen.getByLabelText("Project name")).toHaveValue(
        "Agent-native application portal",
      ),
    );
    expect(
      screen.getByText(/a compatible agent gets five core typed WebMCP tools/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Run readiness audit" }));
    expect(await screen.findByText("10 ready")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Prepare exact review" }),
    );
    expect(await screen.findByText("Exact review snapshot")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Authorize exact application" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Submit approved application" }),
    );

    expect(await screen.findByText("Submission receipt")).toBeInTheDocument();
    expect(screen.getByText(/Recorded against review/)).toBeInTheDocument();
    expect(screen.getByText(/Submitted r\d+/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Prepare exact review" }),
    ).not.toBeInTheDocument();
  });

  it("updates the status bar after a WebMCP audit succeeds", async () => {
    const tools = installModelContext();
    saveWorkspace(createWorkspace(createValidDraft()));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(verifiedRepository), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    render(<ApplicationWorkspace />);
    await waitFor(() => expect(tools.get("audit_application")).toBeDefined());
    const auditTool = tools.get("audit_application");
    if (!auditTool) {
      throw new Error("Expected audit_application to register.");
    }

    await act(async () => {
      await auditTool.execute({}, { signal: new AbortController().signal });
    });

    expect(
      await screen.findByText("Draft r3 passed all 10 deterministic checks."),
    ).toBeInTheDocument();
  });
});
