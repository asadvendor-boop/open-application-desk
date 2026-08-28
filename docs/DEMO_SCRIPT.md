# Open Application Desk — locked demo script

**Target duration:** 2:46, including two seconds of silence after the opening.

**Recording gate:** Use only the final no-login production URL after its
WebMCP registration and golden journey have been verified. Do not record this
script against the older Day 1 manual deployment. Keep the browser at 1440 ×
900, leave system waits at normal speed, and make every tool result and native
human action visible.

| Time | Screen proof | Narration |
| --- | --- | --- |
| 0:00–0:12 | Open on the incomplete application and several visible tabs or links. Pause briefly after “opportunity.” | At my last application deadline, rules were in one tab, evidence links in another, and my draft in a third. A stale claim nearly slipped through—and could have cost the opportunity. |
| 0:12–0:22 | Return to the portal overview, with the form, readiness rail, and evidence area together. | Open Application Desk puts those things in one shared application state. WebMCP lets an agent help without turning a deadline into blind automation. |
| 0:22–0:32 | Show the connected WebMCP status, then ask ChatGPT: “Read this application, audit it, and do not edit or submit anything.” | Five WebMCP tools connect ChatGPT to this actual draft. I ask it to inspect, not edit. |
| 0:32–0:49 | Show `get_application_context`, then `audit_application`; hold on 3/10 readiness, seven concrete blockers, and unchanged draft revision. | It reads the exact rules and draft behind this page, then runs deterministic checks. Seven blockers appear: a too-long summary, no audience fact, missing public evidence, and no attestation. The draft is unchanged. |
| 0:49–1:04 | Focus the missing audience-and-problem field and its audit reason. | One blocker needs a real answer: who is this for and what difficulty do they face? The agent cannot truthfully infer it. I own that fact. |
| 1:04–1:26 | Call `stage_draft_patch`; show the patch drawer, old/new values, and native **Apply proposed changes** button. Apply it yourself. | The agent can propose a concise, allowlisted patch. The old and new text sit side by side, and the change exists only in this drawer. I use the native Apply proposed changes control. The agent’s tool ends at proposal. |
| 1:26–1:49 | Enter the human-owned audience fact, add the public evidence, check the attestation, and show a green re-audit. | Now I supply the missing audience fact myself, link public evidence, and attest that the application reflects my claim. The agent audits the updated revision. The gate turns green, but green is readiness, not acceptance. |
| 1:49–2:12 | Show `prepare_submission`, the exact draft hash, native **Authorize exact application**, then `submit_approved_application` and its receipt. | `prepare_submission` creates a five-minute review bound to this exact draft hash. I use the native authorization control; only then can the agent submit that matching review. One receipt records the reviewed hash and submission time. |
| 2:12–2:32 | Show the five registration names in ChatGPT, then `src/webmcp/register-tools.ts` and a strict-schema excerpt. | There are exactly five registrations, all with strict schemas and the same shared controller as the form. The source shows `registerTool`; the experience shows the human boundaries working. |
| 2:32–2:46 | End on the receipt and the human-controlled workflow summary. | A stale claim nearly cost my submission. Open Application Desk lets ChatGPT find blockers, stage the fix, and submit only the exact version I approve. |

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

The narration above is **291 words**, below the 418-word cap. The time budget
intentionally reserves space for visible tool calls, human actions, and the
two-second opening pause.
