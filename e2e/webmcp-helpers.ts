import type { Page } from "@playwright/test";

declare global {
  interface Window {
    __registeredWebMcpTools: Map<string, WebMCP.ModelContextTool>;
  }
}

export async function installWebMcpTestDouble(page: Page) {
  await page.addInitScript(() => {
    const tools = new Map<string, WebMCP.ModelContextTool>();
    const modelContext = {
      async registerTool(
        tool: WebMCP.ModelContextTool,
        options?: WebMCP.ModelContextRegisterToolOptions,
      ) {
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
      },
      async getTools() {
        return [...tools.values()];
      },
    };

    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: modelContext,
    });
    Object.defineProperty(window, "__registeredWebMcpTools", {
      configurable: true,
      value: tools,
    });
  });
}

export async function registeredToolNames(page: Page): Promise<string[]> {
  return page.evaluate(() => [...window.__registeredWebMcpTools.keys()]);
}

export async function executeWebMcpTool<T>(
  page: Page,
  name: string,
  input: Record<string, unknown>,
): Promise<T> {
  return page.evaluate(
    async ({ toolName, toolInput }) => {
      const tools = window.__registeredWebMcpTools;
      const tool = tools.get(toolName);
      if (!tool) {
        throw new Error(`Tool ${toolName} is not registered.`);
      }
      return (await tool.execute(toolInput, {
        signal: new AbortController().signal,
      })) as T;
    },
    { toolName: name, toolInput: input },
  );
}
