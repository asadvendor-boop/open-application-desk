"use client";

import { useState } from "react";

import type {
  ReviewSnapshot,
  SubmissionReceipt,
} from "@/domain/application/types";

interface SubmissionReviewProps {
  review: ReviewSnapshot | null;
  receipt: SubmissionReceipt | null;
  submitting: boolean;
  onAuthorize(reviewId: string): void;
  onSubmit(reviewId: string, draftHash: string): void;
}

function shortHash(value: string): string {
  return `${value.slice(0, 12)}…${value.slice(-8)}`;
}

export function SubmissionReview({
  review,
  receipt,
  submitting,
  onAuthorize,
  onSubmit,
}: SubmissionReviewProps) {
  const [copyState, setCopyState] = useState<{
    receiptId: string | null;
    status: "idle" | "copied" | "error";
  }>({ receiptId: null, status: "idle" });

  async function copyReceipt() {
    if (!receipt) {
      return;
    }
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(
          {
            receiptId: receipt.id,
            reviewId: receipt.reviewId,
            draftHash: receipt.draftHash,
            submittedAt: receipt.submittedAt,
          },
          null,
          2,
        ),
      );
      setCopyState({ receiptId: receipt.id, status: "copied" });
    } catch {
      setCopyState({ receiptId: receipt.id, status: "error" });
    }
  }

  if (receipt) {
    const receiptCopyState =
      copyState.receiptId === receipt.id ? copyState.status : "idle";

    return (
      <section className="rail-card receipt-card" aria-labelledby="receipt-title">
        <div className="receipt-seal" aria-hidden="true">✓</div>
        <p className="eyebrow">Single-use result</p>
        <h2 id="receipt-title">Submission receipt</h2>
        <p>
          Recorded against review <strong>{receipt.reviewId}</strong>. Repeating the
          same approved submission returns this receipt instead of duplicating work.
        </p>
        <dl className="receipt-grid">
          <div>
            <dt>Receipt</dt>
            <dd>{receipt.id}</dd>
          </div>
          <div>
            <dt>Reviewed hash</dt>
            <dd title={receipt.draftHash}>{shortHash(receipt.draftHash)}</dd>
          </div>
        </dl>
        <div className="receipt-actions">
          <button
            className="button button--quiet"
            type="button"
            onClick={copyReceipt}
          >
            {receiptCopyState === "copied" ? "Copied" : "Copy receipt"}
          </button>
          {receiptCopyState === "error" && (
            <div className="receipt-copy-fallback" role="alert">
              <span>Copy failed; copy the full reviewed hash below.</span>
              <code>{receipt.draftHash}</code>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (!review) {
    return null;
  }

  const authorized = Boolean(review.authorizedAt);

  return (
    <section className="rail-card review-card" aria-labelledby="review-title">
      <p className="eyebrow">Hash-bound checkpoint</p>
      <h2 id="review-title">Exact review snapshot</h2>
      <p>
        Review r{review.draftRevision} is fixed to this hash for five minutes. Any
        later edit invalidates it.
      </p>
      <dl className="review-facts">
        <div>
          <dt>Draft hash</dt>
          <dd title={review.draftHash}>{shortHash(review.draftHash)}</dd>
        </div>
        <div>
          <dt>Expires</dt>
          <dd>{new Date(review.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</dd>
        </div>
      </dl>

      {!authorized ? (
        <button
          className="button button--authorize"
          type="button"
          onClick={() => onAuthorize(review.id)}
        >
          Authorize exact application
        </button>
      ) : (
        <div className="authorization-box">
          <div>
            <strong>Human authorized</strong>
            <span>Only this review ID and draft hash may be submitted.</span>
          </div>
          <button
            className="button button--primary"
            type="button"
            disabled={submitting}
            onClick={() => onSubmit(review.id, review.draftHash)}
          >
            {submitting ? "Recording receipt…" : "Submit approved application"}
          </button>
        </div>
      )}
    </section>
  );
}
