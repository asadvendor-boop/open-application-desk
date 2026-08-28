# WebMCP Application Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task in this session. Do not dispatch subagents. Track every checkbox and stop at each task gate.

**Goal:** Build, deploy, demonstrate, and submit a WebMCP-native application portal in three focused calendar days, with one human-controlled journey from draft audit to hash-bound submission receipt.

**Architecture:** A single Next.js application owns the visible form, deterministic audit engine, staged patches, review authorization, and local-first judge workspace. Five imperative WebMCP tools call the same domain functions as the human interface. ChatGPT supplies reasoning through the compatible browser; the application embeds no LLM and treats public repository metadata as untrusted evidence.

**Tech Stack:** Node.js 22.12, npm, Next.js 16.3.3, React 19.2.8, TypeScript 5.9.3, Zod 4.4.3, `webmcp-types` 0.1.5, Vitest 4.1.11, Testing Library, Playwright 1.62.1, Vercel, and the public GitHub REST API.

**Spec:** `docs/plans/2026-08-26-agent-native-application-portal-design.md`

## Global Constraints

- Target users are individuals completing grants, accelerators, scholarships, admissions, procurement, fellowships, or competition applications under time pressure; the challenge build demonstrates one grant-style project application.
- Delivery is limited to three focused calendar days: Day 1 manual hosted path, Day 2 complete WebMCP path, Day 3 verification and submission production.
- The final product name is selected by Asad; code and copy use a descriptive working label until that decision is supplied.
- There is one desktop-first application workspace and one golden journey.
- Register exactly five imperative tools through `document.modelContext.registerTool(...)`.
- Use `AbortController.signal` as the registration lifecycle and pass the execution `AbortSignal` into cancellable work.
- The agent cannot apply its staged patch, authorize a review, invent missing facts, or submit a draft that differs from the human-authorized review.
- The hosted judge workspace is explicitly local-first: state and receipts persist in that browser. Do not describe it as a production submission backend.
- External verification is limited to public GitHub repository metadata and deterministic field/URL checks; there is no arbitrary URL fetcher.
- Tool returns, public metadata, and all external strings render as untrusted text.
- No embedded model, multi-agent system, OAuth, email, generic form builder, analytics suite, organization administration, or second scenario.
- No feature work begins after the Day 3 morning verification gate.
- All claims in README, submission copy, and video must be reproduced by the frozen public build.

---

## Locked File Structure

| Path | Responsibility |
| --- | --- |
| `package.json` | Pinned dependencies and verification scripts |
| `next.config.ts` | Next.js configuration and same-origin tools permissions policy |
| `vitest.config.ts` | Unit/component test environment |
| `playwright.config.ts` | Browser tests with a managed development server |
| `src/app/layout.tsx` | Fonts, metadata, and application shell |
| `src/app/page.tsx` | Render the single application workspace |
| `src/app/globals.css` | Complete visual system and responsive layout |
| `src/app/api/github-repository/route.ts` | Return bounded public GitHub metadata |
| `src/domain/application/types.ts` | Program, draft, audit, patch, review, receipt, and activity types |
| `src/domain/application/schemas.ts` | Runtime schemas and allowlisted patch fields |
| `src/domain/application/sample-program.ts` | Reference program requirements and initial judge draft |
| `src/domain/application/audit.ts` | Pure deterministic requirement evaluation |
| `src/domain/application/github.ts` | GitHub URL parser and metadata normalization |
| `src/domain/application/canonical.ts` | Canonical draft serialization and SHA-256 hashing |
| `src/domain/application/workspace.ts` | Pure workspace state transitions |
| `src/storage/local-workspace.ts` | Versioned browser persistence with fail-safe reset |
| `src/webmcp/tool-schemas.ts` | JSON Schemas and Zod validation for five tools |
| `src/webmcp/tool-executors.ts` | Tool-to-domain adapters and structured results |
| `src/webmcp/register-tools.ts` | Feature detection, registration, cancellation, and cleanup |
| `src/hooks/use-application-workspace.ts` | State controller shared by UI and WebMCP executors |
| `src/hooks/use-webmcp-tools.ts` | React lifecycle for tool registration and support status |
| `src/components/*.tsx` | Editor, readiness, activity, patch, review, receipt, and status UI |
| `src/test/setup.ts` | Testing Library setup and browser API shims |
| `src/test/fixtures.ts` | Valid draft and repository fixtures |
| `src/**/*.test.ts(x)` | Focused tests colocated with source |
| `e2e/application-journey.spec.ts` | Complete assisted golden journey |
| `e2e/webmcp-registration.spec.ts` | Tool discovery, execution, cleanup, and fallback |
| `README.md` | Judge start, setup, WebMCP implementation, and limitations |
| `LICENSE` | MIT license at repository root |
| `docs/DEMO_SCRIPT.md` | Locked under-three-minute narration and actions |
| `docs/SUBMISSION_COPY.md` | Rubric-aligned submission text |

---

## Day 1 — Hosted Manual Golden Path

### Task 1: Bootstrap the application and freeze domain contracts

