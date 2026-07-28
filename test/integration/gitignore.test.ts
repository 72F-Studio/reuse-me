import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { InventoryRunner } from "../../src/runner/inventoryRunner";
import { KnowledgePipelineRunner } from "../../src/runner/knowledgePipelineRunner";

// A repository already states what belongs to it. Before this, every walker
// used its own hardcoded skip list, so a vendored checkout or a benchmark
// cache was analyzed and reported as first-party code.

const tempDirs: string[] = [];

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function createGitRepo(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "reuse-me-gitignore-"));
  tempDirs.push(root);

  for (const [path, source] of Object.entries(files)) {
    const absolutePath = join(root, path);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, source);
  }

  execFileSync("git", ["init", "--quiet"], { cwd: root, stdio: "ignore" });

  return root;
}

describe("ignored paths", () => {
  it("does not analyze files .gitignore excludes", () => {
    const root = createGitRepo({
      ".gitignore": "vendor-cache/\n",
      "src/components/Button.tsx": `export function Button() {
  return <button />;
}
`,
      "vendor-cache/ui/components/Card.tsx": `export function Card() {
  return <div />;
}
`
    });

    const construction = new KnowledgePipelineRunner().construct(root);

    if (construction.status !== "ready") {
      throw new Error("Expected ready repository knowledge");
    }

    const paths = new InventoryRunner()
      .run(construction.knowledge)
      .components.map((component) => component.path);

    expect(paths).toContain("src/components/Button.tsx");
    expect(paths.some((path) => path.startsWith("vendor-cache/"))).toBe(false);
  });
});
