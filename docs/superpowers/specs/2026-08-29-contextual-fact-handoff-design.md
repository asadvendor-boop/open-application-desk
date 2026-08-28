# Contextual Fact Handoff and Readiness Projection

## Outcome

Keep Open Application Desk's one application journey intact while adding two
judge-visible moments after the first audit:

1. An agent can request the one missing applicant-owned fact and visibly wait
   for the person to provide it through native UI.
2. A staged patch visibly predicts which deterministic requirements it fixes,
   without mutating the draft or overstating an unverified result.

The cold open and first 30 seconds remain unchanged: personal deadline story,
five core tools, and the `3/10 ready · 7 blockers` audit result.

## Boundaries

- This is one sample program and one workflow, not a reusable contract system.
- The five existing core tool names and their authority do not change.
- One contextual sixth tool, `request_applicant_fact`, is registered only while
  `audienceProblem` is empty. It disappears after a human supplies the fact.
- The tool accepts only `{ field: "audienceProblem" }`; it cannot supply its
  own question, write draft content, apply a patch, attest, authorize, or
  submit.
- The application owns the exact question and makes clear that the answer is
  shared with the waiting agent only after the human uses the native control.
- A reset, cancellation, aborted registration, or component unmount resolves a
  pending request safely as cancelled; no agent call may hang.
- Projection is a compact two-row readiness comparison inside the existing
  staged-patch drawer. It is not a graph, new dashboard, or new workflow.
- Projection evaluates a candidate draft in memory. It does not save, apply,
  or change the live revision.
- If repository metadata cannot be verified, the UI must say projection is
  unavailable or pending; it must not claim a numeric improvement.

## Data and controller design

`StagedPatch` gains an optional `readinessProjection` containing only the
comparison needed by the UI:

- current ready count;
- projected ready count;
- total requirement count;
- requirement IDs resolved by the proposal; and
- requirement IDs still blocking afterward.

The domain retains a pure helper that overlays allowlisted patch changes onto a
copy of a draft. The hook uses its existing deterministic audit service to
audit that candidate, then persists the resulting projection with the staged
proposal. The draft itself remains byte-for-byte and revision-for-revision
unchanged until `applyPatch` is invoked by the human.

The hook also owns a non-persisted pending fact request and its resolver. A
successful native response writes `audienceProblem` through the same human
mutation path as ordinary editing, then resolves the waiting tool with
`source: "human"` and the new revision. Cancellation resolves without a draft
mutation. This prevents stale pending prompts from surviving reloads or resets.

## WebMCP integration

Core registration remains a single five-tool lifecycle. A separate contextual
registration lifecycle registers the sixth tool only when the hook reports a
missing audience fact. Its execution checks current state again, opens the
native request, and returns one of `answered`, `cancelled`, `already_pending`,
or `not_needed`.

The status UI continues to describe the five core capabilities; it may append
that one contextual fact request is available rather than presenting six as a
new baseline. The final video will prove all registrations rather than making a
novelty claim about their count.

## Interaction copy

When requested, the page displays:

> A fact only you can supply
>
> Who is this application for, and what specific difficulty do they face?

The submission action is named **Share answer with ChatGPT** and explicitly
states that the answer is added to the draft and returned to the waiting agent.
The other action is **Cancel request**.

The patch drawer states **Preview only — not applied** above two compact
ten-segment rows:

- `Now: 3/10 ready`
- `After this proposal: 7/10 ready`
- `Four blockers resolved · Three require the applicant`

The precise counts are derived from the candidate audit, never hard-coded.

## Test and release evidence

Tests first prove:

- candidate projection is correct and does not mutate the live draft;
- no repository verification means no false projection;
- the contextual tool is absent when not needed, waits for a native response,
  resolves with a human source and new revision, and safely cancels on reset;
- the drawer exposes the accessible readiness comparison and preview label;
- the existing five core tools remain registered and authority boundaries hold.

Before release: focused tests, full `npm run verify`, deployed OpenAI Sites
journey, a live WebMCP context-tool check, and documentation consistency scan.
