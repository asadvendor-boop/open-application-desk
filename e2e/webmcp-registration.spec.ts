import { expect, test } from "@playwright/test";

import {
  installWebMcpTestDouble,
  registeredToolNames,
} from "./webmcp-helpers";

const expectedTools = [
  "get_application_context",
  "audit_application",
  "stage_draft_patch",
  "prepare_submission",
  "submit_approved_application",
];

test("discovers five core tools plus the one contextual fact request only while needed", async ({ page }) => {
  await installWebMcpTestDouble(page);
  await page.goto("/");

  await expect(page.getByText("WebMCP connected")).toBeVisible();
  expect((await registeredToolNames(page)).sort()).toEqual(
    [...expectedTools, "request_applicant_fact"].sort(),
  );

  const schemasAreClosed = await page.evaluate(() =>
    [...window.__registeredWebMcpTools.values()].every(
      (tool) =>
        (tool.inputSchema as { additionalProperties?: boolean })
          .additionalProperties === false,
    ),
  );
  expect(schemasAreClosed).toBe(true);

  const pendingFact = page.evaluate(async () => {
    const tool = window.__registeredWebMcpTools.get("request_applicant_fact");
    if (!tool) throw new Error("Missing contextual tool");
    return tool.execute(
      { field: "audienceProblem" },
      { signal: new AbortController().signal },
    );
  });
  await page.getByLabel("Your answer").fill("Applicants need a truthful shared draft.");
  await page.getByRole("button", { name: "Share answer with ChatGPT" }).click();
  await pendingFact;
  await expect.poll(() => registeredToolNames(page)).toEqual(expectedTools);

  await page.reload();
  await expect(page.getByText("WebMCP connected")).toBeVisible();
  expect(await registeredToolNames(page)).toEqual(expectedTools);
});

test("keeps the deterministic readiness gate in the compact desktop opening frame", async ({
  page,
}) => {
  await installWebMcpTestDouble(page);
  await page.setViewportSize({ width: 1265, height: 720 });
  await page.goto("/");

  await expect(page.getByText("WebMCP connected")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Application readiness" }),
  ).toBeInViewport({ ratio: 0.1 });
});