**Timebox:** 60 minutes

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `next-env.d.ts`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/domain/application/types.ts`
- Create: `src/domain/application/sample-program.ts`
- Test: `src/domain/application/sample-program.test.ts`

**Interfaces:**
- Produces: `ProgramDefinition`, `ApplicationDraft`, `EvidenceBinding`, `AuditReport`, `StagedPatch`, `ReviewSnapshot`, `SubmissionReceipt`, `ActivityEntry`, `WorkspaceState`, `PROGRAM`, and `createSampleDraft()`.
- Consumes: Only platform and package types.

- [x] **Step 1: Create the pinned package contract**

Create `package.json` with these exact scripts and versions:

```json
{
  "name": "webmcp-application-portal",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "verify": "npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e"
  },
  "dependencies": {
    "next": "16.3.3",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "webmcp-types": "0.1.5",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@playwright/test": "1.62.1",
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.2",
    "@testing-library/user-event": "14.6.6",
    "@types/node": "22.20.1",
    "@types/react": "19.2.18",
    "@types/react-dom": "19.2.5",
    "eslint": "9.39.5",
    "eslint-config-next": "16.3.3",
    "jsdom": "28.1.0",
    "typescript": "5.9.3",
    "typescript-eslint": "8.50.0",
    "vitest": "4.1.11"
  }
}
```

- [x] **Step 2: Create strict configuration**

Create `.gitignore` with `.next/`, `node_modules/`, `coverage/`,
`playwright-report/`, `test-results/`, `.vercel/`, `.env*.local`, and `.DS_Store`.

Use this strict `tsconfig.json` core, retaining Next's plugin and generated type
includes:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", ".next/types/**/*.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

Create `next-env.d.ts` exactly as:

```ts
/* eslint-disable */
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

Configure:

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { environment: "jsdom", setupFiles: ["src/test/setup.ts"] },
});
```

```ts
// eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([".next/**", "coverage/**", "playwright-report/**", "test-results/**"]),
]);
```

Configure Playwright for Chromium with base URL `http://127.0.0.1:3000` and:

```ts
webServer: {
  command: "npm run dev -- --hostname 127.0.0.1",
  url: "http://127.0.0.1:3000",
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
}
```

`src/test/setup.ts` imports `@testing-library/jest-dom/vitest`, calls Testing
Library `cleanup()` after each test, clears `localStorage`, and restores Vitest
mocks.

Set the tools permissions policy in `next.config.ts`:

```ts
const nextConfig = {
  async headers() {
    return [{
      source: "/:path*",
      headers: [{ key: "Permissions-Policy", value: "tools=(self)" }],
    }];
  },
};

export default nextConfig;
```

- [x] **Step 3: Install dependencies**

Run: `npm install`

Expected: exit 0 and a new `package-lock.json`.

- [x] **Step 4: Write the failing domain-contract test**

```ts
import { describe, expect, it } from "vitest";
import { PROGRAM, createSampleDraft } from "./sample-program";

describe("sample program", () => {
  it("has unique requirements and an honestly incomplete judge draft", () => {
    const ids = PROGRAM.requirements.map((item) => item.id);
    const draft = createSampleDraft();
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(10);
    expect(draft.workflowState).toBe("draft");
    expect(draft.fields.audienceProblem).toBe("");
    expect(draft.attested).toBe(false);
  });
});
```

- [x] **Step 5: Verify the test fails**

Run: `npm test -- src/domain/application/sample-program.test.ts`

Expected: FAIL because `./sample-program` is unresolved.

- [x] **Step 6: Implement the exact domain contracts**

Create `src/domain/application/types.ts`:

```ts
export const applicationFieldKeys = [
  "projectName", "summary", "audienceProblem", "liveUrl",
  "repositoryUrl", "impactStatement",
] as const;

export type ApplicationFieldKey = (typeof applicationFieldKeys)[number];
export type WorkflowState = "draft" | "review" | "submitted";
export type RequirementStatus = "pass" | "attention" | "block";

export interface RequirementDefinition { id: string; label: string; blocking: boolean }
export interface ProgramDefinition {
  id: string; title: string; deadlineIso: string; summaryWordLimit: number;
  requirements: RequirementDefinition[];
}
export interface EvidenceBinding {
  id: string; claim: string; url: string;
  kind: "repository" | "live_demo" | "other";
}
export interface ApplicationDraft {
  id: string; revision: number;
  fields: Record<ApplicationFieldKey, string>;
  evidence: EvidenceBinding[]; attested: boolean;
  workflowState: WorkflowState; updatedAt: string;
}
export interface AuditCheck {
  requirementId: string; status: RequirementStatus; message: string;
  field?: ApplicationFieldKey; evidenceId?: string;
}
export interface AuditReport {
  draftRevision: number; checkedAt: string; checks: AuditCheck[];
  blockingCount: number; attentionCount: number;
}
export interface PatchChange { field: ApplicationFieldKey; value: string; rationale: string }
export interface StagedPatch {
  id: string; baseRevision: number; changes: PatchChange[];
  state: "staged" | "applied" | "rejected" | "stale"; createdAt: string;
}
export interface ReviewSnapshot {
  id: string; draftRevision: number; draftHash: string;
  createdAt: string; expiresAt: string; authorizedAt: string | null;
}
export interface SubmissionReceipt {
  id: string; reviewId: string; draftHash: string; submittedAt: string;
}
export interface ActivityEntry {
  id: string; actor: "human" | "agent" | "system";
  action: string; summary: string; createdAt: string;
}
export interface WorkspaceState {
  version: 1; draft: ApplicationDraft; audit: AuditReport | null;
  stagedPatch: StagedPatch | null; review: ReviewSnapshot | null;
  receipt: SubmissionReceipt | null; activity: ActivityEntry[];
}
```

Create `PROGRAM` with a 90-word limit and requirement IDs:
`project_name`, `summary_present`, `summary_word_limit`, `audience_problem`,
`live_url_https`, `repository_public`, `repository_license`, `impact_statement`,
`claim_evidence`, and `human_attestation`.

