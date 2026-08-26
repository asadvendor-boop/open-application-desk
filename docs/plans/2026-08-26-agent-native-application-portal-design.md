# Agent-Native Application Portal — Product Design

**Date:** 2026-08-26

**Status:** Approved product direction; implementation not started

**Delivery constraint:** Three focused calendar days

**Final product name:** To be selected by Asad; labels in this document are descriptive only

## 1. Product thesis

High-stakes application portals give people forms but give agents no safe,
structured way to help. An agent must usually scrape visible text, guess at the
current page state, and imitate clicks. That is brittle precisely where a stale
claim, missing attachment, inaccessible link, or unintended submission can cost
someone an opportunity.

This project is a WebMCP-native application portal. It lets a person and an
agent inspect, repair, verify, and submit the same live application while the
portal remains the authority for rules, state, validation, permissions, and
submission.

The agent may propose and prepare. The human remains the authority for factual
claims, application changes, and final submission.

## 2. Personal origin and judge-facing story

The project is grounded in a real submission experience: near a deadline, Asad
had to reconcile official rules, hosted links, repository evidence, test totals,
and multiple commit identities across several surfaces. A stale claim almost
survived into the submitted package.

The opening story is therefore:

> Near a submission deadline, I was reconciling rules, deployment links,
> repository evidence, test totals, and commit identities across multiple tabs.
> One stale claim nearly survived. High-stakes application portals still give
> agents nothing except brittle screen-scraping. This portal gives the agent
> safe, structured tools while the applicant stays in control.

The product does not claim that it guarantees acceptance or improves judging
scores. It claims to make application completeness, evidence consistency,
review, and submission more reliable and legible.

## 3. Target users and use cases

### Primary user

An individual preparing a high-stakes online application under time pressure.

### Initial use case

A grant-style project application containing:

- project summary;
- audience and problem;
- public live URL;
- public repository URL;
- license requirement;
- evidence-backed claims;
- program-specific length and completeness constraints;
- human attestation and final submission.

### Credible extensions

The same interaction model can support accelerators, scholarships, admissions,
procurement, fellowships, and competitions. These are impact extensions, not
features for the three-day build.

## 4. Core product promise

The user opens an ordinary application workspace and asks ChatGPT to verify it.
The site exposes structured WebMCP tools that let the agent:

1. read the exact program requirements and current draft;
2. run deterministic readiness and evidence checks;
3. stage a narrowly scoped, visible patch;
4. prepare an exact final review snapshot; and
5. submit only after the user authorizes that exact snapshot.

The normal human UI and the WebMCP tools use the same state and validation
functions. There is no separate hidden agent workflow.

## 5. Golden journey

```text
Human opens application draft
  -> ChatGPT reads application context through WebMCP
  -> Agent audits requirements and public evidence
  -> Portal displays concrete blockers
  -> Agent stages an allowlisted patch
  -> Human reviews and applies or rejects the patch
  -> Human supplies any fact the agent cannot truthfully infer
  -> Agent re-audits the exact updated draft
  -> Portal prepares a hash-bound final review
  -> Human authorizes that exact review
  -> Agent submits once and the portal issues a receipt
```

## 6. WebMCP tools

The application registers exactly five imperative tools through
`document.modelContext.registerTool(...)`.

### 6.1 `get_application_context`

**Purpose:** Return the current program rules, deadline, draft, requirements,
evidence bindings, and current workflow state.

**Input:** Optional section selection.

**Side effects:** None.

**Key behavior:** Reads the same live state shown in the human UI.

### 6.2 `audit_application`

**Purpose:** Execute deterministic checks for required fields, length limits,
URL validity, evidence completeness, cross-field consistency, and application
state.

**Input:** Optional requirement identifiers.

**Side effects:** Updates the visible audit panel and activity history, but does
not modify application content.

**Key behavior:** Returns discrete results with identifiers, severity, evidence,
and remediation guidance. It does not manufacture or semantically certify a
claim.

### 6.3 `stage_draft_patch`

