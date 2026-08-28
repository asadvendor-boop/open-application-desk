import type { WorkspaceController } from "@/hooks/use-application-workspace";
import {
  createApplicantFactToolDefinition,
  createToolDefinitions,
  type ToolExecutionObserver,
} from "./tool-executors";

export async function registerWebMcpTools(
  controller: WorkspaceController,
  modelContext: WebMCP.ModelContext | undefined =
    typeof document === "undefined" ? undefined : document.modelContext,
  registrationSignal?: AbortSignal,
  observer?: ToolExecutionObserver,
) {
  if (!modelContext || typeof modelContext.registerTool !== "function") {
    return { supported: false as const, dispose() {} };
  }

  const lifecycle = new AbortController();
  const abortLifecycle = () => lifecycle.abort();
  if (registrationSignal?.aborted) {
    lifecycle.abort();
  } else {
    registrationSignal?.addEventListener("abort", abortLifecycle, {
      once: true,
    });
  }
  try {
    for (const tool of createToolDefinitions(controller, observer)) {
      lifecycle.signal.throwIfAborted();
      await modelContext.registerTool(tool, { signal: lifecycle.signal });
      lifecycle.signal.throwIfAborted();
    }
  } catch (error) {
    lifecycle.abort();
    registrationSignal?.removeEventListener("abort", abortLifecycle);
    throw error;
  }

  return {
    supported: true as const,
    dispose() {
      lifecycle.abort();
      registrationSignal?.removeEventListener("abort", abortLifecycle);
    },
  };
}

export async function registerApplicantFactTool(
  controller: WorkspaceController,
  modelContext: WebMCP.ModelContext | undefined =
    typeof document === "undefined" ? undefined : document.modelContext,
  registrationSignal?: AbortSignal,
) {
  if (!modelContext || typeof modelContext.registerTool !== "function") {
    return { supported: false as const, dispose() {} };
  }

  const lifecycle = new AbortController();
  const abortLifecycle = () => lifecycle.abort();
  if (registrationSignal?.aborted) {
    lifecycle.abort();
  } else {
    registrationSignal?.addEventListener("abort", abortLifecycle, {
      once: true,
    });
  }
  try {
    await modelContext.registerTool(createApplicantFactToolDefinition(controller), {
      signal: lifecycle.signal,
    });
    lifecycle.signal.throwIfAborted();
  } catch (error) {
    lifecycle.abort();
    registrationSignal?.removeEventListener("abort", abortLifecycle);
    throw error;
  }

  return {
    supported: true as const,
    dispose() {
      lifecycle.abort();
      registrationSignal?.removeEventListener("abort", abortLifecycle);
    },
  };
}
