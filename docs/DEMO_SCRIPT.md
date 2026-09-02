# Open Application Desk — locked demo script

**Target duration:** 2:32. Record in native Chrome 149+ with WebMCP testing
enabled and the open-source **OpenAI WebMCP Tool Inspector** side panel already
open. Configure the OpenAI API key before recording. The first frame begins one
uninterrupted live journey; there is no title card, setup sequence, key entry,
login, loading screen, or reset cut.

**Recording gate:** Use only the final no-login production URL after its
WebMCP registration and golden journey have been verified. Do not record this
script against the older Day 1 manual deployment. Keep the browser at 1440 ×
900, record the workflow in short clips, jump-cut tool latency and other dead
air, and make every tool result and native human action visible. Never speed up
a consequential review or authorization moment beyond legibility. Disable the
unrelated third-party WebMCP inspector before recording, and never expose an API
key, browser settings, notifications, or private tabs. Describe this side panel
accurately as an optional OpenAI-powered developer extension—not as an official
ChatGPT extension.

| Time | Screen proof | Narration |
| --- | --- | --- |
| 0:00–0:08 | Start already on the fresh sample with **For high-stakes applicants**, **WebMCP connected**, and the OpenAI agent side panel visible. Show `get_application_context` and `audit_application`; jump-cut latency. Land on `3/10 ready`, `7 blockers remain`, and **0 fields changed** by 0:08. | While racing a real application deadline, a stale claim nearly survived into my submission. This agent is already auditing the exact live draft: three of ten ready, seven blockers, and zero fields changed. |
| 0:08–0:20 | Hold on the blockers and unchanged revision, then show the agent call `stage_draft_patch`. Use a compact overlay: **The agent prepares; the applicant decides**. Do not type the prompt live. | Open Application Desk gives the agent typed WebMCP tools, not pixels to scrape. It can prepare work, but it cannot invent applicant facts, apply a patch, or submit a different revision. |
| 0:20–0:38 | Show **Preview only — not applied**, the compact `3/10 → 7/10` projection, and the three old/new values. Add a brief **Human applies** overlay, then use native **Apply proposed changes** at normal speed. | It stages three bounded fixes and evaluates them without touching my application: three to seven ready. The difference is visible, but the original draft changes only when I use the page's Apply control. |
| 0:38–1:00 | Show `request_applicant_fact` appear because the audience fact is blank. Call it, hold on the page-owned question and waiting state, then answer through native **Share answer with agent**. Show the tool list again after it disappears. | One blocker is a fact only I can truthfully provide. The page exposes one contextual tool. The agent asks; I answer through the native form. Once answered, that tool disappears. |
| 1:00–1:18 | Add public evidence, check attestation, and call `audit_application` again. Jump-cut latency and hold on `10/10 ready` with `0 blockers remain`. | I add public evidence and attest to the claim. A fresh deterministic audit now reaches ten of ten, with zero blockers. |
| 1:18–1:45 | Show `prepare_submission`, the exact draft hash, native **Authorize exact application**, then `submit_approved_application`. Keep authorization at normal speed and add **Human authorizes this hash**. | Preparation binds a five-minute review to this canonical SHA-256 draft hash. I authorize that exact artifact in the page. Only then can the agent submit its matching review ID and hash. |
| 1:45–2:03 | Hold on the receipt: `7 blockers caught`, `10 / 10 ready`, `0 blockers remain`, reviewed hash, and one submission. | The receipt records the actual outcome: seven blockers caught, zero remaining, and one submission of the revision I approved. |
| 2:03–2:22 | Show the five core registration names, then one strict-schema excerpt from `src/webmcp/register-tools.ts`. Keep the contextual tool’s appearance/disappearance visible from the earlier journey; avoid a repository tour. | Five core tools share the same controller as the form. Inputs use closed schemas, and the sixth tool exists only while the page needs my fact. |
| 2:22–2:32 | Return to the receipt and human-control labels. Do not show browser settings, host compatibility, or a title card. | The agent makes a high-stakes application easier to complete; the applicant still owns the facts, changes, and final submission. |

## Rehearsal procedure

1. Begin with a fresh sample draft and record no video. Run the journey once for
   correctness. Stop immediately if a tool fails to register, a draft changes
   before native Apply, or the final receipt hash differs from the reviewed hash.
2. Reset the sample and complete a second rehearsal in short clips. Preserve
   every real tool result and human control, but cut loading and dead air. The
   edited sequence must finish between 2:25 and 2:35 with narration.
3. Record the final take only after both rehearsals pass. Watch the exported
   video once with sound, verify captions, then check the duration is between
   145 and 155 seconds and strictly under 180 seconds before uploading it
   publicly.
4. Run the exported video's first 30 seconds through the owner comprehension
   checklist in `docs/RECORDING_VALIDATION.md`. External-user validation is
   optional and must not be claimed unless it is actually performed.

## Narration count

The narration above is approximately **243 words** across a 2:32 target. Recount
it after any recording edit; spoken pacing must remain natural, the first
WebMCP calls must begin at second zero, and the audit result must be visible by
second eight.
