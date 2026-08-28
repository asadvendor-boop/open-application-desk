import type { ApplicationDraft, ProgramDefinition } from "./types";

const sampleSummary =
  "This application describes a web project whose public artifacts must agree with the claims submitted for review. The draft combines a live experience, a public repository, an open-source license, a clearly bounded audience, and evidence links that another person can inspect. The applicant wants an agent to identify incomplete or contradictory fields, but does not want the agent to silently rewrite facts or trigger the final submission. Every proposed change must therefore appear as an exact diff, and the final action must remain bound to the version that the applicant reviewed.";

export const PROGRAM: ProgramDefinition = {
  id: "open-web-community-grant",
  title: "Open Web Community Grant — Judge Sample",
  deadlineIso: "2026-09-04T01:00:00+05:00",
  summaryWordLimit: 90,
  requirements: [
    { id: "project_name", label: "Project name supplied", blocking: true },
    { id: "summary_present", label: "Project summary supplied", blocking: true },
    { id: "summary_word_limit", label: "Summary is 90 words or fewer", blocking: true },
    { id: "audience_problem", label: "Audience and problem are explicit", blocking: true },
    { id: "live_url_https", label: "Live URL uses HTTPS", blocking: true },
    { id: "repository_public", label: "Repository is public", blocking: true },
    { id: "repository_license", label: "Repository has an open-source license", blocking: true },
    { id: "impact_statement", label: "Impact statement supplied", blocking: true },
    { id: "claim_evidence", label: "Claims have public evidence", blocking: true },
    { id: "human_attestation", label: "Applicant attestation supplied", blocking: true },
  ],
};

export function createSampleDraft(
  now = "2026-08-27T00:00:00.000Z",
): ApplicationDraft {
  return {
    id: "judge-application",
    revision: 1,
    fields: {
      projectName: "Open web project application",
      summary: sampleSummary,
      audienceProblem: "",
      liveUrl: "",
      repositoryUrl: "",
      impactStatement:
        "Application portals can become shared workspaces where people keep authority while agents handle structured inspection and preparation.",
    },
    evidence: [],
    attested: false,
    workflowState: "draft",
    updatedAt: now,
  };
}
