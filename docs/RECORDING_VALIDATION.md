# Final recording validation

This gate applies to the exported submission video, not the script alone.

## First-30-second comprehension check

Watch only `0:00–0:30` without reading the Devpost description. Confirm that the
clip independently answers:

1. Who is this for?
2. What painful problem does it solve?
3. What did the agent just do?
4. What remains under human control?

The answers must be visible or spoken: a high-stakes applicant near a real
deadline; stale or missing application claims; the agent used webpage-provided
tools to audit the live draft and stage a preview; and the person controls facts,
changes, and submission.

External blind testing remains useful but is not a release blocker for this
deadline. Status: **SKIPPED — no external-user-validation claim will be made.**

## Chrome recording preflight

- Chrome 149+ has `chrome://flags/#enable-webmcp-testing` enabled and has been
  fully relaunched.
- The unpacked extension is loaded from the local
  `WebMCP-OpenAI-Inspector` folder and its OpenAI API key is configured before
  recording.
- The unrelated third-party WebMCP inspector is disabled to prevent duplicate
  side panels or false status messages.
- The production URL is open on a freshly reset sample and the page says
  **WebMCP connected**.
- The OpenAI agent side panel discovers the five core tools plus the contextual
  `request_applicant_fact` tool while the audience fact is missing.
- No API key, extension settings, browser flags, private tabs, or notifications
  appear in the capture.

## Export checks

- Duration is between 150 and 165 seconds and strictly under 180 seconds.
- The video starts on the working application with no title card, setup, login,
  API-key entry, loading screen, personal-origin introduction, or reset cut.
- The agent side panel visibly shows OpenAI invoking registered WebMCP tools;
  the recording does not substitute manual tool execution for the agent flow.
- `get_application_context` and `audit_application` begin at second zero;
  **For high-stakes applicants**, `3/10 ready`, `7 blockers remain`, and
  **0 fields changed** are readable by second eight.
- The first narration sentence establishes the real deadline and stale-claim
  pain while the WebMCP tools are already running; there is no separate origin
  or inspiration segment.
- `stage_draft_patch` begins by second 25, and its non-mutating `3/10 → 7/10`
  preview plus the native Apply boundary are legible within the first 30
  seconds.
- Captions match the spoken words and do not cover tool results or controls.
- Tool invocations, native Apply, native authorization, receipt metrics, and
  reviewed hash are legible at normal playback speed.
- Tool latency, loading, live typing, pauses, repeated features, and repository
  browsing are cut; consequential review and authorization remain unsped and
  legible.
- The video contains no credentials, private tabs, notifications, or invented
  user-validation claims.
- The closing host statement is precise: manual mode works everywhere; agent
  collaboration uses the supported ChatGPT desktop Work/Codex host or the
  optional OpenAI Chrome developer extension. It does not imply that ordinary
  chatgpt.com currently hosts these page tools.