**Purpose:** Place proposed edits into a visible review drawer.

**Input:** Allowlisted field changes plus concise rationale.

**Side effects:** Creates a staged patch only; the application draft remains
unchanged.

**Key behavior:** The human sees old value, proposed value, reason, and affected
checks, then explicitly applies or rejects the patch in the normal UI.

### 6.4 `prepare_submission`

**Purpose:** Re-run all blocking checks and construct an immutable review
snapshot for the exact current draft.

**Input:** Expected draft revision.

**Side effects:** Creates a review snapshot, not a submission.

**Key behavior:** Produces a draft hash, requirement results, evidence summary,
and expiration. Any later draft change invalidates it.

### 6.5 `submit_approved_application`

**Purpose:** Submit the reviewed application.

**Input:** Expected review identifier and draft hash.

**Side effects:** Consequential and irreversible within the sample portal.

**Key behavior:** Succeeds only when the user has authorized the same unexpired
review in the native UI. Submission is idempotent and produces a receipt.

## 7. Human authority and safety model

- Tool inputs and outputs use strict JSON Schema and runtime validation.
- Tool calls operate only on the currently open application.
- Mutating inputs use an explicit field allowlist and per-field size limits.
- Tool-provided strings render as text, never trusted HTML.
- External URLs and fetched content are treated as untrusted data.
- `stage_draft_patch` cannot apply its own changes.
- A human must apply a staged patch in the website UI.
- Preparation never implies authorization.
- Authorization binds to the exact review identifier and draft hash.
- Any draft mutation invalidates an existing authorization.
- Final submission is single-use and idempotent.
- The activity timeline records proposal, review, authorization, and execution.
- Missing facts remain missing; the agent is instructed to ask rather than
  invent them.

This is a focused product safety model, not a claim of production compliance or
complete protection against every browser-agent threat.

## 8. Interface design

The product uses one desktop-first workspace rather than multiple dashboards.

### 8.1 Header

- descriptive product label;
- program name and deadline;
- workflow state: Draft, Review, or Submitted;
- WebMCP availability indicator;
- reset-sample action.

### 8.2 Application editor

- ordinary labeled form fields;
- clear program constraints beside relevant fields;
- claim-to-evidence bindings;
- manual save state;
- no embedded chatbot.

### 8.3 Readiness rail

- compact red, amber, and green requirement states;
- plain-language blocker descriptions;
- evidence-link status;
- current draft revision and review validity.

### 8.4 WebMCP activity timeline

- tool name;
- timestamp;
- human-readable result;
- whether a call was read-only, staged, authorized, or executed;
- no raw chain-of-thought or sensitive browser data.

### 8.5 Patch-review drawer

- old and proposed value;
- agent rationale;
- affected requirements;
- Apply and Reject controls owned by the human UI.

### 8.6 Submission review and receipt

- exact requirements included in the review;
- draft hash and expiry;
- explicit human authorization control;
- final receipt identifier, submission time, and reviewed hash.

### 8.7 Unsupported-browser experience

If WebMCP is unavailable, the application remains manually usable and explains
how to reopen it in ChatGPT's in-app browser or a compatible Chrome build. It
does not falsely report that tools are registered.

## 9. Data and state design

### Program

- identifier;
- title and deadline;
- ordered requirement definitions;
- field constraints;
- evidence rules.

### Application draft

- identifier and revision;
- field values;
- evidence bindings;
- updated timestamp;
- workflow state.

### Audit result

- requirement identifier;
- status: pass, attention, or block;
- deterministic reason;
- relevant field or evidence reference.

### Staged patch

- identifier;
- base draft revision;
- allowlisted field changes;
- rationale;
- state: staged, applied, rejected, or stale.

### Review snapshot

- identifier;
- exact draft hash;
- complete audit results;
- created and expiry times;
- human authorization state.

### Submission receipt

- identifier;
- review identifier;
- submitted draft hash;
- submission timestamp;
- idempotency key.