Implement `createSampleDraft(now = "2026-08-27T00:00:00.000Z")` with blank
audience/live/repository fields, no evidence, `attested: false`, and this
91-word summary so the word-limit failure is real and reproducible:

```ts
const sampleSummary = "This application describes a web project whose public artifacts must agree with the claims submitted for review. The draft combines a live experience, a public repository, an open-source license, a clearly bounded audience, and evidence links that another person can inspect. The applicant wants an agent to identify incomplete or contradictory fields, but does not want the agent to silently rewrite facts or trigger the final submission. Every proposed change must therefore appear as an exact diff, and the final action must remain bound to the version that the applicant reviewed.";
```

Label the workspace as a judge sample, not production data.

- [x] **Step 7: Run foundation verification**

Run: `npm test -- src/domain/application/sample-program.test.ts && npm run typecheck`

Expected: both commands PASS.

- [x] **Step 8: Commit the foundation**

```bash
git add package.json package-lock.json .gitignore next-env.d.ts tsconfig.json next.config.ts eslint.config.mjs vitest.config.ts playwright.config.ts src
git commit -m "chore: establish WebMCP portal foundation"
```

### Task 2: Build deterministic audits and bounded GitHub verification

**Timebox:** 90 minutes

**Files:**
- Create: `src/domain/application/schemas.ts`
- Create: `src/domain/application/github.ts`
- Create: `src/domain/application/audit.ts`
- Create: `src/app/api/github-repository/route.ts`
- Create: `src/test/fixtures.ts`
- Test: `src/domain/application/github.test.ts`
- Test: `src/domain/application/audit.test.ts`
- Test: `src/app/api/github-repository/route.test.ts`

**Interfaces:**
- Consumes: `ApplicationDraft`, `AuditReport`, and `PROGRAM`.
- Produces: `parseGitHubRepositoryUrl()`, `RepositoryVerification`, `auditApplication()`, and `POST /api/github-repository`.

- [x] **Step 1: Write failing parser and audit tests**

```ts
it("accepts one public repository path and rejects non-GitHub hosts", () => {
  expect(parseGitHubRepositoryUrl("https://github.com/openai/openai-node"))
    .toEqual({ owner: "openai", repository: "openai-node" });
  expect(() => parseGitHubRepositoryUrl("https://example.com/openai/openai-node"))
    .toThrow("Only public github.com repository URLs are supported");
});
```

```ts
it("passes a complete draft with a public licensed repository", () => {
  const report = auditApplication(
    createValidDraft(), verifiedRepository, "2026-08-27T01:00:00.000Z",
  );
  expect(report.blockingCount).toBe(0);
  expect(report.checks).toHaveLength(10);
  expect(report.checks.every((check) => check.status === "pass")).toBe(true);
});
```

- [x] **Step 2: Verify the tests fail**

Run: `npm test -- src/domain/application/github.test.ts src/domain/application/audit.test.ts`

Expected: FAIL because parser, audit, and fixtures are absent.

- [x] **Step 3: Implement strict schemas**

```ts
export const repositoryRequestSchema = z.object({
  repositoryUrl: z.string().url().max(500),
}).strict();

export const patchChangeSchema = z.object({
  field: z.enum(applicationFieldKeys),
  value: z.string().max(4_000),
  rationale: z.string().min(1).max(240),
}).strict();

export const stagePatchInputSchema = z.object({
  changes: z.array(patchChangeSchema).min(1).max(4),
}).strict();

export type StagePatchInput = z.infer<typeof stagePatchInputSchema>;
```

`createValidDraft()` must include all six fields, one HTTPS repository evidence
binding, a summary under 90 words, and `attested: true`.
`passingAudit()` must call `auditApplication(createValidDraft(),
verifiedRepository, "2026-08-27T01:00:00.000Z")` so later authority tests use the
same check set as production.

- [x] **Step 4: Implement bounded GitHub parsing**

```ts
export interface RepositoryVerification {
  status: "verified" | "not_found" | "unavailable";
  repositoryUrl: string;
  isPublic: boolean | null;
  licenseSpdx: string | null;
  checkedAt: string;
  message: string;
}

export function parseGitHubRepositoryUrl(value: string) {
  const url = new URL(value);
  const [owner, repository, extra] = url.pathname.replace(/^\//, "").split("/");
  if (url.protocol !== "https:" || url.hostname !== "github.com" || !owner || !repository || extra) {
    throw new Error("Only public github.com repository URLs are supported");
  }
  return { owner, repository: repository.replace(/\.git$/, "") };
}
```

- [x] **Step 5: Implement the deterministic audit**

Return exactly one check per requirement. Required strings pass after trimming;
summary uses whitespace word count; URLs must parse as HTTPS; repository and
license pass only for `status: "verified"`; unavailable metadata is a blocker
whose message says `unverified`; claim evidence requires a non-empty claim and
HTTPS URL; attestation remains human-owned and blocking.

- [x] **Step 6: Implement the GitHub metadata route**

Parse the request with `repositoryRequestSchema`, derive owner/repository, and
call only the public GitHub API:

