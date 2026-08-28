# Judge-Facing Audit Repairs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove every judge-visible defect found in the final product audit without expanding the five-tool WebMCP scope.

**Architecture:** Keep the existing shared `WorkspaceController`. Add one optional UI observer to tool registration so a WebMCP audit can update the same status explanation as a manual audit. Copy, fallback, and responsive changes remain presentation-only.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Playwright, CSS, WebMCP.

## Global Constraints

- Preserve exactly five WebMCP tools and their current authority boundaries.
- The agent may submit only after the page's native authorization of the exact review ID and draft hash.
- Do not claim claim-semantic verification, shared persistence, acceptance improvement, or production-backend behavior.
- Preserve the editorial application-desk visual system and reduce, rather than add, first-minute cognitive load.

---

### Task 1: Synchronize WebMCP audit feedback

**Files:**
- Modify: `src/components/application-workspace.test.tsx`
- Modify: `src/hooks/use-webmcp-tools.ts`
- Modify: `src/webmcp/register-tools.ts`
- Modify: `src/webmcp/tool-executors.ts`
- Modify: `src/components/application-workspace.tsx`

- [ ] **Step 1: Write the failing integration test**

Register the real tools in `ApplicationWorkspace`, invoke `audit_application`, and expect the status bar to say `Draft r3 passed all 10 deterministic checks.`

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npm test -- src/components/application-workspace.test.tsx`

Expected: the expected audit-success announcement is absent because WebMCP cannot currently notify the component.

- [ ] **Step 3: Add the minimal observer path**

Pass an optional `onAuditCompleted(report)` callback from `ApplicationWorkspace` through `useWebMcpTools` and `registerWebMcpTools` to the `audit_application` executor. Call it only after `controller.runAudit()` succeeds.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `npm test -- src/components/application-workspace.test.tsx`

Expected: PASS.

### Task 2: Make fallback and compact layouts self-explanatory

**Files:**
- Modify: `src/components/webmcp-status.tsx`
- Modify: `src/hooks/use-webmcp-tools.test.tsx`
- Modify: `src/app/globals.css`
- Modify: `e2e/webmcp-registration.spec.ts`

- [ ] **Step 1: Write failing fallback and narrow-viewport checks**

Expect Manual mode to name ChatGPT's in-app browser and verify the readiness title remains visible at the 1265 px in-app-panel width.

- [ ] **Step 2: Run the focused tests and confirm RED**

Run: `npm test -- src/hooks/use-webmcp-tools.test.tsx && npm run test:e2e -- e2e/webmcp-registration.spec.ts`

Expected: the fallback instruction is absent and the narrow-viewport readiness assertion fails.

- [ ] **Step 3: Implement the minimal visual repair**

Give Manual mode a compatible-browser instruction. At compact desktop widths, retain a two-column layout with a narrower readiness rail and reduced grid padding so the deterministic gate stays in the opening frame.

- [ ] **Step 4: Run the focused tests and confirm GREEN**

Run: `npm test -- src/hooks/use-webmcp-tools.test.tsx && npm run test:e2e -- e2e/webmcp-registration.spec.ts`

Expected: PASS.

### Task 3: Align the human story and public contract

**Files:**
- Modify: `src/domain/application/sample-program.ts`
- Modify: `src/components/application-workspace.tsx`
- Modify: `README.md`
- Modify: `docs/DEMO_SCRIPT.md`
- Modify: `docs/SUBMISSION_COPY.md`

- [ ] **Step 1: Update only source-of-truth copy**

Replace stale deployment wording with the production URL, accurately describe authorized agent submission, name the manual-mode fallback, strengthen the personal consequence, and name the broader high-stakes audiences.

- [ ] **Step 2: Keep claims bounded**

Retain the distinction between public evidence links and semantic verification. Keep browser-local and fictional-reference-program limits.

- [ ] **Step 3: Validate text consistency**

Run: `rg -n "pending deployment|cannot apply a patch, attest, authorize, or submit|cannot apply proposals, attest, authorize, or submit|Judge Sample" README.md docs src`

Expected: no stale or contradictory phrase remains.

### Task 4: Verify and release the repaired candidate

**Files:**
- Verify: all modified files

- [ ] **Step 1: Run complete local verification**

Run: `npm run verify`

Expected: lint, typecheck, unit tests, production build, and Playwright pass.

- [ ] **Step 2: Capture the complete WebMCP golden journey**

Use the in-app browser at 1440 x 900 and verify manual guidance, 3/10 blockers, staged diff, 10/10 re-audit status, exact review, and receipt.

- [ ] **Step 3: Commit and deploy**

Commit the verified repair set, deploy that exact commit to OpenAI Sites, then record only against that deployment.
