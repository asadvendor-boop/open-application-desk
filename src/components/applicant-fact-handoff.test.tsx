import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ApplicantFactHandoff } from "./applicant-fact-handoff";

describe("ApplicantFactHandoff", () => {
  it("uses the page-owned question and shares only after native human confirmation", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(
      <ApplicantFactHandoff
        request={{
          id: "request-1",
          field: "audienceProblem",
          question: "Who is this application for, and what specific difficulty do they face?",
        }}
        onAnswer={onAnswer}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "A fact only you can supply" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Agent is waiting")).toBeInTheDocument();
    expect(onAnswer).not.toHaveBeenCalled();
    await user.type(
      screen.getByLabelText("Your answer"),
      "Independent applicants need a truthful view of their evidence.",
    );
    await user.click(
      screen.getByRole("button", { name: "Share answer with agent" }),
    );

    expect(onAnswer).toHaveBeenCalledWith(
      "Independent applicants need a truthful view of their evidence.",
    );
    expect(
      screen.getByText(/added to the draft and returned to the waiting agent/i),
    ).toBeInTheDocument();
  });
});
