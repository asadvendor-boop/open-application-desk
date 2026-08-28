import { describe, expect, it, vi } from "vitest";

import {
  createWorkspace,
  recordAudit,
  stagePatch,
} from "@/domain/application/workspace";
import { createValidDraft, passingAudit } from "@/test/fixtures";
import {
  STORAGE_KEY,
  loadWorkspace,
  saveWorkspace,
} from "./local-workspace";

describe("browser-local workspace persistence", () => {
  it("round-trips a valid version-one workspace", () => {
    const workspace = createWorkspace(createValidDraft());

    expect(saveWorkspace(workspace)).toEqual({ ok: true });
    expect(loadWorkspace()).toEqual(workspace);
  });

  it("persists a staged patch that includes a readiness projection", () => {
    const workspace = stagePatch(
      createWorkspace(createValidDraft()),
      {
        changes: [
          {
            field: "summary",
            value: "A concise summary.",
            rationale: "Meet the word limit.",
          },
        ],
      },
      "patch-1",
      "2026-08-29T00:00:00.000Z",
      {
        currentReadyCount: 3,
        projectedReadyCount: 7,
        requirementCount: 10,
        resolvedRequirementIds: ["summary_word_limit"],
        remainingBlockingRequirementIds: ["audience_problem"],
      },
    );

    expect(saveWorkspace(workspace)).toEqual({ ok: true });
    expect(loadWorkspace()?.stagedPatch?.readinessProjection).toMatchObject({
      currentReadyCount: 3,
      projectedReadyCount: 7,
    });
  });

  it("marks an older audited version-one state as having no trustworthy baseline", () => {
    const workspace = recordAudit(
      createWorkspace(createValidDraft()),
      passingAudit(),
    );
    const olderWorkspace: Partial<typeof workspace> = { ...workspace };
    delete olderWorkspace.baselineAudit;
    delete olderWorkspace.baselineAuditTracked;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(olderWorkspace));

    const loaded = loadWorkspace();
    expect(loaded?.baselineAudit).toBeNull();
    expect(loaded?.baselineAuditTracked).toBe(false);
    expect(recordAudit(loaded!, passingAudit()).baselineAudit).toBeNull();
  });

  it("rejects malformed or future-version browser state", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99 }));
    expect(loadWorkspace()).toBeNull();

    localStorage.setItem(STORAGE_KEY, "not-json");
    expect(loadWorkspace()).toBeNull();
  });

  it("reports a write failure instead of claiming persistence", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    expect(saveWorkspace(createWorkspace(createValidDraft()))).toEqual({
      ok: false,
      error: "Browser storage is unavailable",
    });
  });
});
