import * as fs from "node:fs";
import { dirname, join, resolve } from "node:path";

import { loadConfig } from "../config/loadConfig";
import type { RepositoryContext } from "../model/repository";

// Finds the nearest Git repository root by walking upward from a starting path.
// A repository root is any directory containing a `.git` entry.
export function findRepositoryRoot(startPath: string): string {
  const resolvedStart = resolve(startPath);
  const searchedPaths: string[] = [];

  let currentPath = resolvedStart;

  while (true) {
    searchedPaths.push(currentPath);

    if (fs.existsSync(join(currentPath, ".git"))) {
      return currentPath;
    }

    const parentPath = dirname(currentPath);

    if (parentPath === currentPath) {
      throw new Error(
        `No Git repository found from "${resolvedStart}". Searched: ${searchedPaths.join(" -> ")}`
      );
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
