import { expect, test } from "@playwright/test";

import {
  executeWebMcpTool,
  installWebMcpTestDouble,
} from "./webmcp-helpers";

interface ContextResult {
  outcome: "context";
  draft: { revision: number; fields: { summary: string } };
}

interface AuditResult {
  outcome: "audited";
  draftRevision: number;
  blockingCount: number;
}

interface PreparedResult {
  outcome: "prepared";
  reviewId: string;
  draftRevision: number;
  draftHash: string;
  authorized: false;
}

test("completes the human-controlled WebMCP journey from blockers to receipt", async ({
  page,
}) => {
  await installWebMcpTestDouble(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/github-repository", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "verified",
        repositoryUrl:
          "https://github.com/asadvendor-boop/open-application-desk",
        isPublic: true,
        licenseSpdx: "MIT",
        checkedAt: "2026-08-28T08:00:00.000Z",
        message: "Public repository metadata checked.",
      }),
    });
  });
  await page.goto("/");
  await expect(page.getByText("WebMCP connected")).toBeVisible();
  await page.screenshot({
    path: "output/playwright/day2-draft.png",
    animations: "disabled",
  });

  const context = await executeWebMcpTool<ContextResult>(
    page,
    "get_application_context",
    { sections: ["draft"] },
  );
  expect(context.outcome).toBe("context");
  expect(context.draft.revision).toBe(1);

  const firstAudit = await executeWebMcpTool<AuditResult>(
    page,
    "audit_application",
    {},
  );
  expect(firstAudit.blockingCount).toBe(7);
  await expect(page.getByText("7 blockers remain.")).toBeVisible();

  const originalSummary = await page.getByLabel("Project summary").inputValue();
  await executeWebMcpTool(page, "stage_draft_patch", {
    changes: [
      {
        field: "summary",
        value:
          "A human-led application portal where WebMCP agents inspect requirements, stage exact changes, verify public evidence, and submit only after authorization.",
        rationale: "Bring the summary under the published 90-word limit.",
      },
      {
        field: "liveUrl",
        value: "https://example.com/open-application-desk",
        rationale: "Supply the deployed HTTPS experience.",
      },
      {
        field: "repositoryUrl",
        value: "https://github.com/asadvendor-boop/open-application-desk",
        rationale: "Supply a public repository for bounded metadata checks.",
      },
    ],
  });

  await expect(
    page.getByRole("heading", { name: "Proposed change" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Apply proposed changes" }),
  ).toBeInViewport({ ratio: 1 });
  await page.screenshot({
    path: "output/playwright/day2-patch-review.png",
    animations: "disabled",
  });
  await expect(page.getByLabel("Project summary")).toHaveValue(originalSummary);
  await page.getByRole("button", { name: "Apply proposed changes" }).click();
  await expect(page.getByLabel("Project summary")).not.toHaveValue(originalSummary);

  await page
    .getByLabel("Audience and problem")
    .fill(
      "Applicants under deadline pressure risk rejection when requirements, claims, and public evidence drift across disconnected tabs.",
    );
  await page.getByLabel("Evidence type").selectOption("live_demo");
  await page
    .getByLabel("Claim", { exact: true })
    .fill("The public portal exposes the complete human-controlled workflow.");
  await page
    .getByLabel("Public evidence URL")
    .fill("https://example.com/open-application-desk");
  await page.getByRole("checkbox", { name: /Applicant attestation/ }).check();

  const updatedContext = await executeWebMcpTool<ContextResult>(
    page,
    "get_application_context",
    { sections: ["draft"] },
  );
  const finalAudit = await executeWebMcpTool<AuditResult>(
    page,
    "audit_application",
    {},
  );
  expect(finalAudit.blockingCount).toBe(0);
  await expect(page.getByText("10 ready")).toBeVisible();

  await executeWebMcpTool(page, "stage_draft_patch", {
    changes: [
      {
        field: "impactStatement",
        value:
          "A person retains authority while an agent helps inspect and prepare a single application.",
        rationale: "A human must decide whether this optional wording is accurate.",
      },
    ],
  });
  await expect(
    page.getByRole("heading", { name: "Proposed change" }),
  ).toBeVisible();

  const prepared = await executeWebMcpTool<PreparedResult>(
    page,
    "prepare_submission",
    { expectedDraftRevision: updatedContext.draft.revision },
  );
  expect(prepared.authorized).toBe(false);
  await expect(
    page.getByRole("heading", { name: "Exact review snapshot" }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Authorize exact application" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Authorize exact application" })
    .click();

  const receipt = await executeWebMcpTool<{
    outcome: "submitted";
    receiptId: string;
    reviewId: string;
    draftHash: string;
  }>(page, "submit_approved_application", {
    reviewId: prepared.reviewId,
    draftHash: prepared.draftHash,
  });

  expect(receipt).toMatchObject({
    outcome: "submitted",
    reviewId: prepared.reviewId,
    draftHash: prepared.draftHash,
  });
  await expect(
    page.getByRole("heading", { name: "Submission receipt" }),
  ).toBeVisible();
  await expect(page.getByTitle(prepared.draftHash)).toBeVisible();
  await expect(page.getByText("7 blockers caught")).toBeVisible();
  await expect(page.getByText("10 / 10 ready")).toBeVisible();
  await expect(page.getByText("0 blockers remain")).toBeVisible();
  await expect(page.getByText("Submitted", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Proposed change" }),
  ).toBeHidden();
  await page
    .getByRole("heading", { name: "Submission receipt" })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "output/playwright/day2-submitted.png",
    animations: "disabled",
  });

  await page.reload();
  await expect(page.getByText("7 blockers caught")).toBeVisible();
  await expect(page.getByText("10 / 10 ready")).toBeVisible();
  await expect(page.getByText("0 blockers remain")).toBeVisible();
  await expect(page.getByTitle(prepared.draftHash)).toBeVisible();
});

