import type {
  ApplicationDraft,
  StagedPatch,
} from "@/domain/application/types";

interface PatchReviewDrawerProps {
  patch: StagedPatch | null;
  fields: ApplicationDraft["fields"];
  onApply(patchId: string): void;
  onReject(patchId: string): void;
}

const fieldLabels: Record<keyof ApplicationDraft["fields"], string> = {
  projectName: "Project name",
  summary: "Project summary",
  audienceProblem: "Audience and problem",
  liveUrl: "Live URL",
  repositoryUrl: "Repository URL",
  impactStatement: "Impact statement",
};

function ReadinessRow({
  label,
  accessibleLabel,
  readyCount,
  requirementCount,
}: {
  label: string;
  accessibleLabel: string;
  readyCount: number;
  requirementCount: number;
}) {
  return (
    <div className="patch-readiness-row">
      <span>{label}</span>
      <div
        className="patch-readiness-row__segments"
        aria-label={accessibleLabel}
      >
        {Array.from({ length: requirementCount }, (_, index) => (
          <span
            className={index < readyCount ? "is-ready" : "is-blocked"}
            key={index}
          />
        ))}
      </div>
    </div>
  );
}

function countWord(value: number): string {
  return ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"][value] ?? String(value);
}

export function PatchReviewDrawer({
  patch,
  fields,
  onApply,
  onReject,
}: PatchReviewDrawerProps) {
  if (!patch || patch.state !== "staged") {
    return null;
  }

  return (
    <aside className="patch-drawer" aria-labelledby="patch-title">
      <div className="patch-drawer__eyebrow">Agent proposal · not applied</div>
      <div className="patch-drawer__heading">
        <div>
          <h2 id="patch-title">Proposed change</h2>
          <p>Compare every value. Only these native controls can change the draft.</p>
        </div>
        <span className="revision-chip">Based on r{patch.baseRevision}</span>
      </div>

      {patch.readinessProjection ? (
        <section className="patch-readiness-preview" aria-label="Patch readiness preview">
          <p>Preview only — not applied</p>
          <ReadinessRow
            label={`Now: ${patch.readinessProjection.currentReadyCount}/${patch.readinessProjection.requirementCount} ready`}
            accessibleLabel={`Now: ${patch.readinessProjection.currentReadyCount} of ${patch.readinessProjection.requirementCount} ready`}
            readyCount={patch.readinessProjection.currentReadyCount}
            requirementCount={patch.readinessProjection.requirementCount}
          />
          <ReadinessRow
            label={`After this proposal: ${patch.readinessProjection.projectedReadyCount}/${patch.readinessProjection.requirementCount} ready`}
            accessibleLabel={`After this proposal: ${patch.readinessProjection.projectedReadyCount} of ${patch.readinessProjection.requirementCount} ready`}
            readyCount={patch.readinessProjection.projectedReadyCount}
            requirementCount={patch.readinessProjection.requirementCount}
          />
          <strong>
            {countWord(patch.readinessProjection.resolvedRequirementIds.length)} blocker{patch.readinessProjection.resolvedRequirementIds.length === 1 ? "" : "s"} resolved · {countWord(patch.readinessProjection.remainingBlockingRequirementIds.length)} require{patch.readinessProjection.remainingBlockingRequirementIds.length === 1 ? "s" : ""} the applicant
          </strong>
        </section>
      ) : (
        <p className="patch-readiness-preview patch-readiness-preview--unavailable">
          Projected readiness is unavailable until public repository metadata can be verified.
        </p>
      )}

      <div className="patch-diff-list">
        {patch.changes.map((change) => (
          <article className="patch-diff" key={change.field}>
            <h3>{fieldLabels[change.field]}</h3>
            <div className="patch-diff__grid">
              <div>
                <span className="diff-label diff-label--old">Current</span>
                <p>{fields[change.field] || "Empty"}</p>
              </div>
              <div>
                <span className="diff-label diff-label--new">Proposed</span>
                <p>{change.value}</p>
              </div>
            </div>
            <p className="patch-rationale">Reason: {change.rationale}</p>
          </article>
        ))}
      </div>

      <div className="patch-actions">
        <button
          className="button button--quiet"
          type="button"
          onClick={() => onReject(patch.id)}
        >
          Reject proposal
        </button>
        <button
          className="button button--primary"
          type="button"
          onClick={() => onApply(patch.id)}
        >
          Apply proposed changes
        </button>
      </div>
    </aside>
  );
}
