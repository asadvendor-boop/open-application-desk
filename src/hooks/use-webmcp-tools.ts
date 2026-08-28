"use client";

import { useEffect, useState } from "react";

import type { AuditReport } from "@/domain/application/types";
import type { WorkspaceController } from "./use-application-workspace";
import { registerWebMcpTools } from "@/webmcp/register-tools";

export type WebMcpConnection =
  | { status: "unavailable" }
  | { status: "connecting" }
  | { status: "connected"; toolCount: 5 }
  | { status: "error" };

function initialConnection(): WebMcpConnection {
  return typeof document !== "undefined" && document.modelContext
    ? { status: "connecting" }
    : { status: "unavailable" };
}

export function useWebMcpTools(
  controller: WorkspaceController,
  onAuditCompleted?: (report: AuditReport) => void,
): WebMcpConnection {
  const [connection, setConnection] =
    useState<WebMcpConnection>(initialConnection);

  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext || typeof modelContext.registerTool !== "function") {
      return;
    }

    const lifecycle = new AbortController();
    let disposeRegistration: (() => void) | undefined;

    void registerWebMcpTools(controller, modelContext, lifecycle.signal, {
      onAuditCompleted,
    })
      .then((registration) => {
        if (lifecycle.signal.aborted) {
          registration.dispose();
          return;
        }
        disposeRegistration = registration.dispose;
        setConnection({ status: "connected", toolCount: 5 });
      })
      .catch(() => {
        if (!lifecycle.signal.aborted) {
          setConnection({ status: "error" });
        }
      });

    return () => {
      lifecycle.abort();
      disposeRegistration?.();
    };
  }, [controller, onAuditCompleted]);

  return connection;
}
