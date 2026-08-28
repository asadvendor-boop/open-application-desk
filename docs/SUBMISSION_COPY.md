# Open Application Desk — submission copy

## Project name

Open Application Desk

## Elevator pitch

A human-controlled WebMCP application workspace: agents audit and prepare;
applicants own facts, changes, and submission.

## Description

### The problem

Near a real submission deadline, I was reconciling official rules, deployment
links, repository evidence, test totals, and a draft across several tabs. One
stale claim nearly survived into the final package. Most application portals
give an agent only brittle screen-scraping and click imitation—exactly the
wrong interface for work where an invented fact or accidental submission can
cost someone an opportunity.

Open Application Desk is a browser-local application workspace where a person
and an agent work on the same live draft, while the portal—not the agent—keeps
authority over rules, state, validation, and submission.

The same interaction model fits grants, accelerators, scholarships, admissions,
procurement, fellowships, and competitions: any application where a stale claim
or unintended submission can cost an opportunity.

### Why WebMCP is the right fit

WebMCP exposes the smallest useful set of structured actions from the actual
page. Instead of asking an agent to interpret arbitrary UI text and imitate
clicks, the portal gives it five clear tools: read the current context, run a
deterministic audit, stage a bounded patch, prepare an exact review, and submit
only an already-approved review.

The human UI and WebMCP tools call the same controller and domain functions.
That means the agent sees the same draft and requirements as the applicant,
without a hidden agent-only workflow or an embedded language model deciding
whether a consequential action is safe.

### A better application experience

The applicant sees concrete blockers, the exact proposed diff, and the exact
draft hash before anything consequential happens. An agent can identify that a
summary is too long or an evidence link is missing, but it cannot silently
rewrite the application. A native human control applies or rejects each staged
patch.

Preparation also is not authorization. `prepare_submission` re-audits the
current revision and creates a five-minute review bound to a canonical SHA-256
draft hash. The person authorizes that exact review in the page. Only then can
the agent call `submit_approved_application`, which records a single receipt
bound to the reviewed hash.

### What people and agents can do together

The agent handles structured inspection and preparation: it reads the rules,
finds deterministic blockers, proposes a visible allowlisted patch, and
prepares a review. The person supplies facts the agent cannot truthfully infer,
chooses whether to apply a proposal, attests to their application, and
authorizes the reviewed artifact.

That division makes collaborative submission work more legible than detached
chat or brittle UI automation: the agent can help across the complete journey,
while a person retains factual and consequential authority at every boundary.

### How it works

The project registers five imperative WebMCP tools through
`document.modelContext.registerTool(...)`. Inputs are constrained with closed
JSON Schema (`additionalProperties: false`) and runtime Zod validation. Tool
registration uses an `AbortSignal` lifecycle; execution respects cancellation.
The audit engine is deterministic and tool-proposed edits stay visibly staged
until a person applies them. The hash-bound receipt uses a browser-provided
exclusive lock, so repeated submissions of the same authorized review reconcile
to one receipt across open tabs; a browser without that lock fails closed.

The implementation is React, TypeScript, Vinext, Zod, Playwright, and
`webmcp-types`. The exact registration path is
`src/webmcp/register-tools.ts`; tool authority boundaries live in
`src/webmcp/tool-executors.ts`.

### Honest limits

This is a challenge sample rather than a shared production backend. Drafts and
receipts persist only in the visitor’s browser, and the reference grant program
is fictional. Public GitHub metadata checks may return `unverified` when the
public API is unavailable; the application never invents a result. A passing
readiness check does not certify a claim, guarantee acceptance, or replace a
person’s judgment.

## Submission-only checks

Before pasting the description into Devpost, add the final no-login live URL
and public YouTube URL in their dedicated fields. Use only the production
deployment and video that have passed the final WebMCP journey; do not link the
older manual-only deployment.
