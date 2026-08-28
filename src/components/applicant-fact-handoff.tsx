"use client";

import { useState } from "react";

import type { ApplicantFactRequest } from "@/hooks/use-application-workspace";

interface ApplicantFactHandoffProps {
  request: ApplicantFactRequest;
  onAnswer(value: string): void;
  onCancel(): void;
}

export function ApplicantFactHandoff({
  request,
  onAnswer,
  onCancel,
}: ApplicantFactHandoffProps) {
  const [answer, setAnswer] = useState("");
  const ready = Boolean(answer.trim());

  return (
    <section className="applicant-fact-handoff" aria-labelledby="fact-handoff-title">
      <p className="applicant-fact-handoff__eyebrow">ChatGPT is waiting</p>
      <h2 id="fact-handoff-title">A fact only you can supply</h2>
      <p>{request.question}</p>
      <label htmlFor="applicant-fact-answer">Your answer</label>
      <textarea
        id="applicant-fact-answer"
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        rows={3}
      />
      <p className="applicant-fact-handoff__notice">
        This answer is added to the draft and returned to the waiting agent.
      </p>
      <div className="applicant-fact-handoff__actions">
        <button className="button button--quiet" type="button" onClick={onCancel}>
          Cancel request
        </button>
        <button
          className="button button--primary"
          type="button"
          disabled={!ready}
          onClick={() => onAnswer(answer.trim())}
        >
          Share answer with ChatGPT
        </button>
      </div>
    </section>
  );
}