```ts
const response = await fetch(`https://api.github.com/repos/${owner}/${repository}`, {
  headers: {
    Accept: "application/vnd.github+json",
    "User-Agent": "webmcp-application-portal",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  },
  signal: AbortSignal.timeout(4_000),
  next: { revalidate: 300 },
});
```

Return normalized metadata. Return `not_found` for 404 and `unavailable` for
rate limits, timeouts, invalid JSON, and other failures. Never fetch the supplied
URL directly or return upstream body text.

- [x] **Step 7: Run the audit gates**

Run: `npm test -- src/domain/application/github.test.ts src/domain/application/audit.test.ts && npm test && npm run typecheck`

Expected: all commands PASS.

- [x] **Step 8: Commit deterministic auditing**

```bash
git add src/domain src/app/api src/test
git commit -m "feat: add deterministic application audits"
```

### Task 3: Implement patch, review, authorization, and receipt invariants

**Timebox:** 120 minutes

**Files:**
- Create: `src/domain/application/canonical.ts`
- Create: `src/domain/application/workspace.ts`
- Test: `src/domain/application/canonical.test.ts`
- Test: `src/domain/application/workspace.test.ts`

**Interfaces:**
- Consumes: all domain types, `patchChangeSchema`, and `AuditReport`.
- Produces: `createWorkspace()`, `editDraftField()`, `setAttestation()`, `recordAudit()`, `stagePatch()`, `applyPatch()`, `rejectPatch()`, `prepareReview()`, `authorizeReview()`, `submitApproved()`, and `hashDraft()`.

- [x] **Step 1: Write failing authority-boundary tests**

```ts
it("stages a patch without changing the draft", () => {
  const NOW = "2026-08-27T01:00:00.000Z";
  const original = createWorkspace(createValidDraft());
  const staged = stagePatch(original, {
    changes: [{ field: "summary", value: "A concise verified summary.", rationale: "Meet the word limit." }],
  }, "patch-1", NOW);
  expect(staged.draft.fields.summary).toBe(original.draft.fields.summary);
  expect(staged.stagedPatch?.state).toBe("staged");
});

it("invalidates authorization when a reviewed draft changes", async () => {
  const NOW = "2026-08-27T01:00:00.000Z";
  const LATER = "2026-08-27T01:01:00.000Z";
  const ready = recordAudit(createWorkspace(createValidDraft()), passingAudit());
  const reviewed = await prepareReview(ready, "review-1", NOW);
  const authorized = authorizeReview(reviewed, "review-1", NOW);
  const edited = editDraftField(authorized, "impactStatement", "A revised impact statement.", LATER);
  expect(edited.review).toBeNull();
  expect(edited.draft.revision).toBe(authorized.draft.revision + 1);
});

it("submits once only after matching human authorization", async () => {
  const NOW = "2026-08-27T01:00:00.000Z";
  const LATER = "2026-08-27T01:01:00.000Z";
  const ready = recordAudit(createWorkspace(createValidDraft()), passingAudit());
  const reviewed = await prepareReview(ready, "review-1", NOW);
  await expect(submitApproved(
    reviewed,
    { reviewId: "review-1", draftHash: reviewed.review!.draftHash },
    "receipt-1",
    LATER,
  )).rejects.toThrow("Human authorization is required");
  const authorized = authorizeReview(reviewed, "review-1", LATER);
  const submitted = await submitApproved(
    authorized,
    { reviewId: "review-1", draftHash: authorized.review!.draftHash },
    "receipt-1",
    LATER,
  );
  const repeated = await submitApproved(
    submitted,
    { reviewId: "review-1", draftHash: authorized.review!.draftHash },
    "receipt-2",
    LATER,
  );
  expect(repeated.receipt?.id).toBe("receipt-1");
});
```

- [x] **Step 2: Verify the workspace tests fail**

Run: `npm test -- src/domain/application/canonical.test.ts src/domain/application/workspace.test.ts`

Expected: FAIL because canonical and workspace functions are absent.

- [x] **Step 3: Implement canonical hashing**

Canonicalize reviewable fields, evidence, attestation, draft ID, and revision.
Sort evidence by ID and object keys lexicographically. Exclude `updatedAt` and
`workflowState`.

```ts
export async function hashDraft(draft: ApplicationDraft): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalDraftJson(draft));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
```

- [x] **Step 4: Implement revision and patch transitions**

Every human field/evidence/attestation mutation increments the revision, returns
the workflow to `draft`, clears audit/review/receipt, marks an older staged patch
`stale`, and appends one human activity entry. `stagePatch()` parses Zod input,
rejects duplicate fields, and changes no application field. `applyPatch()`
rejects stale patches, applies all allowlisted changes in one revision, and
records one human activity. `rejectPatch()` changes only patch state.

- [x] **Step 5: Implement review and submission transitions**

`prepareReview()` rejects a stale/missing audit or any blocker, hashes the exact
draft, and expires after five minutes. `authorizeReview()` is called only by the
native UI and rejects mismatch/expiry. `submitApproved()` verifies review ID,
hash, authorization, expiry, and current draft hash; repeated identical calls
return the original receipt.

- [x] **Step 6: Run invariant verification**

Run: `npm test -- src/domain/application/canonical.test.ts src/domain/application/workspace.test.ts && npm test && npm run typecheck`

Expected: all commands PASS.

- [x] **Step 7: Commit authority boundaries**

```bash
git add src/domain/application
git commit -m "feat: bind review and submission authority"
```

### Task 4: Build the complete manual workspace and deploy it

**Timebox:** 210 minutes

**Required skill before UI implementation:** `frontend-design`

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `src/storage/local-workspace.ts`
- Create: `src/hooks/use-application-workspace.ts`
- Create: `src/components/application-workspace.tsx`
- Create: `src/components/application-editor.tsx`
- Create: `src/components/readiness-rail.tsx`
- Create: `src/components/activity-timeline.tsx`
- Create: `src/components/patch-review-drawer.tsx`
- Create: `src/components/submission-review.tsx`
- Create: `src/components/webmcp-status.tsx`
- Test: `src/storage/local-workspace.test.ts`
- Test: `src/components/application-workspace.test.tsx`

**Interfaces:**
- Consumes: all pure workspace transitions and the GitHub metadata route.
- Produces: `useApplicationWorkspace()`, a stable `WorkspaceController`, and a complete manual Draft -> Review -> Submitted experience.

- [ ] **Step 1: Write failing persistence and manual-journey tests**

```ts
it("rejects malformed or future-version browser state", () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99 }));
  expect(loadWorkspace()).toBeNull();
});

