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

test("discovers exactly five WebMCP tools after load and reload", async ({ page }) => {
  await installWebMcpTestDouble(page);
  await page.goto("/");

  await expect(page.getByText("WebMCP connected")).toBeVisible();
  expect(await registeredToolNames(page)).toEqual(expectedTools);

  const schemasAreClosed = await page.evaluate(() =>
    [...window.__registeredWebMcpTools.values()].every(
      (tool) =>
        (tool.inputSchema as { additionalProperties?: boolean })
          .additionalProperties === false,
    ),
  );
  expect(schemasAreClosed).toBe(true);

  await page.reload();
  await expect(page.getByText("WebMCP connected")).toBeVisible();
  expect(await registeredToolNames(page)).toEqual(expectedTools);
});
