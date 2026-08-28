import { describe, expect, it } from "vitest";
import { parseGitHubRepositoryUrl } from "./github";

describe("parseGitHubRepositoryUrl", () => {
  it("accepts one public repository path and rejects non-GitHub hosts", () => {
    expect(
      parseGitHubRepositoryUrl("https://github.com/openai/openai-node"),
    ).toEqual({ owner: "openai", repository: "openai-node" });

    expect(() =>
      parseGitHubRepositoryUrl("https://example.com/openai/openai-node"),
    ).toThrow("Only public github.com repository URLs are supported");
  });

  it("normalizes a .git suffix and rejects deeper paths", () => {
    expect(
      parseGitHubRepositoryUrl("https://github.com/openai/openai-node.git"),
    ).toEqual({ owner: "openai", repository: "openai-node" });

    expect(() =>
      parseGitHubRepositoryUrl("https://github.com/openai/openai-node/issues"),
    ).toThrow("Only public github.com repository URLs are supported");
  });
});
