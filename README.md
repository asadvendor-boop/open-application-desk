# Open Application Desk

An applicant-facing WebMCP portal for the moment a deadline is near and one
stale claim can survive across instructions, a form, a repository, a deployment
link, and several open tabs. A person retains factual, attestation, patch-apply,
authorization, and submission authority; an agent gets structured access to the
same live draft.

**Production URL:** pending deployment of this exact WebMCP candidate. The
previous Day 1 manual deployment is deliberately not presented as this release.

## Judge in 90 seconds

1. Open the live URL in ChatGPT's in-app browser or a WebMCP-enabled Chrome.
2. Confirm the header says **WebMCP connected**. The application registers five
   tools against its actual page state, not a detached demo API.
3. Ask the agent to read context and audit the incomplete sample. It returns the
   deterministic blockers without editing the draft.
4. Ask it to stage a concise patch. The page shows the exact diff; the draft does
   not change until the person uses **Apply proposed changes**.
5. Supply the human-owned audience fact and attestation in the page, then ask the
   agent to audit and prepare an exact review.
6. Use the native **Authorize exact application** control, then ask the agent to
   submit the matching review ID and draft hash. The application records one
   receipt bound to that reviewed hash.

Use **Reset sample** for a fresh browser-local workspace.

## Why WebMCP

An ordinary agent must scrape UI text and imitate clicks. That makes it hard to
know which draft it inspected, whether a change was applied, or whether the
person authorized the same state that was submitted. WebMCP lets the portal
expose the smallest useful set of structured actions while retaining the portal
as authority for rules, state, validation, and submission.

The normal UI and the tools call the same `WorkspaceController` and pure domain
transitions. There is no hidden agent workflow and no embedded LLM.

## The five tools

| Tool | What it does | Authority boundary |
| --- | --- | --- |
| `get_application_context` | Reads selected rules, live draft, audit, and workflow state. | Read-only. |
| `audit_application` | Runs deterministic readiness and bounded public-repository checks. | Never edits draft content. |
| `stage_draft_patch` | Creates a visible allowlisted diff of one to four field changes. | Cannot apply its own patch. |
| `prepare_submission` | Re-audits the expected revision and creates a five-minute hash-bound review. | Cannot authorize or submit. |
| `submit_approved_application` | Records a single receipt for a matching approved review. | Requires native human authorization of the exact review ID and hash. |

The tool definitions are in
[`src/webmcp/tool-executors.ts`](src/webmcp/tool-executors.ts); registration and
`AbortSignal` cleanup are in
[`src/webmcp/register-tools.ts`](src/webmcp/register-tools.ts). Every input is
runtime-validated with Zod and uses a closed JSON Schema
(`additionalProperties: false`).

The browser registration starts from the page's real model context:

```ts
const modelContext = document.modelContext;
for (const tool of createToolDefinitions(controller)) {
  await modelContext.registerTool(tool, { signal: lifecycle.signal });
}
```

## Safety and state model

- The agent cannot invent missing facts, attest, apply a patch, authorize, or
  submit a changed review.
- A human edit invalidates any current audit and review; a human must re-audit
  and re-authorize.
- The review is bound to a canonical SHA-256 draft hash and expires after five
  minutes.
- Submission is single-use and idempotent for the same approved review/hash.
- Repository verification accepts only public `github.com/owner/repository`
  URLs. It makes no arbitrary URL requests; an API failure falls back only to
  bounded GitHub and raw-license endpoints.
- All agent-provided and external text is rendered as text, never trusted HTML.

## Local setup

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. In an unsupported browser, Manual mode remains
fully usable; use ChatGPT's in-app browser or Chrome with WebMCP testing enabled
to discover the tools.

```bash
npm run verify
```

This runs linting, strict TypeScript, Vitest domain/component tests, a production
Vinext build, and the Playwright WebMCP discovery and golden-journey tests.

## Implementation and hosting

The project uses React, TypeScript, Vinext, Zod, `webmcp-types`, Vitest,
Playwright, and OpenAI Sites. The host binding lives in
`.openai/hosting.json`. Source is versioned before each Sites production
deployment.

Set `GITHUB_TOKEN` only if higher GitHub public-metadata quota is needed. It is
optional and must be configured as a runtime secret; it is never committed.

## Important limitations

This is an honestly labeled challenge sample, not a production application
backend. Application state and receipts persist in the visitor's browser, not
in a shared server database. The reference grant program is fictional. A green
readiness check only verifies stated, deterministic requirements and public
metadata; it does not certify truth, improve acceptance odds, or replace a
human's judgment.

## License

[MIT](LICENSE)
