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
});
