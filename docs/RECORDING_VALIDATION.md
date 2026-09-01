# Final recording validation

This gate applies to the exported submission video, not the script alone.

## First-30-second blind test

Show only `0:00–0:30` to three people who have not seen the product and do not
explain it first. Ask each person, in this order:

1. Who is this for?
2. What painful problem does it solve?
3. What did the agent just do?
4. What remains under human control?

Record answers verbatim. Pass only when at least two of three people correctly
identify all four ideas: a high-stakes applicant; stale or missing application
claims; the agent used webpage-provided tools to audit the live draft and stage
a preview; and the person controls facts, changes, and submission.

| Reviewer | Unfamiliar with project | User | Pain | Agent action | Human control | Pass |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | UNRUN | UNRUN | UNRUN | UNRUN | UNRUN | UNRUN |
| 2 | UNRUN | UNRUN | UNRUN | UNRUN | UNRUN | UNRUN |
| 3 | UNRUN | UNRUN | UNRUN | UNRUN | UNRUN | UNRUN |

Status: **UNRUN — requires the final exported video and three external human
reviewers.** AI cold-reading can improve the script but must not be reported as
external-user validation.

## Export checks

- Duration is between 150 and 165 seconds and strictly under 180 seconds.
- The video starts on the working application with no title card, setup, login,
  loading screen, personal-origin introduction, or reset cut.
- `get_application_context` and `audit_application` begin at second zero;
  **For high-stakes applicants**, `3/10 ready`, `7 blockers remain`, and
  **0 fields changed** are readable by second eight.
- `stage_draft_patch` begins by second 24, and its non-mutating `3/10 → 7/10`
  preview plus the native Apply boundary are legible within the first 30
  seconds.
- Captions match the spoken words and do not cover tool results or controls.
- Tool invocations, native Apply, native authorization, receipt metrics, and
  reviewed hash are legible at normal playback speed.
- Tool latency, loading, live typing, pauses, repeated features, and repository
  browsing are cut; consequential review and authorization remain unsped and
  legible.
- The video contains no credentials, private tabs, notifications, or invented
  user-validation claims.
