import { readdirSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

import { languageForPath } from "../discovery/languageDetector";
import type { RepositoryContext } from "../model/repository";
import type {
  RepositoryHeuristicFinding,
  RepositoryStructureAnalysis
} from "../model/repositoryStructure";

const IGNORED_DIRECTORIES = new Set([
  ".agents",
  ".codex",
  ".git",
  ".gradle",
  ".idea",
  ".kotlin",
  ".next",
  ".artifacts",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out"
]);

const IGNORED_REPEATED_DIRECTORY_NAMES = new Set([
  "androidTest",
  "com",
  "debug",
  "generated",
  "java",
  "kotlin",
  "main",
  "resources",
  "src",
  "test"
]);

const MANIFEST_FILENAMES = new Set([
  "build.gradle",
  "build.gradle.kts",
  "package.json",
  "pom.xml",
  "pyproject.toml",
  "settings.gradle",
  "settings.gradle.kts"
]);

// Language-independent repository floor: path and file-shape facts only.
export class RepositoryStructureAnalyzer {
  analyze(context: RepositoryContext): RepositoryStructureAnalysis {
    const tree = walk(context.rootPath);
    const sourceFiles = tree.files.filter(
      (path) => languageForPath(path) !== undefined && !isManifestPath(path)
    );

    return {
      summary: {
        fileCount: tree.files.length,
        directoryCount: tree.directories.length,
        sourceFileCount: sourceFiles.length,
        topLevelDirectories: topLevelDirectories(tree.directories)
      },
      findings: [
        ...duplicateSourceFilenames(sourceFiles),
        ...repeatedSourceDirectories(sourceFiles),
        ...multipleManifestRoots(tree.files)
      ]
    };
  }
}

function walk(rootPath: string): { files: string[]; directories: string[] } {
  const files: string[] = [];
  const directories: string[] = [];

  function visit(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      const absolutePath = join(directory, entry.name);
      const repositoryPath = normalizePath(relative(rootPath, absolutePath));

      if (entry.isDirectory()) {
        directories.push(repositoryPath);
        visit(absolutePath);
      } else if (entry.isFile()) {
        files.push(repositoryPath);
      }
    }
  }

  visit(rootPath);

  return {
    files: files.sort(),
    directories: directories.sort()
  };
}

function topLevelDirectories(directories: string[]): string[] {
  return [
    ...new Set(
      directories
        .filter((path) => !path.includes("/"))
        .filter((path) => !IGNORED_DIRECTORIES.has(path))
    )
  ].sort();
}

function duplicateSourceFilenames(sourceFiles: string[]): RepositoryHeuristicFinding[] {
  const byName = new Map<string, string[]>();

  for (const path of sourceFiles) {
    add(byName, basename(path), path);
  }

  return [...byName.entries()]
    .filter(([, paths]) => paths.length > 1)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([name, paths]) => ({
      kind: "repository-heuristic",
      title: `Duplicate source filename: ${name}`,
      paths,
      evidence: [`${paths.length} files share the same leaf filename`]
    }));
}

function repeatedSourceDirectories(
  sourceFiles: string[]
): RepositoryHeuristicFinding[] {
  const byName = new Map<string, string[]>();

  for (const path of sourceFiles) {
    const directoryName = basename(dirname(path));

    if (!IGNORED_REPEATED_DIRECTORY_NAMES.has(directoryName)) {
      add(byName, directoryName, dirname(path));
    }
  }

  return [...byName.entries()]
    .map(
      ([name, paths]) =>
        [name, [...new Set(paths)].sort()] as const
    )
    .filter(([, paths]) => paths.length > 1)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([name, paths]) => ({
      kind: "repository-heuristic",
      title: `Repeated source directory name: ${name}`,
      paths,
      evidence: [`${paths.length} source directories share this name`]
    }));
}

function multipleManifestRoots(files: string[]): RepositoryHeuristicFinding[] {
  const manifestPaths = files.filter(isManifestPath);

  if (manifestPaths.length < 2) {
    return [];
  }

  return [
    {
      kind: "repository-heuristic",
      title: "Multiple project manifests detected",
      paths: manifestPaths,
      evidence: [`${manifestPaths.length} build/package manifests found`]
    }
  ];
}

function isManifestPath(path: string): boolean {
  return MANIFEST_FILENAMES.has(basename(path));
}

function add(map: Map<string, string[]>, key: string, path: string): void {
  map.set(key, [...(map.get(key) ?? []), path]);
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/");
}
