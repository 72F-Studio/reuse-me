import { describe, expect, it } from "vitest";

import { UiFileClassifier } from "../../src/extractors/typescript-react/uiFileClassifier";
import type { ChangedFile } from "../../src/model/diff";

const classifier = new UiFileClassifier();

function changedFile(path: string): ChangedFile {
  return {
    path,
    status: "modified"
  };
}

describe("UiFileClassifier", () => {
  it("classifies a common React component file", () => {
    expect(
      classifier.classifyFiles([changedFile("src/components/Button.tsx")])
    ).toEqual([
      {
        path: "src/components/Button.tsx",
        framework: "react",
        kind: "component"
      }
    ]);
  });

  it("classifies a page file", () => {
    expect(
      classifier.classifyFiles([changedFile("src/pages/BillingPage.tsx")])
    ).toEqual([
      {
        path: "src/pages/BillingPage.tsx",
        framework: "react",
        kind: "page"
      }
    ]);
  });

  it("classifies a hook file", () => {
    expect(classifier.classifyFiles([changedFile("src/hooks/useBilling.ts")])).toEqual([
      {
        path: "src/hooks/useBilling.ts",
        framework: "react",
        kind: "hook"
      }
    ]);
  });

  it("classifies a layout file", () => {
    expect(
      classifier.classifyFiles([changedFile("src/layouts/AppLayout.tsx")])
    ).toEqual([
      {
        path: "src/layouts/AppLayout.tsx",
        framework: "react",
        kind: "layout"
      }
    ]);
  });

  it("ignores non-ui files", () => {
    expect(
      classifier.classifyFiles([changedFile("src/services/billingService.ts")])
    ).toEqual([]);
  });

  it("handles ambiguous ui candidates safely as unknown", () => {
    expect(classifier.classifyFiles([changedFile("src/features/modal.tsx")])).toEqual([
      {
        path: "src/features/modal.tsx",
        framework: "react",
        kind: "unknown"
      }
    ]);
  });
});
