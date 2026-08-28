import { describe, expect, it } from "vitest";
import {
  detectCommonLicenseSpdx,
  parseGitHubRepositoryUrl,
} from "./github";

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

  it("rejects repository URLs with credentials, ports, queries, or fragments", () => {
    for (const value of [
      "https://token@github.com/openai/openai-node",
      "https://github.com:444/openai/openai-node",
      "https://github.com/openai/openai-node?token=secret",
      "https://github.com/openai/openai-node#readme",
    ]) {
      expect(() => parseGitHubRepositoryUrl(value)).toThrow(
        "Only public github.com repository URLs are supported",
      );
    }
  });

  it("rejects encoded path separators in repository names", () => {
    for (const value of [
      "https://github.com/openai/%2Fhidden",
      "https://github.com/openai/openai-node%2Fissues",
    ]) {
      expect(() => parseGitHubRepositoryUrl(value)).toThrow(
        "Only public github.com repository URLs are supported",
      );
    }
  });
});

describe("detectCommonLicenseSpdx", () => {
  it("recognizes bounded MIT and Apache-2.0 license text", () => {
    expect(
      detectCommonLicenseSpdx(
        'Permission is hereby granted, free of charge, to any person obtaining a copy. THE SOFTWARE IS PROVIDED "AS IS".',
      ),
    ).toBe("MIT");

    expect(
      detectCommonLicenseSpdx(
        "Apache License\nVersion 2.0, January 2004\nTERMS AND CONDITIONS FOR USE",
      ),
    ).toBe("Apache-2.0");
  });

  it("does not guess an SPDX identifier for unrecognized text", () => {
    expect(detectCommonLicenseSpdx("Copyright 2026. All rights reserved.")).toBeNull();
  });
});
