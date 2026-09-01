# Open Application Desk — locked demo script

**Target duration:** 2:40. Start on the working application and its compatible
agent browser. The first frame begins one uninterrupted live journey; there is
no title card, setup sequence, personal-origin introduction, or reset cut.

**Recording gate:** Use only the final no-login production URL after its
WebMCP registration and golden journey have been verified. Do not record this
script against the older Day 1 manual deployment. Keep the browser at 1440 ×
900, record the workflow in short clips, jump-cut tool latency and other dead
air, and make every tool result and native human action visible. Never speed up
a consequential review or authorization moment beyond legibility.

| Time | Screen proof | Narration |
| --- | --- | --- |
| 0:00–0:08 | Start already on the fresh sample in a compatible agent browser with **For high-stakes applicants** and **WebMCP connected** visible. Show ChatGPT call `get_application_context` and `audit_application`; jump-cut latency. Land on `3/10 ready`, `7 blockers remain`, and an overlay reading **0 fields changed** by 0:08. | ChatGPT audits this live high-stakes application through WebMCP: three of ten ready, seven blockers, and zero fields changed. |
| 0:08–0:24 | Hold briefly on concrete blockers and the unchanged draft revision, then show ChatGPT call `stage_draft_patch`. Do not type the prompt live. | The page exposes typed tools for its exact live state, so the agent sees rules and missing evidence without scraping or guessing. |
| 0:24–0:43 | Show **Preview only — not applied**, the compact `3/10 → 7/10` projection, and all three old/new values. Add a brief **Human applies** overlay, then use native **Apply proposed changes**. | It stages a bounded patch and predicts four resolved blockers. This is only a preview: every original value remains until the applicant uses Apply. |
| 0:43–1:03 | Show that the missing audience fact makes `request_applicant_fact` appear. Call it, hold on the page-owned question and waiting state, then answer through native **Share answer with ChatGPT**. Add a brief **Contextual tool appeared** overlay. | Because the audience fact is missing, the page dynamically exposes one contextual tool. The agent stops; I supply the fact through the native page. |
| 1:03–1:23 | Add public evidence, check attestation, and call `audit_application` again. Jump-cut latency and hold on `10/10 ready` with `0 blockers remain`. | I add public evidence and attest to the claim. A fresh audit reaches ten of ten, with zero blockers. |
| 1:23–1:49 | Show `prepare_submission`, the exact draft hash, native **Authorize exact application**, then `submit_approved_application`. Keep the authorization action at normal speed and add a brief **Human authorizes this hash** overlay. | Preparation creates a five-minute review bound to this exact draft hash. Only after I authorize that artifact can the agent submit it. |
| 1:49–2:08 | Hold on the receipt’s measured journey: `7 blockers caught`, `10 / 10 ready`, `0 blockers remain`, and the reviewed hash. | The receipt proves the journey: seven blockers caught, zero remaining, and the reviewed hash submitted once. |
| 2:08–2:30 | Show the five core registration names, the contextual fact tool appearing only while needed, then `src/webmcp/register-tools.ts` and one strict-schema excerpt. Avoid a repository tour. | Five strict core tools share the same controller as the form. The contextual fact tool exists only when needed, and every input is schema-validated. |
| 2:30–2:40 | Return to the receipt and human-control labels. | The desk works manually for anyone. In a compatible agent browser, WebMCP adds shared-state collaboration while the applicant keeps facts, changes, and final authorization. |

## Rehearsal procedure

1. Begin with a fresh sample draft and record no video. Run the journey once for
   correctness. Stop immediately if a tool fails to register, a draft changes
   before native Apply, or the final receipt hash differs from the reviewed hash.
2. Reset the sample and complete a second rehearsal in short clips. Preserve
   every real tool result and human control, but cut loading and dead air. The
   edited sequence must finish between 2:30 and 2:40 with narration.
3. Record the final take only after both rehearsals pass. Watch the exported
   video once with sound, verify captions, then check the duration is between
   150 and 165 seconds and strictly under 180 seconds before uploading it
   publicly.
4. Run the exported video's first 30 seconds through the blind comprehension
   protocol in `docs/RECORDING_VALIDATION.md`. Do not count the project owner or
   anyone who already knows the product.

## Narration count

The narration above is **193 words** across a 2:40 target. Recount it after any
recording edit; spoken pacing must remain natural, the first WebMCP calls must
begin at second zero, and the audit result must be visible by second eight.