it("reports a write failure instead of claiming persistence", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Quota exceeded", "QuotaExceededError");
  });
  expect(saveWorkspace(createWorkspace(createValidDraft())))
    .toEqual({ ok: false, error: "Browser storage is unavailable" });
});
```

```tsx
it("shows a staged patch as a diff and requires the human Apply control", async () => {
  const user = userEvent.setup();
  render(<ApplicationWorkspace />);
  await user.click(screen.getByRole("button", { name: "Stage sample correction" }));
  expect(screen.getByText("Proposed change")).toBeInTheDocument();
  expect(screen.getByLabelText("Project summary")).not.toHaveValue("A concise verified summary.");
  await user.click(screen.getByRole("button", { name: "Apply proposed changes" }));
  expect(screen.getByLabelText("Project summary")).toHaveValue("A concise verified summary.");
});
```

The `Stage sample correction` control exists only when
`process.env.NODE_ENV !== "production"`; it tests the human review UI without
appearing in the judge build.

- [ ] **Step 2: Verify the focused tests fail**

Run: `npm test -- src/storage/local-workspace.test.ts src/components/application-workspace.test.tsx`

Expected: FAIL because storage, hook, and components are absent.

- [ ] **Step 3: Implement versioned local-first persistence**

Use key `webmcp-application-portal:v1`. Parse stored JSON with a strict
`WorkspaceState` Zod schema. Return `null` for malformed, missing, or non-v1
state. `saveWorkspace()` returns `{ ok: true }` or
`{ ok: false, error: "Browser storage is unavailable" }`; it never swallows a
failure. Reset removes the key and creates a new sample draft. The UI states:
`Judge workspace — saved in this browser` only after a successful write.

For final submission, compute the next state, persist it, and update React state
only when persistence succeeds. Persistence unavailable behavior is fail-visible:
keep the review authorized, show the storage error, and issue no receipt.

- [ ] **Step 4: Implement the stable workspace controller**

Expose:

```ts
export interface WorkspaceController {
  getState(): WorkspaceState;
  editField(field: ApplicationFieldKey, value: string): void;
  setAttestation(value: boolean): void;
  runAudit(signal?: AbortSignal): Promise<AuditReport>;
  stagePatch(input: StagePatchInput): StagedPatch;
  applyPatch(patchId: string): void;
  rejectPatch(patchId: string): void;
  prepareSubmission(): Promise<ReviewSnapshot>;
  authorizeSubmission(reviewId: string): void;
  submit(reviewId: string, draftHash: string): Promise<SubmissionReceipt>;
  recordActivity(actor: ActivityEntry["actor"], action: string, summary: string): void;
  reset(): void;
}
```

Keep latest state in a React ref so tool callbacks never capture stale renders.
Inject `crypto.randomUUID()` and `new Date().toISOString()` at the hook boundary;
pure functions remain deterministic.

- [ ] **Step 5: Build the single-screen product**

Use a civic-editorial direction rather than a dark AI dashboard:

- warm ivory `#F4F0E7`, ink `#14213D`, cobalt `#2457E6`, rust `#B7442A`, pine `#1F7556`;
- `Source Serif 4` headings and `Manrope` controls;
- 60/40 editor/readiness split at 1440×900;
- visible workflow, deadline, local-first disclosure, and WebMCP status;
- restrained transitions only for requirement and patch changes.

Implement all manual fields, evidence bindings, loading/error states, patch diff,
Apply/Reject, review expiry, authorization, receipt, and reset. Do not add
navigation or a dashboard home.

- [ ] **Step 6: Run component and build gates**

Run: `npm test -- src/storage/local-workspace.test.ts src/components/application-workspace.test.tsx && npm run lint && npm run typecheck && npm run build`

Expected: all commands PASS without hydration warnings.

- [ ] **Step 7: Commit and deploy the Day 1 path**

```bash
git add src next.config.ts package.json package-lock.json
git commit -m "feat: deliver manual application workspace"
npx vercel@latest --yes
```

Record the preview URL. Open it in a fresh browser and manually complete Draft
-> Review -> Submitted. Day 1 stops if this is broken; do not begin WebMCP on a
broken UI.

---

## Day 2 — WebMCP Golden Journey and Hosted Verification

### Task 5: Register and execute all five WebMCP tools

**Timebox:** 180 minutes

**Files:**
- Create: `src/types/webmcp.d.ts`
- Create: `src/webmcp/tool-schemas.ts`
- Create: `src/webmcp/tool-executors.ts`
- Create: `src/webmcp/register-tools.ts`
- Create: `src/hooks/use-webmcp-tools.ts`
- Modify: `src/components/application-workspace.tsx`
- Modify: `src/components/webmcp-status.tsx`
- Test: `src/webmcp/tool-executors.test.ts`
- Test: `src/webmcp/register-tools.test.ts`

**Interfaces:**
- Consumes: `WorkspaceController` and strict domain schemas.
- Produces: `createToolDefinitions()`, `registerWebMcpTools()`, `useWebMcpTools()`, and exactly five discoverable tools.

- [ ] **Step 1: Write failing registration and cancellation tests**

