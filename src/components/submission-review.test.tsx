import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SubmissionReview } from "./submission-review";

describe("SubmissionReview receipt", () => {
  it("copies the complete receipt and confirms the action visibly", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(
      <SubmissionReview
        review={null}
        receipt={{
          id: "receipt-1",
          reviewId: "review-1",
          draftHash:
            "64d264ec3749f0bf1a3143cf34c0ba789f2bf4c2e9f31c00461727ac461727ac",
          submittedAt: "2026-08-28T08:00:00.000Z",
        }}
        submitting={false}
        onAuthorize={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Copy receipt" }));

    expect(await screen.findByText("Copied")).toBeInTheDocument();
  });

  it("resets copy feedback when a different receipt is shown", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const props = {
      review: null,
      submitting: false,
      onAuthorize: () => undefined,
      onSubmit: () => undefined,
    };
    const { rerender } = render(
      <SubmissionReview
        {...props}
        receipt={{
          id: "receipt-1",
          reviewId: "review-1",
          draftHash:
            "64d264ec3749f0bf1a3143cf34c0ba789f2bf4c2e9f31c00461727ac461727ac",
          submittedAt: "2026-08-28T08:00:00.000Z",
        }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Copy receipt" }));
    expect(await screen.findByText("Copied")).toBeInTheDocument();

    rerender(
      <SubmissionReview
        {...props}
        receipt={{
          id: "receipt-2",
          reviewId: "review-2",
          draftHash:
            "74d264ec3749f0bf1a3143cf34c0ba789f2bf4c2e9f31c00461727ac461727ac",
          submittedAt: "2026-08-28T08:05:00.000Z",
        }}
      />,
    );

    expect(
      await screen.findByRole("button", { name: "Copy receipt" }),
    ).toBeInTheDocument();
  });

  it("shows the full reviewed hash when browser copy is unavailable", async () => {
    const user = userEvent.setup();
    const draftHash =
      "64d264ec3749f0bf1a3143cf34c0ba789f2bf4c2e9f31c00461727ac461727ac";
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });

    render(
      <SubmissionReview
        review={null}
        receipt={{
          id: "receipt-1",
          reviewId: "review-1",
          draftHash,
          submittedAt: "2026-08-28T08:00:00.000Z",
        }}
        submitting={false}
        onAuthorize={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Copy receipt" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Copy failed",
    );
    expect(screen.getByText(draftHash)).toBeVisible();
  });
});
