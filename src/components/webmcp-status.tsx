export function WebMcpStatus() {
  const supported =
    typeof document !== "undefined" && "modelContext" in document;

  return (
    <div className={supported ? "protocol-status protocol-status--on" : "protocol-status"}>
      <span className="protocol-status__pulse" aria-hidden="true" />
      <span>
        <strong>{supported ? "WebMCP available" : "Manual mode"}</strong>
        <span>
          {supported
            ? "Compatible browser detected"
            : "WebMCP tools arrive on Day 2; this workspace remains fully usable"}
        </span>
      </span>
    </div>
  );
}
