import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

function requestFor(body: unknown): Request {
  return new Request("http://localhost/api/github-repository", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/github-repository", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects non-GitHub URLs before any network request", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const response = await POST(
      requestFor({ repositoryUrl: "https://example.com/owner/repository" }),
    );

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("normalizes verified repository metadata", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          private: false,
          license: { spdx_id: "MIT" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const repositoryUrl = "https://github.com/openai/openai-node";
    const response = await POST(requestFor({ repositoryUrl }));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toMatchObject({
      status: "verified",
      repositoryUrl,
      isPublic: true,
      licenseSpdx: "MIT",
      message: "Public repository metadata checked.",
    });
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(
      "https://api.github.com/repos/openai/openai-node",
    );
  });

  it("returns a normalized not-found result without exposing GitHub's body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "sensitive upstream detail" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const repositoryUrl = "https://github.com/missing/repository";
    const response = await POST(requestFor({ repositoryUrl }));
    const result = await response.json();

    expect(result).toMatchObject({
      status: "not_found",
      repositoryUrl,
      isPublic: null,
      licenseSpdx: null,
    });
    expect(JSON.stringify(result)).not.toContain("sensitive upstream detail");
  });

  it("falls back to the public repository and LICENSE file when the API is rate limited", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 403 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          "Apache License\nVersion 2.0, January 2004\nTERMS AND CONDITIONS FOR USE",
          { status: 200, headers: { "Content-Type": "text/plain" } },
        ),
      );
    vi.stubGlobal("fetch", fetchSpy);

    const repositoryUrl = "https://github.com/openai/openai-node";
    const response = await POST(requestFor({ repositoryUrl }));
    const result = await response.json();

    expect(result).toMatchObject({
      status: "verified",
      repositoryUrl,
      isPublic: true,
      licenseSpdx: "Apache-2.0",
    });
    expect(fetchSpy.mock.calls.map((call) => call[0])).toEqual([
      "https://api.github.com/repos/openai/openai-node",
      "https://github.com/openai/openai-node",
      "https://raw.githubusercontent.com/openai/openai-node/HEAD/LICENSE",
    ]);
  });
});
