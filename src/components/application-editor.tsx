import type {
  ApplicationDraft,
  ApplicationFieldKey,
  EvidenceBinding,
} from "@/domain/application/types";
import { PROGRAM } from "@/domain/application/sample-program";

interface ApplicationEditorProps {
  draft: ApplicationDraft;
  disabled?: boolean;
  onFieldChange(field: ApplicationFieldKey, value: string): void;
  onEvidenceChange(evidence: EvidenceBinding): void;
  onAttestationChange(value: boolean): void;
}

const primaryEvidenceDefaults: EvidenceBinding = {
  id: "primary-evidence",
  claim: "",
  url: "",
  kind: "other",
};

function words(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function ApplicationEditor({
  draft,
  disabled = false,
  onFieldChange,
  onEvidenceChange,
  onAttestationChange,
}: ApplicationEditorProps) {
  const evidence = draft.evidence[0] ?? primaryEvidenceDefaults;
  const summaryWords = words(draft.fields.summary);
  const revisionLabel =
    draft.workflowState === "submitted"
      ? "Submitted"
      : draft.workflowState === "review"
        ? "Review"
        : "Draft";

  function updateEvidence(change: Partial<EvidenceBinding>) {
    onEvidenceChange({ ...evidence, ...change });
  }

  return (
    <form className="application-form" onSubmit={(event) => event.preventDefault()}>
      <fieldset disabled={disabled}>
        <legend className="sr-only">Application details</legend>

        <section className="form-section" aria-labelledby="narrative-title">
          <div className="section-number">01</div>
          <div className="section-content">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Application narrative</p>
                <h2 id="narrative-title">Make the case legible.</h2>
              </div>
              <span className="revision-chip">
                {revisionLabel} r{draft.revision}
              </span>
            </div>

            <label className="field" htmlFor="project-name">
              <span>Project name</span>
              <input
                id="project-name"
                value={draft.fields.projectName}
                onChange={(event) =>
                  onFieldChange("projectName", event.currentTarget.value)
                }
              />
            </label>

            <label className="field" htmlFor="project-summary">
              <span className="field-label-row">
                <span>Project summary</span>
                <span
                  className={
                    summaryWords > PROGRAM.summaryWordLimit
                      ? "field-counter field-counter--over"
                      : "field-counter"
                  }
                >
                  {summaryWords}/{PROGRAM.summaryWordLimit} words
                </span>
              </span>
              <textarea
                id="project-summary"
                rows={5}
                value={draft.fields.summary}
                onChange={(event) =>
                  onFieldChange("summary", event.currentTarget.value)
                }
              />
            </label>

            <div className="field-grid">
              <label className="field" htmlFor="audience-problem">
                <span>Audience and problem</span>
                <textarea
                  id="audience-problem"
                  rows={5}
                  value={draft.fields.audienceProblem}
                  onChange={(event) =>
                    onFieldChange("audienceProblem", event.currentTarget.value)
                  }
                  placeholder="Who is this for, and what concrete difficulty do they face?"
                />
              </label>
              <label className="field" htmlFor="impact-statement">
                <span>Impact statement</span>
                <textarea
                  id="impact-statement"
                  rows={5}
                  value={draft.fields.impactStatement}
                  onChange={(event) =>
                    onFieldChange("impactStatement", event.currentTarget.value)
                  }
                />
              </label>
            </div>
          </div>
        </section>

        <section className="form-section" aria-labelledby="proof-title">
          <div className="section-number">02</div>
          <div className="section-content">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Public proof</p>
                <h2 id="proof-title">Connect claims to things people can inspect.</h2>
              </div>
            </div>

            <div className="field-grid">
              <label className="field" htmlFor="live-url">
                <span>Live URL</span>
                <input
                  id="live-url"
                  type="url"
                  value={draft.fields.liveUrl}
                  onChange={(event) =>
                    onFieldChange("liveUrl", event.currentTarget.value)
                  }
                  placeholder="https://your-project.example"
                />
              </label>
              <label className="field" htmlFor="repository-url">
                <span>Public GitHub repository</span>
                <input
                  id="repository-url"
                  type="url"
                  value={draft.fields.repositoryUrl}
                  onChange={(event) =>
                    onFieldChange("repositoryUrl", event.currentTarget.value)
                  }
                  placeholder="https://github.com/owner/repository"
                />
              </label>
            </div>

            <div className="evidence-card">
              <div className="evidence-card__header">
                <div>
                  <p className="eyebrow">Claim ↔ evidence binding</p>
                  <h3>One public claim, one inspectable source.</h3>
                </div>
                <select
                  aria-label="Evidence type"
                  value={evidence.kind}
                  onChange={(event) =>
                    updateEvidence({
                      kind: event.currentTarget.value as EvidenceBinding["kind"],
                    })
                  }
                >
                  <option value="repository">Repository</option>
                  <option value="live_demo">Live demo</option>
                  <option value="other">Other public proof</option>
                </select>
              </div>
              <label className="field" htmlFor="evidence-claim">
                <span>Claim</span>
                <input
                  id="evidence-claim"
                  value={evidence.claim}
                  onChange={(event) =>
                    updateEvidence({ claim: event.currentTarget.value })
                  }
                  placeholder="What does this source prove?"
                />
              </label>
              <label className="field" htmlFor="evidence-url">
                <span>Public evidence URL</span>
                <input
                  id="evidence-url"
                  type="url"
                  value={evidence.url}
                  onChange={(event) =>
                    updateEvidence({ url: event.currentTarget.value })
                  }
                  placeholder="https://..."
                />
              </label>
            </div>
          </div>
        </section>

        <section className="attestation-card" aria-labelledby="attestation-title">
          <div className="attestation-mark" aria-hidden="true">A</div>
          <label htmlFor="applicant-attestation">
            <span id="attestation-title">Applicant attestation</span>
            <span>
              I reviewed these facts and confirm that the application reflects
              my own claims. An agent may prepare work, but cannot attest for me.
            </span>
          </label>
          <input
            id="applicant-attestation"
            type="checkbox"
            checked={draft.attested}
            onChange={(event) => onAttestationChange(event.currentTarget.checked)}
          />
        </section>
      </fieldset>
    </form>
  );
}