For the challenge build, persistence should be the smallest hosted mechanism
that reliably supports a no-login judge workspace. If hosted persistence cannot
be provisioned quickly, the product may use clearly disclosed browser-local
sample workspaces and downloadable receipts; it must not pretend local storage
is a production submission backend.

## 10. Application architecture

### Frontend

- React/Next.js with TypeScript;
- one application workspace route;
- shared domain functions used by both UI controls and WebMCP executions;
- feature-detected WebMCP registration with cleanup on unmount;
- accessible, high-contrast desktop layout optimized for a 16:9 demo.

### Server boundary

- narrowly scoped URL/evidence checks where browser CORS prevents verification;
- strict URL parsing, timeout, response-size, and content-type limits;
- no arbitrary command execution or private-network fetching;
- submission persistence if a small hosted store is provisioned.

### Agent boundary

The project does not embed its own LLM. ChatGPT supplies reasoning through the
WebMCP-compatible browser. The portal supplies current state, deterministic
checks, safe actions, and visible human controls.

## 11. Error handling

- WebMCP unavailable: show compatibility guidance; manual UI continues.
- Tool schema rejected: return a concise structured validation error.
- Evidence URL unavailable: mark it unverified, not invalid.
- Audit timeout: preserve prior results and label the current check incomplete.
- Patch based on stale revision: reject it and require a fresh context read.
- Draft changes after review: invalidate the review and authorization.
- Repeated submission: return the original receipt without duplicating work.
- Persistence unavailable: fail visibly and do not issue a successful receipt.

## 12. Truthful demonstration evidence

The demo may claim only observable, reproducible facts:

- the number of requirements before and after review;
- the number of evidence links actually checked;
- the concrete contradiction or missing item detected;
- no application field changed before human approval;
- authorization was invalidated when the draft changed, if shown;
- the submitted receipt matches the reviewed draft hash;
- the deployed browser discovered and invoked the registered tools.

The demo must not claim acceptance-rate improvement, time savings, production
security, or prevention of all submission mistakes without a real measurement.

## 13. Testing strategy

The test suite is intentionally small and central-claim focused.

### Unit tests

- requirement evaluation;
- URL and field validation;
- canonical draft hashing;
- stale patch rejection;
- authorization invalidation;
- idempotent receipt generation.

### Component/integration tests

- staged patch is visible but not applied;
- human Apply updates the expected fields;
- human Reject leaves the draft unchanged;
- prepare fails while blocking checks remain;
- submission fails without matching authorization.

### Browser tests

- complete manual Draft -> Review -> Submitted journey;
- unsupported-WebMCP fallback;
- reset produces a fresh judge workspace;
- deployed page remains usable at the recording viewport.

### Manual compatibility gate

- tool discovery and invocation in ChatGPT's in-app browser;
- tool discovery and invocation in compatible Chrome;
- fresh-browser live URL and receipt journey;
- repository setup from a fresh clone.

## 14. Three-day delivery plan

### Day 1 — Hosted golden path

**Exit criterion:** A judge can open the deployment and complete the full
workflow manually.

- create an isolated public repository with a detectable open-source license;
- implement the single-screen application workspace;
- implement schemas, application state, audit engine, and receipt model;
- register the five WebMCP tools;
- implement manual Draft -> Review -> Submitted behavior;
- deploy by the end of the day;
- perform first tool-discovery checks in both supported browsers.

### Day 2 — Trustworthy WebMCP journey

**Exit criterion:** The hosted ChatGPT-driven golden journey works from start to
receipt.

- add bounded public-link and evidence verification;
- implement patch staging, human apply/reject, and stale-patch rejection;
- bind review and authorization to the exact draft hash;
- implement idempotent submission and activity history;
- add compatibility guidance and judge reset;
- add unit and browser tests for the central authority boundaries;
- polish the 16:9 judge experience;
- run a timed video rehearsal.

### Day 3 — Verify, communicate, and freeze

**Exit criterion:** Public repository, live experience, video, and submission
copy all describe and demonstrate the same verified product.

