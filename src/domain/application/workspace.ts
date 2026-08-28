import { hashDraft } from "./canonical";
import { stagePatchInputSchema, type StagePatchInput } from "./schemas";
import type {
  ActivityEntry,
  ApplicationDraft,
  ApplicationFieldKey,
  AuditReport,
  StagedPatch,
  WorkspaceState,
} from "./types";

const REVIEW_WINDOW_MS = 5 * 60 * 1_000;

function activity(
  state: WorkspaceState,
  actor: ActivityEntry["actor"],
  action: string,
  summary: string,
  createdAt: string,
): ActivityEntry {
  return {
    id: `activity-${state.activity.length + 1}`,
    actor,
    action,
    summary,
    createdAt,
  };
}

function stalePatch(patch: StagedPatch | null): StagedPatch | null {
  return patch?.state === "staged" ? { ...patch, state: "stale" } : patch;
}

function withHumanMutation(
  state: WorkspaceState,
  draft: ApplicationDraft,
  action: string,
  summary: string,
  now: string,
): WorkspaceState {
  return {
    ...state,
    draft: {
      ...draft,
      revision: state.draft.revision + 1,
      workflowState: "draft",
      updatedAt: now,
    },
    audit: null,
    stagedPatch: stalePatch(state.stagedPatch),
    review: null,
    receipt: null,
    activity: [
      ...state.activity,
      activity(state, "human", action, summary, now),
    ],
  };
}

export function createWorkspace(draft: ApplicationDraft): WorkspaceState {
  return {
    version: 1,
    draft: {
      ...draft,
      fields: { ...draft.fields },
      evidence: draft.evidence.map((item) => ({ ...item })),
    },
    audit: null,
    stagedPatch: null,
    review: null,
    receipt: null,
    activity: [],
  };
}

export function recordAudit(
  state: WorkspaceState,
  audit: AuditReport,
): WorkspaceState {
  return {
    ...state,
    audit,
    activity: [
      ...state.activity,
      activity(
        state,
        "system",
        "audit",
        audit.blockingCount === 0
          ? "Readiness audit passed."
          : `Readiness audit found ${audit.blockingCount} blocker${audit.blockingCount === 1 ? "" : "s"}.`,
        audit.checkedAt,
      ),
    ],
  };
}

export function editDraftField(
  state: WorkspaceState,
  field: ApplicationFieldKey,
  value: string,
  now: string,
): WorkspaceState {
  if (state.draft.fields[field] === value) {
    return state;
  }

  return withHumanMutation(
    state,
    {
      ...state.draft,
      fields: { ...state.draft.fields, [field]: value },
    },
    "edit_field",
    `Updated ${field}.`,
    now,
  );
}

export function setAttestation(
  state: WorkspaceState,
  attested: boolean,
  now: string,
): WorkspaceState {
  if (state.draft.attested === attested) {
    return state;
  }

  return withHumanMutation(
    state,
    { ...state.draft, attested },
    "attest",
    attested ? "Added applicant attestation." : "Removed applicant attestation.",
    now,
  );
}

export function stagePatch(
  state: WorkspaceState,
  input: StagePatchInput,
  patchId: string,
  now: string,
): WorkspaceState {
  const parsed = stagePatchInputSchema.parse(input);
  const fields = parsed.changes.map((change) => change.field);
  if (new Set(fields).size !== fields.length) {
    throw new Error("A staged patch cannot contain duplicate fields.");
  }

  const stagedPatch: StagedPatch = {
    id: patchId,
    baseRevision: state.draft.revision,
    changes: parsed.changes,
    state: "staged",
    createdAt: now,
  };

  return {
    ...state,
    stagedPatch,
    activity: [
      ...state.activity,
      activity(
        state,
        "agent",
        "stage_patch",
        `Proposed ${parsed.changes.length} draft change${parsed.changes.length === 1 ? "" : "s"}.`,
        now,
      ),
    ],
  };
}