Add `createWorkspaceControllerHarness(initialDraft)` to `src/test/fixtures.ts`.
It stores `WorkspaceState` in a local variable, delegates every method to the
pure workspace functions, and exposes the same `WorkspaceController` interface
as the React hook. Use that harness as `controller` in both tests below.

```ts
it("registers exactly five tools and aborts their lifecycle on dispose", async () => {
  const registered: WebMCP.ModelContextTool[] = [];
  let lifecycleSignal: AbortSignal | undefined;
  const modelContext = {
    registerTool: vi.fn(async (tool, options) => {
      registered.push(tool);
      lifecycleSignal = options?.signal;
    }),
  } as unknown as WebMCP.ModelContext;
  const registration = await registerWebMcpTools(controller, modelContext);
  expect(registered.map((tool) => tool.name)).toEqual([
    "get_application_context",
    "audit_application",
    "stage_draft_patch",
    "prepare_submission",
    "submit_approved_application",
  ]);
  registration.dispose();
  expect(lifecycleSignal?.aborted).toBe(true);
});

it("aborts already registered tools when a later registration fails", async () => {
  let firstSignal: AbortSignal | undefined;
  const modelContext = {
    registerTool: vi.fn()
      .mockImplementationOnce(async (_tool, options) => { firstSignal = options?.signal; })
      .mockRejectedValueOnce(new Error("registration rejected")),
  } as unknown as WebMCP.ModelContext;
  await expect(registerWebMcpTools(controller, modelContext))
    .rejects.toThrow("registration rejected");
  expect(firstSignal?.aborted).toBe(true);
});
```

```ts
it("stages but does not apply an agent-proposed patch", async () => {
  const tool = createToolDefinitions(controller)
    .find((candidate) => candidate.name === "stage_draft_patch")!;
  const before = controller.getState().draft.fields.summary;
  const result = await tool.execute({
    changes: [{ field: "summary", value: "A shorter summary.", rationale: "Meet the stated limit." }],
  }, { signal: new AbortController().signal });
  expect(controller.getState().draft.fields.summary).toBe(before);
  expect(result).toMatchObject({ outcome: "staged" });
});
```

- [ ] **Step 2: Verify WebMCP tests fail**

Run: `npm test -- src/webmcp/tool-executors.test.ts src/webmcp/register-tools.test.ts`

Expected: FAIL because the adapter is absent.

- [ ] **Step 3: Add current API types and strict schemas**

Create `src/types/webmcp.d.ts`:

```ts
/// <reference types="webmcp-types" />
```

Every JSON Schema uses `additionalProperties: false`. Patch input permits one to
four changes. Submit input requires `reviewId` and `draftHash`. Human attestation
and authorization are never tool inputs.

- [ ] **Step 4: Implement structured executors**

Each `execute(input, { signal })` calls `signal.throwIfAborted()` before and after
awaited work, validates with Zod, appends a concise agent activity, and returns
only `outcome`, relevant identifiers, and verification state.

Use annotations:

```ts
get_application_context: { readOnlyHint: true, untrustedContentHint: true }
audit_application: { readOnlyHint: false, untrustedContentHint: true }
stage_draft_patch: { readOnlyHint: false, untrustedContentHint: false }
prepare_submission: { readOnlyHint: false, untrustedContentHint: true }
submit_approved_application: { readOnlyHint: false, untrustedContentHint: false }
```

The stage tool description states: `Stage allowlisted edits as a visible diff.
This does not modify the application. The person must apply or reject the patch
in the page.`

- [ ] **Step 5: Implement registration and cleanup**

```ts
export async function registerWebMcpTools(
  controller: WorkspaceController,
  modelContext = document.modelContext,
) {
  if (!modelContext || typeof modelContext.registerTool !== "function") {
    return { supported: false as const, dispose() {} };
  }
  const lifecycle = new AbortController();
  try {
    for (const tool of createToolDefinitions(controller)) {
      await modelContext.registerTool(tool, { signal: lifecycle.signal });
    }
  } catch (error) {
    lifecycle.abort();
    throw error;
  }
  return {
    supported: true as const,
    dispose() { lifecycle.abort(); },
  };
}
```

The hook disposes on unmount and survives React strict-mode remount without
duplicate tools. Registration failure sets visible status `error`.

- [ ] **Step 6: Run WebMCP and full gates**

Run: `npm test -- src/webmcp/tool-executors.test.ts src/webmcp/register-tools.test.ts && npm test && npm run lint && npm run typecheck && npm run build`

Expected: all commands PASS and the fake observes exactly five names.

- [ ] **Step 7: Commit the WebMCP boundary**

```bash
git add src/webmcp src/hooks src/components src/types
git commit -m "feat: expose human-controlled WebMCP tools"
```

### Task 6: Add browser proof and recording-ready judge UX

**Timebox:** 180 minutes

**Files:**
- Create: `e2e/webmcp-registration.spec.ts`
- Create: `e2e/application-journey.spec.ts`
- Modify: `src/app/globals.css`
- Modify: `src/components/application-workspace.tsx`
- Modify: `src/components/readiness-rail.tsx`
- Modify: `src/components/activity-timeline.tsx`

**Interfaces:**
- Consumes: live UI and five registered tools.
- Produces: browser proof of discovery, staged mutation, human approval, exact review, and receipt.

- [ ] **Step 1: Install the browser-side WebMCP test double**

Use `page.addInitScript()` before navigation:

```ts
const tools = new Map();
Object.defineProperty(document, "modelContext", {
  configurable: true,
  value: {
    async registerTool(tool, options) {
      tools.set(tool.name, tool);
      options?.signal?.addEventListener("abort", () => tools.delete(tool.name), { once: true });
    },
    async getTools() { return Array.from(tools.values()); },
  },
});
Object.defineProperty(window, "__registeredWebMcpTools", { value: tools });
```

