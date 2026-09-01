# Native Chrome recording runbook

Use this runbook only with the final production URL and the optional open-source
OpenAI WebMCP Tool Inspector. It is designed to produce the live journey in
`docs/DEMO_SCRIPT.md` without showing setup, credentials, or live typing.

## One-time preflight — do not record

1. Use Chrome 149+ and enable
   `chrome://flags/#enable-webmcp-testing`, then fully relaunch Chrome.
2. Open `chrome://extensions`, enable Developer mode, and load the unpacked
   extension from:
   `/Users/asad.ali/Documents/WebMCP-OpenAI-Inspector`
3. Disable the unrelated third-party **WebMCP Extension** so only the OpenAI
   inspector side panel is active.
4. Open
   `https://open-application-desk.syed3000.chatgpt.site/`, pin the OpenAI
   inspector side panel, and set the OpenAI API key before recording. Never
   capture the key-entry screen.
5. Use **Reset sample**, accept the confirmation, reload once, and confirm the
   page says **WebMCP connected**. The side panel must discover five core tools
   plus `request_applicant_fact` while the audience fact is blank.

## Exact agent prompts

Paste prompts between clips or cut out the typing. Do not narrate the prompt
text; show the resulting tool calls and page state.

### Clip 1 — context and first audit

```text
Read this application's current requirements and exact live draft, then run its deterministic audit. Do not edit, stage, apply, attest, authorize, or submit anything. Report the readiness score, blocker count, and whether any field changed.
```

Required visible result: **3/10 ready**, **7 blockers remain**, unchanged
revision, and zero edited fields.

### Clip 2 — non-mutating preview

```text
Stage exactly these three edits as a preview only. Do not apply them:

summary: Open Application Desk lets applicants and agents share one live draft. WebMCP exposes deterministic audits, visible patch previews, applicant-owned facts, and hash-bound submission while native controls keep every consequential decision human-owned.

liveUrl: https://open-application-desk.syed3000.chatgpt.site/

repositoryUrl: https://github.com/asadvendor-boop/open-application-desk

Use a concise rationale for each field.
```

Required visible result: **Preview only — not applied**, all three old/new
values, and **3/10 → 7/10**. Then the human uses native **Apply proposed
changes**.

### Clip 3 — contextual applicant fact

```text
The application still lacks the applicant-owned audience-and-problem fact. Use the page's contextual tool to request it from me. Do not invent or supply the answer yourself.
```

Required visible result: `request_applicant_fact` invokes the page-owned
question and waits. In the native page, enter:

```text
Applicants under deadline pressure risk rejection when requirements, claims, and public evidence drift across disconnected tabs.
```

Use native **Share answer with agent**. The contextual tool must disappear after
the answer is accepted.

### Human-only evidence and attestation

Do not ask the agent to invent evidence. In the native page:

- Evidence type: **Live demo**
- Claim: `The public portal exposes the complete human-controlled workflow.`
- Public evidence URL:
  `https://open-application-desk.syed3000.chatgpt.site/`
- Check **Applicant attestation**.

### Clip 4 — fresh audit and exact review

```text
Run a fresh deterministic audit of the exact live draft. If and only if it reaches 10/10 with zero blockers, prepare that current revision for review. Do not authorize or submit it.
```

Required visible result: **10/10 ready**, **0 blockers remain**, then an exact
review ID, revision, five-minute window, and draft hash. The human uses native
**Authorize exact application** at normal speed.

### Clip 5 — bound submission

```text
Submit only the exact review I just authorized, using its matching review ID and draft hash. Do not substitute a different revision.
```

Required visible result: one submission receipt bound to the reviewed hash,
showing seven blockers caught and zero remaining.

## Stop conditions

Stop and reset before recording again if any of these occur:

- The page does not say **WebMCP connected**.
- The first audit is not 3/10 with seven blockers.
- A draft field changes before native Apply.
- The agent invents the applicant fact or evidence.
- The contextual tool remains registered after the human answer.
- Final audit is not 10/10 with zero blockers.
- The receipt hash differs from the authorized review hash.
- Any credential, setting screen, notification, or private tab enters frame.

