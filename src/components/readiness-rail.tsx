import { PROGRAM } from "@/domain/application/sample-program";
import type { AuditReport } from "@/domain/application/types";

interface ReadinessRailProps {
  audit: AuditReport | null;
  draftRevision: number;
  submitted: boolean;
  busy: "idle" | "auditing" | "preparing";
  onAudit(): void;
  onPrepare(): void;
}

export function ReadinessRail({
  audit,
  draftRevision,
  submitted,
  busy,
  onAudit,
  onPrepare,
}: ReadinessRailProps) {
  const auditIsCurrent = audit?.draftRevision === draftRevision;
  const readyCount = auditIsCurrent
    ? audit.checks.filter((check) => check.status === "pass").length
    : 0;
  const blockerCount = auditIsCurrent ? audit.blockingCount : PROGRAM.requirements.length;
  const canPrepare = Boolean(
    !submitted && auditIsCurrent && audit?.blockingCount === 0,
  );

  return (
    <section className="rail-card readiness-card" aria-labelledby="readiness-title">
      <div className="rail-card__heading">
        <div>
          <p className="eyebrow">Deterministic gate</p>
          <h2 id="readiness-title">Application readiness</h2>
        </div>
        <div className={canPrepare ? "readiness-score readiness-score--ready" : "readiness-score"}>
          <strong>{readyCount}</strong>
          <span>/ {PROGRAM.requirements.length}</span>
        </div>
      </div>

      <div className="readiness-summary" aria-live="polite">
        {auditIsCurrent ? (
          <>
            <strong>{readyCount} ready</strong>
            <span>
              {blockerCount === 0
                ? "No blocking requirements on this exact revision."
                : `${blockerCount} blocker${blockerCount === 1 ? "" : "s"} remain.`}
            </span>
          </>
        ) : (
          <>
            <strong>Not checked</strong>
            <span>Run the gate against draft r{draftRevision}.</span>
          </>
        )}
      </div>

      <ol className="requirement-list">
        {PROGRAM.requirements.map((requirement, index) => {
          const result = auditIsCurrent
            ? audit?.checks.find((check) => check.requirementId === requirement.id)
            : undefined;
          const status = result?.status ?? "unchecked";
          return (
            <li className={`requirement requirement--${status}`} key={requirement.id}>
              <span className="requirement__index">{String(index + 1).padStart(2, "0")}</span>
              <span className="requirement__copy">
                <strong>{requirement.label}</strong>
                <span>{result?.message ?? "Awaiting audit."}</span>
              </span>
              <span className="requirement__state" aria-label={status}>
                {status === "pass" ? "✓" : status === "block" ? "!" : "·"}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="rail-actions">
        <button
          className="button button--secondary"
          type="button"
          onClick={onAudit}
          disabled={busy !== "idle"}
        >
          {busy === "auditing" ? "Checking public proof…" : "Run readiness audit"}
        </button>
        {canPrepare && (
          <button
            className="button button--primary"
            type="button"
            onClick={onPrepare}
            disabled={busy !== "idle"}
          >
            {busy === "preparing" ? "Binding snapshot…" : "Prepare exact review"}
          </button>
        )}
      </div>
    </section>
  );
}