- [ ] **Step 2: Write and run the failing registration test**

Verify `WebMCP connected`, all five names, and lifecycle cleanup on navigation.

Run: `npm run test:e2e -- e2e/webmcp-registration.spec.ts`

Expected: FAIL until UI status and test bridge are wired.

- [ ] **Step 3: Write and run the failing assisted journey**

The test routes `/api/github-repository` to a deterministic verified response,
then executes context, audit, stage patch, native Apply, human-only audience and
attestation, re-audit, prepare, native Authorize, submit, and visible receipt.
Assert that form state does not change before Apply and receipt hash equals
review hash.

Run: `npm run test:e2e -- e2e/application-journey.spec.ts`

Expected: FAIL at the first incomplete judge transition.

- [ ] **Step 4: Complete only journey-required UX states**

Provide connected/unavailable/error status; blocking and passing counts; exact
patch diff; native Apply/Reject/Authorize/Reset; concise activity; final receipt
with 12-character hash preview and copy control. No essential information may be
hover-only.

- [ ] **Step 5: Inspect recording-size screenshots**

Capture Draft, Patch Review, and Submitted at 1440×900. Inspect every image and
fix clipping, contrast, hierarchy, horizontal scroll, and unreadable status.
Do not add panels.

- [ ] **Step 6: Run the complete local release gate**

Run: `npm run verify`

Expected: lint, typecheck, Vitest, build, and Playwright PASS.

- [ ] **Step 7: Commit browser proof**

```bash
git add e2e src playwright.config.ts
git commit -m "test: prove the WebMCP judge journey"
```

### Task 7: Publish and verify the hosted WebMCP experience

**Timebox:** 120 minutes

**Files:**
- Create: `LICENSE`
- Create: `README.md`
- Create: `.env.example`

**Interfaces:**
- Consumes: frozen local release candidate.
- Produces: public repository URL, production URL, detected license, and two-browser WebMCP evidence.

- [ ] **Step 1: Add root license and judge-first README**

Use the MIT license with copyright `2026 Asad Ali`. README order:

1. personal problem;
2. product outcome;
3. production URL;
4. `Judge in 90 seconds` instructions;
5. five tools and authority boundaries;
6. exact `registerTool` implementation path;
7. setup and verification commands;
8. local-first persistence disclosure;
9. browser requirements;
10. limitations and no-guarantee statement.

`.env.example` contains only optional `GITHUB_TOKEN=` and explains the public API
rate limit. Never add a real token.

- [ ] **Step 2: Run repository-content checks**

```bash
if git grep -nE 'sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY' -- . ':!package-lock.json'; then exit 1; else echo "secret scan: no findings"; fi
git status --short
```

Expected: secret search prints nothing; status lists only intended release docs.

- [ ] **Step 3: Commit public-release documentation**

```bash
git add README.md LICENSE .env.example
git commit -m "docs: publish judge start and project license"
```

- [ ] **Step 4: Create the human-named public repository**

Asad supplies the final slug in `WEBMCP_REPO_SLUG`:

```bash
test -n "$WEBMCP_REPO_SLUG"
gh auth status
gh repo create "$WEBMCP_REPO_SLUG" --public --source=. --remote=origin --push
gh repo view --json url,visibility,licenseInfo
```

Expected: visibility `PUBLIC` and license `MIT`. If indexing is pending, query
once again later; do not change the license text.

- [ ] **Step 5: Deploy the exact public commit**

```bash
npx vercel@latest --prod
git rev-parse HEAD
git status --short --branch
```

Record production URL and commit in the execution log. Require clean status.

- [ ] **Step 6: Verify both real supported browsers**

In ChatGPT's in-app browser, discover all five tools and run the complete journey.
Confirm the staged patch waits for native Apply, submission waits for native
authorization, and receipt/review hashes match.

In compatible Chrome, enable WebMCP testing, inspect schemas, call one read-only
and one staged-mutation tool, reset, and confirm a fresh draft. Use
`superpowers:systematic-debugging` before changing code for unexpected behavior.

- [ ] **Step 7: Freeze the Day 2 candidate**

```bash
git tag webmcp-video-candidate
git status --short --branch
```

Expected: clean branch and tag at the production commit. Do not push this tag
until Day 3 verification.

---

## Day 3 — Verification, Video, and Submission Freeze

### Task 8: Produce the final judge package and stop

**Timebox:** 360 minutes maximum

**Files:**
- Create: `docs/DEMO_SCRIPT.md`
- Create: `docs/SUBMISSION_COPY.md`
- Modify: `README.md` only if hosted verification exposes a factual mismatch

**Interfaces:**
- Consumes: exact tagged hosted candidate.
- Produces: public video, rubric-aligned text, frozen repository, and verified submission links.

- [ ] **Step 1: Run the Day 3 morning gate**

```bash
git status --short --branch
npm ci
npm run verify
git rev-parse HEAD
git rev-list -n 1 webmcp-video-candidate
```

Expected: clean status, full verification PASS, and identical HEAD/tag commits.
Only failed acceptance criteria may be fixed after this point.

- [ ] **Step 2: Write the locked 2:45-2:50 script**

Use this budget:

