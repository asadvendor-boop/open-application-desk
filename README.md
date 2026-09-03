# Open Application Desk

An applicant-facing WebMCP portal for the moment a deadline is near and one
stale claim can survive across instructions, a form, a repository, a deployment
link, and several open tabs. A person retains factual, attestation, patch-apply,
authorization, and submission authority; an agent gets structured access to the
same live draft.

The creative premise is simple: **the form can explain and audit itself, while
its WebMCP tools cannot apply changes, attest to facts, or authorize
submission.** This is not a chatbot embedded beside a form or an agent imitating
clicks. The page itself publishes a typed collaboration surface through WebMCP.

**Production URL:** [open-application-desk.syed3000.chatgpt.site](https://open-application-desk.syed3000.chatgpt.site)

## Judge in 90 seconds

1. Open the live URL in the ChatGPT desktop app's built-in browser with
   ChatGPT Work or Codex on GPT-5.6 Sol/Terra. For native Chrome, use the
   optional open-source
   [OpenAI WebMCP Tool Inspector](https://github.com/asadvendor-boop/openai-webmcp-tool-inspector)
   with Chrome's WebMCP testing flag enabled.
2. Confirm the header says **WebMCP connected**. The application registers five
   core tools against its actual page state, plus one contextual fact request
   only while the applicant's audience fact is missing.
3. Ask the agent to read context and audit the incomplete sample. It returns the
   deterministic blockers without editing the draft.
4. Ask it to stage a concise patch. The page shows the exact diff; the draft does
   not change until the person uses **Apply proposed changes**.
5. Ask the agent to request the missing audience fact. The page—not the agent—
   asks its fixed question and immediately returns an `awaiting_human` handoff.
   Add the native response, evidence, and attestation, then ask the agent to
   re-read the live draft, audit, and prepare an exact review.
6. Use the native **Authorize exact application** control, then ask the agent to
   submit the matching review ID and draft hash. The application records one
   receipt bound to that reviewed hash, including the measured journey from the
   first audit to the final gate.

Use **Reset sample** for a fresh browser-local workspace.

## Compatible agent hosts

- **Official ChatGPT path:** the ChatGPT desktop app's built-in browser with
  ChatGPT Work or Codex on GPT-5.6 Sol or Terra, with Site Tools enabled. Access
  depends on the current product rollout and account settings.
- **Optional native-Chrome path:** the open-source
  [OpenAI WebMCP Tool Inspector](https://github.com/asadvendor-boop/openai-webmcp-tool-inspector)
  discovers registered page tools and maps them to OpenAI Responses API
  function calls. It is an unofficial developer adapter, uses a user-supplied
  API key held only for the browser session, and is not part of ChatGPT.
- **Ordinary browsers and chatgpt.com:** the application remains fully usable
  in Manual mode. The chatgpt.com web surface does not currently expose the
  WebMCP Site Tools host used by this project.

See the current [OpenAI WebMCP guide](https://learn.chatgpt.com/docs/webmcp)
for official host and model availability.

## Demonstrated outcome

The reproducible reference journey begins at **3/10 ready with seven blockers**
and ends at **10/10 ready with zero blockers**. The initial audit edits zero
application fields; proposed changes remain staged until the applicant applies
them. The final receipt records the initial blocker count, final readiness, and
exact reviewed draft hash. These are measured properties of the sample journey,
not claims about time saved, acceptance odds, or external adoption.

## Why WebMCP

**The OpenAI API supplies the reasoning; WebMCP lets this page publish its live
tools, state, and boundaries.**

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

When `audienceProblem` is blank, the page additionally and temporarily exposes
`request_applicant_fact({ field: "audienceProblem" })`. It has no free-form
question parameter and cannot write a draft field itself: it opens the page's
fixed native question and immediately returns an `awaiting_human` handoff. The
agent then re-reads the live page after the applicant chooses to share an
answer. Once answered, that contextual tool disappears.

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

- The agent can only stage an allowlisted text proposal. It cannot apply a
  patch, attest, or authorize; the applicant remains responsible for reviewing
  proposed text and supplying factual claims.
- The agent may call `submit_approved_application` only after the applicant has
  natively authorized that exact review ID and draft hash.
- A human edit invalidates any current audit and review; a human must re-audit
  and re-authorize.
- The review is bound to a canonical SHA-256 draft hash and expires after five
  minutes.
- Submission uses a browser-provided exclusive lock, is single-use and
  idempotent for the same approved review/hash across open tabs, and fails
  closed when that lock is unavailable.
- Repository verification accepts only public `github.com/owner/repository`
  URLs. It makes no arbitrary URL requests; an API failure falls back only to
  bounded GitHub and raw-license endpoints.
- All agent-provided and external text is rendered as text, never trusted HTML.
- A staged proposal is audited against an in-memory candidate before it is shown
  as a readiness preview. The candidate never changes the live revision; if its
  public repository metadata is unverified, the page suppresses the projected
  score rather than inventing one.

## Local setup

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. In an unsupported browser, Manual mode remains
fully usable. To discover tools, use the supported ChatGPT desktop path above
or Chrome 149+ with WebMCP testing enabled and a compatible agent extension.

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

The challenge build deliberately uses browser-local persistence. A portal
operator can replace `src/storage/local-workspace.ts` with authenticated server
storage while keeping the controller, five WebMCP contracts, deterministic
gate, visible patch review, and human authorization boundary unchanged. That is
the adoption seam for foundations, accelerators, admissions offices, and
procurement portals; this sample does not claim that migration has occurred.

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
