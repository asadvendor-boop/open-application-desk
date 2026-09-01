import { StrictMode, useMemo } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WebMcpStatus } from "@/components/webmcp-status";
import { createWorkspaceControllerHarness } from "@/test/fixtures";
import { useWebMcpTools } from "./use-webmcp-tools";

function HookHarness({ contextualFactRequestAvailable = false }: {
  contextualFactRequestAvailable?: boolean;
}) {
  const controller = useMemo(() => createWorkspaceControllerHarness(), []);
  const connection = useWebMcpTools(
    controller,
    undefined,
    contextualFactRequestAvailable,
  );
  return <WebMcpStatus connection={connection} />;
}

function installModelContext() {
  const tools = new Map<string, WebMCP.ModelContextTool>();
  const modelContext = {
    registerTool: vi.fn(async (tool, options) => {
      tools.set(tool.name, tool);
      options?.signal?.addEventListener(
        "abort",
        () => {
          if (tools.get(tool.name) === tool) {
            tools.delete(tool.name);
          }
        },
        { once: true },
      );
    }),
  } as unknown as WebMCP.ModelContext;
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: modelContext,
  });
  return { tools, modelContext };
}

afterEach(() => {
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: undefined,
  });
});

describe("useWebMcpTools", () => {
  it("adds and removes the contextual fact tool without restarting the five core tools", async () => {
    const { tools } = installModelContext();
    const rendered = render(<HookHarness />);
    await waitFor(() => expect(tools.size).toBe(5));

    rendered.rerender(<HookHarness contextualFactRequestAvailable />);
    await waitFor(() => expect(tools.has("request_applicant_fact")).toBe(true));
    expect([...tools.keys()].slice(0, 5)).toEqual([
      "get_application_context",
      "audit_application",
      "stage_draft_patch",
      "prepare_submission",
      "submit_approved_application",
    ]);

    rendered.rerender(<HookHarness contextualFactRequestAvailable={false} />);
    await waitFor(() => expect(tools.has("request_applicant_fact")).toBe(false));
    expect(tools.size).toBe(5);
  });

  it("shows connected only after exactly five tools register and cleans up", async () => {
    const { tools } = installModelContext();
    const rendered = render(
      <StrictMode>
        <HookHarness />
      </StrictMode>,
    );

    expect(
      await screen.findByText("WebMCP connected"),
    ).toBeInTheDocument();
    expect([...tools.keys()]).toEqual([
      "get_application_context",
      "audit_application",
      "stage_draft_patch",
      "prepare_submission",
      "submit_approved_application",
    ]);

    rendered.unmount();
    expect(tools.size).toBe(0);
  });

  it("keeps the complete manual experience when WebMCP is unavailable", () => {
    render(<HookHarness />);

    expect(screen.getByText("Manual mode — fully usable")).toBeInTheDocument();
    expect(screen.getByText(/manual controls work in every browser/i)).toBeInTheDocument();
    expect(
      screen.getByText(/availability depends on browser support and rollout/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ChatGPT desktop app's built-in browser/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ChatGPT Work or Codex/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/GPT-5\.6 Sol or Terra/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/compatible Chrome agent extension/i),
    ).toBeInTheDocument();
  });

  it("reports registration failure without breaking the page", async () => {
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool: vi.fn().mockRejectedValue(new Error("registration failed")),
      },
    });

    render(<HookHarness />);

    await waitFor(() =>
      expect(screen.getByText("WebMCP error")).toBeInTheDocument(),
    );
    expect(screen.getByText(/manual controls remain available/i)).toBeInTheDocument();
    expect(
      screen.getByText(/supported ChatGPT desktop agent browser or compatible Chrome agent extension/i),
    ).toBeInTheDocument();
  });
});
