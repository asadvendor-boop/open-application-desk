"use client";

import { useCallback, useState } from "react";

import { PROGRAM } from "@/domain/application/sample-program";
import type { AuditReport, EvidenceBinding } from "@/domain/application/types";
import { useApplicationWorkspace } from "@/hooks/use-application-workspace";
import { useWebMcpTools } from "@/hooks/use-webmcp-tools";
import { ActivityTimeline } from "./activity-timeline";
import { ApplicantFactHandoff } from "./applicant-fact-handoff";
import { ApplicationEditor } from "./application-editor";
import { PatchReviewDrawer } from "./patch-review-drawer";
import { ReadinessRail } from "./readiness-rail";
import { SubmissionReview } from "./submission-review";
import { WebMcpStatus } from "./webmcp-status";

type BusyState = "idle" | "auditing" | "preparing" | "submitting";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The operation could not be completed.";
}

function auditNotice(report: AuditReport): string {
  return report.blockingCount === 0
    ? `Draft r${report.draftRevision} passed all ${report.checks.length} deterministic checks.`
    : `Draft r${report.draftRevision} has ${report.blockingCount} blocking requirement${report.blockingCount === 1 ? "" : "s"}.`;
}

export function ApplicationWorkspace() {
  const { workspace, controller, persistence, pendingApplicantFact } = useApplicationWorkspace();
  const [busy, setBusy] = useState<BusyState>("idle");
  const [notice, setNotice] = useState(
    "The form and readiness gate share one live application state.",
  );
  const onWebMcpAuditCompleted = useCallback((report: AuditReport) => {
    setNotice(auditNotice(report));
  }, []);
  const webMcpConnection = useWebMcpTools(
    controller,
    onWebMcpAuditCompleted,
    Boolean(pendingApplicantFact) || !workspace.draft.fields.audienceProblem.trim(),
  );

  async function runAudit() {
    setBusy("auditing");
    setNotice("Checking the current revision and its public repository metadata…");
    try {
      const report = await controller.runAudit();
      setNotice(auditNotice(report));
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setBusy("idle");
    }
  }

  async function prepareSubmission() {
    setBusy("preparing");
    setNotice("Binding the exact current revision to a five-minute review window…");
    try {
      const review = await controller.prepareSubmission();
      setNotice(`Exact review ${review.id} is ready for your authorization.`);
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setBusy("idle");
    }
  }

  function authorizeSubmission(reviewId: string) {
    try {
      controller.authorizeSubmission(reviewId);
      setNotice("You authorized the exact review ID and draft hash shown here.");
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function submitApplication(reviewId: string, draftHash: string) {
    setBusy("submitting");
    setNotice("Persisting the authorized result before issuing a receipt…");
    try {
      const receipt = await controller.submit(reviewId, draftHash);
      setNotice(`Submission recorded once as ${receipt.id}.`);
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setBusy("idle");
    }
  }

  function updateEvidence(evidence: EvidenceBinding) {
    controller.upsertEvidence(evidence);
  }

  function resetWorkspace() {
    if (
      window.confirm(
        "Reset this browser-local judge workspace to the intentionally incomplete sample?",
      )
    ) {
      controller.reset();
      setNotice("The intentionally incomplete judge sample has been restored.");
    }
  }

  const workflowLabel =
    workspace.draft.workflowState === "submitted"
      ? "Submitted"
      : workspace.draft.workflowState === "review"
        ? "In exact review"
        : "Draft in progress";

  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#application-editor">
        Skip to application editor
      </a>
      <div className="paper-grain" aria-hidden="true" />

      <header className="workspace-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <span>OA</span>
            <span>01</span>
          </div>
          <div>
            <p className="eyebrow">Human-led · agent-ready</p>
            <h1>Open Application Desk</h1>
          </div>
        </div>

        <div className="program-lockup">
          <p>{PROGRAM.title}</p>
          <span>Deadline · Sep 3, 1:00 PM PT</span>
        </div>

        <div className="header-actions">
          <WebMcpStatus connection={webMcpConnection} />
          <button className="text-button" type="button" onClick={resetWorkspace}>
            Reset sample
          </button>
        </div>
      </header>

      <div className="origin-strip">
        <span className="origin-strip__label">For high-stakes applicants</span>
        <p>
          At my last deadline, a stale claim nearly slipped through. In a grant,
          scholarship, or accelerator application, that can cost the opportunity.
        </p>
        <span className="origin-strip__rule" aria-hidden="true" />
      </div>

      <div className="workspace-statusbar">
        <div className={`workflow-pill workflow-pill--${workspace.draft.workflowState}`}>
          <span aria-hidden="true" />
          {workflowLabel}
        </div>
        <span>Revision {workspace.draft.revision}</span>
        <span
          className={`persistence-state persistence-state--${persistence.status}`}
        >
          {persistence.message}
        </span>
        <p aria-live="polite">{notice}</p>
      </div>

      <main className="workspace-grid">
        <article id="application-editor" className="editor-surface">
          <div className="editor-intro">
            <div>
              <p className="eyebrow">The page is the agent interface</p>
              <h2>This form can explain itself.<br />You decide what gets submitted.</h2>
            </div>
            <p>
              Instead of scraping pixels, a compatible agent gets five core typed WebMCP
              tools for this exact draft. Native controls keep facts, changes,
              and authorization human-owned.
            </p>
          </div>

          {pendingApplicantFact ? (
            <ApplicantFactHandoff
              request={pendingApplicantFact}
              onAnswer={(value) => {
                controller.answerApplicantFact(value);
                setNotice("You supplied the fact the waiting agent could not truthfully infer.");
              }}
              onCancel={() => {
                controller.cancelApplicantFact();
                setNotice("The applicant fact request was cancelled; the draft was not changed.");
              }}
            />
          ) : null}

          <ApplicationEditor
            draft={workspace.draft}
            disabled={Boolean(workspace.receipt)}
            onFieldChange={(field, value) => controller.editField(field, value)}
            onEvidenceChange={updateEvidence}
            onAttestationChange={(value) => controller.setAttestation(value)}
          />
        </article>

        <aside className="workspace-rail" aria-label="Readiness and submission">
          <ReadinessRail
            audit={workspace.audit}
            draftRevision={workspace.draft.revision}
            submitted={Boolean(workspace.receipt)}
            busy={
              busy === "auditing" || busy === "preparing" ? busy : "idle"
            }
            onAudit={runAudit}
            onPrepare={prepareSubmission}
          />
          <SubmissionReview
            review={workspace.review}
            receipt={workspace.receipt}
            submitting={busy === "submitting"}
            onAuthorize={authorizeSubmission}
            onSubmit={submitApplication}
          />
          <ActivityTimeline activity={workspace.activity} />
        </aside>
      </main>

      <footer className="workspace-footer">
        <p>
          Browser-local challenge sample. It does not claim to be a production
          application backend or to improve acceptance decisions.
        </p>
        <span>Rules → draft → proof → exact human authorization</span>
      </footer>

      <PatchReviewDrawer
        patch={workspace.stagedPatch}
        fields={workspace.draft.fields}
        onApply={(patchId) => {
          controller.applyPatch(patchId);
          setNotice("You applied the visible proposal; a fresh audit is now required.");
        }}
        onReject={(patchId) => {
          controller.rejectPatch(patchId);
          setNotice("You rejected the proposal. The draft was not changed.");
        }}
      />
    </div>
  );
}
