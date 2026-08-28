import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
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

afterEach(() => {
  Reflect.deleteProperty(navigator, "locks");
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
});