- fix only blockers found in fresh deployed-browser testing;
- run fresh-clone setup, build, tests, hosted flow, license, and secret checks;
- write concise README and submission copy around the personal story;
- record and edit the locked video storyboard;
- add readable captions and verify audio and duration;
- upload publicly and recheck every judge-facing link;
- freeze several hours before the deadline.

No new features begin after the Day 3 morning verification.

## 15. Locked video storyboard

Target duration: 2:45 to 2:50.

| Time | Judge-visible content |
| --- | --- |
| 0:00-0:15 | Personal deadline story and consequence of one stale claim |
| 0:15-0:27 | Existing problem across rules, form, repository, and evidence |
| 0:27-0:38 | Live portal inside ChatGPT browser; WebMCP availability visible |
| 0:38-0:50 | Ask ChatGPT to verify without changing or submitting anything |
| 0:50-1:18 | Context and audit tools run; UI updates visibly |
| 1:18-1:32 | One contradiction and one human-only missing item appear |
| 1:32-1:52 | Agent stages patch; human reviews and applies it |
| 1:52-2:08 | Human supplies missing fact; re-audit turns requirements green |
| 2:08-2:24 | Human authorizes; agent submits; receipt appears |
| 2:24-2:39 | Five tools and one short `registerTool` excerpt |
| 2:39-2:48 | Broader impact and human-control conclusion |

The video shows one uninterrupted journey. Architecture, testing totals, and
secondary cases stay out of the first two minutes.

## 16. Judging-criteria mapping

### WebMCP Leverage

- five purposeful tools across read, audit, staged mutation, preparation, and
  consequential execution;
- shared live page state rather than detached API state;
- visible human-agent collaboration;
- ordinary UI and WebMCP actions share domain logic;
- structured discovery replaces brittle clicking.

### Execution

- public no-login URL;
- coherent manual and agent-assisted experience;
- visible progress, errors, approvals, and receipt;
- tested in the actual supported browsers.

### Potential Impact

- specific audience and costly last-mile application problem;
- credible path across grants, admissions, procurement, and competitions;
- demonstrated reduction in unresolved requirements and unreviewed mutation,
  without unsupported outcome claims.

### Creativity and Ambition

- treats an application portal as an agent-native shared workspace;
- binds visible human approval to the exact reviewed artifact;
- demonstrates a reusable future pattern for the open web without attempting a
  generic platform during the challenge.

## 17. Explicit exclusions

- no CrossPatch extension;
- no multi-agent system;
- no embedded LLM or duplicate chatbot;
- no generic form builder;
- no third-party OAuth;
- no document-generation subsystem;
- no email or notification system;
- no organization administration;
- no analytics suite;
- no second demo scenario;
- no enormous test or evidence catalog;
- no claim that the product guarantees success.

## 18. Kill criteria

To protect the three-day deadline:

- if hosted persistence consumes more than two focused hours, use an honestly
  labeled local-first judge workspace and downloadable receipt;
- if external evidence fetching is unreliable, restrict checks to deterministic
  URL metadata and clearly report `unverified`;
- if one WebMCP tool cannot be made reliable, combine it with an adjacent tool
  rather than adding retry orchestration;
- if visual polish competes with a working hosted tool path, preserve the tool
  path first and simplify the interface;
- if the golden journey exceeds 110 seconds during rehearsal, remove detail
  rather than accelerating the recording unnaturally.

## 19. Definition of submission-ready

The project is submission-ready only when:

- the live URL opens without credentials;
- the normal application workflow is coherent;
- a compatible browser discovers the five tools;
- the agent-assisted golden journey reaches a truthful receipt;
- no patch applies before human review;
- no submission occurs without matching human authorization;
- the public repository contains source, setup instructions, and a detected
  open-source license;
- the video is public, audible, captioned, and shorter than three minutes;
- submission copy and video claims are reproduced by the frozen hosted build;
- all judge-facing links work from a fresh browser.
