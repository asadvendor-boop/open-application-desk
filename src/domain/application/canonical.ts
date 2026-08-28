import type { ApplicationDraft } from "./types";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

function sortJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortJson(nested)]),
    );
  }
  return value;
}

export function canonicalDraftJson(draft: ApplicationDraft): string {
  const reviewable: JsonValue = {
    id: draft.id,
    revision: draft.revision,
    fields: { ...draft.fields },
    evidence: [...draft.evidence]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((item) => ({ ...item })),
    attested: draft.attested,
  };

  return JSON.stringify(sortJson(reviewable));
}

export async function hashDraft(draft: ApplicationDraft): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalDraftJson(draft));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
