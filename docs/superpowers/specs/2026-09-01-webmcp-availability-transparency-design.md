# WebMCP availability transparency

## Purpose

Make Open Application Desk truthful about current WebMCP availability without
weakening the applicant-first opening or adding a new product surface.

## Approved design

The existing status component is the single in-product disclosure surface. Its
unavailable state is `Manual mode — fully usable` and states that manual
controls work in every browser. It names the current official agent host
precisely: the ChatGPT desktop app's built-in browser with ChatGPT Work or Codex
on GPT-5.6 Sol/Terra. It also permits a compatible Chrome agent extension and
states that availability depends on browser support and rollout. It does not
imply that the ordinary chatgpt.com web surface hosts these page tools.

The connected and error states remain concise and preserve their current
authority wording. No persistent banner, modal, embedded chatbot, or product
area will be introduced.

The active collaboration UI uses provider-neutral language (`agent`) because
the same WebMCP contracts work in either supported host. `README.md` and
`docs/SUBMISSION_COPY.md` distinguish the official ChatGPT desktop route from
the optional open-source OpenAI Chrome developer extension. The demo is
recorded in native Chrome with that extension, but no credential or setup flow
appears on screen. The personal-pain opening and golden journey remain
unchanged.

## Verification

Focused component tests first assert the manual-mode host disclosure,
provider-neutral applicant-fact handoff, and provider-neutral workspace copy.
Those tests must fail before production copy changes, then pass afterward. The
complete release command and production build run before deployment. The exact
validated commit is pushed and deployed through OpenAI Sites, followed by a
fresh hosted tool-discovery and audit replay.
