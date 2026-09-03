import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  authorizeReview,
  createWorkspace,
  prepareReview,
  recordAudit,
} from "@/domain/application/workspace";
import type { SubmissionReceipt } from "@/domain/application/types";
import { loadWorkspace, saveWorkspace } from "@/storage/local-workspace";
import { createValidDraft, passingAudit } from "@/test/fixtures";
import { createSampleDraft } from "@/domain/application/sample-program";
import { useApplicationWorkspace } from "./use-application-workspace";

function bufferFromHex(value: string): ArrayBuffer {
  return Uint8Array.from(
    value.match(/.{2}/g) ?? [],
    (byte) => Number.parseInt(byte, 16),
  ).buffer;
}

function installSubmissionLock() {
  let queue = Promise.resolve();
  const request = function request<T>(
    _name: string,
    _options: LockOptions,
    callback: (lock: Lock) => T | Promise<T>,
  ) {
    const run = queue.then(() => callback({} as Lock));
    queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: { request },
  });
}

beforeEach(() => {
  installSubmissionLock();
});

afterEach(() => {
  localStorage.clear();
  Reflect.deleteProperty(navigator, "locks");
  vi.restoreAllMocks();
});

describe("useApplicationWorkspace concurrency", () => {
  it("stages a truthful readiness projection without mutating the live draft", async () => {
    saveWorkspace(createWorkspace(createSampleDraft()));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({
          status: "verified",
          repositoryUrl: "https://github.com/openai/openai-node",
          isPublic: true,
          licenseSpdx: "Apache-2.0",
          checkedAt: "2026-08-29T00:00:00.000Z",
          message: "Public repository and license verified.",
        }), { headers: { "Content-Type": "application/json" } }),
      ),
    );
    const { result } = renderHook(() => useApplicationWorkspace());
    const originalSummary = result.current.workspace.draft.fields.summary;
    const originalRevision = result.current.workspace.draft.revision;

    let staged!: Awaited<ReturnType<typeof result.current.controller.stagePatch>>;
    await act(async () => {
      staged = await result.current.controller.stagePatch({
        changes: [
          {
            field: "summary",
            value: "A concise WebMCP application desk keeps applicant facts and final authorization human-owned.",
            rationale: "Meet the word limit.",
          },
          {
            field: "liveUrl",
            value: "https://open-application-desk.example",
            rationale: "Add the live project URL.",
          },
          {
            field: "repositoryUrl",
            value: "https://github.com/openai/openai-node",
            rationale: "Add the public repository.",
          },
        ],
      });
    });

    expect(result.current.workspace.draft.revision).toBe(originalRevision);
    expect(result.current.workspace.draft.fields.summary).toBe(originalSummary);
    expect(staged.readinessProjection).toMatchObject({
      currentReadyCount: 3,
      projectedReadyCount: 7,
      requirementCount: 10,
    });
  });

  it("does not claim a projected readiness score when proposed repository metadata is unverified", async () => {
    saveWorkspace(createWorkspace(createSampleDraft()));
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const { result } = renderHook(() => useApplicationWorkspace());

    let staged!: Awaited<ReturnType<typeof result.current.controller.stagePatch>>;
    await act(async () => {
      staged = await result.current.controller.stagePatch({
        changes: [
          {
            field: "repositoryUrl",
            value: "https://github.com/openai/openai-node",
            rationale: "Add the public repository.",
          },
        ],
      });
    });

    expect(staged.readinessProjection).toBeUndefined();
    expect(result.current.workspace.draft.fields.repositoryUrl).toBe("");
  });

  it("clears a visible applicant-fact handoff when the sample is reset", async () => {
    saveWorkspace(createWorkspace(createSampleDraft()));
    const { result } = renderHook(() => useApplicationWorkspace());

    let request!: ReturnType<typeof result.current.controller.requestApplicantFact>;
    act(() => {
      request = result.current.controller.requestApplicantFact("audienceProblem");
    });
    await expect(request).resolves.toMatchObject({ outcome: "awaiting_human" });
    expect(result.current.pendingApplicantFact?.field).toBe("audienceProblem");

    act(() => {
      result.current.controller.reset();
    });

    expect(result.current.pendingApplicantFact).toBeNull();
  });

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

  it("returns one persisted receipt when two tabs submit the same authorized review", async () => {
    const now = new Date().toISOString();
    const ready = recordAudit(createWorkspace(createValidDraft()), passingAudit());
    const reviewed = await prepareReview(ready, "review-1", now);
    const authorized = authorizeReview(reviewed, "review-1", now);
    saveWorkspace(authorized);

    const first = renderHook(() => useApplicationWorkspace());
    const second = renderHook(() => useApplicationWorkspace());

    let receipts!: [SubmissionReceipt, SubmissionReceipt];
    await act(async () => {
      receipts = await Promise.all([
        first.result.current.controller.submit(
          "review-1",
          authorized.review!.draftHash,
        ),
        second.result.current.controller.submit(
          "review-1",
          authorized.review!.draftHash,
        ),
      ]);
    });

    expect(receipts[1].id).toBe(receipts[0].id);
    expect(loadWorkspace()?.receipt?.id).toBe(receipts[0].id);
    expect(first.result.current.workspace.receipt?.id).toBe(receipts[0].id);
    expect(second.result.current.workspace.receipt?.id).toBe(receipts[0].id);
  });

  it("fails closed when the browser cannot serialize submissions across tabs", async () => {
    const now = new Date().toISOString();
    const ready = recordAudit(createWorkspace(createValidDraft()), passingAudit());
    const reviewed = await prepareReview(ready, "review-1", now);
    const authorized = authorizeReview(reviewed, "review-1", now);
    saveWorkspace(authorized);
    Reflect.deleteProperty(navigator, "locks");
    const { result } = renderHook(() => useApplicationWorkspace());

    await expect(
      result.current.controller.submit("review-1", authorized.review!.draftHash),
    ).rejects.toThrow("cannot guarantee a single submission");
    expect(loadWorkspace()?.receipt).toBeNull();
  });
});
