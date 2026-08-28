import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  authorizeReview,
  createWorkspace,
  prepareReview,
  recordAudit,
} from "@/domain/application/workspace";
import { saveWorkspace } from "@/storage/local-workspace";
import { createValidDraft, passingAudit } from "@/test/fixtures";
import { useApplicationWorkspace } from "./use-application-workspace";

function bufferFromHex(value: string): ArrayBuffer {
  return Uint8Array.from(
    value.match(/.{2}/g) ?? [],
    (byte) => Number.parseInt(byte, 16),
  ).buffer;
}

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("useApplicationWorkspace concurrency", () => {
  it("preserves a human edit made while a review hash is being prepared", async () => {
    saveWorkspace(recordAudit(createWorkspace(createValidDraft()), passingAudit()));
    let resolveDigest!: (value: ArrayBuffer) => void;
    const digest = new Promise<ArrayBuffer>((resolve) => {
      resolveDigest = resolve;
    });
    vi.spyOn(crypto.subtle, "digest").mockReturnValue(digest);
    const { result } = renderHook(() => useApplicationWorkspace());

    let preparation!: ReturnType<
      typeof result.current.controller.prepareSubmission
    >;
    act(() => {
      preparation = result.current.controller.prepareSubmission();
    });
    act(() => {
      result.current.controller.editField(
        "projectName",
        "Human edit during preparation",
      );
    });
    resolveDigest(new ArrayBuffer(32));

    await expect(preparation).rejects.toThrow("changed while");
    expect(result.current.workspace.draft.fields.projectName).toBe(
      "Human edit during preparation",
    );
    expect(result.current.workspace.review).toBeNull();
  });

  it("preserves a human edit made while an authorized submission is hashing", async () => {
    const now = new Date().toISOString();
    const ready = recordAudit(createWorkspace(createValidDraft()), passingAudit());
    const reviewed = await prepareReview(ready, "review-1", now);
    const authorized = authorizeReview(reviewed, "review-1", now);
    saveWorkspace(authorized);
    let resolveDigest!: (value: ArrayBuffer) => void;
    const digest = new Promise<ArrayBuffer>((resolve) => {
      resolveDigest = resolve;
    });
    vi.spyOn(crypto.subtle, "digest").mockReturnValue(digest);
    const { result } = renderHook(() => useApplicationWorkspace());

    let submission!: ReturnType<typeof result.current.controller.submit>;
    act(() => {
      submission = result.current.controller.submit(
        "review-1",
        authorized.review!.draftHash,
      );
    });
    act(() => {
      result.current.controller.editField(
        "projectName",
        "Human edit during submission",
      );
    });
    resolveDigest(bufferFromHex(authorized.review!.draftHash));

    await expect(submission).rejects.toThrow("changed while");
    expect(result.current.workspace.draft.fields.projectName).toBe(
      "Human edit during submission",
    );
    expect(result.current.workspace.receipt).toBeNull();
  });
});
