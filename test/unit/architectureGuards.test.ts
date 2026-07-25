import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("architecture guards", () => {
  it("keeps extractor modules out of reasoning layers", () => {
    const offenders = matchingFiles(reasoningFiles(), /from\s+["'][^"']*extractors\//u);

    expect(offenders).toEqual([]);
  });

  it("keeps TypeScript compiler APIs inside extractors", () => {
    const offenders = matchingFiles(
      sourceFilesUnder("src").filter(
        (file) => !relativePath(file).startsWith("src/extractors/typescript-react/")
      ),
      /from\s+["']typescript["']/u
    );

    expect(offenders).toEqual([]);
  });

  it("keeps extractor-private models out of shared models", () => {
    const offenders = matchingFiles(
      sourceFilesUnder("src/model"),
      /\b(?:UiFile|ParsedSource|SourceFileCandidate|SourceFile|Jsx|JSX|React|exportKind)\b/u
    );

    expect(offenders).toEqual([]);
  });

  it("keeps public config source-directory names generic", () => {
    const offenders = matchingFiles(
      [
        join(repoRoot, "src/model/config.ts"),
        join(repoRoot, "src/config/defaults.ts")
      ],
      /\b(?:sharedComponentDirs|screenDirs)\b/u
    );

    expect(offenders).toEqual([]);
  });

  it("does not export extractor-private implementation details from the package index", () => {
    const index = readFileSync(join(repoRoot, "src/index.ts"), "utf8");

    expect(index).not.toMatch(
      /(?:sourceFileParser|uiFileClassifier|sourceFileDiscovery|repositoryFactsBuilder|repositoryFactCollector|jsxStructureExtractor|styleTokenExtractor|relationshipAnalyzer|parsedSource|uiFile|sourceFileCandidate)/u
    );
  });
});

function reasoningFiles(): string[] {
  return [
    ...sourceFilesUnder("src/analysis"),
    ...sourceFilesUnder("src/knowledge"),
    ...sourceFilesUnder("src/model"),
    ...sourceFilesUnder("src/reporter"),
    join(repoRoot, "src/runner/changeAnalysisRunner.ts"),
    join(repoRoot, "src/runner/repositoryHealthRunner.ts")
  ];
}

function matchingFiles(files: string[], pattern: RegExp): string[] {
  return files
    .filter((file) => pattern.test(readFileSync(file, "utf8")))
    .map(relativePath)
    .sort();
}

function sourceFilesUnder(path: string): string[] {
  const absolutePath = join(repoRoot, path);

  if (!existsSync(absolutePath)) {
    return [];
  }

  return walk(absolutePath).filter(
    (file) => file.endsWith(".ts") && !file.endsWith(".d.ts")
  );
}

function walk(path: string): string[] {
  const entries = readdirSync(path, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = join(path, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function relativePath(path: string): string {
  return relative(repoRoot, path).replaceAll("\\", "/");
}
