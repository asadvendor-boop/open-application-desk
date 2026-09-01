import type { WebMcpConnection } from "@/hooks/use-webmcp-tools";

interface WebMcpStatusProps {
  connection: WebMcpConnection;
}

const connectionCopy: Record<
  WebMcpConnection["status"],
  { title: string; detail: string; active: boolean }
> = {
  unavailable: {
    title: "Manual mode — fully usable",
    detail:
      "Manual controls work in every browser. Agent collaboration requires the ChatGPT desktop app's built-in browser with ChatGPT Work or Codex (GPT-5.6 Sol or Terra), or a compatible Chrome agent extension. Availability depends on browser support and rollout.",
    active: false,
  },
  connecting: {
    title: "Connecting WebMCP",
    detail: "Registering five tools against this live application state",
    active: false,
  },
  connected: {
    title: "WebMCP connected",
    detail: "Five tools share this live application state",
    active: true,
  },
  error: {
    title: "WebMCP error",
    detail:
      "Tool registration failed. Reload in a supported ChatGPT desktop agent browser or compatible Chrome agent extension; manual controls remain available.",
    active: false,
  },
};

export function WebMcpStatus({ connection }: WebMcpStatusProps) {
  const copy = connectionCopy[connection.status];

  return (
    <div
      className={copy.active ? "protocol-status protocol-status--on" : "protocol-status"}
      role="status"
    >
      <span className="protocol-status__pulse" aria-hidden="true" />
      <span>
        <strong>{copy.title}</strong>
        <span>{copy.detail}</span>
      </span>
    </div>
  );
}
