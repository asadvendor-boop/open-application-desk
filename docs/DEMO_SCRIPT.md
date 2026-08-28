# Open Application Desk — locked demo script

**Target duration:** 2:46, including two seconds of silence after the opening.

**Recording gate:** Use only the final no-login production URL after its
WebMCP registration and golden journey have been verified. Do not record this
script against the older Day 1 manual deployment. Keep the browser at 1440 ×
900, leave system waits at normal speed, and make every tool result and native
human action visible.

| Time | Screen proof | Narration |
| --- | --- | --- |
| 0:00–0:15 | Open on the incomplete application and several visible tabs or links. Pause two seconds after “failure.” | At my last application deadline, I had rules in one tab, evidence links in another, and a draft in a third. One stale claim almost made it through. That is a real failure. |
| 0:15–0:27 | Return to the portal overview, showing the form, readiness rail, and evidence area together. | The portal looks ordinary, but it connects the application, rules, repository evidence, and final authorization to one shared state. WebMCP lets an agent help without turning a deadline into blind automation. |
| 0:27–0:38 | Show the header and its connected WebMCP status. | This is Open Application Desk: a browser-local application workspace with the actual WebMCP registration state visible right here. |
| 0:38–0:50 | In ChatGPT, ask: “Read this application, audit it, and do not edit or submit anything.” | I ask the agent to inspect, not edit: read this application, audit it, and tell me what is missing. It cannot apply proposals, attest, authorize, or submit; I remain responsible for factual claims. |
| 0:50–1:18 | Show the `get_application_context` call, then `audit_application`; hold on the concrete blockers and unchanged draft revision. | First, `get_application_context` reads the exact draft and rules behind this page. Then `audit_application` runs deterministic readiness checks: a too-long summary, no audience fact, missing public evidence, and no attestation. These are visible blockers, not a hidden model verdict, and the draft is unchanged. |
| 1:18–1:32 | Focus the missing audience-and-problem field and its audit reason. | One blocker needs a real answer: who is this for and what difficulty do they face? The agent cannot infer it. The applicant owns that fact. |
| 1:32–1:52 | Call `stage_draft_patch`; show the patch drawer, old/new values, and native **Apply proposed changes** button. Apply it yourself. | The agent can propose a concise, allowlisted patch. But look: the old and new text sit side by side, and the change only exists in this drawer. I use the native Apply proposed changes control. The agent’s tool ends at proposal. |
| 1:52–2:08 | Enter the human-owned audience fact, add the public evidence, check the attestation, and show a green re-audit. | Now I supply the missing audience fact myself, attach public evidence, and attest that the application reflects my claim. The agent audits the updated revision. The gate turns green, but green is readiness, not acceptance. |
| 2:08–2:24 | Show `prepare_submission`, the exact draft hash, native **Authorize exact application**, then `submit_approved_application` and its receipt. | Next, `prepare_submission` creates a five-minute review bound to this exact draft hash. I use the native authorization control, then the agent submits that matching review. One receipt records the reviewed hash and submission time. |
| 2:24–2:39 | Show the five registration names in ChatGPT, then `src/webmcp/register-tools.ts` and a strict-schema excerpt. | There are exactly five registrations, all with strict schemas and the same shared controller as the form. The source shows `registerTool`, while the experience shows the human boundaries working. |
| 2:39–2:48 | End on the receipt and the human-controlled workflow summary. | This makes high-stakes applications more legible: agents prepare structured work, while people remain responsible for facts and consequential decisions. |

## Rehearsal procedure

1. Begin with a fresh sample draft and record no video. Run the journey once for
   correctness. Stop immediately if a tool fails to register, a draft changes
   before native Apply, or the final receipt hash differs from the reviewed hash.
2. Reset the sample and complete a second rehearsal at ordinary interaction
   speed. The captured sequence must finish between 2:35 and 2:43 before the
   narration overlays.
3. Record the final take only after both rehearsals pass. Watch the exported
   video once with sound, verify captions, then check the duration is at least
   165 and under 180 seconds before uploading it publicly.

## Narration count

The narration above is **338 words**, below the 418-word cap. The time budget
intentionally reserves space for visible tool calls, human actions, and the
two-second opening pause.
