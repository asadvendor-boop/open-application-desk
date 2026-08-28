import { describe, expect, it, vi } from "vitest";

import { createWorkspace } from "@/domain/application/workspace";
import { createValidDraft } from "@/test/fixtures";
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
