# WebMCP availability transparency

## Purpose

Make Open Application Desk truthful about current WebMCP availability without
weakening the applicant-first opening or adding a new product surface.

## Approved design

The existing status component is the single in-product disclosure surface. Its
unavailable state will be renamed from `Manual mode` to `Manual mode — fully
usable` and will state that the desk remains usable without an agent; ChatGPT's
built-in browser and other WebMCP-compatible agent browsers can add
collaboration on the same live draft; and availability depends on browser
support and rollout.

The connected and error states remain concise and preserve their current
authority wording. No persistent banner, modal, embedded chatbot, or product
area will be introduced.

`docs/SUBMISSION_COPY.md` will gain a short availability note in Honest limits.
`docs/DEMO_SCRIPT.md` will replace only the closing narration with the same
truthful positioning. The opening through 0:30 and the golden journey remain
unchanged.

## Verification

An existing hook/component test will first assert the new manual-mode title and
both the manual and compatible-browser claims. The test must fail before the
component copy changes, then pass afterward. The complete release command and
production build will run before deployment. The exact validated commit will be
pushed and deployed through OpenAI Sites.
