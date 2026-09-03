# Open Application Desk — submission copy

## Project name

Open Application Desk

## Elevator pitch

The application form that can explain and audit itself to an AI agent—while its
WebMCP tools cannot apply changes or authorize submission.

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

The OpenAI API supplies the reasoning; WebMCP lets this page publish its live
tools, state, and boundaries.

WebMCP exposes the smallest useful set of structured actions from the actual
page. Instead of asking an agent to interpret arbitrary UI text and imitate
clicks, the portal gives it five core tools: read the current context, run a
deterministic audit, stage a bounded patch, prepare an exact review, and submit
only an already-approved review. When the audience fact is blank, one
contextual tool can request that exact fact—but the page owns the question and
the applicant must choose to share the answer.

The human UI and WebMCP tools call the same controller and domain functions.
That means the agent sees the same draft and requirements as the applicant,
without a hidden agent-only workflow or an embedded language model deciding
whether a consequential action is safe.

### What is new

This is not an autofill bot, a chatbot beside a form, or an agent imitating
clicks. Open Application Desk treats the webpage itself as a collaboration
protocol. A compatible agent can discover the page's typed, stateful
capabilities, while the application reuses its existing rules, live state, and
native human controls. The form can explain its requirements, expose its
blockers, stage a bounded change, and bind submission to the artifact the person
actually reviewed.

That suggests a broader future for the open web: sites do not need a separate
private integration for every assistant, and agents do not need to guess at
pixels. A webpage can publish exactly what an agent may do while keeping the
human boundaries visible in the same experience.

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
prepares a review. It can visibly pause for the one applicant-owned audience
fact instead of inventing it. The person supplies that fact, chooses whether to
apply a proposal, attests to their application, and authorizes the reviewed
artifact.

That division makes collaborative submission work more legible than detached
chat or brittle UI automation: the agent can help across the complete journey,
while a person retains factual and consequential authority at every boundary.

### Demonstrated impact

The reference journey starts at **3/10 ready with seven blocking requirements**.
The WebMCP audit changes zero application fields. The page evaluates the staged
proposal against an in-memory candidate and visibly projects **3/10 → 7/10**;
the live draft remains unchanged until native Apply. After the applicant's own
factual inputs, the exact revision reaches **10/10 ready with zero blockers**.
The final receipt records that before/after result and the reviewed SHA-256
draft hash.

Those figures are produced by the visible deployed journey and its automated
browser test. They are not estimates of time saved, claims of external adoption,
or promises that an application will be accepted.

### How it works

The project registers five core imperative WebMCP tools through
`document.modelContext.registerTool(...)`. Inputs are constrained with closed
JSON Schema (`additionalProperties: false`) and runtime Zod validation. Tool
registration uses an `AbortSignal` lifecycle; execution respects cancellation.
One contextual `request_applicant_fact` registration appears only while its
fixed audience fact is missing. It opens the page-owned question and returns an
immediate `awaiting_human` handoff, so the agent re-reads the live state after
the applicant answers instead of holding an open call. The audit engine is
deterministic and tool-proposed edits stay visibly staged until a person applies
them. The hash-bound receipt uses a browser-provided exclusive lock, so repeated
submissions of the same authorized review reconcile to one receipt across open
tabs; a browser without that lock fails closed.

The implementation is React, TypeScript, Vinext, Zod, Playwright, and
`webmcp-types`. The exact registration path is
`src/webmcp/register-tools.ts`; tool authority boundaries live in
`src/webmcp/tool-executors.ts`.

For the native-Chrome recording path, an optional open-source developer
extension discovers the same registered tools, maps their JSON Schemas to
OpenAI Responses API functions, and routes structured results back to the
model. It uses a user-supplied OpenAI API key held only for that browser
session. The extension is not required when the site runs in the supported
ChatGPT desktop host, and it is published separately at
https://github.com/asadvendor-boop/openai-webmcp-tool-inspector.

### Adoption path

The current sample is browser-local so a judge can reset and reproduce it
without an account. A foundation, accelerator, admissions office, or
procurement portal can replace the local persistence seam with authenticated
server storage while retaining the same controller, typed WebMCP contracts,
deterministic gate, visible patch review, and human authorization boundary.
That gives both sides a clearer record of what was checked, reviewed, and
submitted. This is an implementation path, not a claim that an institution has
already adopted the sample.

### Honest limits

This is a challenge sample rather than a shared production backend. Drafts and
receipts persist only in the visitor’s browser, and the reference grant program
is fictional. Public GitHub metadata checks may return `unverified` when the
public API is unavailable; the application never invents a result. A passing
readiness check does not certify a claim, guarantee acceptance, or replace a
person’s judgment.

Manual mode works in every browser. The official WebMCP agent path currently
requires the ChatGPT desktop app's built-in browser with ChatGPT Work or Codex
on GPT-5.6 Sol or Terra, with Site Tools enabled; access depends on account
settings and rollout. Native Chrome can use the optional open-source OpenAI
developer extension described above. The ordinary chatgpt.com web surface does
not currently expose the WebMCP Site Tools host used by this project.

## Submission-only checks

Before pasting the description into Devpost, add the final no-login live URL
and public YouTube URL in their dedicated fields. Use only the production
deployment and video that have passed the final WebMCP journey; do not link the
older manual-only deployment.
