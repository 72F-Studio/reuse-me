import * as fs from "node:fs";
import { dirname, join, resolve } from "node:path";

import { loadConfig } from "../config/loadConfig";
import type { RepositoryContext } from "../model/repository";

// Finds the analysis root by walking upward from a starting path.
// A Git repository root is preferred; a directory containing a project manifest
// stops the walk too, so nested packages and non-Git checkouts still resolve.
// With no marker anywhere above, the starting path is the root: analysing the
// directory the user pointed at beats walking to the filesystem root.
export function findRepositoryRoot(startPath: string): string {
  const resolvedStart = resolve(startPath);

  let currentPath = resolvedStart;

  while (true) {
    if (fs.existsSync(join(currentPath, ".git"))) {
      return currentPath;
    }

    const parentPath = dirname(currentPath);

    if (parentPath === currentPath) {
      return resolveFallbackRoot(resolvedStart);
    }

    currentPath = parentPath;
  }
}

// Root resolution for checkouts with no Git metadata anywhere above them.
// Exported so it can be tested without depending on whether the machine's
// temporary directory happens to sit inside a Git repository.
export function resolveFallbackRoot(startPath: string): string {
  const resolvedStart = resolve(startPath);

  return nearestManifestRoot(resolvedStart) ?? resolvedStart;
}

const ROOT_MARKER_FILENAMES = [
  "package.json",
  "pyproject.toml",
  "go.mod",
  "Cargo.toml",
  "build.gradle",
  "build.gradle.kts",
  "settings.gradle",
  "settings.gradle.kts",
  "pom.xml",
  "Package.swift",
  "pubspec.yaml",
  "Gemfile",
  "composer.json"
];

function nearestManifestRoot(startPath: string): string | undefined {
  let currentPath = startPath;

  while (true) {
    if (
      ROOT_MARKER_FILENAMES.some((filename) =>
        fs.existsSync(join(currentPath, filename))
      )
    ) {
      return currentPath;
    }

    const parentPath = dirname(currentPath);

    if (parentPath === currentPath) {
      return undefined;
    }

    currentPath = parentPath;
  }
}

// Discovers the canonical repository context for a working directory.
// Repository discovery happens once and configuration is loaded from the root.
export function discoverRepositoryContext(
  startPath: string
): RepositoryContext {
  const rootPath = findRepositoryRoot(startPath);

  return {
    rootPath,
    config: loadConfig(rootPath)
  };
}
