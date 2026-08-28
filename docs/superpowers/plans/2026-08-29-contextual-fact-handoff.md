# Contextual Fact Handoff and Readiness Projection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one safe contextual applicant-fact request and a compact, truthful staged-patch readiness projection without expanding the application into another product or weakening current authority controls.

**Architecture:** Preserve the five core WebMCP tools and shared workspace controller. Add an in-memory candidate audit that writes only a minimal projection to a staged patch, plus a non-persisted pending human-fact promise that a dynamically registered contextual tool can safely await.

**Tech Stack:** React 19, TypeScript, Zod, Vitest, Testing Library, Playwright, WebMCP, OpenAI Sites.

## Global constraints

- Do not alter existing core tool names, schemas, or submission authority.
- Allow only `audienceProblem` as contextual human fact input and do not let the agent compose the question.
- Do not write a candidate audit or answer to storage until the human actively applies/supplies it.
- Preserve the initial `3/10` audit and first-30-second demo flow.
- State unverified repository projection honestly; no hard-coded readiness counts.

### Task 1: Add pure candidate-patch projection data

**Files:**
- Modify: `src/domain/application/types.ts`
- Modify: `src/domain/application/workspace.ts`
- Modify: `src/domain/application/workspace.test.ts`
- Modify: `src/hooks/use-application-workspace.ts`
- Modify: `src/hooks/use-application-workspace.test.tsx`

- [x] **Step 1: Write failing domain tests**

Test a pure patch overlay and readiness projection: three staged sample changes
must preserve draft revision/content while moving a complete candidate audit
from 3 to 7 ready, resolving four requirements and leaving three blocks.

- [x] **Step 2: Confirm RED**

Run: `npm test -- src/domain/application/workspace.test.ts`

Expected: the projection helper/type does not yet exist.

- [x] **Step 3: Implement the smallest pure domain surface**

Add an immutable patch-overlay helper and a projection value to `StagedPatch`.
Update `stagePatch` to accept a controller-provided projection but leave all
apply/stale semantics unchanged.

- [x] **Step 4: Write failing controller tests**

Test that controller staging obtains a candidate audit, persists a projection,
and does not commit the candidate audit or mutate live draft/revision. Test
repository-unavailable behavior returns no numeric projection.

- [x] **Step 5: Confirm RED then implement**

Run: `npm test -- src/hooks/use-application-workspace.test.tsx`

Extract repository lookup and non-committing audit helpers. Make
`stagePatch(input, signal?)` asynchronous; audit current and candidate drafts
from the same source snapshot, derive projection only when both reports are
truthful, then commit the staged proposal if the source has not changed.

- [x] **Step 6: Confirm GREEN**

Run both focused test files and confirm they pass.

### Task 2: Build the contextual human-fact handoff

**Files:**
- Modify: `src/hooks/use-application-workspace.ts`
- Modify: `src/hooks/use-application-workspace.test.tsx`
- Modify: `src/test/fixtures.ts`
- Modify: `src/webmcp/tool-schemas.ts`
- Modify: `src/webmcp/tool-executors.ts`
- Modify: `src/webmcp/tool-executors.test.ts`
- Modify: `src/webmcp/register-tools.ts`
- Modify: `src/webmcp/register-tools.test.ts`
- Modify: `src/hooks/use-webmcp-tools.ts`
- Modify: `src/hooks/use-webmcp-tools.test.tsx`

- [x] **Step 1: Write failing executor tests**

Test `request_applicant_fact` accepts only `audienceProblem`, waits for the
controller's native answer, returns `source: human` and a new revision, and
returns `not_needed` after the field is supplied.

- [x] **Step 2: Confirm RED**

Run: `npm test -- src/webmcp/tool-executors.test.ts`

- [x] **Step 3: Add the controller handoff contract**

Add a pending request model and controller methods to open, answer, and cancel
the one factual handoff. Keep resolver state in the hook only. Reset and
unmount resolve cancellation before clearing state. Extend test harness with a
deterministic equivalent.

- [x] **Step 4: Add strict schema and contextual executor**

Define the closed literal input schema. Export a separate contextual-tool
factory; the executor opens no arbitrary question and writes no field itself.

- [x] **Step 5: Write registration-hook RED tests**

Verify the core lifecycle still registers exactly five tools and the separate
contextual lifecycle adds/removes only `request_applicant_fact` as the missing
fact state changes.

- [x] **Step 6: Confirm RED then implement registration**

Run: `npm test -- src/webmcp/register-tools.test.ts src/hooks/use-webmcp-tools.test.tsx`

Implement isolated contextual registration with its own abort lifecycle, so a
fact answer can resolve before removal and core tool registration is not
needlessly restarted.

- [x] **Step 7: Confirm GREEN**

Run all four focused tool/hook test files.

### Task 3: Make the two moments visible in the existing UI

**Files:**
- Add: `src/components/applicant-fact-handoff.tsx`
- Add: `src/components/applicant-fact-handoff.test.tsx`
- Modify: `src/components/application-workspace.tsx`
- Modify: `src/components/application-workspace.test.tsx`
- Modify: `src/components/patch-review-drawer.tsx`
- Modify: `src/components/patch-review-drawer.test.tsx`
- Modify: `src/app/globals.css`

- [x] **Step 1: Write failing component tests**

Test the handoff displays app-owned wording, only shares after native action,
and cancels safely. Test the drawer labels preview-only and renders accessible
current/projected readiness with no false projection when unavailable.

- [x] **Step 2: Confirm RED**

Run: `npm test -- src/components/applicant-fact-handoff.test.tsx src/components/patch-review-drawer.test.tsx`

- [x] **Step 3: Implement minimal UI**

Place a compact native handoff panel adjacent to the existing application form.
Add the two-row, ten-segment readiness preview above existing diffs. Preserve
the existing visual system and avoid new navigation or modes.

- [x] **Step 4: Confirm GREEN**

Run the focused component tests and existing workspace component test.

### Task 4: Demonstrate and document the exact story

**Files:**
- Modify: `docs/DEMO_SCRIPT.md`
- Modify: `docs/SUBMISSION_COPY.md`
- Modify: `README.md`
- Modify: `e2e/application-journey.spec.ts`
- Modify: `e2e/webmcp-registration.spec.ts`

- [x] **Step 1: Write failing end-to-end assertions**

Extend the golden journey to show the projection before native apply and the
contextual request/response before final audit. Keep current first-30-second
baseline assertions and verify five core registrations plus one contextual tool
only while required.

- [x] **Step 2: Confirm RED**

Run: `npm run test:e2e -- e2e/application-journey.spec.ts e2e/webmcp-registration.spec.ts`

- [x] **Step 3: Update public copy**

Change tool-count wording to five core tools plus a contextual request when a
fact is missing. Add only the new one-line collaboration payoff; do not add
architecture exposition or unsupported impact claims.

- [x] **Step 4: Confirm GREEN**

Run focused E2E tests and a text consistency scan:

`rg -n "exactly five|five typed|5 tools|request_applicant_fact|Preview only" README.md docs src`

### Task 5: Release the exact candidate

**Files:** all changed files

- [x] **Step 1: Full local verification**

Run: `npm run verify`

- [ ] **Step 2: Commit and deploy**

Commit the verified change set. Deploy the exact commit through OpenAI Sites.

- [ ] **Step 3: Hosted proof**

In a compatible browser, reset the sample; verify five core tools, `3/10`, the
previewed patch, contextual fact request and native answer, `10/10`, exact
authorization, and receipt. Capture the final live URL and commit SHA.