| Time | Maximum narration | Required screen proof |
| --- | ---: | --- |
| 0:00-0:15 | 38 words | Personal deadline pain and consequence |
| 0:15-0:27 | 30 words | Rules, form, repository, and evidence fragmentation |
| 0:27-0:38 | 26 words | Production portal and WebMCP status |
| 0:38-0:50 | 30 words | Instruction not to change or submit |
| 0:50-1:18 | 70 words | Live context and audit calls |
| 1:18-1:32 | 34 words | Real blocker and human-only fact |
| 1:32-1:52 | 50 words | Patch diff and native Apply |
| 1:52-2:08 | 40 words | Human fact, attestation, and green re-audit |
| 2:08-2:24 | 40 words | Authorization, agent submit, receipt |
| 2:24-2:39 | 38 words | Five registrations and source excerpt |
| 2:39-2:48 | 22 words | Broader impact and human control |

Stay below 418 words and leave two seconds of silence. Do not mention test
totals, architecture diagrams, or another scenario.

- [ ] **Step 3: Write rubric-aligned submission copy**

`docs/SUBMISSION_COPY.md` contains:

- **Why WebMCP:** shared state, native rules, structured tools, and safe
  consequential action beat detached chat and brittle clicking.
- **Better experience:** exact blockers and diffs remain visible while the
  applicant retains factual and submission authority.
- **People and agents together:** agent inspects/prepares; person supplies facts,
  applies changes, and authorizes the reviewed artifact.
- **Implementation:** five imperative tools, shared domain functions, Zod/JSON
  Schema, AbortSignal lifecycle, deterministic audits, local-first persistence,
  and hash-bound receipt.

State the reference program, browser-local workspace, public GitHub metadata
limit, and no guarantee of acceptance.

- [ ] **Step 4: Rehearse production twice**

First rehearsal checks correctness and stops on mismatch. Second is timed and
finishes between 2:35 and 2:43 before narration overlays. Reset between runs.
Do not accelerate cursor movement or hide waiting states.

- [ ] **Step 5: Record and verify the public video**

Record the production URL and public source excerpt with clear audio, large
cursor, readable 16:9 framing, and captions. Keep tool-call waits at normal
speed. Export under three minutes.

```bash
test -n "$WEBMCP_VIDEO_FILE"
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$WEBMCP_VIDEO_FILE"
```

Expected: at least 165 seconds and less than 180 seconds. Watch once with sound,
then upload publicly to YouTube.

- [ ] **Step 6: Commit and verify the final package**

```bash
git add docs/DEMO_SCRIPT.md docs/SUBMISSION_COPY.md README.md
git commit -m "docs: freeze WebMCP challenge submission"
npm run verify
git status --short --branch
git push origin main
git tag webmcp-final
git push origin webmcp-final
```

Deploy the exact final commit. Re-run the golden journey from a fresh browser.
Confirm repository license, README links, live URL, YouTube URL, and five tools.

- [ ] **Step 7: Submit and enforce the freeze**

Paste only reviewed text from `docs/SUBMISSION_COPY.md`. Verify public live URL,
public YouTube URL, public repository, detected license, implementation path,
and no-login instructions. Submit before the buffer. Then do not modify app,
repository, video, or submission until judging ends. Continue Google All Things
Agentic only in its separate task and repository.

---

## Official Implementation References

- OpenAI WebMCP guide: `https://learn.chatgpt.com/docs/webmcp`
- Chrome WebMCP overview: `https://developer.chrome.com/docs/ai/webmcp`
- Chrome imperative API: `https://developer.chrome.com/docs/ai/webmcp/imperative-api`
- WebMCP specification: `https://webmachinelearning.github.io/webmcp/`

Follow the current API shown by these sources: awaited `registerTool`, JSON
Schema inputs, plain object/string outputs, `readOnlyHint`,
`untrustedContentHint`, registration `AbortController.signal`, and the execution
callback's cancellation signal.

## Scope Kill Rules

- Do not provision a hosted database; browser-local persistence is disclosed.
- If GitHub metadata work exceeds 60 minutes, retain parsing and report `unverified`; never add arbitrary URL fetching.
- If one tool remains unreliable after 30 focused debugging minutes, stop and amend the approved contract before changing tool count.
- If the golden journey exceeds 110 seconds, remove explanation rather than speeding the recording.
- If polish conflicts with a working tool path, preserve the path and simplify ornament.
- Day 3 permits only acceptance-blocker fixes, documentation, video, and submission work.

---

## Three-Day Stoplight

| Deadline | Green | Red — stop expansion |
| --- | --- | --- |
| End Day 1 | Hosted manual Draft -> Review -> Receipt works | Manual journey or build broken |
| Midday Day 2 | Five tools and authority tests pass | Duplicate tools, silent mutation, stale authorization |
| End Day 2 | Hosted ChatGPT and Chrome journeys pass | Discovery or production receipt fails |
| Morning Day 3 | Exact hosted candidate passes verification | Source/deployment mismatch |
| Final Day 3 | Video, copy, repository, and app agree | New feature or unsupported claim |

## Definition of Done

- [ ] Public no-login URL works in a fresh browser.
- [ ] Exactly five WebMCP tools are discoverable.
- [ ] Manual UI works without WebMCP.
- [ ] External failures say `unverified`, not an invented conclusion.
- [ ] Agent proposals stay staged until native human Apply.
- [ ] Missing facts remain human-owned.
- [ ] Authorization binds to exact draft hash and expires after change.
- [ ] Repeated identical submission returns the original receipt.
- [ ] Root MIT license is detected publicly.
- [ ] Fresh clone passes `npm ci` and `npm run verify`.
- [ ] Production ChatGPT and Chrome journeys pass.
- [ ] Video is public, audible, captioned, and under three minutes.
- [ ] Video and copy contain no unsupported claims.
- [ ] Final source, deployment, video, and submission are frozen.
