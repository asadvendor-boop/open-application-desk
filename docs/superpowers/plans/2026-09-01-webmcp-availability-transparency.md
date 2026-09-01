# WebMCP Availability Transparency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clearly distinguish universal manual use from currently limited WebMCP agent collaboration across the product and recording materials.

**Architecture:** Keep the existing `WebMcpStatus` component as the only in-product surface. Update its unavailable-state copy and its focused test. Add matching availability language to the submission copy and the final eight seconds of the video script without modifying the demonstrated interaction flow.

**Tech Stack:** React, TypeScript, Vitest, Markdown, OpenAI Sites.

## Global Constraints

- Do not add a product area, banner, modal, or embedded chatbot.
- Do not alter the demo script before 2:40 or the golden journey.
- State that manual use is available today; state that agent collaboration requires a WebMCP-compatible agent browser and depends on browser support and rollout.
- Keep factual and submission authority with the applicant.

---

### Task 1: Add and prove the product disclosure

**Files:**
- Modify: `src/hooks/use-webmcp-tools.test.tsx:95-105`
- Modify: `src/components/webmcp-status.tsx:12-16`

**Interfaces:**
- Consumes: `WebMcpStatus` with `connection.status === "unavailable"`.
- Produces: an accessible status that says `Manual mode — fully usable` and names both manual availability and compatible-browser dependency.

- [ ] **Step 1: Write the failing test**

```tsx
expect(screen.getByText("Manual mode — fully usable")).toBeInTheDocument();
expect(screen.getByText(/works for anyone without an agent/i)).toBeInTheDocument();
expect(screen.getByText(/availability depends on browser support and rollout/i)).toBeInTheDocument();
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- src/hooks/use-webmcp-tools.test.tsx`

Expected: FAIL because the current title is `Manual mode` and current copy lacks the approved availability language.

- [ ] **Step 3: Implement the minimal status copy**

```ts
title: "Manual mode — fully usable",
detail:
  "This desk works for anyone without an agent. In ChatGPT's built-in browser or another WebMCP-compatible agent browser, an agent can collaborate on this same live draft. Agent availability depends on browser support and rollout.",
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- src/hooks/use-webmcp-tools.test.tsx`

Expected: PASS with all hook tests green.

### Task 2: Keep public materials aligned

**Files:**
- Modify: `docs/SUBMISSION_COPY.md:110-116`
- Modify: `docs/DEMO_SCRIPT.md:24`

**Interfaces:**
- Consumes: the exact approved product disclosure.
- Produces: a submission limitation paragraph and a closing narration that do not disturb the opening demo sequence.

- [ ] **Step 1: Add the availability note under Honest limits**

```md
WebMCP collaboration currently requires a compatible agent browser. The desk remains fully usable without one; availability of agent collaboration depends on browser support and rollout.
```

- [ ] **Step 2: Replace only the final narration row**

```md
Anyone can use the desk manually today. In compatible agent browsers, WebMCP adds this collaboration while applicants keep the facts, changes, and final authorization.
```

- [ ] **Step 3: Confirm the first 0:30 and required claims are unchanged**

Run: `rg -n "0:00|0:16|0:30|Anyone can use the desk manually|compatible agent browser" docs/DEMO_SCRIPT.md docs/SUBMISSION_COPY.md`

Expected: opening timing rows remain unchanged and each availability statement is present.

### Task 3: Release the exact validated source

**Files:**
- Modify: files from Tasks 1 and 2.

**Interfaces:**
- Consumes: a passing focused regression test and aligned public copy.
- Produces: a pushed source commit and matching OpenAI Sites deployment.

- [ ] **Step 1: Run the full release gate**

Run: `npm run verify`

Expected: lint, typecheck, Vitest, build, and Playwright complete with exit code 0.

- [ ] **Step 2: Commit the exact validated source**

```bash
git add src/components/webmcp-status.tsx src/hooks/use-webmcp-tools.test.tsx docs/SUBMISSION_COPY.md docs/DEMO_SCRIPT.md docs/superpowers/specs/2026-09-01-webmcp-availability-transparency-design.md docs/superpowers/plans/2026-09-01-webmcp-availability-transparency.md
git commit -m "docs: clarify WebMCP availability"
git push origin HEAD:main
```

- [ ] **Step 3: Publish through OpenAI Sites**

Run the existing Sites packaging and deployment workflow using the pushed commit SHA, then poll until the hosted deployment succeeds.

- [ ] **Step 4: Verify source and hosted identity**

Run: `git status --short --branch`

Expected: clean worktree and branch aligned with `origin/main`; return the deployed URL.