export function applyPatch(
  state: WorkspaceState,
  patchId: string,
  now: string,
): WorkspaceState {
  const patch = state.stagedPatch;
  if (!patch || patch.id !== patchId) {
    throw new Error("The staged patch was not found.");
  }
  if (patch.state === "stale" || patch.baseRevision !== state.draft.revision) {
    throw new Error("The staged patch is stale and cannot be applied.");
  }
  if (patch.state !== "staged") {
    throw new Error("Only a staged patch can be applied.");
  }

  const fields = { ...state.draft.fields };
  for (const change of patch.changes) {
    fields[change.field] = change.value;
  }

  const mutated = withHumanMutation(
    { ...state, stagedPatch: null },
    { ...state.draft, fields },
    "apply_patch",
    `Applied ${patch.changes.length} reviewed change${patch.changes.length === 1 ? "" : "s"}.`,
    now,
  );

  return { ...mutated, stagedPatch: { ...patch, state: "applied" } };
}

export function rejectPatch(
  state: WorkspaceState,
  patchId: string,
  now: string,
): WorkspaceState {
  const patch = state.stagedPatch;
  if (!patch || patch.id !== patchId) {
    throw new Error("The staged patch was not found.");
  }
  if (patch.state !== "staged") {
    throw new Error("Only a staged patch can be rejected.");
  }

  return {
    ...state,
    stagedPatch: { ...patch, state: "rejected" },
    activity: [
      ...state.activity,
      activity(
        state,
        "human",
        "reject_patch",
        "Rejected the proposed changes.",
        now,
      ),
    ],
  };
}

export async function prepareReview(
  state: WorkspaceState,
  reviewId: string,
  now: string,
): Promise<WorkspaceState> {
  if (!state.audit || state.audit.draftRevision !== state.draft.revision) {
    throw new Error("Run a readiness audit for the current draft first.");
  }
  if (state.audit.blockingCount > 0) {
    throw new Error("Resolve all blocking requirements before review.");
  }

  const draftHash = await hashDraft(state.draft);
  const expiresAt = new Date(new Date(now).getTime() + REVIEW_WINDOW_MS).toISOString();

  return {
    ...state,
    draft: { ...state.draft, workflowState: "review" },
    review: {
      id: reviewId,
      draftRevision: state.draft.revision,
      draftHash,
      createdAt: now,
      expiresAt,
      authorizedAt: null,
    },
    receipt: null,
    activity: [
      ...state.activity,
      activity(state, "system", "prepare_review", "Prepared an exact review snapshot.", now),
    ],
  };
}

export function authorizeReview(
  state: WorkspaceState,
  reviewId: string,
  now: string,
): WorkspaceState {
  const review = state.review;
  if (!review || review.id !== reviewId) {
    throw new Error("The review snapshot does not match.");
  }
  if (review.draftRevision !== state.draft.revision) {
    throw new Error("The review snapshot is stale.");
  }
  if (new Date(now).getTime() >= new Date(review.expiresAt).getTime()) {
    throw new Error("The review authorization window has expired.");
  }

  return {
    ...state,
    review: { ...review, authorizedAt: now },
    activity: [
      ...state.activity,
      activity(
        state,
        "human",
        "authorize_review",
        "Authorized the exact reviewed draft.",
        now,
      ),
    ],
  };
}

export async function submitApproved(
  state: WorkspaceState,
  input: { reviewId: string; draftHash: string },
  receiptId: string,
  now: string,
): Promise<WorkspaceState> {
  if (
    state.receipt &&
    state.receipt.reviewId === input.reviewId &&
    state.receipt.draftHash === input.draftHash
  ) {
    return state;
  }

  const review = state.review;
  if (!review || review.id !== input.reviewId) {
    throw new Error("The review snapshot does not match.");
  }
  if (review.draftHash !== input.draftHash) {
    throw new Error("The authorized draft hash does not match.");
  }
  if (!review.authorizedAt) {
    throw new Error("Human authorization is required before submission.");
  }
  if (new Date(now).getTime() >= new Date(review.expiresAt).getTime()) {
    throw new Error("The review authorization window has expired.");
  }
  if (review.draftRevision !== state.draft.revision) {
    throw new Error("The authorized draft revision is stale.");
  }
  if ((await hashDraft(state.draft)) !== review.draftHash) {
    throw new Error("The current draft differs from the authorized snapshot.");
  }

  return {
    ...state,
    draft: { ...state.draft, workflowState: "submitted" },
    receipt: {
      id: receiptId,
      reviewId: review.id,
      draftHash: review.draftHash,
      submittedAt: now,
    },
    activity: [
      ...state.activity,
      activity(
        state,
        "system",
        "submit",
        "Recorded the authorized submission receipt.",
        now,
      ),
    ],
  };
}