test("reconciles concurrent submissions from two Chromium tabs to one receipt", async ({
  context,
  page,
}) => {
  await installWebMcpTestDouble(page);
  await page.route("**/api/github-repository", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "verified",
        repositoryUrl:
          "https://github.com/asadvendor-boop/open-application-desk",
        isPublic: true,
        licenseSpdx: "MIT",
        checkedAt: "2026-08-28T08:00:00.000Z",
        message: "Public repository metadata checked.",
      }),
    });
  });
  await page.goto("/");

  await page.getByLabel("Project summary").fill(
    "A concise WebMCP application workspace where people retain review and submission authority.",
  );
  await page.getByLabel("Audience and problem").fill(
    "Applicants need one reliable place to keep requirements, public evidence, and submission authority aligned.",
  );
  await page
    .getByLabel("Live URL")
    .fill("https://example.com/open-application-desk");
  await page
    .getByLabel("Public GitHub repository")
    .fill("https://github.com/asadvendor-boop/open-application-desk");
  await page
    .getByLabel("Claim", { exact: true })
    .fill("The portal provides one human-controlled application workflow.");
  await page
    .getByLabel("Public evidence URL")
    .fill("https://example.com/open-application-desk");
  await page.getByRole("checkbox", { name: /Applicant attestation/ }).check();

  const contextResult = await executeWebMcpTool<ContextResult>(
    page,
    "get_application_context",
    { sections: ["draft"] },
  );
  const audit = await executeWebMcpTool<AuditResult>(
    page,
    "audit_application",
    {},
  );
  expect(audit.blockingCount).toBe(0);
  const prepared = await executeWebMcpTool<PreparedResult>(
    page,
    "prepare_submission",
    { expectedDraftRevision: contextResult.draft.revision },
  );
  await page.getByRole("button", { name: "Authorize exact application" }).click();

  const secondPage = await context.newPage();
  await installWebMcpTestDouble(secondPage);
  await secondPage.goto("/");
  await expect(secondPage.getByText("WebMCP connected")).toBeVisible();

  const [firstReceipt, secondReceipt] = await Promise.all([
    executeWebMcpTool<{ receiptId: string }>(
      page,
      "submit_approved_application",
      { reviewId: prepared.reviewId, draftHash: prepared.draftHash },
    ),
    executeWebMcpTool<{ receiptId: string }>(
      secondPage,
      "submit_approved_application",
      { reviewId: prepared.reviewId, draftHash: prepared.draftHash },
    ),
  ]);

  expect(firstReceipt.receiptId).toBe(secondReceipt.receiptId);
  await expect(page.getByRole("heading", { name: "Submission receipt" })).toBeVisible();
  await expect(
    secondPage.getByRole("heading", { name: "Submission receipt" }),
  ).toBeVisible();
});
