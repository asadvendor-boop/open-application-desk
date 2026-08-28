# Open Application Desk — locked demo script

**Target duration:** 2:48. The opening uses one clearly labeled cold-open result,
then returns to the fresh sample for one uninterrupted live journey.

**Recording gate:** Use only the final no-login production URL after its
WebMCP registration and golden journey have been verified. Do not record this
script against the older Day 1 manual deployment. Keep the browser at 1440 ×
900, leave system waits at normal speed, and make every tool result and native
human action visible.

| Time | Screen proof | Narration |
| --- | --- | --- |
| 0:00–0:09 | **Cold open:** show the real audited sample at `3/10 ready` and `7 blockers remain`, with **For high-stakes applicants** visible. Keep both numbers legible. | As an applicant racing a deadline, I nearly submitted a stale claim. This portal found seven blockers before they cost me the opportunity. |
| 0:09–0:16 | Cut once to a fresh reset with a small “30 seconds earlier” label. Show the personal origin strip and **WebMCP connected** status. | So I built a form that can explain itself—but only I can authorize submission. |
| 0:16–0:30 | Ask ChatGPT: “Read this application, audit it, and do not edit or submit anything.” Show `get_application_context` and `audit_application`; the live result must be visible by 0:28. | ChatGPT discovers five typed WebMCP tools and audits this exact page. The gate returns three of ten ready, with no draft edit. |
| 0:30–0:47 | Hold on seven concrete blockers and unchanged draft revision. | The checks are deterministic: the summary is too long, the audience fact is missing, public evidence is absent, and I have not attested. The draft is unchanged. |
| 0:47–1:01 | Focus the missing audience-and-problem field and its audit reason. | One blocker needs a real answer: who is this for and what difficulty do they face? The agent cannot truthfully invent it. I own that fact. |
| 1:01–1:24 | Call `stage_draft_patch` with the concise summary, deployed HTTPS URL, and public repository URL. Show all three old/new values and the native **Apply proposed changes** button. Review and apply them yourself. | The agent proposes three allowlisted fields: a shorter summary and the two public project links. I review every value; the draft stays untouched until I use the native Apply control. The tool ends at proposal. |
| 1:24–1:47 | Enter the human-owned audience fact, add public evidence, check attestation, and show the green re-audit. | I supply the missing audience fact, link public evidence, and attest to my claim. A fresh audit turns the exact revision green: ten of ten ready, zero blockers. |
| 1:47–2:10 | Show `prepare_submission`, the exact draft hash, native **Authorize exact application**, then `submit_approved_application`. | Preparation creates a five-minute review bound to this draft hash. I authorize that exact artifact in the page; only then can the agent submit it. |
| 2:10–2:29 | Hold on the receipt’s measured journey: `7 blockers caught`, `10 / 10 ready`, `0 blockers remain`, and the reviewed hash. | The receipt now binds the visible result: seven blockers caught, zero remaining, and the exact reviewed hash submitted once. That is demonstrated impact, not an acceptance promise. |
| 2:29–2:40 | Show the five registration names in ChatGPT, then `src/webmcp/register-tools.ts` and a strict-schema excerpt. | Five strict registrations share the same controller as the form. WebMCP turns the page itself into the agent interface—not another chatbot or click bot. |
| 2:40–2:48 | End on the receipt and origin strip. | Open Application Desk lets agents prepare the application while applicants keep the facts, the changes, and final authorization. |

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
4. Run the exported video's first 30 seconds through the blind comprehension
   protocol in `docs/RECORDING_VALIDATION.md`. Do not count the project owner or
   anyone who already knows the product.

## Narration count

The narration above is **269 words** across a 2:48 target. Recount it after any
recording edit; spoken pacing must remain natural and the result must still be
visible by second 28.
