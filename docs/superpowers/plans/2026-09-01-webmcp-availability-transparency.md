# WebMCP Availability and Recording Readiness Plan

**Goal:** Make the supported agent hosts, provider-neutral authority boundary,
and native-Chrome recording path truthful and reproducible without adding a new
product area.

**Architecture:** Keep `WebMcpStatus` as the only in-product availability
surface. The application continues to publish the same WebMCP tools and native
human controls; documentation distinguishes the official ChatGPT desktop host
from the optional OpenAI Chrome developer extension.

**Implementation status:** COMPLETE. Release commands below are operational
gates; the immutable Git commit and Sites deployment history record their
execution rather than self-staling this plan with release identifiers.

## Constraints

- Manual mode works in every browser.
- Do not imply that ordinary chatgpt.com currently hosts WebMCP Site Tools.
- Name the current official host precisely: ChatGPT desktop Work/Codex on
  GPT-5.6 Sol/Terra, subject to settings and rollout.
- Describe the native-Chrome adapter as an optional open-source developer
  extension, not an official ChatGPT extension.
- Never expose an OpenAI API key in the application, repository, or recording.
- Preserve the applicant's authority over facts, patch application,
  attestation, authorization, and final submission.

## Task 1 — Product disclosure and provider-neutral UI

- Added failing tests for precise host disclosure and provider-neutral UI.
- Updated `WebMcpStatus`, the applicant-fact handoff, and workspace intro.
- Updated every browser E2E selector for **Share answer with agent**.
- Ran the focused component and browser regressions green.

## Task 2 — Public copy and recording package

- Updated README and submission copy with official/optional host boundaries.
- Added an honest adoption seam without claiming external deployment.
- Updated the demo script for native Chrome and visible OpenAI tool calls.
- Added an exact Chrome prompt/runbook and stop conditions.
- Marked external-user testing skipped and removed any validation claim.

## Exact release procedure

1. Run `npm run verify`, `git diff --check`, and the secret/claim scans.
2. Commit and push the exact validated source to public `main`.
3. Save and deploy that commit through OpenAI Sites.
4. Verify the production URL, registered tools, clean console, and hosted
   deterministic audit from a fresh browser state.
5. Confirm a clean worktree aligned with `origin/main`.
